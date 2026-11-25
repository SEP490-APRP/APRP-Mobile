import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  AdminReturnDecisionRequest,
  ReturnCreateRequest,
  ReturnRequestResponse,
  ReturnStatus,
  ShipperReturnActionRequest,
  ShopReturnRespondRequest,
} from './return.types'

export type * from './return.types'

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if (
      'data' in res &&
      (res as { data: unknown }).data &&
      typeof (res as { data: unknown }).data === 'object' &&
      'result' in (res as { data: { result: unknown } }).data
    ) {
      return (res as { data: ApiResponse<T> }).data.result as T
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result as T
    }
  }
  return res as T
}

export const returnService = {
  /** Lấy danh sách yêu cầu hoàn trả gửi đến Shop của Người bán GET /returns/shop/my-returns */
  async getShopReturns(
    page = 0,
    size = 20,
    status?: ReturnStatus,
  ): Promise<ApiResponse<PageResponse<ReturnRequestResponse>>> {
    const res = await axiosInstance.get('/returns/shop/my-returns', {
      params: { page, size, status: status || undefined },
    })
    return { code: 200, result: unwrap<PageResponse<ReturnRequestResponse>>(res) }
  },

  /** Chi tiết 1 yêu cầu hoàn trả GET /returns/{id} */
  async getReturnById(id: number): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.get(`/returns/${id}`)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /** Người bán phản hồi khiếu nại POST /returns/{id}/respond */
  async shopRespond(
    id: number,
    data: ShopReturnRespondRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/respond`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /** Danh sách khiếu nại dành cho Admin */
  async getDisputes(): Promise<ApiResponse<ReturnRequestResponse[]>> {
    const res = await axiosInstance.get('/returns/admin/disputes/list')
    const result = unwrap<ReturnRequestResponse[]>(res)
    return { code: 200, result: Array.isArray(result) ? result : [] }
  },

  /** Tạo yêu cầu đổi trả */
  async createReturnRequest(data: ReturnCreateRequest): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post('/returns', data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /** Kiểm tra trạng thái payout khi hoàn tất PayOS */
  async autoCheckPayout(orderCode: number): Promise<ApiResponse<boolean>> {
    const res = await axiosInstance.get(`/returns/auto-check-payout/${orderCode}`)
    const result = unwrap<boolean>(res)
    return { code: 200, result: !!result, message: `Payout verified for order ${orderCode}` }
  },

  /** Kiểm tra trạng thái hoàn tiền của 1 đơn khiếu nại */
  async checkPayoutStatus(id: number): Promise<ApiResponse<{ request: ReturnRequestResponse }>> {
    const res = await axiosInstance.get(`/returns/check-payout-status/${id}`)
    const result = unwrap<{ request: ReturnRequestResponse }>(res)
    return { code: 200, result }
  },

  /** Admin phân xử */
  async adminAction(
    id: number,
    payload: { accept: boolean; response: string; refundAmount: number },
  ): Promise<ApiResponse<{ request: ReturnRequestResponse; checkoutUrl?: string }>> {
    const res = await axiosInstance.post(`/returns/admin-action/${id}`, payload)
    const result = unwrap<{ request: ReturnRequestResponse; checkoutUrl?: string }>(res)
    return { code: 200, result }
  },

  async adminDecision(
    id: number,
    data: AdminReturnDecisionRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/admin-decision`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  async cancelReturnRequest(id: number): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/cancel`)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  async getBuyerReturns(
    page = 0,
    size = 10,
    status?: ReturnStatus,
  ): Promise<ApiResponse<PageResponse<ReturnRequestResponse>>> {
    const res = await axiosInstance.get('/returns/buyer/my-returns', {
      params: { page, size, status: status || undefined },
    })
    return { code: 200, result: unwrap<PageResponse<ReturnRequestResponse>>(res) }
  },

  async shipperAccept(id: number): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/shipper/accept`)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  async shipperPickup(
    id: number,
    data?: ShipperReturnActionRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/shipper/pickup`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  async shipperDeliver(
    id: number,
    data?: ShipperReturnActionRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/shipper/deliver`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  async getShipperAvailableReturns(
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReturnRequestResponse>>> {
    const res = await axiosInstance.get('/returns/shipper/available', { params: { page, size } })
    return { code: 200, result: unwrap<PageResponse<ReturnRequestResponse>>(res) }
  },

  async getShipperMyReturns(
    page = 0,
    size = 10,
    status?: ReturnStatus,
  ): Promise<ApiResponse<PageResponse<ReturnRequestResponse>>> {
    const res = await axiosInstance.get('/returns/shipper/my-returns', {
      params: { page, size, status: status || undefined },
    })
    return { code: 200, result: unwrap<PageResponse<ReturnRequestResponse>>(res) }
  },

  async shipperFail(
    id: number,
    data?: ShipperReturnActionRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/shipper/fail`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },
}
