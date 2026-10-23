export interface OrderResponse {
  id: number
  orderCode?: string
  status: string
  totalAmount: number
  shippingFee: number
  buyerName?: string
  buyerPhone?: string
  shopName?: string
  createdAt: string
  itemsCount?: number
  paymentMethod?: string
  codAmount?: number
  codPrepaidAmount?: number
  shippingDiscountAmount?: number
  refundAmount?: number
  refundReason?: string
}
