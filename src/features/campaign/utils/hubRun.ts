import type { PreOrderResponse, PriorityLevel, ShipperCapacity } from '@/services'

/**
 * Shipper tạo chuyến giao từ một hub: chọn nhiều đơn trong giới hạn sức chở của xe và số dư ký quỹ,
 * có gợi ý đơn nên gộp và thứ tự giao theo đường ngắn.
 */

export type Point = [number, number]
export type SuggestMode = 'near' | 'fee' | 'urgent'

export interface HubGroup {
  hubId: number
  name: string
  address: string
  point: Point | null
  orders: PreOrderResponse[]
}

/** Phần còn nhận thêm được: kg trên xe và tiền thu hộ ký quỹ được */
export interface RunLimits {
  kg: number
  cod: number
}

/** Hệ số đổi đường chim bay sang đường đi thực tế (giống BE) */
const ROAD_FACTOR = 1.25
const RANK: Record<PriorityLevel, number> = { URGENT: 0, HIGH: 1, NORMAL: 2 }

export const kgOf = (o: PreOrderResponse) => Number(o.totalKg ?? 0)
export const codOf = (o: PreOrderResponse) => Math.max(0, Number(o.remainingAmount ?? 0))
export const feeOf = (o: PreOrderResponse) => Math.round(Number(o.shipperEarnEstimate ?? 0))

export const pointOf = (o: PreOrderResponse): Point | null =>
  o.shippingLatitude != null && o.shippingLongitude != null ? [Number(o.shippingLatitude), Number(o.shippingLongitude)] : null

/** Khoảng cách đường đi ước tính giữa 2 điểm (km); thiếu toạ độ = rất xa để xếp cuối */
export function roadKm(a: Point | null, b: Point | null) {
  if (!a || !b) return Number.POSITIVE_INFINITY
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLon = rad(b[1] - a[1])
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(x)) * ROAD_FACTOR
}

export function groupByHub(orders: PreOrderResponse[]): HubGroup[] {
  const groups = new Map<number, HubGroup>()
  for (const o of orders) {
    const hubId = o.hubId ?? 0
    let g = groups.get(hubId)
    if (!g) {
      g = {
        hubId,
        name: o.hubName ?? 'Điểm tập kết',
        address: o.hubAddress ?? o.collectionSiteAddress ?? '',
        point: o.hubLatitude != null && o.hubLongitude != null ? [Number(o.hubLatitude), Number(o.hubLongitude)] : null,
        orders: [],
      }
      groups.set(hubId, g)
    }
    g.orders.push(o)
  }
  return [...groups.values()].sort((a, b) => b.orders.length - a.orders.length || a.name.localeCompare(b.name, 'vi'))
}

/** Thứ tự giao: từ hub luôn tới điểm gần nhất tiếp theo */
export function routeOrder(start: Point | null, orders: PreOrderResponse[]): PreOrderResponse[] {
  const left = [...orders]
  const route: PreOrderResponse[] = []
  let at = start
  while (left.length) {
    let best = 0
    for (let i = 1; i < left.length; i++) if (roadKm(at, pointOf(left[i])) < roadKm(at, pointOf(left[best]))) best = i
    const [next] = left.splice(best, 1)
    route.push(next)
    at = pointOf(next) ?? at
  }
  return route
}

/** Tổng km của chuyến theo thứ tự đã xếp; null nếu thiếu toạ độ */
export function routeKm(start: Point | null, ordered: PreOrderResponse[]): number | null {
  let at = start
  let km = 0
  for (const o of ordered) {
    const next = pointOf(o)
    const leg = roadKm(at, next)
    if (!Number.isFinite(leg)) return null
    km += leg
    at = next
  }
  return Math.round(km * 10) / 10
}

export const limitsOf = (c: ShipperCapacity): RunLimits => ({
  kg: Math.max(0, c.capacityKg - Number(c.carryingKg ?? 0)),
  cod: Math.max(0, Number(c.availableBalance ?? 0)),
})

export function runTotals(orders: PreOrderResponse[]) {
  return orders.reduce((t, o) => ({ kg: t.kg + kgOf(o), fee: t.fee + feeOf(o), cod: t.cod + codOf(o) }), { kg: 0, fee: 0, cod: 0 })
}

/** Lý do không thêm được đơn này vào chuyến đang chọn; null = thêm được */
export function blockedReason(o: PreOrderResponse, picked: PreOrderResponse[], limits: RunLimits): string | null {
  const t = runTotals(picked)
  if (t.kg + kgOf(o) > limits.kg + 1e-9) return 'Vượt sức chở của xe'
  if (t.cod + codOf(o) > limits.cod) return 'Ví không đủ ký quỹ'
  return null
}

/**
 * Gợi ý chuyến: lần lượt thêm đơn còn vừa xe và vừa ví.
 * near = đơn gần hub nhất rồi đơn gần đơn vừa chọn; fee = cước cao trước; urgent = đơn gấp trước, cùng mức thì gần hub trước.
 */
export function suggestRun(hub: Point | null, orders: PreOrderResponse[], mode: SuggestMode, limits: RunLimits): number[] {
  const picked: PreOrderResponse[] = []
  const fromHub = (o: PreOrderResponse) => roadKm(hub, pointOf(o))
  const compare = (a: number, b: number) => (a === b ? 0 : a < b ? -1 : 1)
  const sorted = [...orders].sort((a, b) =>
    mode === 'fee'
      ? feeOf(b) - feeOf(a) || compare(fromHub(a), fromHub(b))
      : mode === 'urgent'
        ? RANK[a.priorityLevel ?? 'NORMAL'] - RANK[b.priorityLevel ?? 'NORMAL'] || compare(fromHub(a), fromHub(b))
        : compare(fromHub(a), fromHub(b)),
  )
  if (mode !== 'near') {
    for (const o of sorted) if (!blockedReason(o, picked, limits)) picked.push(o)
    return picked.map((o) => o.preOrderId)
  }
  let at = hub
  const left = [...sorted]
  for (;;) {
    const fits = left.filter((o) => !blockedReason(o, picked, limits))
    if (!fits.length) break
    const next = routeOrder(at, fits)[0]
    picked.push(next)
    left.splice(left.indexOf(next), 1)
    at = pointOf(next) ?? at
  }
  return picked.map((o) => o.preOrderId)
}

/** Link Google Maps đi từ hub qua các điểm giao theo thứ tự */
export function mapsRoute(start: Point | null, ordered: PreOrderResponse[]) {
  const stops = ordered.map((o) => pointOf(o)?.join(',') ?? o.shippingAddress ?? '').filter(Boolean)
  if (!stops.length) return null
  const params = [`api=1`, `destination=${encodeURIComponent(stops[stops.length - 1])}`]
  if (start) params.push(`origin=${encodeURIComponent(start.join(','))}`)
  if (stops.length > 1) params.push(`waypoints=${encodeURIComponent(stops.slice(0, -1).join('|'))}`)
  return `https://www.google.com/maps/dir/?${params.join('&')}`
}
