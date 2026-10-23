import type { ChatMessage, Conversation } from '@/types/chat'
import { mockChatHistories, mockConversationsList } from '@/mocks/chat.mock'

const listeners: ((msg: ChatMessage) => void)[] = []

export const chatService = {
  connect(onConnect?: () => void, _onError?: (err: unknown) => void): void {
    setTimeout(() => onConnect?.(), 100)
  },

  disconnect(): void {
    // disconnected
  },

  subscribeToConversation(
    _userId: number,
    _otherUserId: number,
    callback: (msg: ChatMessage) => void,
  ): void {
    listeners.push(callback)
  },

  unsubscribeFromConversation(_userId: number, _otherUserId: number): void {
    // unsubscribe
  },

  async markAsRead(otherUserId: number): Promise<void> {
    const conv = mockConversationsList.find((c) => c.otherUserId === otherUserId)
    if (conv) conv.unreadCount = 0
  },

  async getConversations(): Promise<Conversation[]> {
    await new Promise((r) => setTimeout(r, 200))
    return [...mockConversationsList]
  },

  async getChatHistory(otherUserId: number): Promise<ChatMessage[]> {
    await new Promise((r) => setTimeout(r, 150))
    return [...(mockChatHistories[otherUserId] || [])]
  },

  sendMessage(payload: { receiverId: number; content: string }): void {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 1,
      receiverId: payload.receiverId,
      content: payload.content,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    if (!mockChatHistories[payload.receiverId]) {
      mockChatHistories[payload.receiverId] = []
    }
    mockChatHistories[payload.receiverId].push(newMsg)

    const conv = mockConversationsList.find((c) => c.otherUserId === payload.receiverId)
    if (conv) {
      conv.lastMessage = payload.content
      conv.lastMessageTime = newMsg.createdAt
    }

    listeners.forEach((cb) => cb(newMsg))
  },
}
