import { unwrap } from '@/services/api/apiUtils'
import axiosInstance from '@/services/api/axiosInstance'
import type { PageResponse } from '@/types'
import type { ChatMessage, ChatMessageRequest, Conversation } from '@/types/chat'

/** Chép từ APRP-FE/src/services/api/chat.api.ts. Realtime nằm ở features/chat/hooks/useChatSocket.ts. */
export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const res = await axiosInstance.get('/chat/conversations')
    return unwrap<Conversation[]>(res) ?? []
  },

  async initConversation(receiverId: number): Promise<Conversation> {
    const res = await axiosInstance.post('/chat/conversations/init', { receiverId })
    return unwrap<Conversation>(res)
  },

  async getMessages(conversationId: number, page = 0, size = 50): Promise<PageResponse<ChatMessage>> {
    const res = await axiosInstance.get(`/chat/conversations/${conversationId}/messages`, { params: { page, size } })
    return unwrap<PageResponse<ChatMessage>>(res)
  },

  async sendMessage(request: ChatMessageRequest): Promise<ChatMessage> {
    const res = await axiosInstance.post('/chat/messages', request)
    return unwrap<ChatMessage>(res)
  },

  async markAsRead(conversationId: number): Promise<void> {
    await axiosInstance.patch(`/chat/conversations/${conversationId}/read`)
  },
}
