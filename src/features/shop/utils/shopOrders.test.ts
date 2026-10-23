import type { OrderResponse } from '@/types/order.types'
import {
  isPrepaid,
  itemSubtotal,
  matchShopOrder,
  orderTime,
  SHOP_ORDER_TABS,
  shopCanCancel,
  shopOrderStage,
  stageHint,
} from './shopOrders'

const order = (over: Partial<OrderResponse>) =>
  ({
    orderId: 1042,
    status: 'PENDING',
    recipientName: 'Nguyễn Ngọc Như',
    recipientPhone: '0903 456 789',
    ...over,
  }) as OrderResponse

describe('shopOrders', () => {
  it('không có thẻ nào chứa đơn chờ thanh toán', () => {
    expect(SHOP_ORDER_TABS.every((t) => !t.statuses.includes('AWAITING_PAYMENT'))).toBe(true)
  })

  it('xác định bước tiếp theo theo trạng thái', () => {
    expect(shopOrderStage('PAID')).toBe('confirm')
    expect(shopOrderStage('CONFIRMED')).toBe('pack')
    expect(shopOrderStage('READY')).toBe('waiting_shipper')
    expect(shopOrderStage('PICKED_UP')).toBe('shipping')
    expect(shopOrderStage('FAILED')).toBe('cancelled')
  })

  it('chỉ huỷ được trước khi giao shipper', () => {
    expect(shopCanCancel('PENDING')).toBe(true)
    expect(shopCanCancel('CONFIRMED')).toBe(true)
    expect(shopCanCancel('READY')).toBe(false)
    expect(shopCanCancel('SHIPPING')).toBe(false)
  })

  it('nhận ra đơn trả trước', () => {
    expect(isPrepaid({ status: 'PAID', paymentMethod: 'COD' })).toBe(true)
    expect(isPrepaid({ status: 'CONFIRMED', paymentMethod: 'payos' })).toBe(true)
    expect(isPrepaid({ status: 'PENDING', paymentMethod: 'COD' })).toBe(false)
    expect(stageHint({ status: 'PAID', paymentMethod: 'PAYOS' })).toMatch(/VietQR/)
  })

  it('tìm theo mã, tên, số điện thoại', () => {
    const o = order({})
    expect(matchShopOrder(o, '#1042')).toBe(true)
    expect(matchShopOrder(o, 'ngọc')).toBe(true)
    expect(matchShopOrder(o, '0903456')).toBe(true)
    expect(matchShopOrder(o, 'trần')).toBe(false)
  })

  it('tính thành tiền và giờ đặt', () => {
    expect(itemSubtotal({ unitPrice: 18000, quantity: 2 })).toBe(36000)
    expect(itemSubtotal({ subtotal: 5000, unitPrice: 1, quantity: 1 })).toBe(5000)
    expect(orderTime('2026-10-23T08:05:00')).toBe('08:05 · 23/10/2026')
  })
})
