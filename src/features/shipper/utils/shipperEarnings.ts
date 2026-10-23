import type { OrderResponse } from '@/types/order.types'
import { codToCollect } from './shipperOrders'

/**
 * Thu nhập của tài xế tính từ các đơn đã giao.
 * Backend chưa có ví shipper, nên thu nhập = phí giao hàng của đơn giao thành công.
 */

export type EarningsPeriod = 'today' | '7d' | '30d' | 'all'

export const EARNINGS_PERIODS: { value: EarningsPeriod; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'all', label: 'Tất cả' },
]

export const isDelivered = (o: Pick<OrderResponse, 'status'>) => o.status === 'DELIVERED' || o.status === 'COMPLETED'

/** Ngày tài xế chạy đơn: lúc lấy hàng, chưa có thì lúc đặt đơn (backend không lưu giờ giao xong). */
export function workDate(o: Pick<OrderResponse, 'pickedUpAt' | 'createdAt'>): Date | null {
  const d = new Date(o.pickedUpAt || o.createdAt)
  return Number.isNaN(d.getTime()) ? null : d
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const DAY_MS = 86_400_000

export function inPeriod(o: OrderResponse, period: EarningsPeriod, now = new Date()): boolean {
  if (period === 'all') return true
  const d = workDate(o)
  if (!d) return false
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30
  const from = startOfDay(now).getTime() - (days - 1) * DAY_MS
  return d.getTime() >= from
}

export interface EarningsSummary {
  delivered: number
  failed: number
  fees: number
  cod: number
  /** Phần trăm giao thành công, undefined khi chưa có đơn nào kết thúc */
  successRate?: number
}

export function earningsSummary(orders: readonly OrderResponse[]): EarningsSummary {
  let delivered = 0
  let failed = 0
  let fees = 0
  let cod = 0
  for (const o of orders) {
    if (isDelivered(o)) {
      delivered++
      fees += Number(o.shippingFee ?? 0)
      cod += codToCollect(o)
    } else if (o.status === 'FAILED') failed++
  }
  const done = delivered + failed
  return { delivered, failed, fees, cod, successRate: done ? Math.round((delivered / done) * 100) : undefined }
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export interface DayBar {
  key: string
  label: string
  fees: number
  count: number
}

/** Phí giao theo từng ngày trong `days` ngày gần nhất, ngày cũ trước. */
export function dailyFees(orders: readonly OrderResponse[], days = 7, now = new Date()): DayBar[] {
  const today = startOfDay(now)
  const bars: DayBar[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * DAY_MS)
    return { key: dayKey(d), label: i === days - 1 ? 'Nay' : WEEKDAYS[d.getDay()], fees: 0, count: 0 }
  })
  const byKey = new Map(bars.map((b) => [b.key, b]))
  for (const o of orders) {
    if (!isDelivered(o)) continue
    const d = workDate(o)
    const bar = d && byKey.get(dayKey(d))
    if (!bar) continue
    bar.fees += Number(o.shippingFee ?? 0)
    bar.count++
  }
  return bars
}

export function dayTitle(d: Date, now = new Date()): string {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / DAY_MS)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  return `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export interface HistoryDay {
  key: string
  title: string
  fees: number
  orders: OrderResponse[]
}

/** Nhóm lịch sử theo ngày chạy đơn, ngày mới trước, trong ngày đơn mới trước. */
export function groupByDay(orders: readonly OrderResponse[], now = new Date()): HistoryDay[] {
  const groups = new Map<string, HistoryDay>()
  const sorted = [...orders].sort((a, b) => (workDate(b)?.getTime() ?? 0) - (workDate(a)?.getTime() ?? 0))
  for (const o of sorted) {
    const d = workDate(o)
    const key = d ? dayKey(d) : 'unknown'
    let g = groups.get(key)
    if (!g) {
      g = { key, title: d ? dayTitle(d, now) : 'Không rõ ngày', fees: 0, orders: [] }
      groups.set(key, g)
    }
    g.orders.push(o)
    if (isDelivered(o)) g.fees += Number(o.shippingFee ?? 0)
  }
  return [...groups.values()]
}
