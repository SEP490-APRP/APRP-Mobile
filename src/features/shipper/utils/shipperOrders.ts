import { orderIdOf } from '@/features/order/utils/orderStatus'
import type { OrderResponse, OrderStatus } from '@/types/order.types'

export interface LatLng {
  latitude: number
  longitude: number
}

/** Toạ độ mặc định (trung tâm TP.HCM) khi không lấy được GPS từ thiết bị hoặc máy ảo */
export const DEFAULT_SHIPPER_COORDS: LatLng = { latitude: 10.7769, longitude: 106.7009 }

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

/** Hệ số quy đổi chim bay sang đường thực tế, khớp GeoUtils.ROAD_FACTOR ở BE */
export const ROAD_FACTOR = 1.25

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
  // Ưu tiên số BE trả (quãng đường ước tính = chim bay × 1,25, cùng số BE dùng để quyết định mời);
  // không có thì tự tính cùng công thức
  const toShop = o.distanceToShopKm ?? (me && shop ? Math.round(straightKm(me, shop) * ROAD_FACTOR * 10) / 10 : undefined)
  const toBuyer = o.distanceKm ?? (shop && buyer ? straightKm(shop, buyer) : undefined)
  const total = toShop != null && toBuyer != null ? toShop + toBuyer : undefined
  return { toShop, toBuyer, total }
}

export const isCod = (o: Pick<OrderResponse, 'paymentMethod'>) => (o.paymentMethod ?? '').toUpperCase() === 'COD'

/** Tiền shipper phải thu của khách khi giao: chỉ đơn COD. */
/** Tiền shipper phải thu của khách khi giao: chỉ đơn COD. codAmount = 0 (chưa thu) thì lấy tổng tiền đơn. */
export const codToCollect = (o: OrderResponse) => (isCod(o) ? Number(o.codAmount || o.totalAmount || 0) : 0)

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

const vnd = (n: unknown) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0) + 'đ'

/** Mã lỗi BE (nếu có) */
export function shipperErrorCode(err: unknown): number | undefined {
  return (err as { data?: { code?: number } } | null)?.data?.code
}

/** Mã lỗi nghiệp vụ của OrderService / ví đổi sang câu dễ hiểu cho tài xế. */
export function shipperErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { code?: number; message?: string; result?: unknown } } | null)?.data
  switch (data?.code) {
    case 7002:
      return 'Đơn này vừa đổi trạng thái, có thể shipper khác đã nhận. Kéo xuống để tải lại.'
    case 7004:
      return 'Bạn đang có đơn chưa giao xong. Hoàn tất đơn đó rồi nhận thêm nhé.'
    case 7005:
      return 'Đơn này đã được tài xế khác nhận.'
    case 7006:
      return 'Bạn cần bật nhận đơn để xem và nhận đơn.'
    case 7007:
      return 'Cần chụp ít nhất 1 ảnh bằng chứng.'
    case 7009:
      return 'Cần gọi khách tối thiểu 3 cuộc trước khi báo không liên lạc được.'
    case 7010:
      return 'Ghi rõ lý do giao thất bại nhé.'
    case 16013: {
      const r = (data.result ?? {}) as { required?: number; available?: number; missing?: number }
      return `Đơn COD cần ký quỹ ${vnd(r.required)}, ví còn ${vnd(r.available)}. Nạp thêm ${vnd(r.missing)} để nhận đơn.`
    }
    case 16014:
      return 'Ví đang âm do còn tiền COD chưa nộp về sàn. Nạp ví trước khi nhận đơn.'
  }
  // 9999 = lỗi chưa phân loại ở BE ("Uncategorized Error"): dùng câu dự phòng tiếng Việt
  if (data?.code === 9999) return fallback
  return data?.message?.trim() || fallback
}

/**
 * Ký quỹ đơn COD: số dư khả dụng phải >= tiền thu của khách.
 * Trả về số tiền cần ký quỹ và số còn thiếu (0 = đủ, hoặc đơn đã trả online).
 */
export function codReserveCheck(o: OrderResponse, available?: number | null) {
  const required = codToCollect(o)
  const have = Math.max(0, Number(available ?? 0))
  return { required, missing: required > 0 ? Math.max(0, required - have) : 0 }
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
