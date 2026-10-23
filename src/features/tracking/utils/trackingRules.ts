/**
 * Luật theo dõi shipper, chuyển từ GoogleMapTrackingModal bản web:
 * mỗi vai trò chỉ thấy chặng liên quan tới mình.
 * - Shop thấy xe khi tài xế đang tới quán hoặc đang ở quán (chặng cam Shipper ➔ Shop).
 * - Buyer chỉ thấy xe sau khi tài xế đã lấy hàng (chặng xanh Shop ➔ Khách).
 */

export type TrackingRole = 'BUYER' | 'SHOP' | 'SHIPPER'
export type DeliveryPhase = 'TO_SHOP' | 'AT_SHOP' | 'TO_BUYER' | 'DELIVERED' | 'FAILED'

export interface LatLng {
  lat: number
  lng: number
}

/** Dữ liệu từ GET /shippers/location/order/{id} và topic /topic/order/{id}/location */
export interface ShipperLocationPayload {
  orderId?: number
  shipperId?: number
  shipperName?: string
  shipperPhone?: string
  vehicleNumber?: string
  latitude?: number
  longitude?: number
  updatedAt?: unknown
  shopLatitude?: number
  shopLongitude?: number
  shopAddress?: string
  shopName?: string
  destinationLatitude?: number
  destinationLongitude?: number
  destinationAddress?: string
  recipientName?: string
  recipientPhone?: string
  orderStatus?: string
  isFake?: boolean
  gpsOff?: boolean
  deliveryPhase?: string
}

/** Toạ độ mặc định (TP.HCM) khi đơn chưa được geocode, giống bản web */
export const DEFAULT_SHOP: LatLng = { lat: 10.8515, lng: 106.7719 }
export const DEFAULT_DEST: LatLng = { lat: 10.7725, lng: 106.6578 }

/** Trạng thái đơn cho phép mở bản đồ, theo nút "Theo dõi lộ trình" ở từng trang web */
const TRACKABLE: Record<TrackingRole, readonly string[]> = {
  BUYER: ['READY', 'SHIPPING', 'PICKED_UP'],
  SHOP: ['SHIPPING', 'PICKED_UP'],
  SHIPPER: ['ASSIGNED', 'SHIPPING', 'PICKED_UP'],
}

export const canTrackOrder = (status: string | null | undefined, role: TrackingRole) =>
  !!status && TRACKABLE[role].includes(status)

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v !== 0 ? v : undefined)

/** Vị trí quán và người nhận: ưu tiên dữ liệu realtime, rồi tới toạ độ trên đơn, cuối cùng là mặc định. */
export function resolveEndpoints(
  data: ShipperLocationPayload | null | undefined,
  initial: { shop?: Partial<LatLng>; dest?: Partial<LatLng> } = {},
): { shop: LatLng; dest: LatLng } {
  return {
    shop: {
      lat: num(data?.shopLatitude) ?? num(initial.shop?.lat) ?? DEFAULT_SHOP.lat,
      lng: num(data?.shopLongitude) ?? num(initial.shop?.lng) ?? DEFAULT_SHOP.lng,
    },
    dest: {
      lat: num(data?.destinationLatitude) ?? num(initial.dest?.lat) ?? DEFAULT_DEST.lat,
      lng: num(data?.destinationLongitude) ?? num(initial.dest?.lng) ?? DEFAULT_DEST.lng,
    },
  }
}

export function shipperPosition(data: ShipperLocationPayload | null | undefined): LatLng | null {
  const lat = num(data?.latitude)
  const lng = num(data?.longitude)
  return lat !== undefined && lng !== undefined ? { lat, lng } : null
}

const dist = (a: LatLng, b: LatLng) => Math.hypot(a.lat - b.lat, a.lng - b.lng)

/**
 * Chặng hiện tại. Trạng thái đơn thắng deliveryPhase; nếu thiếu cả hai thì đoán theo
 * khoảng cách của xe tới quán và tới người nhận (ngưỡng như bản web).
 */
