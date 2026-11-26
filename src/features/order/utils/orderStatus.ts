import type { OrderResponse, OrderStatus } from '@/types/order.types'

export const ORDER_STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: 'Chờ thanh toán',
  PENDING: 'Chờ xác nhận',
  AWAITING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  PACK: 'Đang đóng gói',
  READY: 'Sẵn sàng giao',
  SHIPPING_TO_WAREHOUSE: 'Đang giao tới kho',
  ARRIVED_AT_WAREHOUSE: 'Đã tới kho',
  QUALITY_CHECKING: 'Đang kiểm định',
  QUALITY_APPROVED: 'Đạt chất lượng',
  QUALITY_CHECKED: 'Đã kiểm tra',
  QUALITY_REJECTED: 'Không đạt chất lượng',
  SHIPPING: 'Tài xế đang đến lấy',
  PICKED_UP: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn thành',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã huỷ',
  FAILED: 'Giao thất bại',
  RETURNING_TO_SHOP: 'Đang hoàn về Shop',
  RETURNED_TO_SHOP: 'Chờ Shop xác nhận hoàn',
  REFUND_REQUESTED: 'Đang yêu cầu trả hàng',
  REFUNDED: 'Đã hoàn tiền',
  SHOP_APPROVED: 'Shop đã duyệt',
  ADMIN_APPROVED: 'Admin đã duyệt',
  APPROVED: 'Đã chấp thuận',
  DISPUTED: 'Đang khiếu nại',
  RETURN_SHIPPING: 'Chờ shipper lấy hàng trả',
  RETURN_PICKED_UP: 'Đang chuyển hàng trả',
  RETURN_DELIVERED: 'Đã trả về shop',
  RETURN_FAILED: 'Trả hàng thất bại',
  REFUND_PENDING: 'Đang hoàn tiền',
  REJECTED: 'Đã từ chối',
}

export const orderStatusLabel = (status?: string | null) => {
  if (!status) return 'Không xác định'
  const key = status.toUpperCase().trim()
  return ORDER_STATUS_LABELS[key] ?? ORDER_STATUS_LABELS[status] ?? status
}

export type StatusTone = 'leaf' | 'blue' | 'amber' | 'rose' | 'gray'

export function orderStatusTone(status?: string | null): StatusTone {
  const s = (status || '').toUpperCase()
  switch (s) {
    case 'COMPLETED':
    case 'PAID':
    case 'DELIVERED':
    case 'QUALITY_APPROVED':
    case 'REFUNDED':
    case 'RETURN_DELIVERED':
      return 'leaf'
    case 'PICKED_UP':
    case 'SHIPPING':
    case 'SHIPPING_TO_WAREHOUSE':
    case 'SHOP_APPROVED':
    case 'ADMIN_APPROVED':
    case 'APPROVED':
    case 'RETURN_SHIPPING':
    case 'RETURN_PICKED_UP':
      return 'blue'
    case 'AWAITING_PAYMENT':
    case 'PENDING':
    case 'AWAITING_CONFIRMATION':
    case 'PREPARING':
    case 'QUALITY_CHECKING':
    case 'RETURNING_TO_SHOP':
    case 'RETURNED_TO_SHOP':
    case 'REFUND_REQUESTED':
    case 'REFUND_PENDING':
    case 'DISPUTED':
      return 'amber'
    case 'CANCELLED':
    case 'FAILED':
    case 'QUALITY_REJECTED':
    case 'RETURN_FAILED':
    case 'REJECTED':
      return 'rose'
    default:
      return 'gray'
  }
}

export type OrderTab = 'ALL' | 'AWAITING_PAYMENT' | 'PENDING' | 'SHIPPING' | 'COMPLETED' | 'REFUND' | 'CANCELLED'

/** Các thẻ lọc và nhóm trạng thái gửi lên GET /orders/my, như bản web. */
export const ORDER_TABS: { key: OrderTab; label: string; statuses?: OrderStatus[] }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'AWAITING_PAYMENT', label: 'Chờ thanh toán', statuses: ['AWAITING_PAYMENT'] },
  { key: 'PENDING', label: 'Chờ xác nhận', statuses: ['PENDING', 'PAID'] },
  { key: 'SHIPPING', label: 'Đang giao', statuses: ['CONFIRMED', 'READY', 'SHIPPING', 'PICKED_UP'] },
  { key: 'COMPLETED', label: 'Hoàn thành', statuses: ['DELIVERED', 'COMPLETED'] },
  { key: 'REFUND', label: 'Trả hàng / Hoàn tiền', statuses: ['REFUND_REQUESTED', 'REFUNDED'] },
  { key: 'CANCELLED', label: 'Đã huỷ / Thất bại', statuses: ['CANCELLED', 'FAILED', 'RETURNING_TO_SHOP', 'RETURNED_TO_SHOP'] },
]

