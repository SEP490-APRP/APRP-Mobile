export interface NotificationItem {
  id: number
  title: string
  message: string
  targetRole?: string
  receiverType?: string
  receiverTypes?: string[]
  createdAt?: string
  createAt?: string
  isRead?: boolean
}
