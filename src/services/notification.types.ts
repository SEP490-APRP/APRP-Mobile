export interface NotificationItem {
  id: number
  notiId?: number
  title: string
  message: string
  evidence?: string
  targetRole?: string
  receiverType?: string
  receiverTypes?: string[]
  createAt?: string
  createdAt?: string
  isRead?: boolean
  adminId?: number
  adminName?: string
  /** NEW_ORDER | ORDER_STATUS | SHIPPER_OFFER | DISPATCH_TIMEOUT | CHAT_MESSAGE... */
  type?: string | null
  /** Id đối tượng liên quan (vd. orderId) */
  referenceId?: number | null
}

export interface AdminSendNotificationRequest {
  title: string
  message: string
  evidence?: string
  receiverTypes: string[]
}
