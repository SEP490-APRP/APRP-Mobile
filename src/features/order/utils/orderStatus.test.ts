import type { OrderResponse } from '@/types/order.types'
import { canCancelOrder, isUnpaidOrder, matchOrder, orderStatusLabel, orderStepIndex } from './orderStatus'

const order = (extra: Partial<OrderResponse>): OrderResponse => ({
  orderId: 12,
  status: 'PENDING',
  recipientName: '',
  recipientPhone: '',
  shippingAddress: '',
  paymentMethod: 'COD',
  totalAmount: 0,
  createdAt: '',
  items: [{ productName: 'Cà rốt', quantity: 1, unitPrice: 1 }],
  ...extra,
})

describe('orderStatus', () => {
  it('đơn PayOS còn PENDING vẫn tính là chưa thanh toán, COD thì không', () => {
    expect(isUnpaidOrder(order({ paymentMethod: 'PAYOS' }))).toBe(true)
    expect(isUnpaidOrder(order({ paymentMethod: 'COD' }))).toBe(false)
    expect(isUnpaidOrder(order({ status: 'AWAITING_PAYMENT' }))).toBe(true)
  })

  it('chỉ huỷ được trước khi shop xác nhận', () => {
    expect(canCancelOrder(order({ status: 'PENDING' }))).toBe(true)
    expect(canCancelOrder(order({ status: 'CONFIRMED' }))).toBe(false)
  })

  it('tìm theo mã, shop, tên món', () => {
    const o = order({ shopName: 'Vườn cô Ba' })
    expect(matchOrder(o, '12')).toBe(true)
    expect(matchOrder(o, 'cô ba')).toBe(true)
    expect(matchOrder(o, 'cà rốt')).toBe(true)
    expect(matchOrder(o, 'khoai')).toBe(false)
  })

  it('nhãn và bước tiến trình', () => {
    expect(orderStatusLabel('PICKED_UP')).toBe('Đang giao hàng')
    expect(orderStatusLabel('NEW_THING')).toBe('NEW THING')
    expect(orderStepIndex('READY')).toBe(1)
    expect(orderStepIndex('CANCELLED')).toBe(-1)
  })
})
