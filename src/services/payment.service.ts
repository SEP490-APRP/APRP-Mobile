import axiosInstance from '@/services/api/axiosInstance'
import type { CreatePaymentRequest, PaymentResponse, ResumePaymentOptionsResponse } from '@/types/payment.types'

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

/**
 * Khởi tạo liên kết thanh toán PayOS (nhận checkoutUrl & qrCodeUrl)
 */
export async function createPayosPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
  const res = await axiosInstance.post('/payments/create-payos', data)
  return unwrap<PaymentResponse>(res)
}

/**
 * Lấy thông tin thanh toán theo mã orderCode
 */
export async function getPaymentByOrderCode(orderCode: string): Promise<PaymentResponse> {
  const res = await axiosInstance.get(`/payments/${encodeURIComponent(orderCode)}`)
  return unwrap<PaymentResponse>(res)
}

/**
 * Xác thực thanh toán khi FE được redirect về từ PayOS return URL
 */
export async function confirmPayment(orderCode: string): Promise<PaymentResponse> {
  const res = await axiosInstance.post(`/payments/${encodeURIComponent(orderCode)}/confirm`)
  return unwrap<PaymentResponse>(res)
}

/**
 * Lấy tùy chọn tiếp tục thanh toán cho đơn hàng (hỗ trợ gom đơn batch hoặc đơn lẻ)
 */
export async function getResumePaymentOptions(orderId: number): Promise<ResumePaymentOptionsResponse> {
  const res = await axiosInstance.get(`/payments/order/${orderId}/resume-options`)
  return unwrap<ResumePaymentOptionsResponse>(res)
}

/**
 * Hủy thanh toán qua PayOS (hoàn tồn kho và trả hàng về giỏ)
 */
export async function cancelPaymentByOrderCode(orderCode: string): Promise<string> {
  const res = await axiosInstance.post(`/payments/${encodeURIComponent(orderCode)}/cancel`)
  return unwrap<string>(res)
}

export const paymentService = {
  createPayosPayment,
  getPaymentByOrderCode,
  confirmPayment,
  cancelPaymentByOrderCode,
  getResumePaymentOptions,
}
