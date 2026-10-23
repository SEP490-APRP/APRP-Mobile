import type { OrderResponse } from '@/types/order.types'
import { greeting, listingStatus, shopOrderStats } from './shopStats'

const o = (status: OrderResponse['status'], totalAmount: number) => ({ status, totalAmount }) as OrderResponse

describe('shopOrderStats', () => {
  it('bỏ đơn chờ thanh toán và chia doanh thu như web', () => {
    const s = shopOrderStats([
      o('AWAITING_PAYMENT', 999),
      o('PENDING', 100),
      o('PAID', 200),
      o('CONFIRMED', 300),
      o('SHIPPING', 50),
      o('DELIVERED', 400),
      o('COMPLETED', 600),
      o('CANCELLED', 70),
    ])
    expect(s.total).toBe(7)
    expect(s.needsConfirm).toBe(2)
    expect(s.toPack).toBe(1)
    expect(s.completedRevenue).toBe(1000)
    expect(s.completedCount).toBe(2)
    expect(s.pendingRevenue).toBe(550)
    expect(s.pendingCount).toBe(3)
    expect(s.grossRevenue).toBe(1650)
  })

  it('không có đơn thì toàn số 0', () => {
    expect(shopOrderStats().grossRevenue).toBe(0)
  })
})

describe('listingStatus', () => {
  it('đổi mã trạng thái sang nhãn', () => {
    expect(listingStatus('APPROVED').label).toBe('Đang bán')
    expect(listingStatus('pending').label).toBe('Chờ duyệt')
    expect(listingStatus('REJECTED').tone).toBe('rose')
    expect(listingStatus(undefined, false).label).toBe('Tạm dừng')
    expect(listingStatus('HIDDEN').label).toBe('Tạm dừng')
  })
})

it('chào theo giờ', () => {
  expect(greeting(7)).toBe('Chào buổi sáng')
  expect(greeting(12)).toBe('Chào buổi trưa')
  expect(greeting(16)).toBe('Chào buổi chiều')
  expect(greeting(21)).toBe('Chào buổi tối')
})
