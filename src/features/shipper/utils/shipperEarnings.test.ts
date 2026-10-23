import type { OrderResponse } from '@/types/order.types'
import { dailyFees, dayTitle, earningsSummary, groupByDay, inPeriod, workDate } from './shipperEarnings'

const NOW = new Date(2026, 9, 23, 18, 0) // 23/10/2026, thứ Sáu

const order = (p: Partial<OrderResponse>): OrderResponse =>
  ({
    orderId: 1,
    status: 'DELIVERED',
    paymentMethod: 'PAYOS',
    totalAmount: 100_000,
    shippingFee: 20_000,
    createdAt: '2026-10-23T08:00:00',
    items: [],
    recipientName: '',
    recipientPhone: '',
    shippingAddress: '',
    ...p,
  }) as OrderResponse

describe('workDate', () => {
  it('prefers pickedUpAt over createdAt', () => {
    expect(workDate(order({ createdAt: '2026-10-20T08:00:00', pickedUpAt: '2026-10-21T09:00:00' }))?.getDate()).toBe(21)
    expect(workDate(order({ createdAt: '2026-10-20T08:00:00' }))?.getDate()).toBe(20)
  })
})

describe('earningsSummary', () => {
  it('sums fees and COD of delivered orders only', () => {
    const s = earningsSummary([
      order({ shippingFee: 20_000 }),
      order({ status: 'COMPLETED', shippingFee: 15_000, paymentMethod: 'COD', codAmount: 80_000 }),
      order({ status: 'FAILED', shippingFee: 30_000 }),
    ])
    expect(s).toEqual({ delivered: 2, failed: 1, fees: 35_000, cod: 80_000, successRate: 67 })
  })
  it('has no success rate without finished orders', () => {
    expect(earningsSummary([]).successRate).toBeUndefined()
  })
})

describe('inPeriod', () => {
  it('counts whole calendar days back from today', () => {
    const yesterday = order({ createdAt: '2026-10-22T23:00:00' })
    expect(inPeriod(yesterday, 'today', NOW)).toBe(false)
    expect(inPeriod(yesterday, '7d', NOW)).toBe(true)
    const sevenAgo = order({ createdAt: '2026-10-17T00:30:00' })
    expect(inPeriod(sevenAgo, '7d', NOW)).toBe(true)
    expect(inPeriod(order({ createdAt: '2026-10-16T23:00:00' }), '7d', NOW)).toBe(false)
    expect(inPeriod(order({ createdAt: '2020-01-01T00:00:00' }), 'all', NOW)).toBe(true)
  })
})

describe('dailyFees', () => {
  it('builds one bar per day ending today', () => {
    const bars = dailyFees(
      [
        order({ createdAt: '2026-10-23T08:00:00', shippingFee: 20_000 }),
        order({ createdAt: '2026-10-23T10:00:00', shippingFee: 10_000 }),
        order({ createdAt: '2026-10-21T10:00:00', shippingFee: 15_000 }),
        order({ createdAt: '2026-10-21T11:00:00', status: 'FAILED' }),
        order({ createdAt: '2026-10-01T10:00:00' }),
      ],
      7,
      NOW,
    )
    expect(bars.map((b) => b.label)).toEqual(['T7', 'CN', 'T2', 'T3', 'T4', 'T5', 'Nay'])
    expect(bars[6]).toMatchObject({ fees: 30_000, count: 2 })
    expect(bars[4]).toMatchObject({ fees: 15_000, count: 1 })
    expect(bars.reduce((s, b) => s + b.count, 0)).toBe(3)
  })
})

describe('groupByDay', () => {
  it('groups newest day first with delivered fees', () => {
    const days = groupByDay(
      [
        order({ orderId: 1, createdAt: '2026-10-21T08:00:00' }),
        order({ orderId: 2, createdAt: '2026-10-23T08:00:00' }),
        order({ orderId: 3, createdAt: '2026-10-23T12:00:00', status: 'FAILED' }),
      ],
      NOW,
    )
    expect(days.map((d) => d.title)).toEqual(['Hôm nay', 'T4, 21/10/2026'])
    expect(days[0].orders.map((o) => o.orderId)).toEqual([3, 2])
    expect(days[0].fees).toBe(20_000)
  })
  it('names yesterday', () => {
    expect(dayTitle(new Date(2026, 9, 22, 7), NOW)).toBe('Hôm qua')
  })
})
