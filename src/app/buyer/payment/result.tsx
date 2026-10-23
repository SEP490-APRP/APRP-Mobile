import { router, useLocalSearchParams } from 'expo-router'
import { CheckCircle2, Clock, QrCode, ShoppingBag, ShoppingCart, Store, XCircle, type LucideIcon } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading } from '@/components/ui'
import { openPayosCheckout, useCancelPayment, useConfirmPayment, useOrderDetail, usePayosCheckout } from '@/features/checkout'
import { money } from '@/features/product'
import { paymentService } from '@/services'
import { useUiStore } from '@/stores'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

type Params = { orderCode?: string; orderId?: string; method?: string; status?: string; cancel?: string }

/**
 * Kết quả đặt hàng / thanh toán, chuyển từ PaymentResultView bản web.
 * Mở từ: đặt COD, link PayOS trả về (capnong://buyer/payment/result?...), hoặc khi người dùng đóng cổng PayOS.
 */
export default function PaymentResultScreen() {
  const params = useLocalSearchParams<Params>()
  const orderCode = params.orderCode || undefined
  const orderId = Number(params.orderId) || 0
  const isCod = params.method === 'COD'
  const cancelled = params.cancel === 'true' || params.status === 'CANCELLED'
  const showToast = useUiStore((s) => s.showToast)

  const confirm = useConfirmPayment()
  const cancel = useCancelPayment()
  const order = useOrderDetail(orderId)
  const payos = usePayosCheckout()
  const [retrying, setRetrying] = useState(false)
  const handled = useRef<string | null>(null)

  // Huỷ trên cổng PayOS: báo BE hoàn kho và trả hàng về giỏ. Còn lại: hỏi BE trạng thái thanh toán.
  useEffect(() => {
    if (!orderCode || handled.current === orderCode) return
    handled.current = orderCode
    if (cancelled) cancel.mutate(orderCode)
    else confirm.mutate(orderCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode, cancelled])

  const paid =
    !cancelled && (confirm.data?.status === 'PAID' || params.status === 'PAID' || order.data?.status === 'PAID')
  const amount = confirm.data?.amount || order.data?.totalAmount

  const retry = async () => {
    setRetrying(true)
    try {
      if (orderCode) {
        const payment = await paymentService.getPaymentByOrderCode(orderCode)
        if (payment.checkoutUrl) return await openPayosCheckout(payment.checkoutUrl, orderCode)
      }
      if (orderId) {
        const options = await paymentService.getResumePaymentOptions(orderId)
        const url = options.payAllOption?.checkoutUrl ?? options.checkoutUrl
        const code = options.payAllOption?.payosOrderCode ?? options.payosOrderCode
        if (url && code) return await openPayosCheckout(url, code)
        return await payos.start({ orderId, batchId: options.batchId })
      }
      showToast('Không tìm thấy đơn để thanh toán lại. Xem trong mục Đơn hàng.')
    } catch (err) {
      showToast(getErrorMessage(err, 'Chưa mở được cổng PayOS. Vui lòng thử lại.'))
    } finally {
      setRetrying(false)
    }
  }

  if (confirm.isPending) {
    return (
      <CapNongLoading
        message="Đang xác thực giao dịch"
        subMessage="Đang kiểm tra trạng thái thanh toán với PayOS"
      />
    )
  }

  let view: { icon: LucideIcon; tone: 'leaf' | 'amber' | 'rose'; title: string; badge: string; body: string }
  if (cancelled) {
    view = {
      icon: XCircle,
      tone: 'rose',
      title: 'Thanh toán đã huỷ',
      badge: 'Đã dừng thanh toán PayOS',
      body: 'Đơn chưa hoàn tất nên các sản phẩm đã được giữ lại trong giỏ để bạn mua tiếp hoặc chọn cách thanh toán khác.',
    }
  } else if (paid) {
    view = {
      icon: CheckCircle2,
      tone: 'leaf',
      title: 'Thanh toán thành công!',
      badge: 'Đã thanh toán qua PayOS',
      body: 'Nhà vườn sẽ kiểm tra và chuẩn bị nông sản để giao cho bạn.',
    }
  } else if (isCod) {
    view = {
      icon: CheckCircle2,
      tone: 'leaf',
      title: 'Đặt hàng thành công!',
      badge: 'Thanh toán khi nhận hàng',
      body: 'Đơn COD đã được tiếp nhận. Nhà vườn sẽ kiểm tra đơn và gửi hàng sớm nhất.',
    }
  } else {
    view = {
      icon: Clock,
      tone: 'amber',
      title: 'Đơn hàng đang chờ thanh toán',
      badge: 'Chờ thanh toán PayOS',
      body: 'Đơn đã được tạo nhưng chưa nhận được tiền. Nếu bạn vừa chuyển khoản, đợi giây lát rồi kiểm tra trong mục Đơn hàng; hoặc bấm Thanh toán lại.',
    }
  }

  const toneBg = { leaf: 'bg-leaf-50', amber: 'bg-amber-50', rose: 'bg-rose-50' }[view.tone]
  const toneColor = { leaf: '#326318', amber: '#b45309', rose: '#be123c' }[view.tone]
  const Icon = view.icon
  const pendingPayos = !cancelled && !paid && !isCod

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="flex-grow justify-center gap-6 p-5">
        <View className="items-center gap-3 rounded-panel border border-line bg-white p-6">
          <View className={cn('h-24 w-24 items-center justify-center rounded-full', toneBg)}>
            <Icon size={56} color={toneColor} />
          </View>
          <AppText accessibilityRole="header" weight="extrabold" className="text-center text-2xl">
            {view.title}
          </AppText>
          <View className={cn('rounded-full px-3 py-1', toneBg)}>
            <AppText weight="bold" className="text-xs" style={{ color: toneColor }}>
              {view.badge}
            </AppText>
          </View>
          <AppText className="text-center text-sm leading-relaxed text-ink-muted">{view.body}</AppText>

          {(orderCode || orderId > 0 || amount) && (
            <View className="mt-2 w-full gap-2 rounded-2xl border border-line bg-paper p-4">
              {!!orderCode && <Row label="Mã giao dịch PayOS" value={orderCode} />}
              {orderId > 0 && <Row label="Mã đơn hàng" value={`#${orderId}`} />}
              {!!order.data?.shopName && <Row label="Nhà vườn" value={order.data.shopName} icon />}
              {!!amount && <Row label="Tổng tiền" value={money(amount)} strong />}
            </View>
          )}
        </View>

        <View className="gap-3">
          {pendingPayos && (
            <Button title="Thanh toán lại" icon={QrCode} loading={retrying || payos.isPending} onPress={() => void retry()} />
          )}
          {cancelled ? (
            <Button title="Quay lại giỏ hàng" icon={ShoppingCart} onPress={() => router.replace('/buyer/cart')} />
          ) : (
            <Button
              title="Xem đơn hàng"
              variant={pendingPayos ? 'outline' : 'primary'}
              onPress={() => router.replace('/buyer/orders')}
            />
          )}
          <Button title="Tiếp tục mua sắm" icon={ShoppingBag} variant="ghost" onPress={() => router.replace('/buyer/fresh')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value, strong, icon }: { label: string; value: string; strong?: boolean; icon?: boolean }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <AppText className="text-xs text-ink-muted">{label}</AppText>
      <View className="flex-row items-center gap-1">
        {icon && <Store size={12} color="#326318" />}
        <AppText weight={strong ? 'extrabold' : 'bold'} className={cn('text-sm', strong && 'text-leaf-700')}>
          {value}
        </AppText>
      </View>
    </View>
  )
}
