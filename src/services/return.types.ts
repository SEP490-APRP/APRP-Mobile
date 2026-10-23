export type ReturnStatus =
  | 'PENDING'
  | 'SHOP_APPROVED'
  | 'DISPUTED'
  | 'REFUND_PENDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'

export interface ReturnRequestResponse {
  id: number
  orderId: number
  productName: string
  refundAmount: number
  reason: string
  status: ReturnStatus
  createdAt: string
  updatedAt?: string
  buyerName?: string
  shopName?: string
  evidence?: string
  adminRemark?: string
  shopResponse?: string
  buyerPhone?: string
  shopPhone?: string
}