export function effectivePhase(
  data: ShipperLocationPayload | null | undefined,
  pos: LatLng | null,
  shop: LatLng,
  dest: LatLng,
): DeliveryPhase {
  if (data?.orderStatus === 'PICKED_UP') return 'TO_BUYER'
  if (data?.orderStatus === 'DELIVERED') return 'DELIVERED'
  const phase = data?.deliveryPhase as DeliveryPhase | undefined
  // Backend giữ phase cũ của tài xế từ đơn trước; đơn còn SHIPPING thì chưa thể "đang giao khách".
  const stale = data?.orderStatus === 'SHIPPING' && (phase === 'TO_BUYER' || phase === 'DELIVERED')
  if (phase && !stale) return phase
  if (!pos) return 'TO_SHOP'
  const toShop = dist(pos, shop)
  if (toShop <= 0.001) return 'AT_SHOP'
  if (data?.orderStatus === 'SHIPPING') return 'TO_SHOP'
  if (dist(pos, dest) < dist(shop, dest) * 0.95 && toShop > 0.002) return 'TO_BUYER'
  return 'TO_SHOP'
}

export function isShipperVisible(role: TrackingRole, phase: DeliveryPhase): boolean {
  if (role === 'SHOP') return phase === 'TO_SHOP' || phase === 'AT_SHOP'
  if (role === 'BUYER') return phase === 'TO_BUYER' || phase === 'DELIVERED'
  return true
}

/** Chặng đường vẽ trên bản đồ cho từng vai trò */
export const routesForRole = (role: TrackingRole) => ({
  toShop: role === 'SHIPPER' || role === 'SHOP',
  toBuyer: role === 'SHIPPER' || role === 'BUYER',
})

const JOURNEY: Record<TrackingRole, Record<DeliveryPhase, string>> = {
  BUYER: {
    TO_SHOP: 'Tài xế đang đến nhà vườn lấy hàng',
    AT_SHOP: 'Tài xế đang nhận hàng tại nhà vườn',
    TO_BUYER: 'Tài xế đã lấy hàng và đang giao đến bạn',
    DELIVERED: 'Đơn hàng đã giao đến bạn thành công',
    FAILED: 'Giao hàng không thành công',
  },
  SHOP: {
    TO_SHOP: 'Shipper đang trên đường đến lấy hàng',
    AT_SHOP: 'Shipper đã tới, đang nhận hàng',
    TO_BUYER: 'Shipper đã nhận hàng và đang giao cho khách',
    DELIVERED: 'Đơn hàng đã được giao thành công',
    FAILED: 'Giao hàng không thành công',
  },
  SHIPPER: {
    TO_SHOP: 'Bạn đang di chuyển đến quán lấy hàng',
    AT_SHOP: 'Bạn đã tới quán, đang nhận hàng',
    TO_BUYER: 'Bạn đang giao hàng đến khách',
    DELIVERED: 'Bạn đã giao hàng thành công',
    FAILED: 'Giao hàng không thành công',
  },
}

export const journeyText = (role: TrackingRole, phase: DeliveryPhase) => JOURNEY[role][phase]

/** Dòng gợi ý khi xe đang bị ẩn với vai trò này */
export function hiddenShipperHint(role: TrackingRole): string {
  return role === 'BUYER'
    ? 'Vị trí xe sẽ hiện khi tài xế lấy hàng rời nhà vườn'
    : 'Tài xế đã lấy hàng tại quán và đang đi giao'
}

/** Hướng xe (độ, 0 = Bắc) giữa hai điểm, để xoay icon */
export function bearing(from: LatLng, to: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const lat1 = rad(from.lat)
  const lat2 = rad(to.lat)
  const dLng = rad(to.lng - from.lng)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Giờ cập nhật; BE có thể trả mảng [y, m, d, h, mi, s] hoặc chuỗi ISO */
export function formatUpdatedAt(value: unknown): string {
  let d: Date | null = null
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, day, h = 0, mi = 0, s = 0] = value.map(Number)
    d = new Date(y, m - 1, day, h, mi, s)
  } else if (typeof value === 'string' || typeof value === 'number') {
    d = new Date(value)
  }
  if (!d || Number.isNaN(d.getTime())) return 'vừa xong'
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Endpoint STOMP thuần WebSocket. BE đăng ký SockJS tại {API}/ws; SockJS của Spring
 * luôn mở thêm đường WebSocket thô ở /ws/websocket, dùng được trên React Native.
 */
export function stompBrokerUrl(apiUrl: string): string {
  const clean = (apiUrl || 'http://localhost:8080/api').replace(/\/api\/v1\/?$/, '/api').replace(/\/+$/, '')
  const base = clean.endsWith('/api') ? `${clean}/ws` : `${clean}/api/ws`
  return `${base.replace(/^http/, 'ws')}/websocket`
}
