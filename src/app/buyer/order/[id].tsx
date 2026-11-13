import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  AlertCircle,
  Check,
  CreditCard,
  MapPin,
  Navigation,
  NotebookPen,
  PackageCheck,
  Phone,
  RotateCcw,
  ShoppingBasket,
  Star,
  Store,
  User,
  XCircle,
} from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading, ConfirmDialog, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  canCancelOrder,
  canCompleteOrder,
  canRequestReturn,
  canReviewItem,
  CancelOrderSheet,
  isUnpaidOrder,
  ORDER_STEPS,
  orderIdOf,
  OrderStatusBadge,
  orderStepIndex,
  paymentMethodLabel,
  ResumePaymentSheet,
  ReturnRequestSheet,
  useCancelOrder,
  useCompleteOrder,
  useOrder,
  usePayOrder,
} from '@/features/order'
import { money } from '@/features/product'
import { ReviewSheet } from '@/features/review'
import { canTrackOrder } from '@/features/tracking'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { OrderItem } from '@/types/order.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/** Chi tiết một đơn: tiến trình, người nhận, món, tiền, đánh giá, hoàn tiền và thao tác. */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = Number(id)
  const orderQuery = useOrder(orderId)
  const order = orderQuery.data
  const cancel = useCancelOrder()
  const complete = useCompleteOrder()
  const payment = usePayOrder()
  const showToast = useUiStore((s) => s.showToast)

  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Review Sheet State
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null)
  // Return Request Sheet State
  const [returnItem, setReturnItem] = useState<OrderItem | null>(null)

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
  const completable = canCompleteOrder(order.status)
  const trackable = canTrackOrder(order.status, 'BUYER')
  const openTracking = () => router.push({ pathname: '/buyer/tracking/[id]', params: { id: String(orderId) } })

  const refresh = async () => {
    setRefreshing(true)
    await orderQuery.refetch()
    setRefreshing(false)
  }

  const doCancel = (reason: string) =>
    cancel.mutate(orderIdOf(order), {
      onSuccess: () => {
        setConfirmCancel(false)
        showToast('Đã huỷ đơn hàng.')
        void orderQuery.refetch()
      },
      onError: (err) => {
        setConfirmCancel(false)
        showToast(getErrorMessage(err, 'Không thể huỷ đơn này.'))
      },
    })

  const doComplete = () =>
    complete.mutate(orderIdOf(order), {
      onSuccess: () => {
        setConfirmComplete(false)
        showToast('Đã xác nhận nhận đủ hàng. Cảm ơn bạn!')
        void orderQuery.refetch()
      },
      onError: (err) => {
        setConfirmComplete(false)
        showToast(getErrorMessage(err, 'Không thể xác nhận hoàn thành đơn.'))
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
        {/* Thông báo trả hàng / hoàn tiền */}
        {order.status === 'REFUND_REQUESTED' && (
          <View className="flex-row items-center gap-3 rounded-panel border border-amber-300 bg-amber-50 p-4">
            <AlertCircle size={22} color="#b45309" />
            <View className="flex-1">
              <AppText weight="bold" className="text-sm text-amber-900">
                Đang xử lý yêu cầu Trả hàng / Hoàn tiền
              </AppText>
              <AppText className="text-xs text-amber-800 leading-relaxed mt-0.5">
                Nhà vườn hoặc quản trị viên đang xem xét yêu cầu hoàn trả của bạn.
              </AppText>
            </View>
          </View>
        )}

        {order.status === 'REFUNDED' && (
          <View className="flex-row items-center gap-3 rounded-panel border border-emerald-300 bg-emerald-50 p-4">
            <Check size={22} color="#047857" />
            <View className="flex-1">
              <AppText weight="bold" className="text-sm text-emerald-900">
                Đơn hàng đã được hoàn tiền
              </AppText>
              {!!order.refundAmount && (
                <AppText className="text-xs text-emerald-800 mt-0.5">
                  Số tiền hoàn: {money(order.refundAmount)}
                </AppText>
              )}
            </View>
          </View>
        )}

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

        {/* Danh sách món & thao tác Đánh giá / Trả hàng */}
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
          {items.map((it, i) => {
            const hasRequestedReturn = it.isRequestedReturn
            const showReturnBtn = canRequestReturn(order.status) && !hasRequestedReturn
            const isReviewed = it.isReviewed
            const showReviewBtn = canReviewItem(order.status, isReviewed)

            return (
              <View key={i} className={cn('gap-2 py-3', i > 0 && 'border-t border-line')}>
                <View className="flex-row items-center gap-3">
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

                {/* Các nút hành động trên từng mặt hàng (Trả hàng / Đánh giá) */}
                {(hasRequestedReturn || showReturnBtn || isReviewed || showReviewBtn) && (
                  <View className="flex-row flex-wrap items-center justify-end gap-2 pt-1">
                    {hasRequestedReturn && (
                      <View className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1">
                        <AppText weight="semibold" className="text-xs text-amber-800">
                          ↺ Đang yêu cầu trả hàng
                        </AppText>
                      </View>
                    )}

                    {showReturnBtn && (
                      <Pressable
                        onPress={() => setReturnItem(it)}
                        className="flex-row items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-1.5 active:bg-gray-200"
                        accessibilityRole="button"
                      >
                        <RotateCcw size={12} color={colors.inkSubtle} />
                        <AppText weight="semibold" className="text-xs text-ink-muted">
                          Trả hàng
                        </AppText>
                      </Pressable>
                    )}

                    {isReviewed && (
                      <View className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                        <AppText weight="semibold" className="text-xs text-emerald-700">
                          ✓ Đã đánh giá
                        </AppText>
                      </View>
                    )}

                    {showReviewBtn && (
                      <Pressable
                        onPress={() => setReviewItem(it)}
                        className="flex-row items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 active:bg-amber-600"
                        accessibilityRole="button"
                      >
                        <Star size={12} color="#ffffff" fill="#ffffff" />
                        <AppText weight="bold" className="text-xs text-white">
                          Đánh giá
                        </AppText>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* Tiền thanh toán */}
        <View className="gap-2 rounded-panel border border-line bg-white p-4">
          <Line label="Phương thức" value={paymentMethodLabel(order.paymentMethod)} />
          {goods > 0 && <Line label="Tiền hàng" value={money(goods)} />}
          {order.shippingFee != null && <Line label="Phí vận chuyển" value={money(order.shippingFee)} />}
          {!!order.voucherDiscountAmount && <Line label="Giảm giá voucher" value={`-${money(order.voucherDiscountAmount)}`} />}
          {!!order.refundAmount && <Line label="Số tiền đã hoàn" value={money(order.refundAmount)} />}
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

      {/* Thanh hành động dưới cùng */}
      {completable && (
        <View className="gap-2 border-t border-line bg-white px-4 pt-3">
          <Button
            title="Đã nhận được hàng"
            icon={PackageCheck}
            loading={complete.isPending}
            onPress={() => setConfirmComplete(true)}
            className="w-full bg-leaf-700"
          />
          {trackable && <Button title="Theo dõi shipper trên bản đồ" variant="outline" icon={Navigation} onPress={openTracking} />}
        </View>
      )}

      {trackable && !unpaid && !cancellable && !completable && (
        <View className="border-t border-line bg-white px-4 pt-3">
          <Button title="Theo dõi shipper trên bản đồ" icon={Navigation} onPress={openTracking} />
        </View>
      )}

      {(unpaid || cancellable) && !completable && (
        <View className="flex-row gap-3 border-t border-line bg-white px-4 pt-3">
          {cancellable && (
            <Button title="Huỷ đơn" variant="outline" icon={XCircle} onPress={() => setConfirmCancel(true)} className="flex-1" />
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

      {/* Tấm huỷ đơn có chọn lý do */}
      <CancelOrderSheet
        visible={confirmCancel}
        orderId={orderIdOf(order)}
        loading={cancel.isPending}
        onClose={() => setConfirmCancel(false)}
        onConfirm={doCancel}
      />

      {/* Hộp thoại xác nhận đã nhận hàng */}
      <ConfirmDialog
        visible={confirmComplete}
        title={`Xác nhận đã nhận đơn #${orderIdOf(order)}?`}
        message="Vui lòng kiểm tra kỹ nông sản trước khi xác nhận. Sau bước này tiền sẽ được giải ngân cho nhà vườn và shipper."
        confirmLabel="Đã nhận đủ hàng"
        cancelLabel="Kiểm tra lại"
        loading={complete.isPending}
        onConfirm={doComplete}
        onCancel={() => setConfirmComplete(false)}
      />

      {/* Tấm đánh giá sản phẩm */}
      <ReviewSheet
        visible={reviewItem != null}
        item={reviewItem}
        orderId={orderIdOf(order)}
        onClose={() => setReviewItem(null)}
        onSuccess={() => void orderQuery.refetch()}
      />

      {/* Tấm yêu cầu trả hàng / hoàn tiền */}
      <ReturnRequestSheet
        visible={returnItem != null}
        item={returnItem}
        orderId={orderIdOf(order)}
        onClose={() => setReturnItem(null)}
        onSuccess={() => void orderQuery.refetch()}
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
    <View className="flex-row items-center justify-between">
      <AppText className="text-xs text-ink-muted">{label}</AppText>
      <AppText weight="semibold" className="text-sm">
        {value}
      </AppText>
    </View>
  )
}
