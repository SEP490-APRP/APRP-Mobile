import { Client } from '@stomp/stompjs'
import * as Location from 'expo-location'
import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { stompBrokerUrl } from '@/features/tracking/utils/trackingRules'
import { useAuthStore } from '@/stores'
import { ENV } from '@/utils/env'

export type BroadcastState = 'off' | 'connecting' | 'live' | 'no-permission' | 'error'

/** Trạng thái chia sẻ vị trí, để tab Đang giao hiện ra mà không phải mở thêm kết nối. */
export const useBroadcastState = create<{ state: BroadcastState; set: (s: BroadcastState) => void }>((set) => ({
  state: 'off',
  set: (state) => set({ state }),
}))

/** Gửi vị trí theo nhịp này, đủ mượt cho bản đồ mà không tốn pin. */
const SEND_MS = 4000

/**
 * Khi đang cầm đơn, gửi GPS lên /app/shipper/location để nhà vườn và người mua thấy xe trên bản đồ
 * (thay cho watchPosition + SockJS của bản web). Chỉ chạy khi app đang mở.
 */
export function useBroadcastLocation(orderId: number | undefined, orderStatus?: string) {
  // Gửi kèm chặng để bản đồ của nhà vườn và người mua hiện đúng (backend lưu lại phase này).
  const phase = orderStatus === 'PICKED_UP' ? 'TO_BUYER' : 'TO_SHOP'
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const token = useAuthStore((s) => s.token)
  const state = useBroadcastState((s) => s.state)
  const set = useBroadcastState((s) => s.set)
  const last = useRef<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    if (!orderId) {
      set('off')
      return
    }
    let cancelled = false
    let watch: Location.LocationSubscription | null = null
    let timer: ReturnType<typeof setInterval> | null = null
    set('connecting')

    const client = new Client({
      brokerURL: stompBrokerUrl(ENV.API_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect: () =>
        !cancelled && set(useBroadcastState.getState().state === 'no-permission' ? 'no-permission' : 'live'),
      onWebSocketClose: () => !cancelled && useBroadcastState.getState().state === 'live' && set('connecting'),
      onStompError: () => !cancelled && set('error'),
    })

    const send = (body: Record<string, unknown>) => {
      if (!client.connected) return
      client.publish({
        destination: '/app/shipper/location',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ orderId, ...body }),
      })
    }

    ;(async () => {
      const perm = await Location.requestForegroundPermissionsAsync().catch(() => null)
      if (cancelled) return
      if (perm?.status !== 'granted') {
        set('no-permission')
        client.onConnect = () => send({ gpsOff: true })
        client.activate()
        return
      }
      client.activate()
      watch = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: SEND_MS, distanceInterval: 10 },
        (pos) => {
          last.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        },
      ).catch(() => null)
      if (cancelled) watch?.remove()
      timer = setInterval(() => last.current && send({ ...last.current, deliveryPhase: phaseRef.current }), SEND_MS)
    })()

    return () => {
      cancelled = true
      set('off')
      watch?.remove()
      if (timer) clearInterval(timer)
      void client.deactivate()
    }
  }, [orderId, token, set])

  return { state, position: last.current }
}
