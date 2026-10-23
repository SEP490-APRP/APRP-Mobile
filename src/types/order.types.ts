/**
 * Types cho Shop Order Processing
 * Mapping với BE OrderController + OrderResponse
 */

/** Toàn bộ trạng thái đơn hàng BE có thể trả về */
export type OrderStatus =
  | 'AWAITING_PAYMENT' // Chờ thanh toán PayOS / chuyển khoản
  | 'PENDING' // Buyer vừa đặt (COD) — chờ shop xác nhận
  | 'PAID' // Buyer đã thanh toán QR — chờ shop xác nhận
  | 'CONFIRMED' // Shop đã xác nhận, đang chuẩn bị hàng
  | 'READY' // Shop đóng gói xong, shipper có thể đến lấy
  | 'SHIPPING' // Shipper đã nhận đơn, đang đến shop lấy hàng
  | 'PICKED_UP' // Shipper đã lấy hàng tại shop, đang giao đến người mua
  | 'DELIVERED' // Đã giao thành công
  | 'COMPLETED' // Hoàn thành
  | 'CANCELLED' // Đã hủy
  | 'FAILED' // Giao thất bại

/** Một sản phẩm trong đơn hàng */
export interface OrderItem {
  orderDetailId?: number
  productId?: number
  mysteryBoxId?: number
  buildComboId?: number
  itemName?: string
  productName?: string
  mysteryBoxType?: string
  quantity: number
  quantityKg?: number
  unitPrice: number
  pricePerKg?: number
  subtotal?: number
  imageUrl?: string
  itemType?: 'PRODUCT' | 'MYSTERY_BOX' | 'BUILD_COMBO' | string
}

/** Thông tin shop gắn trong đơn hàng */
export interface OrderShopInfo {
  id?: number
  shopName?: string
  logoUrl?: string
}

/** Response đầy đủ của 1 đơn hàng từ BE */
export interface OrderResponse {
  id?: number
  orderId?: number
  batchId?: number
  shopId?: number
  buyerName?: string
  shopName?: string
  status: OrderStatus
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  paymentMethod: string
  note?: string
  totalAmount: number
  shippingFee?: number
  voucherDiscountAmount?: number
  shippingLatitude?: number
  shippingLongitude?: number
  shopLatitude?: number
  shopLongitude?: number
  /** Quãng đường nhà vườn → người mua do backend tính (km) */
  distanceKm?: number
  shopAddress?: string
  shopPhone?: string
  /** Số tiền shipper thu của khách khi giao (đơn COD) */
  codAmount?: number
  shipperId?: number
  shipperName?: string
  createdAt: string
  pickedUpAt?: string
  items: OrderItem[]
  shopOwner?: OrderShopInfo
}

/** Response khi BE trả về dạng page */
export interface OrderPageResponse {
  content: OrderResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

/** Params để fetch danh sách đơn có filter */
export interface FetchOrdersParams {
  page?: number
  size?: number
  statuses?: OrderStatus[]
}

// ── BUYER: Checkout types ─────────────────────────────────────────────────────

/** Một item trong đơn khi tạo order */
export interface OrderItemRequest {
  productId?: number
  mysteryBoxId?: number
  buildComboId?: number
  quantity: number
  quantityKg?: number
}

export interface ShopOrderPreview {
  shopId: number
  shopName: string
  goodsAmount: number
  shippingFee: number
  voucherDiscount: number
  totalAmount: number
  items: OrderItem[]
  voucherDiscountsDetail?: Record<string, number>
}

/** Request xem trước đơn hàng (tính phí, voucher...) */
export interface CheckoutPreviewRequest {
  shippingAddress?: string
  voucherCodes?: string[]
  items: OrderItemRequest[]
  cartItemIds?: number[]
}

/** Response xem trước — BE tính toán phí */
export interface CheckoutPreviewResponse {
  shopOrders?: ShopOrderPreview[]
  totalGoodsAmount?: number
  totalShippingFee?: number
  totalVoucherDiscount?: number
  voucherDiscountsDetail?: Record<string, number>
  finalTotalAmount?: number
  // Aliases backward compatible
  subtotal?: number
  shippingFee?: number
  discount?: number
  totalAmount?: number
  estimatedDelivery?: string
}

/** Request tạo đơn hàng thật */
export interface CreateOrderRequest {
  recipientName?: string
  recipientPhone?: string
  shippingAddress: string
  saveAddressToBook?: boolean
  addressLabel?: string
  note?: string
  paymentMethod: 'COD' | 'TRANSFER' | 'PAYOS' | string
  voucherCodes?: string[]
  items: OrderItemRequest[]
  cartItemIds?: number[]
}
