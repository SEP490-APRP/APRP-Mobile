import type { ApiResponse } from '@/types'
import type { CodPendingOrderResponse } from './codSettlement.types'
import type { BackendDateTime } from './wallet.types'
import axiosInstance from '@/services/api/axiosInstance'

export type * from './codSettlement.types'

interface OrderSettlementRow {
  orderId: number
  orderStatus: string
  buyerPaid: number
  shippingFee: number
  codAmount?: number | null
  codSettled?: boolean | null
  codCashCollectedAt?: BackendDateTime
  refundAmount?: number | null
  refundReason?: string | null
  shipper?: { userId?: number; name?: string } | null
  shop?: { userId?: number; name?: string } | null
}

export function isCodOrder(order: { paymentMethod?: string }): boolean {
  return (order.paymentMethod ?? '').toUpperCase() === 'COD'
}

export function getCodCollectAmount(order: {
  codCollectAmount?: number
  collectAmount?: number
  codAmount?: number
  totalAmount?: number
}): number {
  return order.codCollectAmount ?? order.collectAmount ?? order.codAmount ?? order.totalAmount ?? 0
}

export function getCodPrepaidAmount(order: {
  codPrepaidAmount?: number
  prepaidAmount?: number
  totalAmount?: number
}): number {
  return (
    order.codPrepaidAmount ??
    order.prepaidAmount ??
    (order.totalAmount ? Math.round(order.totalAmount * 0.8) : 0)
  )
}

function toIso(value?: BackendDateTime): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const [y, m = 1, d = 1, h = 0, min = 0, s = 0] = value
    return new Date(y, m - 1, d, h, min, s).toISOString()
  }
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString()
}

function toCodRow(s: OrderSettlementRow): CodPendingOrderResponse {
  return {
    id: s.orderId,
    status: s.orderStatus,
    totalAmount: s.buyerPaid,
    shippingFee: s.shippingFee,
    codCollectAmount: s.codAmount ?? s.buyerPaid,
    codPrepaidAmount: 0,
    codPaymentStatus: s.codSettled ? 'SETTLED' : 'CONFIRMED',
    codPaymentOption: 'FULL_COD',
    deliveredAt: toIso(s.codCashCollectedAt),
    codSettled: !!s.codSettled,
    refundAmount: s.refundAmount ?? undefined,
    refundReason: s.refundReason ?? undefined,
    shipper: s.shipper?.userId ? { id: s.shipper.userId, fullName: s.shipper.name } : undefined,
    shop: s.shop?.userId ? { id: s.shop.userId, shopName: s.shop.name } : undefined,
    items: [],
  }
}

export const codSettlementService = {
  /** Đơn COD Shipper đã thu tiền mặt nhưng chưa nộp về sàn: GET /wallets/cod/pending */
  async getPendingCodOrders(): Promise<ApiResponse<CodPendingOrderResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<OrderSettlementRow[]>>('/wallets/cod/pending')
    const list = res.data.result ?? []
    return { code: 1000, result: list.map(toCodRow) }
  },

  /** Admin xác nhận Shipper đã nộp tiền mặt COD: POST /wallets/cod/{orderId}/settle */
  async settleCodOrder(orderId: number): Promise<ApiResponse<boolean>> {
    await axiosInstance.post(`/wallets/cod/${orderId}/settle`)
    return { code: 1000, result: true, message: 'Đối soát COD thành công' }
  },

  /** Luồng COD hiện tại: Shipper thu đủ tiền mặt, nộp về sàn 1 lần, nên xác nhận = đối soát */
  async confirmShipperCashPayment(orderId: number): Promise<ApiResponse<boolean>> {
    return this.settleCodOrder(orderId)
  },

  async refundCodPrepaymentToShipper(_orderId: number): Promise<ApiResponse<boolean>> {
    throw { status: 400, message: 'Backend chưa hỗ trợ ứng tiền COD trước cho shipper' }
  },
}
