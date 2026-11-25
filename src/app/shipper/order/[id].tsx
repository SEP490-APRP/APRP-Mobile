import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Banknote,
  ChevronRight,
  CreditCard,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  ShieldAlert,
  Store,
  X,
} from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, BottomSheet, Button, CapNongLoading, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { orderIdOf, OrderStatusBadge, useOrder } from '@/features/order'
import { money } from '@/features/product'
import {
  codReserveCheck,
  isCod,
  netShipperFee,
  ShipperDeliveryActions,
  shipperErrorCode,
  shipperErrorMessage,
  shipperKeys,
  useAcceptOrder,
  useActiveOrders,
} from '@/features/shipper'
import { shipperService } from '@/services/shipper.service'
import { TopupSheet, useMyWallet } from '@/features/wallet'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { OrderItem, OrderResponse } from '@/types/order.types'
import { cn } from '@/utils/helpers'

function formatDateTime(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  return `${time} · ${date}`
}

export default function ShipperOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = Number(id)
  const qc = useQueryClient()
  const orderQuery = useOrder(orderId)

  // Tìm trong cache Đơn mới (READY) vì BE chặn GET /orders/{id} khi đơn chưa gán cho shipper này
  const cachedReady = (() => {
    const entries = qc.getQueriesData<{ content?: OrderResponse[] }>({ queryKey: shipperKeys.ready() })
    for (const [, data] of entries) {
      const found = data?.content?.find((o) => orderIdOf(o) === orderId)
      if (found) return found
    }
    return undefined
  })()

  // Nếu từ Thông báo mở thẳng vào đơn READY (chưa có trong cache), tự tìm trong danh sách /orders/ready
  const readyFallback = useQuery({
    queryKey: ['shipper', 'ready-detail', orderId],
    queryFn: async () => {
      const page = await shipperService.getReadyOrders(0, 50)
      return page.content.find((o) => orderIdOf(o) === orderId) ?? null
    },
    enabled: orderQuery.isError && !cachedReady && Number.isFinite(orderId) && orderId > 0,
    retry: false,
  })

  const order = orderQuery.data ?? cachedReady ?? readyFallback.data ?? undefined
  const accept = useAcceptOrder()
  const active = useActiveOrders()
  const wallet = useMyWallet()
  const showToast = useUiStore((s) => s.showToast)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [topupOpen, setTopupOpen] = useState(false)

  if ((orderQuery.isPending && !cachedReady) || (orderQuery.isError && !cachedReady && readyFallback.isFetching)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-paper">
        <CapNongLoading />
      </SafeAreaView>
    )
  }

  if (!order) {
    const isForbidden = (orderQuery.error as { status?: number } | null)?.status === 403
    const readyErrCode = shipperErrorCode(readyFallback.error)
    const errorMsg =
      readyErrCode === 7006
        ? 'Bạn đang ở trạng thái nghỉ. Hãy bật "Đang nhận đơn" ở trang chủ để xem và nhận đơn mới.'
        : isForbidden
          ? `Đơn hàng #${orderId} không còn khả dụng (đã có tài xế khác nhận hoặc không thuộc tài khoản của bạn).`
          : undefined
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center gap-2 px-4 py-3">
          <BackButton onPress={() => router.back()} />
          <AppText weight="extrabold" className="text-base">
            Chi tiết đơn hàng
          </AppText>
        </View>
        <ErrorState
          description={errorMsg}
          onRetry={() => {
            void orderQuery.refetch()
            if (orderQuery.isError) void readyFallback.refetch()
          }}
        />
      </SafeAreaView>
    )
  }

  const cod = isCod(order) ? Number(order.codAmount ?? order.totalAmount ?? 0) : 0
  const shipFee = Number(order.shippingFee ?? 0)
  const netIncome = netShipperFee(shipFee)
  const isReady = order.status === 'READY'
  const isActive = order.status === 'SHIPPING' || order.status === 'PICKED_UP'
  const isFail = order.status === 'FAILED'
  const busy = (active.data?.length ?? 0) > 0
  const available = wallet.data?.availableBalance ?? wallet.data?.balance
  const reserve = codReserveCheck(order, available)

  const confirmAccept = () => {
    const idNum = orderIdOf(order)
    accept.mutate(idNum, {
      onSuccess: () => {
        setAcceptOpen(false)
        showToast(`Đã nhận đơn #${idNum}. Đến nhà vườn lấy hàng nhé!`)
        void orderQuery.refetch()
        router.navigate('/shipper/delivering' as any)
      },
      onError: (e) => {
        if (shipperErrorCode(e) !== 16013) setAcceptOpen(false)
        void wallet.refetch()
        showToast(shipperErrorMessage(e, 'Chưa nhận được đơn, thử lại nhé.'))
      },
    })
  }

  const callPhone = (phone?: string) => {
    if (phone) void Linking.openURL(`tel:${phone}`)
  }

  const openMaps = (address?: string) => {
    if (!address) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=two-wheeler`
    void Linking.openURL(url)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-line bg-white px-4 py-3">
        <View className="flex-row items-center gap-2">
          <BackButton onPress={() => router.back()} />
          <View>
            <AppText weight="extrabold" className="text-base">
              Đơn hàng #{orderIdOf(order)}
            </AppText>
            <AppText className="text-xs text-ink-muted">
              Tạo lúc {formatDateTime(order.createdAt)}
            </AppText>
          </View>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <ScrollView
        contentContainerClassName="gap-3 p-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={orderQuery.isRefetching}
            onRefresh={() => void orderQuery.refetch()}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {/* Banner trạng thái giao nếu thất bại */}
        {isFail && (
          <View className="rounded-panel border border-sale/40 bg-sale-soft p-4">
            <View className="flex-row items-center gap-2">
              <ShieldAlert size={18} color={colors.sale} />
              <AppText weight="bold" className="text-sm text-sale">
                Đơn hàng giao không thành công
              </AppText>
            </View>
            <AppText className="mt-1 text-xs text-sale">
              Lý do: {order.failReason || 'Không rõ lý do'}
              {order.failNote ? ` · ${order.failNote}` : ''}
            </AppText>
            {order.failCallAttempts != null && (
              <AppText className="mt-0.5 text-xs text-sale">
                Số lần gọi khách: {order.failCallAttempts} lần
              </AppText>
            )}
          </View>
        )}

        {/* Lộ trình: Shop & Người nhận */}
        <View className="overflow-hidden rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="mb-3 text-xs uppercase tracking-wide text-ink-muted">
            Lộ trình giao nhận
          </AppText>

          {/* Điểm lấy hàng */}
          <View className="flex-row gap-3">
            <View className="mt-1 h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Store size={14} color="#d97706" />
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="bold" numberOfLines={2} className="text-sm">
                {order.shopName || 'Nhà vườn'}
              </AppText>
              <AppText numberOfLines={2} className="mt-0.5 text-xs text-ink-muted">
                {order.shopAddress || 'Chưa có địa chỉ vườn'}
              </AppText>
              <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
                {Boolean(order.shopPhone) && (
                  <Button
                    title="Gọi vườn"
                    icon={Phone}
                    variant="outline"
                    onPress={() => callPhone(order.shopPhone)}
                    className="h-9 px-3 py-0"
                  />
                )}
                <Button
                  title="Nhắn tin"
                  icon={MessageSquare}
                  variant="outline"
                  onPress={() => router.push('/shipper/messages' as any)}
                  className="h-9 px-3 py-0"
                />
                {Boolean(order.shopAddress) && (
                  <Button
                    title="Chỉ đường"
                    icon={Navigation}
                    variant="outline"
                    onPress={() => openMaps(order.shopAddress)}
                    className="h-9 border-leaf-600/30 bg-leaf-50 px-3 py-0"
                  />
                )}
              </View>
            </View>
          </View>

          <View className="my-2.5 ml-3 h-4 w-0.5 bg-line" />

          {/* Điểm giao hàng */}
          <View className="flex-row gap-3">
            <View className="mt-1 h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-100">
              <MapPin size={14} color={colors.leaf700} />
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="bold" numberOfLines={2} className="text-sm">
                {order.recipientName || 'Người nhận'}
              </AppText>
              <AppText numberOfLines={2} className="mt-0.5 text-xs text-ink-muted">
                {order.shippingAddress}
              </AppText>
              <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
                {Boolean(order.recipientPhone) && (
                  <Button
                    title="Gọi khách"
                    icon={Phone}
                    variant="outline"
                    onPress={() => callPhone(order.recipientPhone)}
                    className="h-9 px-3 py-0"
                  />
                )}
                <Button
                  title="Nhắn tin"
                  icon={MessageSquare}
                  variant="outline"
                  onPress={() => router.push('/shipper/messages' as any)}
                  className="h-9 px-3 py-0"
                />
                {Boolean(order.shippingAddress) && (
                  <Button
                    title="Chỉ đường"
                    icon={Navigation}
                    variant="outline"
                    onPress={() => openMaps(order.shippingAddress)}
                    className="h-9 border-leaf-600/30 bg-leaf-50 px-3 py-0"
                  />
                )}
              </View>
            </View>
          </View>

          {/* Ghi chú của khách */}
          {Boolean(order.note) && (
            <View className="mt-3 rounded-lg bg-amber-50 p-2.5">
              <AppText weight="bold" className="text-xs text-amber-900">
                Ghi chú từ khách:
              </AppText>
              <AppText className="mt-0.5 text-xs text-amber-800">
                {order.note}
              </AppText>
            </View>
          )}
        </View>

        {/* Kiện hàng & Chi tiết sản phẩm */}
        <View className="rounded-panel border border-line bg-white p-4">
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
              Chi tiết kiện hàng ({order.items?.length ?? 0} món)
            </AppText>
          </View>

          <View className="mt-3 divide-y divide-line">
            {(order.items ?? []).map((item: OrderItem, idx: number) => {
              const name = item.productName || item.itemName || 'Sản phẩm'
              const qty = item.quantityKg ? `${item.quantityKg} kg` : `x${item.quantity}`
              return (
                <View key={item.id ?? idx} className="flex-row items-center gap-3 py-2.5">
                  <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48 }} contentFit="cover" />
                    ) : (
                      <Package size={20} color={colors.inkSubtle} />
                    )}
                  </View>
                  <View className="min-w-0 flex-1">
                    <AppText weight="bold" numberOfLines={1} className="text-sm">
                      {name}
                    </AppText>
                    <AppText className="text-xs text-ink-muted">
                      Số lượng: {qty}
                    </AppText>
                  </View>
                  <AppText weight="semibold" className="text-xs text-ink-muted">
                    {money(Number(item.unitPrice ?? item.pricePerKg ?? 0))}
                  </AppText>
                </View>
              )
            })}
          </View>
        </View>

        {/* Thông tin cước & COD */}
        <View className="rounded-panel border border-line bg-white p-4 gap-2.5">
          <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
            Thu nhập & Thu hộ
          </AppText>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Banknote size={15} color={colors.leaf700} />
              <AppText className="text-sm text-ink">Cước giao hàng</AppText>
            </View>
            <AppText weight="bold" className="text-sm text-ink">
              {money(shipFee)}
            </AppText>
          </View>

          <View className="flex-row items-center justify-between">
            <AppText className="text-xs text-ink-muted">
              Thực nhận sau phí sàn 3%
            </AppText>
            <AppText weight="extrabold" className="text-base text-leaf-700">
              +{money(netIncome)}
            </AppText>
          </View>

          <View className="my-1 border-t border-line" />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              {cod > 0 ? (
                <Banknote size={15} color="#d97706" />
              ) : (
                <CreditCard size={15} color={colors.leaf700} />
              )}
              <AppText weight="semibold" className="text-sm text-ink">
                {cod > 0 ? 'Thu hộ tiền mặt (COD)' : 'Thanh toán trước'}
              </AppText>
            </View>
            <AppText weight="extrabold" className={cn('text-base', cod > 0 ? 'text-amber-800' : 'text-leaf-700')}>
              {cod > 0 ? money(cod) : '0đ (Đã thanh toán)'}
            </AppText>
          </View>

          {cod > 0 && (
            <View className="rounded-md bg-amber-50 p-2">
              <AppText className="text-xs text-amber-800">
                Tài xế đã ký quỹ {money(cod)} từ số dư khả dụng khi nhận đơn. Khi giao xong, bạn giữ lại số tiền mặt này từ khách.
              </AppText>
            </View>
          )}
        </View>

        {/* Mốc thời gian */}
        <View className="rounded-panel border border-line bg-white p-4 gap-2">
          <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
            Nhật ký chuyến đi
          </AppText>

          <View className="flex-row items-center justify-between">
            <AppText className="text-xs text-ink-muted">Thời điểm tạo đơn</AppText>
            <AppText weight="medium" className="text-xs text-ink">{formatDateTime(order.createdAt)}</AppText>
          </View>

          {Boolean(order.pickedUpAt) && (
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-ink-muted">Thời điểm lấy hàng tại vườn</AppText>
              <AppText weight="medium" className="text-xs text-ink">{formatDateTime(order.pickedUpAt)}</AppText>
            </View>
          )}

          {Boolean(order.deliveredAt) && (
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-leaf-800">Thời điểm giao thành công</AppText>
              <AppText weight="bold" className="text-xs text-leaf-800">{formatDateTime(order.deliveredAt)}</AppText>
            </View>
          )}

          {Boolean(order.failedAt) && (
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-sale">Thời điểm xác nhận thất bại</AppText>
              <AppText weight="bold" className="text-xs text-sale">{formatDateTime(order.failedAt)}</AppText>
            </View>
          )}
        </View>

        {/* Ảnh bằng chứng giao / thất bại */}
        {((order.deliveryProofUrls && order.deliveryProofUrls.length > 0) ||
          (order.failProofUrls && order.failProofUrls.length > 0)) && (
          <View className="rounded-panel border border-line bg-white p-4 gap-2">
            <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
              Ảnh bằng chứng {isFail ? 'thất bại' : 'giao hàng'} (Nhấn để xem lớn)
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {(order.deliveryProofUrls || order.failProofUrls || []).map((url: string, i: number) => (
                <Pressable
                  key={i}
                  onPress={() => setPreviewImage(url)}
                  className="h-20 w-20 overflow-hidden rounded-lg border border-line active:opacity-80"
                >
                  <Image source={{ uri: url }} style={{ width: 80, height: 80 }} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Nút nhận đơn nếu đơn đang READY */}
        {isReady && (
          <View className="mt-2 gap-2">
            <Button
              title={busy ? 'Giao xong đơn hiện tại để nhận thêm' : 'Nhận đơn này'}
              icon={busy ? undefined : ChevronRight}
              disabled={busy}
              onPress={() => setAcceptOpen(true)}
              className={cn('min-h-[48px]', busy && 'opacity-50')}
            />
          </View>
        )}

        {/* Nút hành động nếu đơn đang giao */}
        {isActive && (
          <View className="mt-2 gap-3">
            <Button
              title="Mở bản đồ điều hướng realtime"
              icon={Navigation}
              onPress={() => router.push(`/shipper/tracking/${orderIdOf(order)}` as any)}
              className="min-h-[48px]"
            />
            <ShipperDeliveryActions
              order={order}
              showQuickContact={false}
              onSuccess={() => void orderQuery.refetch()}
            />
            <Button
              title="Quay lại danh sách Đang giao"
              variant="outline"
              onPress={() => router.push('/shipper/delivering' as any)}
              className="min-h-[48px]"
            />
          </View>
        )}
      </ScrollView>

      <BottomSheet
        visible={acceptOpen}
        onClose={() => !accept.isPending && setAcceptOpen(false)}
        title={`Nhận đơn #${orderIdOf(order)}?`}
        subtitle="Sau khi nhận, đến nhà vườn lấy hàng rồi giao cho khách"
        footer={
          <>
            <Button
              title="Để sau"
              variant="outline"
              disabled={accept.isPending}
              onPress={() => setAcceptOpen(false)}
              className="min-h-[48px] flex-1"
            />
            {reserve.missing > 0 ? (
              <Button title="Nạp ví" variant="primary" onPress={() => setTopupOpen(true)} className="min-h-[48px] flex-1" />
            ) : (
              <Button
                title={reserve.required > 0 ? 'Ký quỹ và nhận' : 'Nhận đơn'}
                loading={accept.isPending}
                disabled={wallet.isPending && reserve.required > 0}
                onPress={confirmAccept}
                className="min-h-[48px] flex-1"
              />
            )}
          </>
        }
      >
        <View className="gap-3">
          <View className="flex-row justify-between gap-4">
            <AppText className="text-sm text-ink-muted">Lấy hàng tại</AppText>
            <AppText weight="bold" className="flex-1 text-right text-sm">
              {order.shopName || '—'}
            </AppText>
          </View>
          <View className="flex-row justify-between gap-4">
            <AppText className="text-sm text-ink-muted">Giao cho</AppText>
            <AppText weight="bold" className="flex-1 text-right text-sm">
              {order.recipientName} · {order.recipientPhone}
            </AppText>
          </View>
          <View className="flex-row justify-between gap-4">
            <AppText className="text-sm text-ink-muted">Phí ship bạn nhận</AppText>
            <AppText weight="bold" className="flex-1 text-right text-sm text-leaf-700">
              {money(shipFee)}
            </AppText>
          </View>
          {cod > 0 && (
            <View className={reserve.missing > 0 ? 'gap-1 rounded-card bg-sale-soft p-3' : 'gap-1 rounded-card bg-sun-300/40 p-3'}>
              <AppText weight="bold" className={reserve.missing > 0 ? 'text-sm text-sale' : 'text-sm text-leaf-900'}>
                Đơn COD: ký quỹ {money(cod)} · ví khả dụng {money(Math.max(0, Number(available ?? 0)))}
              </AppText>
              <AppText className={reserve.missing > 0 ? 'text-sm leading-relaxed text-sale' : 'text-sm leading-relaxed text-leaf-900'}>
                {reserve.missing > 0
                  ? `Ví còn thiếu ${money(reserve.missing)}. Nạp thêm để nhận đơn này.`
                  : 'Tiền được giữ chỗ trong ví khi nhận đơn. Giao xong, tiền mặt bạn thu chính là tiền ký quỹ; giao thất bại thì trả lại ví.'}
              </AppText>
            </View>
          )}
        </View>
      </BottomSheet>

      <TopupSheet
        visible={topupOpen}
        missing={reserve.missing}
        onClose={() => setTopupOpen(false)}
        onPaid={() => void wallet.refetch()}
      />

      {/* Modal xem trước ảnh lớn */}
      <Modal visible={Boolean(previewImage)} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View className="flex-1 items-center justify-center bg-black/90 p-4">
          <Pressable
            onPress={() => setPreviewImage(null)}
            accessibilityRole="button"
            accessibilityLabel="Đóng xem ảnh"
            className="absolute right-4 top-12 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/40"
          >
            <X size={22} color="#ffffff" />
          </Pressable>
          {Boolean(previewImage) && (
            <Image
              source={{ uri: previewImage! }}
              style={{ width: '100%', height: '80%' }}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  )
}
