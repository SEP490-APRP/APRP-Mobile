import { Client } from '@stomp/stompjs'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { stompBrokerUrl } from '@/features/tracking/utils/trackingRules'
import { useAuthStore } from '@/stores'
import { ENV } from '@/utils'
import { chatKeys } from './useChatQueries'

/** Có tin mới qua STOMP thì tải lại ngay. Gửi tin đi bằng REST, mất kết nối thì đã có polling dự phòng. */
export function useChatSocket() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return
    const refresh = () => void queryClient.invalidateQueries({ queryKey: chatKeys.all })
    const client = new Client({
      brokerURL: stompBrokerUrl(ENV.API_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      // React Native cắt ký tự NULL cuối frame STOMP; hai cờ này bù lại.
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect: () => {
        client.subscribe('/user/queue/messages', refresh)
        client.subscribe('/user/queue/read', refresh)
      },
    })
    client.activate()
    return () => void client.deactivate()
  }, [token, queryClient])
}
