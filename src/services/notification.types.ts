export interface NotificationItem {
  id: number
  notiId?: number
  title: string
  message: string
  evidence?: string
  targetRole?: string
  receiverType?: string
  receiverTypes?: string[]
  isRead?: boolean
  adminId?: number
  adminName?: string
  createAt?: string
  createdAt?: string
}
