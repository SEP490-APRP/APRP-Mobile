import * as Location from 'expo-location'
import { useEffect } from 'react'
import { SHIPPER_HEARTBEAT_MS, shipperService } from '@/services/shipper.service'
import { useShipperStatus } from './useShipperQueries'

/**
 * Khi đang nhận đơn, gửi lại vị trí mỗi 60s (heartbeat) để BE còn tính shipper là trực tuyến và mời đúng
 * đơn gần. BE tự chuyển offline nếu quá 5 phút không có tín hiệu (vd. app bị tắt ngang).
 */
export function useShipperHeartbeat() {
  const status = useShipperStatus()
  const online = status.data?.online === true
  const fallback = status.data?.latitude != null && status.data?.longitude != null
    ? { latitude: status.data.latitude, longitude: status.data.longitude }
    : null

  useEffect(() => {
    if (!online) return
    let last = fallback
    const beat = async () => {
      try {
        const pos = await Location.getLastKnownPositionAsync()
        if (pos?.coords) last = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      } catch {
        // dùng vị trí cũ
      }
      if (last) await shipperService.goOnline(last.latitude, last.longitude).catch(() => undefined)
    }
    const id = setInterval(() => void beat(), SHIPPER_HEARTBEAT_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])
}
