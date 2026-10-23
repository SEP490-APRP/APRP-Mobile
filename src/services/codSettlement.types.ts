export interface CodPendingOrderItem {
  id: number
  orderDetailId?: number
  orderMysteryBoxId?: number
  mysteryBoxType?: string
  productName?: string
  name?: string
  quantityKg?: number
  quantity?: number
  pricePerKg?: number
  unitPrice?: number
  imageUrl?: string
  image?: string
}

export interface CodPendingOrderResponse {
  id: number
  orderCode?: string
  status?: string
  totalAmount?: number
  shippingFee?: number
  prepaidAmount?: number
  collectAmount?: number
  codCollectAmount?: number
  codPrepaidAmount?: number
  codPaymentStatus?: string
  codPaymentOption?: string
  createdAt?: string
  deliveredAt?: string
  recipientName?: string
  recipientPhone?: string
  deliveryAddress?: string
  shippingAddress?: string
  note?: string
  refundAmount?: number
  refundReason?: string
  codSettled?: boolean
  buyerId?: number
  buyer?: {
    id: number
    fullName?: string
    phone?: string
    phoneNumber?: string
  }
  shipper?: {
    id: number
    fullName?: string
    phone?: string
    phoneNumber?: string
  }
  shop?: {
    id: number
    shopName?: string
  }
  items: CodPendingOrderItem[]
}
