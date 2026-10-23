import { useState } from 'react'
import { usePayosCheckout } from '@/features/checkout'
import { paymentService } from '@/services'
import { useUiStore } from '@/stores'
import type { OrderResponse } from '@/types/order.types'
import type { ResumePaymentOptionsResponse } from '@/types/payment.types'
import { getErrorMessage } from '@/utils/errors'
import { orderIdOf } from '../utils/orderStatus'

/**
 * "Thanh toán ngay" cho đơn chờ thanh toán. Đơn thuộc một lần đặt nhiều shop (batch) còn từ 2 đơn
 * chưa trả thì mở tấm chọn "trả tất cả / từng đơn" (ResumePaymentModal bản web); còn lại mở PayOS luôn.
 */
export function usePayOrder() {
  const payos = usePayosCheckout('push')
  const showToast = useUiStore((s) => s.showToast)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [options, setOptions] = useState<ResumePaymentOptionsResponse | null>(null)

  const run = async (id: number, job: () => Promise<void>) => {
    setPayingId(id)
    try {
      await job()
    } catch (err) {
      showToast(getErrorMessage(err, 'Chưa mở được cổng PayOS. Vui lòng thử lại.'))
    } finally {
      setPayingId(null)
    }
  }

  const pay = (order: OrderResponse) => {
    const orderId = orderIdOf(order)
    return run(orderId, async () => {
      if (order.batchId) {
        const opts = await paymentService.getResumePaymentOptions(orderId).catch(() => null)
        if (opts?.isBatch && (opts.unpaidOrders?.length ?? 0) > 1) {
          setOptions(opts)
          return
        }
      }
      await payos.start({ orderId })
    })
  }

  const payAll = () => {
    if (!options?.batchId) return
    const batchId = options.batchId
    setOptions(null)
    return run(options.triggerOrderId, () => payos.start({ batchId }))
  }

  const paySingle = (orderId: number) => {
    setOptions(null)
    return run(orderId, () => payos.start({ orderId }))
  }

  return { pay, payAll, paySingle, payingId, options, closeOptions: () => setOptions(null) }
}
