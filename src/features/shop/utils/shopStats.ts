import type { OrderResponse } from '@/types/order.types'

/** Đơn shop cần bấm "Xác nhận". */
export const NEEDS_CONFIRM = ['PENDING', 'PAID'] as const
const IN_PROGRESS = ['PAID', 'CONFIRMED', 'READY', 'SHIPPING', 'PICKED_UP']
const DONE = ['DELIVERED', 'COMPLETED']
const LOST = ['CANCELLED', 'FAILED']

const sum = (orders: OrderResponse[]) => orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)

/** Đơn shop thấy được: bỏ đơn chuyển khoản chưa trả tiền, như bản web. */
export const visibleShopOrders = (orders: OrderResponse[] = []) => orders.filter((o) => o.status !== 'AWAITING_PAYMENT')

export interface ShopOrderStats {
  total: number
  needsConfirm: number
  toPack: number
  completedRevenue: number
  completedCount: number
  pendingRevenue: number
  pendingCount: number
  grossRevenue: number
}

/**
 * Số liệu trang Tổng quan, tính từ đơn như Dashboard bản web:
 * đã hoàn thành (đã giao), chờ quyết toán (đang xử lý/giao), tổng giá trị (trừ huỷ/thất bại).
 */
export function shopOrderStats(orders: OrderResponse[] = []): ShopOrderStats {
  const list = visibleShopOrders(orders)
  const completed = list.filter((o) => DONE.includes(o.status))
  const pending = list.filter((o) => IN_PROGRESS.includes(o.status))
  return {
    total: list.length,
    needsConfirm: list.filter((o) => (NEEDS_CONFIRM as readonly string[]).includes(o.status)).length,
    toPack: list.filter((o) => o.status === 'CONFIRMED').length,
    completedRevenue: sum(completed),
    completedCount: completed.length,
    pendingRevenue: sum(pending),
    pendingCount: pending.length,
    grossRevenue: sum(list.filter((o) => !LOST.includes(o.status))),
  }
}

export type ListingTone = 'leaf' | 'amber' | 'rose' | 'gray'

/** Trạng thái tin đăng (nông sản, combo, túi mù) theo cách web hiển thị. */
export function listingStatus(status?: string | null, isActive?: boolean): { label: string; tone: ListingTone } {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'APPROVED':
      return { label: 'Đang bán', tone: 'leaf' }
    case 'PENDING':
      return { label: 'Chờ duyệt', tone: 'amber' }
    case 'REJECTED':
      return { label: 'Bị từ chối', tone: 'rose' }
    case 'OUT_OF_STOCK':
    case 'SOLD_OUT':
      return { label: 'Hết hàng', tone: 'gray' }
    case undefined:
    case '':
      return isActive === false ? { label: 'Tạm dừng', tone: 'gray' } : { label: 'Đang bán', tone: 'leaf' }
    default:
      return { label: 'Tạm dừng', tone: 'gray' }
  }
}

export const isSelling = (status?: string | null) => ['ACTIVE', 'APPROVED'].includes(status?.toUpperCase() ?? '')

/** Lời chào theo giờ trong ngày. */
export function greeting(hour = new Date().getHours()): string {
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 14) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}
