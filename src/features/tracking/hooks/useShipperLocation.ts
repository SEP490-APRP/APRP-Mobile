import { Client } from '@stomp/stompjs'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import axiosInstance from '@/services/api/axiosInstance'
import { useAuthStore } from '@/stores'
import type { ApiResponse } from '@/types'
import { ENV } from '@/utils'
import { stompBrokerUrl, type ShipperLocationPayload } from '../utils/trackingRules'

export const trackingKeys = {
  location: (orderId: number) => ['tracking', 'location', orderId] as const,
}

/** Khi chưa nối được WebSocket thì hỏi lại REST theo chu kỳ này */
const POLL_MS = 10_000

async function fetchLocation(orderId: number): Promise<ShipperLocationPayload | null> {
  const res = await axiosInstance.get<ApiResponse<ShipperLocationPayload>>(`/shippers/location/order/${orderId}`)
  return res.data?.result ?? null
}

/**
 * Vị trí shipper của một đơn: lấy ảnh chụp qua REST rồi nghe STOMP
 * /topic/order/{id}/location. Mất kết nối thì tự thử lại và tạm chuyển sang hỏi REST.
 */
export function useShipperLocation(orderId: number) {
  const token = useAuthStore((s) => s.token)
  const [live, setLive] = useState<ShipperLocationPayload | null>(null)
  const [connected, setConnected] = useState(false)
  const [gpsPaused, setGpsPaused] = useState(false)

  const snapshot = useQuery({
    queryKey: trackingKeys.location(orderId),
    queryFn: () => fetchLocation(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
    refetchInterval: connected ? false : POLL_MS,
    retry: 1,
  })

  useEffect(() => {
    if (!Number.isFinite(orderId) || orderId <= 0) return
    const client = new Client({
      brokerURL: stompBrokerUrl(ENV.API_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      // React Native cắt ký tự NULL cuối frame STOMP; hai cờ này bù lại.
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/order/${orderId}/location`, (msg) => {
          try {
            const body = JSON.parse(msg.body) as ShipperLocationPayload
            if (body.gpsOff) {
              setGpsPaused(true)
              return
            }
            setGpsPaused(false)
            setLive((prev) => ({ ...prev, ...body }))
          } catch {
            // Bỏ qua frame hỏng, frame sau sẽ cập nhật lại.
          }
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onWebSocketError: () => setConnected(false),
    })
    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [orderId, token])

  // REST và WebSocket gộp theo thứ tự đến: bản đến sau là bản mới hơn.
  useEffect(() => {
    if (snapshot.data) setLive((prev) => ({ ...prev, ...snapshot.data }))
  }, [snapshot.data])

  return {
    data: live,
    connected,
    gpsPaused,
    isLoading: snapshot.isPending && !live,
    refresh: () => void snapshot.refetch(),
  }
}
