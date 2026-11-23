import type { ChatMessage, Conversation } from '@/types/chat'

const timeOf = (m: ChatMessage) => new Date(m.sentAt || m.createdAt || 0).getTime()

/** BE trả tin mới nhất trước; màn chat hiển thị từ cũ đến mới. */
export function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => timeOf(a) - timeOf(b))
}

export const isMineMessage = (message: ChatMessage, userId?: string | number) =>
  userId !== undefined && Number(message.senderId) === Number(userId)

export function canSendChat(text: string, isSending: boolean): boolean {
  return text.trim().length > 0 && !isSending
}

export function conversationPreview(conversation: Conversation): string {
  return conversation.lastMessage?.trim() || 'Chưa có tin nhắn'
}

/** Trong hôm nay hiện giờ, ngày khác hiện ngày. */
export function chatTimeLabel(value?: string, now = new Date()): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toDateString() === now.toDateString()
    ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('vi-VN')
}
