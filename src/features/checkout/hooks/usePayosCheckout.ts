import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { Platform } from 'react-native'
import { paymentService } from '@/services'
import { parsePayosReturn } from '../utils/payosReturn'

const RESULT_PATH = '/buyer/payment/result'

/** replace: đi từ màn thanh toán (không quay lại được); push: đi từ danh sách đơn. */
type NavigateMode = 'push' | 'replace'

/** capnong://buyer/payment/result trên máy thật; trên web là origin hiện tại. */
export const payosReturnUrl = () => Linking.createURL(RESULT_PATH)

/**
 * Mở cổng PayOS trong trình duyệt của app (Custom Tabs / SFSafariViewController) thay cho
 * modal QR bản web. PayOS chuyển về returnUrl; app bắt lại link đó rồi mở màn kết quả.
 * Người dùng đóng trình duyệt giữa chừng vẫn được đưa tới màn kết quả để app hỏi lại trạng thái
 * (có thể họ đã chuyển khoản bằng app ngân hàng).
 */
export async function openPayosCheckout(checkoutUrl: string, orderCode: string, navigate: NavigateMode = 'replace') {
  const returnUrl = payosReturnUrl()
  if (Platform.OS === 'web') {
    window.location.assign(checkoutUrl)
    return
  }
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl)
  const back = result.type === 'success' ? parsePayosReturn(result.url) : { orderCode, cancelled: false }
  router[navigate]({
    pathname: RESULT_PATH,
    params: {
      orderCode: back.orderCode ?? orderCode,
      ...(back.cancelled ? { cancel: 'true' } : {}),
    },
  })
}

/** Tạo link PayOS cho đơn (hoặc lô đơn nhiều shop) rồi mở cổng thanh toán. */
export function usePayosCheckout(navigate: NavigateMode = 'replace') {
  const [isPending, setPending] = useState(false)
  const start = async ({ orderId, batchId }: { orderId?: number; batchId?: number }) => {
    setPending(true)
    try {
      const returnUrl = payosReturnUrl()
      const payment = await paymentService.createPayosPayment({
        batchId,
        orderId: batchId ? undefined : orderId,
        returnUrl,
        cancelUrl: returnUrl,
      })
      if (payment.checkoutUrl) await openPayosCheckout(payment.checkoutUrl, payment.payosOrderCode, navigate)
      else router[navigate]({ pathname: RESULT_PATH, params: { orderCode: payment.payosOrderCode } })
    } finally {
      setPending(false)
    }
  }
  return { start, isPending }
}
