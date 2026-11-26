import type { PreOrderResponse } from '@/services'
import { blockedReason, groupByHub, mapsRoute, routeOrder, runTotals, suggestRun, type Point } from './hubRun'

const hub: Point = [10.842, 106.627]
const order = (id: number, lat: number, lng: number, kg: number, extra: Partial<PreOrderResponse> = {}) =>
  ({ preOrderId: id, totalKg: kg, shippingLatitude: lat, shippingLongitude: lng, remainingAmount: kg * 10_000, shipperEarnEstimate: 14_550, hubId: 1, hubName: 'Hub Quận 12', ...extra }) as PreOrderResponse

const near = order(1, 10.843, 106.628, 20)
const mid = order(2, 10.85, 106.62, 30)
const far = order(3, 10.88, 106.65, 100, { shipperEarnEstimate: 29_100, priorityLevel: 'URGENT' })
const all = [far, mid, near]

describe('suggestRun', () => {
  it('gần nhau: đi từ hub tới đơn gần nhất, không vượt sức chở', () => {
    expect(suggestRun(hub, all, 'near', { kg: 60, cod: 10_000_000 })).toEqual([1, 2])
  })

  it('cước cao và đơn gấp được chọn trước khi xe còn chở được', () => {
    expect(suggestRun(hub, all, 'fee', { kg: 130, cod: 10_000_000 })).toEqual([3, 1])
    expect(suggestRun(hub, all, 'urgent', { kg: 100, cod: 10_000_000 })).toEqual([3])
  })

  it('không vượt số dư ký quỹ', () => {
    expect(suggestRun(hub, all, 'near', { kg: 500, cod: 250_000 })).toEqual([1])
    expect(blockedReason(mid, [near], { kg: 500, cod: 250_000 })).toBe('Ví không đủ ký quỹ')
    expect(blockedReason(far, [near], { kg: 60, cod: 10_000_000 })).toBe('Vượt sức chở của xe')
  })
})

describe('chuyến giao', () => {
  it('xếp thứ tự giao theo điểm gần nhất tiếp theo và cộng tổng', () => {
    expect(routeOrder(hub, all).map((o) => o.preOrderId)).toEqual([1, 2, 3])
    expect(runTotals([near, mid])).toEqual({ kg: 50, fee: 29_100, cod: 500_000 })
    expect(groupByHub([near, order(9, 10.8, 106.7, 5, { hubId: 2, hubName: 'Hub Q7' }), mid]).map((g) => [g.hubId, g.orders.length])).toEqual([[1, 2], [2, 1]])
    expect(mapsRoute(hub, [near, mid])).toContain('waypoints=10.843%2C106.628')
  })
})
