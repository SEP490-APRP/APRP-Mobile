import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LatLng } from '../utils/shipperOrders'

export type GpsState = 'loading' | 'granted' | 'denied' | 'error'

/** Vị trí hiện tại của tài xế. Tự động theo dõi khi di chuyển (>100m) và hỗ trợ làm mới bằng refresh. */
export function useCurrentPosition(watch = true) {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [state, setState] = useState<GpsState>('loading')
  const watchSubRef = useRef<Location.LocationSubscription | null>(null)

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

      // Cố gắng lấy tọa độ GPS chính xác với timeout 4s
      try {
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 4000)),
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
    let cancelled = false
    void refresh()

    if (watch) {
      void (async () => {
        const perm = await Location.getForegroundPermissionsAsync().catch(() => null)
        if (cancelled || perm?.status !== 'granted') return
        watchSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 100,
          },
          (pos) => {
            if (!cancelled && pos?.coords) {
              setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
              setState('granted')
            }
          },
        ).catch(() => null)
      })()
    }

    return () => {
      cancelled = true
      watchSubRef.current?.remove()
    }
  }, [refresh, watch])

  return { position, state, refresh }
}
