export type ReturnStatus =
  | 'PENDING'
  | 'SHOP_APPROVED'
  | 'DISPUTED'
  | 'ADMIN_APPROVED'
  | 'APPROVED'
  | 'RETURN_SHIPPING'
  | 'RETURN_PICKED_UP'
  | 'RETURN_DELIVERED'
  | 'RETURN_FAILED'
  | 'REFUND_PENDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'

export interface ReturnRequestResponse {
  id: number
  returnId?: number
  orderId: number
  orderDetailId?: number
  productName: string
  productImage?: string
  itemType?: string
  quantity?: number
  unitPrice?: number
  itemTotal?: number
  refundAmount: number
  reason: string
  status: ReturnStatus
  isReturnGoods?: boolean
  returnShippingFee?: number
  shippingPaymentMethod?: 'WALLET' | 'COD'
  isShippingFeePaid?: boolean
  createdAt: string
  updatedAt?: string
  pickedUpAt?: string
  returnedAt?: string
  buyerId?: number
  buyerName?: string
  buyerPhone?: string
  buyerAddress?: string
  shopId?: number
  shopName?: string
  shopPhone?: string
  shopAddress?: string
  shipperId?: number
  shipperName?: string
  shipperPhone?: string
  evidence?: string
  evidenceUrls?: string[]
  adminRemark?: string
  shopResponse?: string
}

export interface ReturnCreateRequest {
  orderDetailId: number
  reason: string
  refundAmount?: number
  isReturnGoods?: boolean
  evidenceUrls?: string[]
}

export interface ShopReturnRespondRequest {
  accept: boolean
  shopResponse: string
  isReturnGoods?: boolean
  shippingPaymentMethod?: 'WALLET' | 'COD'
  returnShippingFee?: number
}

export interface AdminReturnDecisionRequest {
  accept: boolean
  refundAmount?: number
  isReturnGoods?: boolean
  shippingPaymentMethod?: 'WALLET' | 'COD'
  returnShippingFee?: number
  adminRemark?: string
}

export interface ShipperReturnActionRequest {
  note?: string
  proofImageUrl?: string
}
