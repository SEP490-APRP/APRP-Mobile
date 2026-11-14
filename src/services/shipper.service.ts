import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type { OrderResponse, OrderStatus } from '@/types/order.types'
import type { PageResponse } from '@/types'
import type { UploadFile } from '@/types/upload.types'
import { uploadService } from './upload.service'

/**
 * API của Shipper (ShipperController + phần shipper của OrderController).
 * Chép từ APRP-FE/src/services/shipper.service.ts, giữ tên hàm và endpoint.
 */

/** Lý do giao thất bại, khớp enum DeliveryFailReason ở BE */
export type DeliveryFailReason = 'KHONG_LIEN_LAC_DUOC' | 'SAI_DIA_CHI' | 'KHACH_TU_CHOI' | 'KHAC'

export interface FailOrderRequest {
  reason: DeliveryFailReason
  note?: string
  callAttempts?: number
  proofImageUrls: string[]
}

/** Số cuộc gọi tối thiểu trước khi được báo "không liên lạc được" */
export const MIN_FAIL_CALL_ATTEMPTS = 3

/** Số ảnh bằng chứng tối đa mỗi lần xác nhận */
export const MAX_PROOF_IMAGES = 5

/** Khoảng cách gửi heartbeat khi đang nhận đơn (BE tự chuyển offline sau 5 phút không có tín hiệu) */
export const SHIPPER_HEARTBEAT_MS = 60_000

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

  /** Bật nhận đơn, cũng là heartbeat: gọi lại mỗi ~60s khi đang nhận đơn */
  async goOnline(latitude: number, longitude: number): Promise<void> {
    await axiosInstance.post('/shippers/status/online', { latitude, longitude })
  },

  async goOffline(): Promise<void> {
    await axiosInstance.post('/shippers/status/offline')
  },

  /**
   * Đơn READY chưa có người nhận trong bán kính quanh shipper (BE lọc 15 km, gần nhất trước,
   * kèm distanceToShopKm). Bắt buộc đang nhận đơn (BE trả 7006 nếu chưa).
   */
  async getReadyOrders(
    page = 0,
    size = 20,
    coords?: { latitude: number; longitude: number } | null,
  ): Promise<PageResponse<OrderResponse>> {
    const res = await axiosInstance.get('/orders/ready', {
      params: { page, size, ...(coords ? { lat: coords.latitude, lng: coords.longitude } : {}) },
    })
    return toPage(unwrap<SpringPage<OrderResponse>>(res), page, size)
  },

  /** Đơn của shipper, lọc theo trạng thái nếu có. */
  async getMyOrders(statuses?: OrderStatus[], page = 0, size = 20): Promise<PageResponse<OrderResponse>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) })
    statuses?.forEach((s) => query.append('statuses', s))
    const res = await axiosInstance.get(`/orders/shipper/my?${query.toString()}`)
    return toPage(unwrap<SpringPage<OrderResponse>>(res), page, size)
  },

  /**
   * Nhận đơn và đi lấy hàng: READY → SHIPPING. Đơn COD giữ chỗ đủ tổng tiền trong ví.
   * Lỗi thường gặp: 7004, 7005, 7006, 16013 (result có required/available/missing), 16014.
   */
  async acceptOrder(orderId: number): Promise<OrderResponse> {
    return unwrap<OrderResponse>(await axiosInstance.put(`/orders/${orderId}/ship`))
  },

  /** Đã lấy hàng ở nhà vườn: SHIPPING → PICKED_UP. */
  async pickupOrder(orderId: number): Promise<OrderResponse> {
    return unwrap<OrderResponse>(await axiosInstance.put(`/orders/${orderId}/pickup`))
  },

  /** Giao thành công: PICKED_UP → DELIVERED. Bắt buộc ít nhất 1 ảnh bằng chứng (đã upload). */
  async deliverOrder(orderId: number, proofImageUrls: string[]): Promise<OrderResponse> {
    return unwrap<OrderResponse>(await axiosInstance.put(`/orders/${orderId}/deliver`, { proofImageUrls }))
  },

  /** Giao thất bại (lý do, số cuộc gọi, ảnh), kho được hoàn lại: SHIPPING/PICKED_UP → FAILED. */
  async failOrder(orderId: number, body: FailOrderRequest): Promise<OrderResponse> {
    return unwrap<OrderResponse>(await axiosInstance.put(`/orders/${orderId}/fail`, body))
  },

  /** Upload ảnh bằng chứng giao hàng, trả về danh sách URL */
  async uploadProofImages(files: UploadFile[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files.slice(0, MAX_PROOF_IMAGES)) {
      const res = await uploadService.uploadImage(file, 'delivery-proofs')
      if (res.result?.url) urls.push(res.result.url)
    }
    return urls
  },
}

export default shipperService
