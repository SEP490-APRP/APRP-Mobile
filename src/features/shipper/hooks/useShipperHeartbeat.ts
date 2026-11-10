import * as Location from 'expo-location'
import { useEffect, useRef } from 'react'
import { SHIPPER_HEARTBEAT_MS, shipperService } from '@/services/shipper.service'
import type { LatLng } from '../utils/shipperOrders'
import { useShipperStatus } from './useShipperQueries'

/** Đọc vị trí thật của thiết bị: vị trí hiện tại (tối đa 5 giây), không có thì vị trí gần nhất máy còn nhớ. */
async function readDevicePosition(): Promise<LatLng | null> {
  try {
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 5000)),
    ])
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
  } catch {
    // thử vị trí máy còn nhớ
  }
  try {
    const last = await Location.getLastKnownPositionAsync()
    if (last?.coords) return { latitude: last.coords.latitude, longitude: last.coords.longitude }
  } catch {
    // không có vị trí
  }
  return null
}

/**
 * Khi đang nhận đơn, gửi vị trí thật của thiết bị mỗi 60s (heartbeat) để BE còn tính shipper là trực tuyến
 * và mời đúng đơn gần. BE tự chuyển offline nếu quá 5 phút không có tín hiệu (vd. app bị tắt ngang).
 *
 * Không gửi lại toạ độ đang lưu trên server: nếu server đang giữ toạ độ sai, gửi lại sẽ làm nó sai mãi.
 * Chỉ khi chưa đọc được GPS lần nào mới dùng toạ độ server, cốt để giữ trạng thái trực tuyến.
 */
export function useShipperHeartbeat() {
  const status = useShipperStatus()
  const online = status.data?.online === true
  const serverPos = useRef<LatLng | null>(null)
  serverPos.current =
    status.data?.latitude != null && status.data?.longitude != null
      ? { latitude: status.data.latitude, longitude: status.data.longitude }
      : null

  useEffect(() => {
    if (!online) return
    let lastDevice: LatLng | null = null
    const beat = async () => {
      const device = await readDevicePosition()
      if (device) lastDevice = device
      const at = device ?? lastDevice ?? serverPos.current
      if (at) await shipperService.goOnline(at.latitude, at.longitude).catch(() => undefined)
    }
    // Gửi ngay khi bật để BE có vị trí mới, sau đó mỗi 60 giây
    void beat()
    const id = setInterval(() => void beat(), SHIPPER_HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [online])
}
