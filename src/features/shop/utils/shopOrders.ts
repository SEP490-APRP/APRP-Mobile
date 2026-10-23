import { orderIdOf } from '@/features/order/utils/orderStatus'
import type { OrderResponse, OrderStatus } from '@/types/order.types'

export type ShopOrderTab = 'ALL' | 'TO_CONFIRM' | 'PACKING' | 'READY' | 'SHIPPING' | 'DONE' | 'CANCELLED'

/** Thẻ lọc đơn của Nhà vườn, như trang Đơn hàng bản web (không có đơn chờ thanh toán). */
export const SHOP_ORDER_TABS: { key: ShopOrderTab; label: string; statuses: OrderStatus[] }[] = [
  {
    key: 'ALL',
    label: 'Tất cả',
    statuses: [
      'PENDING',
      'PAID',
      'CONFIRMED',
      'READY',
      'SHIPPING',
      'PICKED_UP',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
      'FAILED',
    ],
  },
  { key: 'TO_CONFIRM', label: 'Chờ xác nhận', statuses: ['PENDING', 'PAID'] },
  { key: 'PACKING', label: 'Đang chuẩn bị', statuses: ['CONFIRMED'] },
  { key: 'READY', label: 'Sẵn sàng giao', statuses: ['READY'] },
  { key: 'SHIPPING', label: 'Đang giao', statuses: ['SHIPPING', 'PICKED_UP'] },
  { key: 'DONE', label: 'Đã giao', statuses: ['DELIVERED', 'COMPLETED'] },
  { key: 'CANCELLED', label: 'Đã huỷ', statuses: ['CANCELLED', 'FAILED'] },
]

export const isShopOrderTab = (v: unknown): v is ShopOrderTab => SHOP_ORDER_TABS.some((t) => t.key === v)

/** Bước tiếp theo shop cần làm với đơn. */
export type ShopOrderStage = 'confirm' | 'pack' | 'waiting_shipper' | 'shipping' | 'done' | 'cancelled' | 'other'

export function shopOrderStage(status?: string | null): ShopOrderStage {
  switch (status) {
    case 'PENDING':
    case 'PAID':
      return 'confirm'
    case 'CONFIRMED':
      return 'pack'
    case 'READY':
      return 'waiting_shipper'
    case 'SHIPPING':
    case 'PICKED_UP':
      return 'shipping'
    case 'DELIVERED':
    case 'COMPLETED':
      return 'done'
    case 'CANCELLED':
    case 'FAILED':
      return 'cancelled'
    default:
      return 'other'
  }
}

/** Shop huỷ được khi chưa giao cho shipper. */
export const shopCanCancel = (status?: string | null) => ['confirm', 'pack'].includes(shopOrderStage(status))

/** Khách đã trả trước (PayOS) thì shop không thu tiền khi giao. */
export const isPrepaid = (o: Pick<OrderResponse, 'status' | 'paymentMethod'>) =>
  o.status === 'PAID' || ['PAYOS', 'TRANSFER'].includes(o.paymentMethod?.toUpperCase() ?? '')

/** Lời nhắc theo bước, lấy từ các khối thông báo trong thẻ đơn bản web. */
export function stageHint(o: Pick<OrderResponse, 'status' | 'paymentMethod'>): string {
  switch (shopOrderStage(o.status)) {
    case 'confirm':
      return isPrepaid(o)
        ? 'Khách đã thanh toán qua VietQR. Bạn chỉ cần xác nhận và chuẩn bị hàng.'
        : 'Đơn thu tiền khi giao (COD). Xác nhận để bắt đầu chuẩn bị hàng.'
    case 'pack':
      return 'Đóng thùng xong thì bấm "Sẵn sàng giao" để shipper thấy đơn và tới lấy.'
    case 'waiting_shipper':
      return 'Đã đóng thùng xong. Đơn đang chờ shipper nhận giao.'
    case 'shipping':
      return o.status === 'PICKED_UP'
        ? 'Shipper đã lấy hàng và đang giao tới người nhận.'
        : 'Shipper đã nhận đơn và đang tới vườn lấy hàng.'
    case 'done':
      return 'Giao hàng thành công, khách đã nhận nông sản.'
    case 'cancelled':
      return o.status === 'FAILED' ? 'Giao không thành công.' : 'Đơn đã huỷ, số lượng nông sản đã được hoàn lại kho.'
    default:
      return ''
  }
}

/** Tìm theo mã đơn, tên người nhận hoặc số điện thoại (như ô tìm kiếm bản web). */
export function matchShopOrder(o: OrderResponse, keyword: string): boolean {
  const q = keyword.trim().toLowerCase().replace(/^#/, '')
  if (!q) return true
  return (
    String(orderIdOf(o)).includes(q) ||
    !!o.recipientName?.toLowerCase().includes(q) ||
    !!o.recipientPhone?.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
  )
}

/** Cam kết trước khi xác nhận đơn (ô tích bắt buộc bản web). */
export const WEIGHT_PLEDGE =
  'Tôi cam kết thu hoạch cân đủ trọng lượng và đóng gói tươi sạch đúng tiêu chuẩn, vì nông sản tươi dễ hao hụt.'

/** Checklist đóng gói chuẩn CapNong (màn Chuẩn bị đơn bản web). */
export const PACKING_CHECKLIST = [
  'Nông sản đạt độ tươi, rũ sạch đất cát, bỏ lá úa dập nát.',
  'Cân đúng hoặc dư trọng lượng để bù hao hụt khi giao.',
  'Đóng thùng carton hoặc khay xốp, lót giấy thoáng khí hoặc màng chống dập.',
  'Ghi hoặc dán mã đơn lên mặt thùng.',
] as const

export const itemName = (it: { itemName?: string; productName?: string; mysteryBoxType?: string }) =>
  it.itemName || it.productName || it.mysteryBoxType || 'Nông sản'

export const itemSubtotal = (it: { subtotal?: number; unitPrice?: number; quantity?: number }) =>
  Number(it.subtotal ?? Number(it.unitPrice || 0) * Number(it.quantity || 1))

/** Giờ và ngày đặt: 08:05 · 23/10/2026 */
export function orderTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())} · ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}
