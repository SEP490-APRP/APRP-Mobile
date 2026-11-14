import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse } from '@/types'
import type { ChatbotMessageRequest, ChatbotMessageResponse, ChatHistoryItem } from './chatbot.types'

export * from './chatbot.types'

/** Chép từ APRP-FE/src/services/chatbot.service.ts, bỏ các hàm admin vì Admin chỉ có trên web. */
export const chatbotService = {
  /**
   * Gửi tin nhắn hoặc lựa chọn sản phẩm tới AI Chatbot Copilot
   */
  async sendMessage(req: ChatbotMessageRequest): Promise<ChatbotMessageResponse> {
    const res = await axiosInstance.post<ApiResponse<ChatbotMessageResponse>>('/chatbot/message', {
      ...req,
      client: 'MOBILE',
    })
    if (!res.data?.result) {
      throw new Error(res.data?.message || 'Không nhận được phản hồi từ AI Copilot')
    }
    return res.data.result
  },

  /**
   * Lấy lịch sử hội thoại của người dùng đã đăng nhập
   */
  async getChatHistory(): Promise<ChatHistoryItem[]> {
    try {
      const res = await axiosInstance.get<ApiResponse<ChatHistoryItem[]>>('/chatbot/history')
      return res.data?.result || []
    } catch {
      return []
    }
  },

  /**
   * Xóa lịch sử trò chuyện
   */
  async clearChatHistory(): Promise<void> {
    await axiosInstance.delete('/chatbot/history')
  },
}
