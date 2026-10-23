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
}

export const orderStatusLabel = (status?: string | null) =>
  !status ? 'Không xác định' : (ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, ' '))

export type StatusTone = 'leaf' | 'blue' | 'amber' | 'rose' | 'gray'

export function orderStatusTone(status?: string | null): StatusTone {
  switch (status) {
    case 'COMPLETED':
    case 'PAID':
    case 'DELIVERED':
    case 'QUALITY_APPROVED':
      return 'leaf'
    case 'PICKED_UP':
    case 'SHIPPING':
    case 'SHIPPING_TO_WAREHOUSE':
      return 'blue'
    case 'AWAITING_PAYMENT':
    case 'PENDING':
    case 'AWAITING_CONFIRMATION':
    case 'PREPARING':
    case 'QUALITY_CHECKING':
      return 'amber'
    case 'CANCELLED':
    case 'FAILED':
    case 'QUALITY_REJECTED':
      return 'rose'
    default:
      return 'gray'
  }
}

export type OrderTab = 'ALL' | 'AWAITING_PAYMENT' | 'PENDING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'

/** Các thẻ lọc và nhóm trạng thái gửi lên GET /orders/my, như bản web. */
export const ORDER_TABS: { key: OrderTab; label: string; statuses?: OrderStatus[] }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'AWAITING_PAYMENT', label: 'Chờ thanh toán', statuses: ['AWAITING_PAYMENT'] },
  { key: 'PENDING', label: 'Chờ xác nhận', statuses: ['PENDING', 'PAID'] },
  { key: 'SHIPPING', label: 'Đang giao', statuses: ['CONFIRMED', 'READY', 'SHIPPING', 'PICKED_UP'] },
  { key: 'COMPLETED', label: 'Hoàn thành', statuses: ['DELIVERED', 'COMPLETED'] },
  { key: 'CANCELLED', label: 'Đã huỷ', statuses: ['CANCELLED', 'FAILED'] },
]

export const orderIdOf = (o: Pick<OrderResponse, 'orderId' | 'id'>) => o.orderId ?? o.id ?? 0

const isOnlinePayment = (method?: string) => ['PAYOS', 'TRANSFER'].includes(method?.toUpperCase() ?? '')

/** Đơn chuyển khoản chưa trả tiền: hiện nút "Thanh toán ngay". */
export const isUnpaidOrder = (o: Pick<OrderResponse, 'status' | 'paymentMethod'>) =>
  o.status === 'AWAITING_PAYMENT' || (o.status === 'PENDING' && isOnlinePayment(o.paymentMethod))

/** Người mua chỉ tự huỷ được khi shop chưa xác nhận. */
export const canCancelOrder = (o: Pick<OrderResponse, 'status'>) => o.status === 'AWAITING_PAYMENT' || o.status === 'PENDING'

export const paymentMethodLabel = (method?: string) =>
  isOnlinePayment(method) ? 'Chuyển khoản PayOS' : 'Thanh toán khi nhận hàng'

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
