export interface CreatePaymentRequest {
  orderId?: number
  batchId?: number
  paymentGateway?: string
  returnUrl?: string
  cancelUrl?: string
}

export interface PaymentResponse {
  paymentId: number
  orderId?: number
  batchId?: number
  amount: number
  paymentGateway: string
  status: string
  payosOrderCode: string
  checkoutUrl?: string
  qrCodeUrl?: string
  createdAt?: string
}

export interface ResumePaymentOrderOption {
  orderId: number
  shopId: number
  shopName: string
  amount: number
  status?: string
}

export interface PayAllOption {
  amount: number
  checkoutUrl?: string
  payosOrderCode?: string
  qrCodeUrl?: string
}

export interface ResumePaymentOptionsResponse {
  isBatch: boolean
  batchId?: number
  triggerOrderId: number
  totalAmount: number
  payosOrderCode?: string
  checkoutUrl?: string
  qrCodeUrl?: string
  unpaidOrders: ResumePaymentOrderOption[]
  payAllOption?: PayAllOption
}

