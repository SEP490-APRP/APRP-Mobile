import type { OrderResponse } from '@/types/order.types'
import {
  codToCollect,
  directionsUrl,
  formatKm,
  itemsSummary,
  minutesAgo,
  orderLegs,
  shipperErrorMessage,
  sortReadyOrders,
  straightKm,
} from './shipperOrders'

const order = (over: Partial<OrderResponse>): OrderResponse => ({
  orderId: 1,
  status: 'READY',
  recipientName: 'A',
  recipientPhone: '0900000000',
  shippingAddress: 'x',
  paymentMethod: 'COD',
  totalAmount: 100000,
  createdAt: '2026-10-23T09:00:00',
  items: [],
  ...over,
})

describe('shipperOrders', () => {
  it('tính khoảng cách chim bay và hiển thị gọn', () => {
    const km = straightKm({ latitude: 10.85, longitude: 106.772 }, { latitude: 10.7725, longitude: 106.6578 })
    expect(km).toBeGreaterThan(14)
    expect(km).toBeLessThan(16)
    expect(formatKm(0.42)).toBe('400 m')
    expect(formatKm(3.26)).toBe('3,3 km')
    expect(formatKm(19)).toBe('19 km')
    expect(formatKm(undefined)).toBe('—')
  })

  it('ưu tiên quãng đường backend tính cho chặng giao, chỉ có chặng đến vườn khi có GPS', () => {
    const o = order({
      shopLatitude: 10.85,
      shopLongitude: 106.772,
      shippingLatitude: 10.77,
      shippingLongitude: 106.65,
      distanceKm: 19,
    })
    expect(orderLegs(o).toBuyer).toBe(19)
    expect(orderLegs(o).toShop).toBeUndefined()
    const legs = orderLegs(o, { latitude: 10.85, longitude: 106.772 })
    expect(legs.toShop).toBeCloseTo(0)
    expect(legs.total).toBeCloseTo(19)
  })

  it('bỏ qua toạ độ 0,0 do backend chưa định vị được', () => {
    expect(
      orderLegs(order({ shopLatitude: 0, shopLongitude: 0 }), { latitude: 10, longitude: 106 }).toShop,
    ).toBeUndefined()
  })

  it('xếp đơn gần nhà vườn trước, không GPS thì đơn chờ lâu trước', () => {
    const near = order({ orderId: 2, shopLatitude: 10.851, shopLongitude: 106.772, createdAt: '2026-10-23T10:00:00' })
    const far = order({ orderId: 3, shopLatitude: 11.5, shopLongitude: 107, createdAt: '2026-10-23T08:00:00' })
    const me = { latitude: 10.85, longitude: 106.772 }
    expect(sortReadyOrders([far, near], me).map((o) => o.orderId)).toEqual([2, 3])
    expect(sortReadyOrders([near, far]).map((o) => o.orderId)).toEqual([3, 2])
  })

  it('chỉ đơn COD mới phải thu tiền', () => {
    expect(codToCollect(order({ codAmount: 244000 }))).toBe(244000)
    expect(codToCollect(order({ paymentMethod: 'PAYOS', codAmount: 0 }))).toBe(0)
  })

  it('tóm tắt món và thời gian chờ', () => {
    expect(
      itemsSummary(
        order({
          items: [
            { itemName: 'Cà rốt', quantity: 1, unitPrice: 1 },
            { itemName: 'Bí', quantity: 1, unitPrice: 1 },
          ],
        }),
      ),
    ).toBe('Cà rốt và 1 món khác')
    const now = new Date('2026-10-23T10:00:00').getTime()
    expect(minutesAgo('2026-10-23T09:35:00', now)).toBe('25 phút trước')
    expect(minutesAgo('2026-10-23T07:00:00', now)).toBe('3 giờ trước')
  })

  it('đổi mã lỗi backend thành câu dễ hiểu', () => {
    expect(shipperErrorMessage({ data: { code: 7004 } }, 'x')).toMatch(/chưa giao xong/)
    expect(shipperErrorMessage({ data: { code: 7002 } }, 'x')).toMatch(/shipper khác/)
    expect(shipperErrorMessage(new Error('boom'), 'Thử lại')).toBe('Thử lại')
  })

  it('chỉ đường tới nhà vườn trước, tới khách sau khi lấy hàng', () => {
    const o = order({
      status: 'SHIPPING',
      shopLatitude: 10.85,
      shopLongitude: 106.77,
      shopAddress: 'Vườn',
      shippingAddress: '12 Võ Văn Ngân',
    })
    expect(directionsUrl(o)).toContain('destination=10.85%2C106.77')
    expect(directionsUrl({ ...o, status: 'PICKED_UP' })).toContain(encodeURIComponent('12 Võ Văn Ngân'))
    expect(directionsUrl(order({ shippingAddress: '' }))).toBeNull()
  })
})
