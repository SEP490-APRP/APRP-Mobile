import { orderIdOf } from '@/features/order/utils/orderStatus'
import type { OrderResponse, OrderStatus } from '@/types/order.types'

export interface LatLng {
  latitude: number
  longitude: number
}

/** Đơn shipper đang cầm: chặng 1 đến nhà vườn, chặng 2 đi giao. */
export const ACTIVE_STATUSES: OrderStatus[] = ['SHIPPING', 'PICKED_UP']
export const DONE_STATUSES: OrderStatus[] = ['DELIVERED', 'COMPLETED', 'FAILED']

const isCoord = (lat?: number | null, lng?: number | null) =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  !(lat === 0 && lng === 0)

export const shopPoint = (o: OrderResponse): LatLng | null =>
  isCoord(o.shopLatitude, o.shopLongitude) ? { latitude: o.shopLatitude!, longitude: o.shopLongitude! } : null

export const buyerPoint = (o: OrderResponse): LatLng | null =>
  isCoord(o.shippingLatitude, o.shippingLongitude)
    ? { latitude: o.shippingLatitude!, longitude: o.shippingLongitude! }
    : null

/** Khoảng cách đường chim bay (km), công thức haversine. */
export function straightKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatKm(km?: number | null): string {
  if (km == null || !Number.isFinite(km)) return '—'
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
  return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`
}

/** Hai chặng của một đơn: shipper → nhà vườn (cần GPS) và nhà vườn → khách. */
export function orderLegs(o: OrderResponse, me?: LatLng | null) {
  const shop = shopPoint(o)
  const buyer = buyerPoint(o)
  const toShop = me && shop ? straightKm(me, shop) : undefined
  const toBuyer = o.distanceKm ?? (shop && buyer ? straightKm(shop, buyer) : undefined)
  const total = toShop != null && toBuyer != null ? toShop + toBuyer : undefined
  return { toShop, toBuyer, total }
}

export const isCod = (o: Pick<OrderResponse, 'paymentMethod'>) => (o.paymentMethod ?? '').toUpperCase() === 'COD'

/** Tiền shipper phải thu của khách khi giao: chỉ đơn COD. */
export const codToCollect = (o: OrderResponse) => (isCod(o) ? Number(o.codAmount ?? o.totalAmount ?? 0) : 0)

export function itemsSummary(o: OrderResponse): string {
  const items = o.items ?? []
  if (!items.length) return 'Đơn nông sản'
  const first = items[0].itemName || items[0].productName || items[0].mysteryBoxType || 'Nông sản'
  return items.length > 1 ? `${first} và ${items.length - 1} món khác` : first
}

/** Đơn gần nhà vườn trước; không có GPS thì đơn cũ trước (chờ lâu hơn). */
export function sortReadyOrders(orders: readonly OrderResponse[], me?: LatLng | null): OrderResponse[] {
  return [...orders].sort((a, b) => {
    const da = orderLegs(a, me).toShop
    const db = orderLegs(b, me).toShop
    if (da != null && db != null && da !== db) return da - db
    if (da != null && db == null) return -1
    if (da == null && db != null) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || orderIdOf(a) - orderIdOf(b)
  })
}

export function minutesAgo(iso?: string, now = Date.now()): string {
  if (!iso) return ''
  const m = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (!Number.isFinite(m)) return ''
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  if (m < 24 * 60) return `${Math.floor(m / 60)} giờ trước`
  return `${Math.floor(m / 1440)} ngày trước`
}

/** Mã lỗi nghiệp vụ của OrderService đổi sang câu dễ hiểu cho tài xế. */
export function shipperErrorMessage(err: unknown, fallback: string): string {
  const code = (err as { data?: { code?: number } } | null)?.data?.code
  if (code === 7004) return 'Bạn đang có đơn chưa giao xong. Hoàn tất đơn đó rồi nhận thêm nhé.'
  if (code === 7002) return 'Đơn này vừa đổi trạng thái, có thể shipper khác đã nhận. Kéo xuống để tải lại.'
  const msg = (err as { data?: { message?: string } } | null)?.data?.message
  return msg?.trim() || fallback
}

/** Link chỉ đường Google Maps tới chặng hiện tại: nhà vườn khi chưa lấy hàng, khách khi đã lấy. */
export function directionsUrl(o: OrderResponse): string | null {
  const toBuyer = o.status === 'PICKED_UP'
  const point = toBuyer ? buyerPoint(o) : shopPoint(o)
  const address = toBuyer ? o.shippingAddress : o.shopAddress
  const destination = point ? `${point.latitude},${point.longitude}` : address?.trim()
  if (!destination) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=two-wheeler`
}
