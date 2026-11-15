import { useEffect } from 'react'
import { Client } from '@stomp/stompjs'
import { stompBrokerUrl } from '@/features/tracking/utils/trackingRules'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores'
import { ENV } from '@/utils/env'
import { showLocalNotificationAsync } from './pushNotification'
import type { NotificationItem } from './notification.types'

/**
 * Lắng nghe thông báo thời gian thực từ Backend qua STOMP WebSocket.
 * Khi nhận được thông báo mới, lập tức:
 * 1. Bật banner thông báo native của điện thoại (rung + phát chuông) qua Local Notification.
 * 2. Cập nhật lại số lượng thông báo chưa đọc và danh sách thông báo.
 */
export function useNotificationListener() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!token || !user?.id) return

    const userId = String(user.id)
    const client = new Client({
      brokerURL: stompBrokerUrl(ENV.API_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect: () => {
        const handleIncoming = (bodyText: string) => {
          try {
            const notif = JSON.parse(bodyText) as NotificationItem
            if (notif && notif.title) {
              void showLocalNotificationAsync(
                notif.title,
                notif.message || '',
                {
                  type: notif.type,
                  orderId: notif.referenceId,
                  referenceId: notif.referenceId,
                },
              )
            }
          } catch {
            /* ignore non-json frames */
          }
          void queryClient.invalidateQueries({ queryKey: ['notifications'] })
          void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
        }

        // 1. Private STOMP user queue
        client.subscribe('/user/queue/notifications', (frame) => {
          handleIncoming(frame.body)
        })

        // 2. Direct user queue /queue/notifications.{userId}
        client.subscribe(`/queue/notifications.${userId}`, (frame) => {
          handleIncoming(frame.body)
        })
      },
    })

    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [token, user?.id])
}

