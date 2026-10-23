export interface ChatMessage {
  id: string
  senderId: number
  receiverId: number
  content: string
  createdAt?: string
  sentAt?: string
  isRead?: boolean
}

export interface Conversation {
  id: string
  otherUserId: number
  otherUserName: string
  otherUserRole?: string
  otherUserAvatar?: string
  lastMessage?: string
  lastMessageTime?: string
  lastMessageAt?: string
  unreadCount?: number
}
