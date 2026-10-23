/**
 * Order Service — map 1-1 với OrderController.java
 *
 * State machine:
 *   PENDING/PAID  →[confirmOrder]→  CONFIRMED
 *   CONFIRMED     →[readyOrder]  →  READY        ← shipper thấy & đến lấy
 *   READY         →[shipOrder]   →  SHIPPING      (SHIPPER)
 *   SHIPPING      →[deliverOrder]→  DELIVERED     (SHIPPER)
 *   SHIPPING      →[failOrder]   →  FAILED        (SHIPPER)
 *   PENDING/../READY →[cancelOrder]→ CANCELLED    (BUYER or SHOP)
 */

import axiosInstance from '@/services/api/axiosInstance'
import type {
  OrderPageResponse,
  OrderResponse,
  FetchOrdersParams,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  CreateOrderRequest,
} from '@/types/order.types'
import type { OrderResponse as MockOrderResponse } from './order.types'
import { mockOrders } from '@/mocks/order.mock'

/** BE luôn wrap response trong { code, message, result } */
interface ApiResponse<T> {
  code: number
  message?: string
  result: T
}

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if ('data' in res && (res as { data: unknown }).data && typeof (res as { data: unknown }).data === 'object' && 'result' in (res as { data: { result: unknown } }).data) {
      return ((res as { data: ApiResponse<T> }).data).result
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result
    }
  }
  return res as T
}

// ── BUYER: Xem trước & Tạo đơn ───────────────────────────────────────────────

/**
 * Tính toán chi phí, phí ship, voucher trước khi đặt hàng.
 * POST /orders/preview  [@BUYER]
 */
export async function previewCheckout(
  data: CheckoutPreviewRequest,
): Promise<CheckoutPreviewResponse> {
  const res = await axiosInstance.post('/orders/preview', data)
  return unwrap<CheckoutPreviewResponse>(res)
}

/**
 * Buyer đặt hàng. Nếu items thuộc nhiều shop → tạo nhiều order.
 * Status: COD → PENDING, chuyển khoản → PAID.
 * POST /orders  [@BUYER]
 */
export async function createOrder(data: CreateOrderRequest): Promise<OrderResponse[]> {
  const res = await axiosInstance.post('/orders', data)
  return unwrap<OrderResponse[]>(res)
}

/**
 * Lấy chi tiết đơn hàng theo ID.
 * GET /orders/{id}
 */
export async function getOrderById(orderId: number): Promise<OrderResponse> {
  const res = await axiosInstance.get(`/orders/${orderId}`)
  return unwrap<OrderResponse>(res)
}

/**
 * Lấy danh sách đơn hàng của Buyer hiện tại.
 * GET /orders/my
 */
export async function fetchMyOrders(params: FetchOrdersParams = {}): Promise<OrderPageResponse> {
  const { page = 0, size = 10, statuses } = params
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('size', String(size))
  if (statuses?.length) {
    statuses.forEach((s: string) => query.append('statuses', s))
  }
  const res = await axiosInstance.get(`/orders/my?${query.toString()}`)
  return unwrap<OrderPageResponse>(res)
}

// ── SHOP: Lấy danh sách & Xác nhận ───────────────────────────────────────────

/**
 * Lấy danh sách đơn của shop hiện tại, phân trang + filter status.
 * GET /orders/shop?page=&size=&statuses=  [@SHOP]
 */
export async function fetchShopOrders(params: FetchOrdersParams = {}): Promise<OrderPageResponse> {
  const { page = 0, size = 10, statuses } = params
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('size', String(size))
  if (statuses?.length) {
    statuses.forEach((s: string) => query.append('statuses', s))
  }
  const res = await axiosInstance.get(`/orders/shop?${query.toString()}`)
  return unwrap<OrderPageResponse>(res)
}

/**
 * Shop xác nhận đơn: PENDING/PAID → CONFIRMED.
 * PUT /orders/{id}/confirm  [@SHOP]
 */
export async function confirmOrder(orderId: number): Promise<OrderResponse> {
  const res = await axiosInstance.put(`/orders/${orderId}/confirm`)
  return unwrap<OrderResponse>(res)
}

/**
 * Shop đóng gói xong, sẵn sàng để shipper đến lấy: CONFIRMED → READY.
 * PUT /orders/{id}/ready  [@SHOP]
 */
export async function readyOrder(orderId: number): Promise<OrderResponse> {
  const res = await axiosInstance.put(`/orders/${orderId}/ready`)
  return unwrap<OrderResponse>(res)
}

// ── SHIPPER: Vận chuyển & Giao hàng ──────────────────────────────────────────

/**
 * Shipper lấy hàng và bắt đầu giao: READY → SHIPPING.
 * PUT /orders/{id}/ship  [@SHIPPER]
 */
export async function shipOrder(orderId: number): Promise<OrderResponse> {
  const res = await axiosInstance.put(`/orders/${orderId}/ship`)
  return unwrap<OrderResponse>(res)
}

/**
 * Shipper giao hàng thành công: SHIPPING → DELIVERED.
 * PUT /orders/{id}/deliver  [@SHIPPER]
 */
export async function deliverOrder(orderId: number): Promise<OrderResponse> {
  const res = await axiosInstance.put(`/orders/${orderId}/deliver`)
  return unwrap<OrderResponse>(res)
}

/**
 * Shipper báo giao thất bại (không có người nhận, sai địa chỉ...): SHIPPING → FAILED.
 * Tồn kho được khôi phục.
 * PUT /orders/{id}/fail  [@SHIPPER]
 */
export async function failOrder(orderId: number): Promise<OrderResponse> {
  const res = await axiosInstance.put(`/orders/${orderId}/fail`)
  return unwrap<OrderResponse>(res)
}

// ── BUYER / SHOP: Hủy đơn ────────────────────────────────────────────────────

/**
 * Hủy đơn trước khi ship. Tồn kho được khôi phục.
 * PENDING/PAID/CONFIRMED/READY → CANCELLED.
 * PUT /orders/{id}/cancel  [@BUYER or @SHOP]
 */
export async function cancelOrder(orderId: number): Promise<OrderResponse> {
  const res = await axiosInstance.put(`/orders/${orderId}/cancel`)
  return unwrap<OrderResponse>(res)
}

export interface AddressSuggestion {
  placeId: string
  description: string
}

export async function getAddressSuggestions(input: string): Promise<AddressSuggestion[]> {
  if (!input || input.trim().length < 2) return []
  try {
    const res = await axiosInstance.get('/shipping/address-suggestions', {
      params: { input: input.trim() },
    })
    return unwrap<AddressSuggestion[]>(res) || []
  } catch {
    return []
  }
}

export const orderService = {
  previewCheckout,
  createOrder,
  getOrderById,
  fetchMyOrders,
  getMyOrders: fetchMyOrders,
  fetchShopOrders,
  confirmOrder,
  readyOrder,
  shipOrder,
  deliverOrder,
  failOrder,
  cancelOrder,
  getAddressSuggestions,
  async getAllOrders(): Promise<{ code: number; result: MockOrderResponse[] }> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: structuredClone(mockOrders) }
  },
}

export default orderService

