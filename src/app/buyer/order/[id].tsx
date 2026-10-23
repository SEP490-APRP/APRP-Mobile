import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Check, CreditCard, MapPin, Navigation, NotebookPen, Phone, ShoppingBasket, Store, User, XCircle } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading, ConfirmDialog, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  canCancelOrder,
  isUnpaidOrder,
  ORDER_STEPS,
  orderIdOf,
  OrderStatusBadge,
  orderStepIndex,
  paymentMethodLabel,
  ResumePaymentSheet,
  useCancelOrder,
  useOrder,
  usePayOrder,
} from '@/features/order'
import { money } from '@/features/product'
import { canTrackOrder } from '@/features/tracking'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/** Chi tiết một đơn: tiến trình, người nhận, món, tiền và thao tác thanh toán / huỷ. */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = Number(id)
  const orderQuery = useOrder(orderId)
  const order = orderQuery.data
  const cancel = useCancelOrder()
  const payment = usePayOrder()
  const showToast = useUiStore((s) => s.showToast)
  const [confirming, setConfirming] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const header = (
    <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer/orders'))} />
      <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
        Đơn hàng #{orderId}
      </AppText>
      {order && <OrderStatusBadge status={order.status} />}
    </View>
  )

  if (orderQuery.isPending) return <CapNongLoading message="Đang tải đơn hàng" />
  if (orderQuery.isError || !order) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        <View className="flex-1 justify-center p-5">
          <ErrorState description="Không tải được đơn hàng này." onRetry={() => void orderQuery.refetch()} />
        </View>
      </SafeAreaView>
    )
  }

  const step = orderStepIndex(order.status)
  const items = order.items ?? []
  const goods = items.reduce((sum, it) => sum + Number(it.subtotal ?? it.unitPrice * it.quantity), 0)
  const unpaid = isUnpaidOrder(order)
  const cancellable = canCancelOrder(order)
  const trackable = canTrackOrder(order.status, 'BUYER')
  const openTracking = () => router.push({ pathname: '/buyer/tracking/[id]', params: { id: String(orderId) } })

  const refresh = async () => {
    setRefreshing(true)
    await orderQuery.refetch()
    setRefreshing(false)
  }

  const doCancel = () =>
    cancel.mutate(orderIdOf(order), {
      onSuccess: () => {
        setConfirming(false)
        showToast('Đã huỷ đơn hàng.')
      },
      onError: (err) => {
        setConfirming(false)
        showToast(getErrorMessage(err, 'Không thể huỷ đơn này.'))
      },
    })

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {header}
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
        }
      >
        {/* Tiến trình */}
        {step >= 0 ? (
          <View className="flex-row rounded-panel border border-line bg-white px-2 py-4">
            {ORDER_STEPS.map((label, i) => {
              const done = i <= step
              return (
                <View key={label} className="flex-1 items-center gap-1.5">
                  <View className="w-full flex-row items-center">
                    <View className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : i <= step ? 'bg-leaf-700' : 'bg-line')} />
                    <View
                      className={cn(
                        'h-7 w-7 items-center justify-center rounded-full border-2',
                        done ? 'border-leaf-700 bg-leaf-700' : 'border-line-strong bg-white',
                      )}
                    >
                      {done && <Check size={14} strokeWidth={3} color={colors.white} />}
                    </View>
                    <View
                      className={cn(
                        'h-0.5 flex-1',
                        i === ORDER_STEPS.length - 1 ? 'bg-transparent' : i < step ? 'bg-leaf-700' : 'bg-line',
                      )}
                    />
                  </View>
                  <AppText weight={i === step ? 'bold' : 'regular'} className={cn('text-xs', done ? 'text-leaf-700' : 'text-ink-muted')}>
                    {label}
                  </AppText>
                </View>
              )
            })}
          </View>
        ) : (
          <View className="flex-row items-center gap-3 rounded-panel border border-rose-200 bg-rose-50 p-4">
            <XCircle size={22} color="#be123c" />
            <AppText className="flex-1 text-sm text-rose-800">
              {'Đơn hàng đã dừng. Nếu đã thanh toán, tiền sẽ được hoàn theo chính sách của CapNong.'}
            </AppText>
          </View>
        )}

        {/* Người nhận */}
        <View className="gap-2 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="text-sm">
            Thông tin nhận hàng
          </AppText>
          <InfoRow icon={User} text={order.recipientName} />
          <InfoRow icon={Phone} text={order.recipientPhone} />
          <InfoRow icon={MapPin} text={order.shippingAddress} />
          {!!order.note && <InfoRow icon={NotebookPen} text={order.note} />}
        </View>

        {/* Món */}
        <View className="rounded-panel border border-line bg-white p-4">
          <Pressable
            disabled={!order.shopId}
            onPress={() => router.push({ pathname: '/buyer/shop/[id]', params: { id: String(order.shopId) } })}
            accessibilityRole="link"
            className="mb-1 flex-row items-center gap-2"
          >
            <Store size={16} color={colors.leaf700} />
            <AppText weight="bold" className="flex-1 text-sm">
              {order.shopName || 'Nhà vườn'}
            </AppText>
          </Pressable>
          {items.map((it, i) => (
            <View key={i} className={cn('flex-row items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
              <View className="h-14 w-14 overflow-hidden rounded-xl border border-line bg-paper">
                {it.imageUrl ? (
                  <Image source={{ uri: it.imageUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <ShoppingBasket size={20} color={colors.inkSubtle} />
                  </View>
                )}
              </View>
              <View className="min-w-0 flex-1">
                <AppText weight="semibold" numberOfLines={2} className="text-sm">
                  {it.productName || it.itemName || it.mysteryBoxType || 'Nông sản'}
                </AppText>
                <AppText className="text-xs text-ink-muted">
                  {money(Number(it.unitPrice || 0))} × {it.quantity}
                </AppText>
              </View>
              <AppText weight="bold" className="text-sm">
                {money(Number(it.subtotal ?? it.unitPrice * it.quantity))}
              </AppText>
            </View>
          ))}
        </View>

        {/* Tiền */}
        <View className="gap-2 rounded-panel border border-line bg-white p-4">
          <Line label="Phương thức" value={paymentMethodLabel(order.paymentMethod)} />
          {goods > 0 && <Line label="Tiền hàng" value={money(goods)} />}
          {order.shippingFee != null && <Line label="Phí vận chuyển" value={money(order.shippingFee)} />}
          {!!order.voucherDiscountAmount && <Line label="Giảm giá voucher" value={`-${money(order.voucherDiscountAmount)}`} />}
          <View className="mt-1 flex-row items-baseline justify-between border-t border-line pt-3">
            <AppText weight="bold" className="text-base">
              Tổng thanh toán
            </AppText>
            <AppText weight="extrabold" className="text-xl text-leaf-700">
              {money(Number(order.totalAmount || 0))}
            </AppText>
          </View>
          {!!order.createdAt && (
            <AppText className="text-xs text-ink-muted">Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</AppText>
          )}
        </View>
      </ScrollView>

      {trackable && !unpaid && !cancellable && (
        <View className="border-t border-line bg-white px-4 pt-3">
          <Button title="Theo dõi shipper trên bản đồ" icon={Navigation} onPress={openTracking} />
        </View>
      )}
      {(unpaid || cancellable) && (
        <View className="flex-row gap-3 border-t border-line bg-white px-4 pt-3">
          {cancellable && (
            <Button title="Huỷ đơn" variant="outline" icon={XCircle} onPress={() => setConfirming(true)} className="flex-1" />
          )}
          {unpaid && (
            <Button
              title="Thanh toán ngay"
              icon={CreditCard}
              loading={payment.payingId === orderIdOf(order)}
              onPress={() => void payment.pay(order)}
              className="flex-[1.4]"
            />
          )}
        </View>
      )}

      <ConfirmDialog
        visible={confirming}
        title="Huỷ đơn hàng này?"
        message="Nông sản sẽ được trả lại kho của nhà vườn. Bạn không thể hoàn tác."
        confirmLabel="Huỷ đơn"
        cancelLabel="Giữ đơn"
        destructive
        loading={cancel.isPending}
        onConfirm={doCancel}
        onCancel={() => setConfirming(false)}
      />
      <ResumePaymentSheet
        options={payment.options}
        onPayAll={() => void payment.payAll()}
        onPaySingle={(oid) => void payment.paySingle(oid)}
        onClose={payment.closeOptions}
      />
    </SafeAreaView>
  )
}

function InfoRow({ icon: Icon, text }: { icon: typeof User; text: string }) {
  return (
    <View className="flex-row items-start gap-2.5">
      <Icon size={16} color={colors.inkSubtle} style={{ marginTop: 2 }} />
      <AppText className="flex-1 text-sm leading-relaxed text-ink-muted">{text}</AppText>
    </View>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <AppText className="text-sm text-ink-muted">{label}</AppText>
      <AppText weight="semibold" className="text-sm">
        {value}
      </AppText>
    </View>
  )
}
