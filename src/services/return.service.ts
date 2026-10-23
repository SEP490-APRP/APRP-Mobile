import type { ApiResponse } from '@/types'
import type { ReturnRequestResponse, ReturnStatus } from './return.types'
import { mockDisputes } from '@/mocks/return.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './return.types'

export const returnService = freshResponses({
  async getDisputes(): Promise<ApiResponse<ReturnRequestResponse[]>> {
    await new Promise((r) => setTimeout(r, 400))
    return { code: 200, result: [...mockDisputes] }
  },

  async autoCheckPayout(orderCode: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 300))
    return { code: 200, result: true, message: `Payout verified for order ${orderCode}` }
  },

  async checkPayoutStatus(id: number): Promise<ApiResponse<{ request: ReturnRequestResponse }>> {
    await new Promise((r) => setTimeout(r, 400))
    const d = mockDisputes.find((m) => m.id === id) || mockDisputes[0]
    return { code: 200, result: { request: { ...d, status: 'COMPLETED' } } }
  },

  async adminAction(
    id: number,
    payload: { accept: boolean; response: string; refundAmount: number },
  ): Promise<ApiResponse<{ request: ReturnRequestResponse; checkoutUrl?: string }>> {
    await new Promise((r) => setTimeout(r, 500))
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
  },
})
