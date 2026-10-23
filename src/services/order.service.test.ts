/**
 * Test cases cho Shop Order Service
 * Chạy: npm test -- src/services/order.service.test.ts
 * Mỗi test mock axiosInstance để không cần BE thật.
 */

import * as orderService from './order.service'

jest.mock('@/services/api/axiosInstance', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}))

import axiosInstance from '@/services/api/axiosInstance'

const mockAxios = axiosInstance as unknown as {
  get: jest.Mock
  put: jest.Mock
}

const makeMockOrder = (overrides = {}) => ({
  id: 1,
  status: 'PENDING' as const,
  recipientName: 'Nguyễn Văn A',
  recipientPhone: '0909000000',
  shippingAddress: '123 Lê Lợi, Q1, HCM',
  paymentMethod: 'COD',
  totalAmount: 150000,
  createdAt: '2026-10-01T10:00:00',
  items: [],
  ...overrides,
})

// ── fetchShopOrders ──────────────────────────────────────────────
describe('fetchShopOrders', () => {
  beforeEach(() => jest.clearAllMocks())

  it('gọi đúng endpoint GET /orders/shop với page và size', async () => {
    mockAxios.get.mockResolvedValue({
      code: 1000,
      result: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true },
    })
    await orderService.fetchShopOrders({ page: 0, size: 10 })
    expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/orders/shop'))
    expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('page=0'))
  })

  it('thêm params statuses vào query string khi được truyền vào', async () => {
    mockAxios.get.mockResolvedValue({
      code: 1000,
      result: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 1, first: true, last: true },
    })
    await orderService.fetchShopOrders({ statuses: ['PENDING', 'PAID'] })
    const calledUrl: string = mockAxios.get.mock.calls[0][0]
    expect(calledUrl).toContain('statuses=PENDING')
    expect(calledUrl).toContain('statuses=PAID')
  })

  it('trả về danh sách đơn hàng từ result', async () => {
    const mockOrders = [makeMockOrder({ id: 1 }), makeMockOrder({ id: 2 })]
    mockAxios.get.mockResolvedValue({
      code: 1000,
      result: { content: mockOrders, page: 0, size: 10, totalElements: 2, totalPages: 1, first: true, last: true },
    })
    const result = await orderService.fetchShopOrders()
    expect(result.content).toHaveLength(2)
    expect(result.content[0].id).toBe(1)
  })
})

// ── confirmOrder ─────────────────────────────────────────────────
describe('confirmOrder', () => {
  beforeEach(() => jest.clearAllMocks())

  it('gọi PUT /orders/10/confirm', async () => {
    mockAxios.put.mockResolvedValue({ code: 1000, result: makeMockOrder({ id: 10, status: 'CONFIRMED' }) })
    await orderService.confirmOrder(10)
    expect(mockAxios.put).toHaveBeenCalledWith('/orders/10/confirm')
  })

  it('trả về order với status CONFIRMED', async () => {
    mockAxios.put.mockResolvedValue({ code: 1000, result: makeMockOrder({ id: 10, status: 'CONFIRMED' }) })
    const result = await orderService.confirmOrder(10)
    expect(result.status).toBe('CONFIRMED')
  })

  it('throw lỗi khi BE trả về lỗi', async () => {
    mockAxios.put.mockRejectedValue({ response: { status: 400, data: { message: 'Invalid status' } } })
    await expect(orderService.confirmOrder(10)).rejects.toBeDefined()
  })
})

// ── readyOrder ───────────────────────────────────────────────────
describe('readyOrder', () => {
  beforeEach(() => jest.clearAllMocks())

  it('gọi PUT /orders/5/ready', async () => {
    mockAxios.put.mockResolvedValue({ code: 1000, result: makeMockOrder({ id: 5, status: 'READY' }) })
    await orderService.readyOrder(5)
    expect(mockAxios.put).toHaveBeenCalledWith('/orders/5/ready')
  })

  it('trả về order với status READY — shipper có thể nhận đơn', async () => {
    mockAxios.put.mockResolvedValue({ code: 1000, result: makeMockOrder({ id: 5, status: 'READY' }) })
    const result = await orderService.readyOrder(5)
    expect(result.status).toBe('READY')
  })
})

// ── cancelOrder ──────────────────────────────────────────────────
describe('cancelOrder', () => {
  beforeEach(() => jest.clearAllMocks())

  it('gọi PUT /orders/3/cancel', async () => {
    mockAxios.put.mockResolvedValue({ code: 1000, result: makeMockOrder({ id: 3, status: 'CANCELLED' }) })
    await orderService.cancelOrder(3)
    expect(mockAxios.put).toHaveBeenCalledWith('/orders/3/cancel')
  })

  it('trả về order với status CANCELLED', async () => {
    mockAxios.put.mockResolvedValue({ code: 1000, result: makeMockOrder({ id: 3, status: 'CANCELLED' }) })
    const result = await orderService.cancelOrder(3)
    expect(result.status).toBe('CANCELLED')
  })
})
