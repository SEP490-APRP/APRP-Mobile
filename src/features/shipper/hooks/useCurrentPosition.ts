import * as Location from 'expo-location'
import { useCallback, useEffect, useState } from 'react'
import type { LatLng } from '../utils/shipperOrders'

export type GpsState = 'loading' | 'granted' | 'denied' | 'error'

/** Vị trí hiện tại của tài xế (một lần, gọi lại bằng refresh). Không có toạ độ giả. */
export function useCurrentPosition() {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [state, setState] = useState<GpsState>('loading')

  const refresh = useCallback(async (): Promise<LatLng | null> => {
    setState('loading')
    try {
      const perm = await Location.requestForegroundPermissionsAsync().catch(() => null)
      if (perm?.status !== 'granted') {
        setState('denied')
        return null
      }

      // Lấy vị trí gần nhất đã lưu trong máy trước để phản hồi tức thì
      let cached: LatLng | null = null
      try {
        const last = await Location.getLastKnownPositionAsync()
        if (last?.coords) {
          cached = { latitude: last.coords.latitude, longitude: last.coords.longitude }
          setPosition(cached)
          setState('granted')
        }
      } catch {
        // bỏ qua lỗi đọc cached
      }

      // Cố gắng lấy tọa độ GPS chính xác với timeout 3.5s để tránh treo máy ảo/thiết bị
      try {
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 3500)),
        ])
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        setPosition(next)
        setState('granted')
        return next
      } catch {
        if (cached) return cached
        setState('error')
        return null
      }
    } catch {
      setState('error')
      return null
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { position, state, refresh }
}
