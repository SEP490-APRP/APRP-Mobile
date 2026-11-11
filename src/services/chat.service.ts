import axiosInstance from './api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type { ChatMessage, ChatMessageRequest, Conversation } from '@/types/chat'
import { chatSocketService } from './websocket/chatSocket.service'

export const chatService = {
  /**
   * Kết nối WebSocket Realtime
   */
  connect(onConnect?: () => void, onError?: (err: unknown) => void): void {
    chatSocketService.connect(onConnect, onError)
  },

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    chatSocketService.disconnect()
  },

  /**
   * Lắng nghe tin nhắn mới từ WebSocket
   */
  onMessage(callback: (msg: ChatMessage) => void): () => void {
    return chatSocketService.onMessage(callback)
  },

  /**
   * Lắng nghe trạng thái soạn tin nhắn
   */
  onTyping(callback: (data: { senderId: number; isTyping: boolean }) => void): () => void {
    return chatSocketService.onTyping(callback)
  },

  /**
   * Lắng nghe thông báo đẩy / tin nhắn mới
   */
  onNotification(callback: (data: any) => void): () => void {
    return chatSocketService.onNotification(callback)
  },

  /**
   * Báo trạng thái đang gõ phím
   */
  sendTyping(receiverId: number, isTyping: boolean): void {
    chatSocketService.sendTyping(receiverId, isTyping)
  },

  /**
   * Lấy danh sách cuộc trò chuyện của người dùng
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const res = await axiosInstance.get<ApiResponse<Conversation[]>>('/chat/conversations')
    return res.data
  },

  /**
   * Khởi tạo hoặc lấy cuộc trò chuyện với 1 người dùng (Chủ shop/Admin)
   */
  async initConversation(receiverId: number): Promise<ApiResponse<Conversation>> {
    const res = await axiosInstance.post<ApiResponse<Conversation>>('/chat/conversations/init', {
      receiverId,
    })
    return res.data
  },

  /**
   * Lấy lịch sử tin nhắn trong một cuộc trò chuyện
   */
  async getMessages(
    conversationId: number,
    page = 0,
    size = 50,
  ): Promise<ApiResponse<PageResponse<ChatMessage>>> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ChatMessage>>>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, size } },
    )
    return res.data
  },

  /**
   * Gửi tin nhắn mới (hỗ trợ text, ảnh, video, voice)
   */
  async sendMessage(
    receiverId: number,
    content: string,
    type = 'TEXT',
    attachmentUrl?: string,
  ): Promise<ApiResponse<ChatMessage>> {
    const payload: ChatMessageRequest = {
      receiverId,
      content,
      type,
      attachmentUrl,
    }

    const res = await axiosInstance.post<ApiResponse<ChatMessage>>('/chat/messages', payload)
    return res.data
  },

  /**
   * Đánh dấu cuộc trò chuyện là đã đọc
   */
  async markAsRead(conversationId: number): Promise<ApiResponse<void>> {
    chatSocketService.sendRead(conversationId)
    const res = await axiosInstance.patch<ApiResponse<void>>(
      `/chat/conversations/${conversationId}/read`,
    )
    return res.data
  },

  /**
   * Đếm tổng số tin nhắn chưa đọc
   */
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    const res = await axiosInstance.get<ApiResponse<{ unreadCount: number }>>('/chat/unread-count')
    return res.data
  },

  /**
   * Xóa / Thu hồi tin nhắn do chính mình gửi đi
   */
  async deleteMessage(messageId: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.delete<ApiResponse<void>>(`/chat/messages/${messageId}`)
    return res.data
  },
}
