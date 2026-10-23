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
      const perm = await Location.requestForegroundPermissionsAsync()
      if (perm.status !== 'granted') {
        setState('denied')
        return null
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      setPosition(next)
      setState('granted')
      return next
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
