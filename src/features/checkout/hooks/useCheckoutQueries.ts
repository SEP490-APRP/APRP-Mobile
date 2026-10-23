import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/features/cart'
import { voucherKeys } from '@/features/voucher'
import { orderService, paymentService, voucherService } from '@/services'
import type { CheckoutPreviewRequest, CreateOrderRequest } from '@/types/order.types'
import { mergeCheckoutVouchers } from '../utils/voucherRules'

export const checkoutKeys = {
  preview: (req: CheckoutPreviewRequest) => ['checkout', 'preview', req] as const,
  vouchers: () => [...voucherKeys.all, 'checkout'] as const,
  order: (id: number) => ['orders', 'detail', id] as const,
  payment: (orderCode: string) => ['payments', orderCode] as const,
}

/** Voucher công khai và trong ví, gộp lại cho tấm chọn voucher. */
export function useCheckoutVouchers() {
  return useQuery({
    queryKey: checkoutKeys.vouchers(),
    queryFn: async () => {
      const [mine, publics] = await Promise.all([
        voucherService.getMyVouchers().catch(() => []),
        voucherService.getPublicVouchers().catch(() => []),
      ])
      return mergeCheckoutVouchers(mine ?? [], publics ?? [])
    },
  })
}

export function useCollectVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => voucherService.collectByCode(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: voucherKeys.all }),
  })
}

/**
 * Xem trước phí ship, giảm giá và tổng tiền. Bản web gọi mutation mỗi khi đổi địa chỉ/voucher;
 * ở đây dùng query theo khoá nên tự gọi lại và giữ số cũ trong lúc chờ.
 */
export function useCheckoutPreview(req: CheckoutPreviewRequest, enabled: boolean) {
  return useQuery({
    queryKey: checkoutKeys.preview(req),
    queryFn: () => orderService.previewCheckout(req),
    enabled,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => orderService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useOrderDetail(orderId: number) {
  return useQuery({
    queryKey: checkoutKeys.order(orderId),
    queryFn: () => orderService.getOrderById(orderId),
    enabled: orderId > 0,
  })
}

export function useConfirmPayment() {
  return useMutation({ mutationFn: (orderCode: string) => paymentService.confirmPayment(orderCode) })
}

export function useCancelPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderCode: string) => paymentService.cancelPaymentByOrderCode(orderCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}
