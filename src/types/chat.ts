export interface ChatMessage {
  id: string | number
  conversationId?: number
  senderId: number
  receiverId: number
  content: string
  type?: string
  attachmentUrl?: string
  createdAt?: string
  sentAt?: string
  isRead?: boolean
}

export interface Conversation {
  id: string | number
  otherUserId: number
  otherUserName: string
  otherUserRole?: string
  otherUserAvatar?: string
  lastMessage?: string
  lastMessageTime?: string
  lastMessageAt?: string
  unreadCount?: number
}

export interface ChatMessageRequest {
  receiverId: number
  content?: string
  type?: string
  attachmentUrl?: string
  referenceId?: number
}
