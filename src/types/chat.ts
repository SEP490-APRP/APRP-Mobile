export interface ChatMessage {
  id: string | number
  conversationId?: number
  senderId: number
  senderName?: string
  senderAvatar?: string
  receiverId: number
  content: string
  type?: string
  attachmentUrl?: string
  referenceId?: number
  createdAt?: string
  sentAt?: string
  isRead?: boolean
  read?: boolean
}

export interface Conversation {
  id: string | number
  roomKey?: string
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
  referenceId?: number
  attachmentUrl?: string
}
