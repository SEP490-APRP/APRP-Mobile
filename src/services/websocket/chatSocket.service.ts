import { Client, type IMessage } from '@stomp/stompjs'
import { AppState, type AppStateStatus } from 'react-native'
import type { ChatMessage } from '@/types/chat'
import { ENV } from '@/utils/env'
import { useAuthStore } from '@/stores'
import { stompBrokerUrl } from '@/features/tracking/utils/trackingRules'

type MessageCallback = (msg: ChatMessage) => void
type TypingCallback = (data: { senderId: number; isTyping: boolean }) => void
type NotificationCallback = (data: any) => void

class ChatSocketService {
  private client: Client | null = null
  private isConnected = false
  private isConnecting = false
  private currentToken: string | null = null
  private messageListeners = new Set<MessageCallback>()
  private typingListeners = new Set<TypingCallback>()
  private notificationListeners = new Set<NotificationCallback>()
  private pendingCallbacks: (() => void)[] = []

  constructor() {
    // Tự động kết nối lại khi người dùng mở lại app từ background
    AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        const token = useAuthStore.getState().token
        if (token && (!this.client || !this.client.connected)) {
          this.connect()
        }
      }
    })
  }

  connect(onConnect?: () => void, onError?: (err: unknown) => void): void {
    const token = useAuthStore.getState().token

    // Nếu token thay đổi (user mới đăng nhập/đổi account), ngắt kết nối cũ
    if (this.isConnected && this.currentToken && token && this.currentToken !== token) {
      this.disconnect()
    }

    if (this.client?.connected && this.isConnected) {
      onConnect?.()
      return
    }

    if (this.isConnecting && this.client) {
      if (onConnect) this.pendingCallbacks.push(onConnect)
      return
    }

    if (onConnect) this.pendingCallbacks.push(onConnect)
    this.isConnecting = true
    this.currentToken = token

    const brokerURL = stompBrokerUrl(ENV.API_URL)

    if (this.client) {
      try {
        this.client.deactivate()
      } catch {}
      this.client = null
    }

    this.client = new Client({
      brokerURL,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // React Native cắt ký tự NULL cuối frame STOMP text; hai cờ này bù đắp để parse chuẩn xác không trễ tin
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      beforeConnect: () => {
        const latestToken = useAuthStore.getState().token
        if (latestToken && this.client) {
          this.client.connectHeaders = {
            Authorization: `Bearer ${latestToken}`,
          }
        }
      },
      onConnect: () => {
        this.isConnecting = false
        this.isConnected = true
        this.currentToken = useAuthStore.getState().token

        const callbacks = [...this.pendingCallbacks]
        this.pendingCallbacks = []
        callbacks.forEach((cb) => cb())

        // 1. Subscribe hàng đợi tin nhắn cá nhân
        this.client?.subscribe('/user/queue/messages', (message: IMessage) => {
          try {
            const chatMsg: ChatMessage = JSON.parse(message.body)
            this.messageListeners.forEach((listener) => listener(chatMsg))
          } catch (e) {
            console.warn('[ChatSocket] Failed to parse message body:', e)
          }
        })

        // 2. Subscribe tín hiệu đang soạn tin (typing)
        this.client?.subscribe('/user/queue/typing', (message: IMessage) => {
          try {
            const data = JSON.parse(message.body)
            this.typingListeners.forEach((listener) => listener(data))
          } catch (e) {
            console.warn('[ChatSocket] Failed to parse typing body:', e)
          }
        })

        // 3. Subscribe hàng đợi thông báo đẩy / tin nhắn mới / xóa tin nhắn
        this.client?.subscribe('/user/queue/notifications', (message: IMessage) => {
          try {
            const data = JSON.parse(message.body)
            this.notificationListeners.forEach((listener) => listener(data))
          } catch (e) {
            console.warn('[ChatSocket] Failed to parse notification body:', e)
          }
        })

        // 4. Subscribe hàng đợi thông báo trực tiếp theo userId
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          this.client?.subscribe(`/queue/notifications.${userId}`, (message: IMessage) => {
            try {
              const data = JSON.parse(message.body)
              this.notificationListeners.forEach((listener) => listener(data))
            } catch (e) {
              console.warn('[ChatSocket] Failed to parse user notification body:', e)
            }
          })
        }
      },
      onStompError: (frame) => {
        console.warn('[ChatSocket] STOMP Error:', frame.headers['message'])
        this.isConnecting = false
        this.isConnected = false
        onError?.(frame)
      },
      onWebSocketError: (event) => {
        console.warn('[ChatSocket] WebSocket Error:', event)
        this.isConnecting = false
        this.isConnected = false
        onError?.(event)
      },
      onDisconnect: () => {
        this.isConnecting = false
        this.isConnected = false
      },
    })

    this.client.activate()
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate()
      this.client = null
    }
    this.isConnected = false
    this.isConnecting = false
  }

  getIsConnected(): boolean {
    return this.isConnected && Boolean(this.client?.connected)
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback)
    return () => this.messageListeners.delete(callback)
  }

  onTyping(callback: TypingCallback): () => void {
    this.typingListeners.add(callback)
    return () => this.typingListeners.delete(callback)
  }

  onNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.add(callback)
    return () => this.notificationListeners.delete(callback)
  }

  sendMessage(receiverId: number, content: string, type = 'TEXT', attachmentUrl?: string): boolean {
    if (!this.client?.connected) return false

    try {
      this.client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          receiverId,
          content,
          type,
          attachmentUrl,
        }),
      })
      return true
    } catch (e) {
      console.warn('[ChatSocket] Failed to send via WS:', e)
      return false
    }
  }

  sendTyping(receiverId: number, isTyping: boolean): void {
    if (!this.client?.connected) return

    try {
      this.client.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ receiverId, isTyping }),
      })
    } catch (e) {
      console.warn('[ChatSocket] Failed to send typing:', e)
    }
  }

  sendRead(conversationId: number): void {
    if (!this.client?.connected) return

    try {
      this.client.publish({
        destination: '/app/chat.read',
        body: JSON.stringify({ conversationId }),
      })
    } catch (e) {
      console.warn('[ChatSocket] Failed to send read:', e)
    }
  }
}

export const chatSocketService = new ChatSocketService()
