import { router, useLocalSearchParams } from 'expo-router'
import { Boxes, CheckCircle2, MapPin, Navigation, Phone, StickyNote, UserRound } from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Checkbox, ConfirmDialog, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { OrderStatusBadge, orderIdOf, useOrder } from '@/features/order'
import { money } from '@/features/product'
import {
  itemSubtotal,
  OrderItemRow,
  orderTime,
  PACKING_CHECKLIST,
  PaymentChip,
  shopCanCancel,
  shopOrderStage,
  StageHint,
  useShopOrderAction,
  WeightPledge,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/**
 * Chi tiết đơn của Nhà vườn: gộp modal "Chi tiết đơn" và màn "Chuẩn bị & đóng gói" (OrderPreparation) bản web.
 * Đơn đã xác nhận có checklist đóng gói; tích đủ mới bấm được "Sẵn sàng giao".
 */
export default function ShopOrderDetail() {
  const { id: raw } = useLocalSearchParams<{ id: string }>()
  const id = Number(raw) || 0
  const order = useOrder(id)
  const action = useShopOrderAction()
  const showToast = useUiStore((s) => s.showToast)
  const [pledged, setPledged] = useState(false)
  const [packed, setPacked] = useState<boolean[]>(() => PACKING_CHECKLIST.map(() => false))
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/orders'))

  const run = (kind: 'confirm' | 'ready' | 'cancel', ok: string) =>
    action.mutate(
      { id, action: kind },
      {
        onSuccess: () => {
          showToast(ok)
          if (kind === 'cancel') setConfirmCancel(false)
        },
        onError: (err) => {
          showToast(getErrorMessage(err, 'Chưa cập nhật được đơn, thử lại nhé.'))
          setConfirmCancel(false)
        },
      },
    )

  const refresh = async () => {
    setRefreshing(true)
    await order.refetch()
    setRefreshing(false)
  }

  const o = order.data
  if (order.isPending || order.isError || !o) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center px-3 pb-2">
          <BackButton onPress={goBack} />
        </View>
        {order.isPending ? (
          <View className="gap-4 p-4">
            <Skeleton className="h-20 rounded-panel" />
            <Skeleton className="h-32 rounded-panel" />
            <Skeleton className="h-48 rounded-panel" />
          </View>
        ) : (
          <ErrorState title="Không mở được đơn hàng" onRetry={() => void order.refetch()} />
        )}
      </SafeAreaView>
    )
  }

  const orderId = orderIdOf(o) || id
  const stage = shopOrderStage(o.status)
  const items = o.items ?? []
  const subtotal = items.reduce((s, it) => s + itemSubtotal(it), 0)
  const allPacked = packed.every(Boolean)
  const busy = action.isPending
  const phone = o.recipientPhone?.replace(/\s/g, '')

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={goBack} />
        <View className="min-w-0 flex-1">
          <AppText accessibilityRole="header" weight="extrabold" className="text-base">
            Đơn #{orderId}
          </AppText>
          <AppText className="text-xs text-ink-muted">{orderTime(o.createdAt)}</AppText>
        </View>
        <OrderStatusBadge status={o.status} />
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        <StageHint order={o} />

        {/* Người nhận */}
        <View className="gap-3 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
            Giao tới
          </AppText>
          <View className="flex-row items-center gap-3">
            <UserRound size={18} color={colors.leaf700} />
            <View className="min-w-0 flex-1">
              <AppText weight="bold" className="text-base">
                {o.recipientName || 'Khách mua'}
              </AppText>
              {!!o.recipientPhone && <AppText className="text-sm text-ink-muted">{o.recipientPhone}</AppText>}
            </View>
            {!!phone && (
              <Pressable
                onPress={() => void Linking.openURL(`tel:${phone}`)}
                accessibilityRole="button"
                accessibilityLabel={`Gọi ${o.recipientName || 'khách'}`}
                className="h-11 w-11 items-center justify-center rounded-full bg-leaf-50"
              >
                <Phone size={18} color={colors.leaf700} />
              </Pressable>
            )}
          </View>
          <View className="flex-row gap-3">
            <MapPin size={18} color={colors.leaf700} />
            <AppText className="flex-1 text-sm leading-relaxed">{o.shippingAddress || 'Chưa có địa chỉ'}</AppText>
          </View>
          {!!o.note && (
            <View className="flex-row gap-3 rounded-xl bg-amber-50 p-3">
              <StickyNote size={16} color="#b45309" />
              <AppText className="flex-1 text-sm text-amber-900">{o.note}</AppText>
            </View>
          )}
        </View>

        {/* Món cần chuẩn bị */}
        <View className="rounded-panel border border-line bg-white px-4 pt-4">
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
              {stage === 'pack' ? 'Nông sản cần đóng thùng' : 'Sản phẩm'}
            </AppText>
            <PaymentChip order={o} />
          </View>
          {items.length === 0 ? (
            <AppText className="py-3 text-sm italic text-ink-muted">Chi tiết sản phẩm đang được cập nhật</AppText>
          ) : (
            items.map((it, i) => <OrderItemRow key={it.orderDetailId ?? i} item={it} />)
          )}
          <View className="gap-1.5 border-t border-line py-3">
            <Line label="Tiền hàng" value={money(subtotal)} />
            {o.shippingFee != null && <Line label="Phí vận chuyển" value={money(Number(o.shippingFee))} />}
            {!!o.voucherDiscountAmount && <Line label="Voucher" value={`−${money(Number(o.voucherDiscountAmount))}`} />}
            <View className="flex-row items-baseline justify-between pt-1">
              <AppText weight="bold" className="text-sm">
                Tổng đơn
              </AppText>
              <AppText weight="extrabold" className="text-xl text-leaf-700">
                {money(Number(o.totalAmount || 0))}
              </AppText>
            </View>
          </View>
        </View>

        {/* Checklist đóng gói (OrderPreparation bản web) */}
        {stage === 'pack' && (
          <View className="gap-1 rounded-panel border-2 border-dashed border-leaf-200 bg-white p-4">
            <View className="flex-row items-center gap-2 pb-1">
              <Boxes size={18} color={colors.leaf700} />
              <AppText weight="extrabold" className="text-base">
                Checklist đóng gói chuẩn CapNong
              </AppText>
            </View>
            {PACKING_CHECKLIST.map((text, i) => {
              const toggle = () => setPacked((p) => p.map((v, j) => (j === i ? !v : v)))
              return (
                <View key={text} className="flex-row items-center">
                  <Checkbox checked={packed[i]} onChange={toggle} label={text} />
                  <Pressable onPress={toggle} accessible={false} className="flex-1">
                    <AppText className={cn('text-sm leading-relaxed', packed[i] ? 'text-ink' : 'text-ink-muted')}>
                      {i === 3 ? `Ghi hoặc dán mã đơn #${orderId} lên mặt thùng.` : text}
                    </AppText>
                  </Pressable>
                </View>
              )
            })}
            <AppText className="pt-1 text-xs text-ink-subtle">
              Đã kiểm {packed.filter(Boolean).length}/{PACKING_CHECKLIST.length} mục
            </AppText>
          </View>
        )}

        {stage === 'confirm' && <WeightPledge checked={pledged} onToggle={() => setPledged((v) => !v)} />}
      </ScrollView>

      {(stage === 'confirm' || stage === 'pack' || stage === 'shipping') && (
        <View className="flex-row gap-2 border-t border-line bg-white px-4 pb-2 pt-3">
          {shopCanCancel(o.status) && (
            <Button
              title="Huỷ đơn"
              variant="outline"
              onPress={() => setConfirmCancel(true)}
              disabled={busy}
              className="min-h-[48px] flex-1"
            />
          )}
          {stage === 'confirm' && (
            <Button
              title="Xác nhận đơn"
              icon={CheckCircle2}
              disabled={!pledged}
              loading={busy && action.variables?.action === 'confirm'}
              onPress={() => run('confirm', `Đã xác nhận đơn #${orderId}. Bắt đầu chuẩn bị hàng nhé.`)}
              className="min-h-[48px] flex-[1.6]"
            />
          )}
          {stage === 'pack' && (
            <Button
              title="Sẵn sàng giao"
              icon={Boxes}
              disabled={!allPacked}
              loading={busy && action.variables?.action === 'ready'}
              onPress={() => run('ready', `Đơn #${orderId} đã sẵn sàng. Shipper có thể nhận đơn.`)}
              className="min-h-[48px] flex-[1.6]"
            />
          )}
          {stage === 'shipping' && (
            <Button
              title="Theo dõi shipper trên bản đồ"
              icon={Navigation}
              onPress={() => router.push({ pathname: '/shop/tracking/[id]', params: { id: String(orderId) } })}
              className="min-h-[48px] flex-1"
            />
          )}
        </View>
      )}

      <ConfirmDialog
        visible={confirmCancel}
        title={`Huỷ đơn #${orderId}?`}
        message="Số lượng nông sản trong đơn sẽ được hoàn lại kho. Khách sẽ nhận thông báo đơn bị huỷ."
        confirmLabel="Huỷ đơn"
        cancelLabel="Quay lại"
        destructive
        loading={busy && action.variables?.action === 'cancel'}
        onConfirm={() => run('cancel', `Đã huỷ đơn #${orderId}, nông sản đã hoàn lại kho.`)}
        onCancel={() => setConfirmCancel(false)}
      />
    </SafeAreaView>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <AppText className="text-sm text-ink-muted">{label}</AppText>
      <AppText className="text-sm">{value}</AppText>
    </View>
  )
}
