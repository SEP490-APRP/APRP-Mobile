import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import { soundService } from '@/services/sound.service'
import { useAuthStore } from '@/stores'
import { chatKeys } from './useChat'
import { notificationKeys } from '@/features/notification/hooks/useNotifications'

/**
 * Hook đồng bộ Realtime toàn cục cho toàn bộ khu vực Khách Mua (Buyer):
 * - Giữ kết nối WebSocket STOMP liên tục khi đăng nhập (ngay từ Trang chủ).
 * - Khi có tin nhắn mới từ Shop -> Phát chuông/rung và cập nhật badge Trang chủ tức thì (<50ms).
 * - Khi có thông báo hệ thống hoặc cập nhật đã đọc -> Cập nhật badge thông báo và tin nhắn tức thì.
 */
export function useBuyerRealtimeSync() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const currentUserId = useAuthStore((s) => Number(s.user?.id ?? 0))

  useEffect(() => {
    if (!token) return

    // 1. Kích hoạt kết nối WebSocket STOMP toàn cục ngay từ khi mở app
    chatService.connect()

    // 2. Lắng nghe tin nhắn mới (/user/queue/messages)
    const unsubMsg = chatService.onMessage((newMsg) => {
      const isFromOther = Number(newMsg.senderId) !== currentUserId

      if (isFromOther) {
        soundService.playMessageChime()
      }

      // Cập nhật ngay lập tức số tin nhắn chưa đọc cho Icon trên Trang chủ
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })

      // Làm mới danh sách hội thoại để khi người dùng vào chat là thấy ngay
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })

      // Nếu đang mở đúng cuộc trò chuyện đó, làm mới lịch sử tin nhắn
      if (newMsg.conversationId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(Number(newMsg.conversationId)),
        })
      }
    })

    // 3. Lắng nghe thông báo đẩy / cập nhật số lượng unread (/user/queue/notifications)
    const unsubNotif = chatService.onNotification((notif) => {
      // Cập nhật số unread trực tiếp vào cache nếu backend có gửi unreadCount
      if (notif?.unreadCount !== undefined) {
        queryClient.setQueryData(chatKeys.unreadCount(), Number(notif.unreadCount))
      } else {
        queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
      }

      // Đồng bộ danh sách hội thoại nếu là sự kiện tin nhắn mới, thu hồi tin hoặc đổi số lượng
      if (
        notif?.type === 'NEW_MESSAGE' ||
        notif?.type === 'DELETE_MESSAGE' ||
        notif?.type === 'UNREAD_COUNT'
      ) {
        queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      }

      // Đồng bộ thông báo hệ thống (chuông thông báo)
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
    })

    return () => {
      unsubMsg()
      unsubNotif()
    }
  }, [token, currentUserId, queryClient])
}

