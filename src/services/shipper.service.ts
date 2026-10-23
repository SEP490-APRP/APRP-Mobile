import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type { OrderResponse, OrderStatus } from '@/types/order.types'
import type { PageResponse } from '@/types'

/**
 * API của Shipper (ShipperController + phần shipper của OrderController).
 * Chỉ gọi những gì backend có thật: không ví, không ứng COD, không ảnh bằng chứng.
 */

export interface ShipperStatus {
  online: boolean
  latitude?: number
  longitude?: number
  updatedAt?: string
}

interface RawStatus {
  online?: boolean
  isOnline?: boolean
  latitude?: number | null
  longitude?: number | null
  updatedAt?: string | null
}

/** Trang kiểu Spring (`number`) đổi về PageResponse của app (`page`). */
interface SpringPage<T> {
  content?: T[]
  number?: number
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  first?: boolean
  last?: boolean
}

function toPage<T>(p: SpringPage<T> | undefined, page: number, size: number): PageResponse<T> {
  const content = p?.content ?? []
  return {
    content,
    page: p?.number ?? p?.page ?? page,
    size: p?.size ?? size,
    totalElements: p?.totalElements ?? content.length,
    totalPages: p?.totalPages ?? 1,
    first: p?.first ?? true,
    last: p?.last ?? true,
  }
}

export const shipperService = {
  async getStatus(): Promise<ShipperStatus> {
    const raw = unwrap<RawStatus | null>(await axiosInstance.get('/shippers/status'))
    return {
      // Lombok sinh getter isOnline() nên Jackson trả khoá `online`.
      online: Boolean(raw?.online ?? raw?.isOnline),
      latitude: raw?.latitude ?? undefined,
      longitude: raw?.longitude ?? undefined,
      updatedAt: raw?.updatedAt ?? undefined,
    }
  },

  async goOnline(latitude: number, longitude: number): Promise<void> {
    await axiosInstance.post('/shippers/status/online', { latitude, longitude })
  },

  async goOffline(): Promise<void> {
    await axiosInstance.post('/shippers/status/offline')
  },

  /** Đơn READY chờ shipper nhận (toàn hệ thống, backend chưa lọc theo bán kính). */
  async getReadyOrders(page = 0, size = 20): Promise<PageResponse<OrderResponse>> {
    const res = await axiosInstance.get('/orders/ready', { params: { page, size } })
    return toPage(unwrap<SpringPage<OrderResponse>>(res), page, size)
  },

  /** Đơn của shipper, lọc theo trạng thái nếu có. */
  async getMyOrders(statuses?: OrderStatus[], page = 0, size = 20): Promise<PageResponse<OrderResponse>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) })
    statuses?.forEach((s) => query.append('statuses', s))
    const res = await axiosInstance.get(`/orders/shipper/my?${query.toString()}`)
    return toPage(unwrap<SpringPage<OrderResponse>>(res), page, size)
  },

  /** Nhận đơn và đi lấy hàng: READY → SHIPPING. */
  async acceptOrder(orderId: number): Promise<OrderResponse> {
    return unwrap<OrderResponse>(await axiosInstance.put(`/orders/${orderId}/ship`))
  },

  /** Đã lấy hàng ở nhà vườn: SHIPPING → PICKED_UP. */
  async pickupOrder(orderId: number): Promise<OrderResponse> {
    return unwrap<OrderResponse>(await axiosInstance.put(`/orders/${orderId}/pickup`))
  },

  /** Giao thành công: PICKED_UP → DELIVERED. */
  async deliverOrder(orderId: number): Promise<OrderResponse> {
    return unwrap<OrderResponse>(await axiosInstance.put(`/orders/${orderId}/deliver`))
  },

  /** Giao thất bại, kho được hoàn lại: SHIPPING/PICKED_UP → FAILED. */
  async failOrder(orderId: number): Promise<OrderResponse> {
    return unwrap<OrderResponse>(await axiosInstance.put(`/orders/${orderId}/fail`))
  },
}

export default shipperService
