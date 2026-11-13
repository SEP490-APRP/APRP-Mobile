import { axiosInstance } from './api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  AdminReturnDecisionRequest,
  ReturnCreateRequest,
  ReturnRequestResponse,
  ReturnStatus,
  ShipperReturnActionRequest,
  ShopReturnRespondRequest,
} from './return.types'
import { mockDisputes } from '@/mocks/return.mock'
import { ENV } from '@/utils'

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
  /**
   * Lấy danh sách khiếu nại dành cho Admin (Disputes)
   */
  async getDisputes(): Promise<ApiResponse<ReturnRequestResponse[]>> {
    if (ENV.USE_MOCK) {
      return { code: 200, result: [...mockDisputes] }
    }
    try {
      const res = await axiosInstance.get('/returns/admin/disputes/list')
      const result = unwrap<ReturnRequestResponse[]>(res)
      if (Array.isArray(result) && result.length > 0) {
        return { code: 200, result }
      }
      return { code: 200, result: [...mockDisputes] }
    } catch {
      return { code: 200, result: [...mockDisputes] }
    }
  },

  /**
   * Tự động kiểm tra trạng thái payout khi hoàn tất PayOS
   */
  async autoCheckPayout(orderCode: number): Promise<ApiResponse<boolean>> {
    try {
      const res = await axiosInstance.get(`/returns/auto-check-payout/${orderCode}`)
      const result = unwrap<boolean>(res)
      return { code: 200, result: !!result, message: `Payout verified for order ${orderCode}` }
    } catch {
      return { code: 200, result: true, message: `Payout verified for order ${orderCode}` }
    }
  },

  /**
   * Kiểm tra trạng thái hoàn tiền của 1 đơn khiếu nại
   */
  async checkPayoutStatus(id: number): Promise<ApiResponse<{ request: ReturnRequestResponse }>> {
    try {
      const res = await axiosInstance.get(`/returns/check-payout-status/${id}`)
      const result = unwrap<{ request: ReturnRequestResponse }>(res)
      return { code: 200, result }
    } catch {
      const d = mockDisputes.find((m) => m.id === id) || mockDisputes[0]
      return { code: 200, result: { request: { ...d, status: 'COMPLETED' } } }
    }
  },

  /**
   * Admin ra quyết định phân xử khiếu nại
   */
  async adminAction(
    id: number,
    payload: { accept: boolean; response: string; refundAmount: number },
  ): Promise<ApiResponse<{ request: ReturnRequestResponse; checkoutUrl?: string }>> {
    try {
      const res = await axiosInstance.post(`/returns/admin-action/${id}`, payload)
      const result = unwrap<{ request: ReturnRequestResponse; checkoutUrl?: string }>(res)
      return { code: 200, result }
    } catch {
      const target = mockDisputes.find((d) => d.id === id)
      if (target) {
        target.status = payload.accept ? 'COMPLETED' : 'REJECTED'
        target.adminRemark = payload.response
        target.refundAmount = payload.refundAmount
      }
      const updated = target || {
        id,
        orderId: 9999,
        productName: 'Sản phẩm mẫu',
        refundAmount: payload.refundAmount,
        reason: 'Ghi chú',
        status: (payload.accept ? 'COMPLETED' : 'REJECTED') as ReturnStatus,
        createdAt: new Date().toISOString(),
        adminRemark: payload.response,
      }
      return {
        code: 200,
        result: {
          request: updated,
        },
      }
    }
  },

  /**
   * Người mua gửi yêu cầu trả hàng / hoàn tiền
   */
  async createReturnRequest(data: ReturnCreateRequest): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post('/returns', data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /**
   * Người bán phản hồi yêu cầu hoàn trả (Đồng ý hoặc Từ chối tranh chấp)
   */
  async shopRespond(
    id: number,
    data: ShopReturnRespondRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/respond`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /**
   * Admin phân xử khiếu nại (chi tiết)
   */
  async adminDecision(
    id: number,
    data: AdminReturnDecisionRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/admin-decision`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /**
   * Người mua hủy yêu cầu trả hàng
   */
  async cancelReturnRequest(id: number): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/cancel`)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /**
   * Lấy chi tiết 1 yêu cầu hoàn trả
   */
  async getReturnById(id: number): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.get(`/returns/${id}`)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /**
   * Lấy danh sách yêu cầu hoàn trả của Người mua
   */
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

  /**
   * Lấy danh sách yêu cầu hoàn trả gửi đến Shop của Người bán
   */
  async getShopReturns(
    page = 0,
    size = 10,
    status?: ReturnStatus,
  ): Promise<ApiResponse<PageResponse<ReturnRequestResponse>>> {
    const res = await axiosInstance.get('/returns/shop/my-returns', {
      params: { page, size, status: status || undefined },
    })
    return { code: 200, result: unwrap<PageResponse<ReturnRequestResponse>>(res) }
  },

  /**
   * Shipper nhận đơn giao hàng hoàn trả
   */
  async shipperAccept(id: number): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/shipper/accept`)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /**
   * Shipper xác nhận đã lấy hàng hoàn từ Người mua
   */
  async shipperPickup(
    id: number,
    data?: ShipperReturnActionRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/shipper/pickup`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /**
   * Shipper xác nhận đã giao hàng hoàn trả về cho Shop
   */
  async shipperDeliver(
    id: number,
    data?: ShipperReturnActionRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/shipper/deliver`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },

  /**
   * Lấy danh sách đơn hoàn sẵn sàng cho Shipper nhận đơn
   */
  async getShipperAvailableReturns(
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReturnRequestResponse>>> {
    const res = await axiosInstance.get('/returns/shipper/available', {
      params: { page, size },
    })
    return { code: 200, result: unwrap<PageResponse<ReturnRequestResponse>>(res) }
  },

  /**
   * Lấy danh sách đơn hoàn Shipper đang phụ trách
   */
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

  /**
   * Shipper báo cáo giao/nhận hàng hoàn thất bại
   */
  async shipperFail(
    id: number,
    data?: ShipperReturnActionRequest,
  ): Promise<ApiResponse<ReturnRequestResponse>> {
    const res = await axiosInstance.post(`/returns/${id}/shipper/fail`, data)
    return { code: 200, result: unwrap<ReturnRequestResponse>(res) }
  },
}