export const orderIdOf = (o: Pick<OrderResponse, 'orderId' | 'id'>) => o.orderId ?? o.id ?? 0

const isOnlinePayment = (method?: string) => ['PAYOS', 'TRANSFER'].includes(method?.toUpperCase() ?? '')

/** Đơn chuyển khoản chưa trả tiền: hiện nút "Thanh toán ngay". */
export const isUnpaidOrder = (o: Pick<OrderResponse, 'status' | 'paymentMethod'>) =>
  o.status === 'AWAITING_PAYMENT' || (o.status === 'PENDING' && isOnlinePayment(o.paymentMethod))

/** Người mua chỉ tự huỷ được khi shop chưa xác nhận. */
export const canCancelOrder = (o: Pick<OrderResponse, 'status'>) => o.status === 'AWAITING_PAYMENT' || o.status === 'PENDING'

/** Người mua xác nhận đã nhận đủ hàng khi shipper đã giao: DELIVERED -> COMPLETED */
export const canCompleteOrder = (status?: string | null) => status === 'DELIVERED'

/** Người mua có thể yêu cầu trả hàng / hoàn tiền khi đơn đã giao hoặc hoàn thành */
export const canRequestReturn = (status?: string | null) => status === 'DELIVERED' || status === 'COMPLETED'

/** Người mua có thể đánh giá sản phẩm sau khi đơn hoàn thành */
export const canReviewItem = (orderStatus?: string | null, isReviewed?: boolean) =>
  orderStatus === 'COMPLETED' && !isReviewed

export const paymentMethodLabel = (method?: string) => {
  const m = (method || '').toUpperCase()
  if (m === 'WALLET') return 'Ví CapNong'
  if (isOnlinePayment(m)) return 'Chuyển khoản PayOS'
  return 'Thanh toán khi nhận hàng (COD)'
}

/** Lý do hủy đơn hàng của Buyer, đồng bộ với web */
export const ORDER_CANCEL_REASONS = [
  'Tôi muốn thay đổi thông tin nhận hàng (địa chỉ, số điện thoại)',
  'Tôi muốn đổi sản phẩm hoặc thêm nông sản khác',
  'Thời gian giao hàng không phù hợp với tôi',
  'Tìm thấy giá ưu đãi hơn ở nguồn khác',
  'Tôi đổi ý, hiện chưa có nhu cầu mua nữa',
  'Lý do khác',
] as const

/** Tìm theo mã đơn, tên shop hoặc tên món. */
export function matchOrder(o: OrderResponse, keyword: string) {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return true
  return (
    String(orderIdOf(o)).includes(kw) ||
    !!o.shopName?.toLowerCase().includes(kw) ||
    !!o.items?.some((it) => (it.productName ?? it.itemName ?? '').toLowerCase().includes(kw))
  )
}

/** Các bước hiển thị trên dòng tiến trình ở màn chi tiết. */
export const ORDER_STEPS = ['Đặt hàng', 'Xác nhận', 'Đang giao', 'Đã nhận'] as const

export function orderStepIndex(status?: string | null): number {
  switch (status) {
    case 'AWAITING_PAYMENT':
    case 'PENDING':
    case 'PAID':
      return 0
    case 'CONFIRMED':
    case 'PREPARING':
    case 'READY':
      return 1
    case 'SHIPPING':
    case 'PICKED_UP':
      return 2
    case 'DELIVERED':
    case 'COMPLETED':
      return 3
    default:
      return -1
  }
}

/**
 * Mã đối soát khi bàn giao hàng: nhà vườn ghi/dán lên túi hàng, tài xế so khớp trước khi bấm "Đã lấy hàng".
 * Cùng định dạng với bản web (utils/orderCode.ts).
 */
export const pickupCode = (orderId: number | string) => `#${orderId}`

/** Nhà vườn cần dán mã lên túi hàng: đã xác nhận, chưa bàn giao cho tài xế */
export const needsPickupCode = (status?: string | null) =>
  status === 'CONFIRMED' || status === 'READY' || status === 'SHIPPING'
