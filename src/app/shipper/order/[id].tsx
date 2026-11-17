import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Banknote,
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
import { AppText, Button, CapNongLoading, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { orderIdOf, OrderStatusBadge, useOrder } from '@/features/order'
import { money } from '@/features/product'
import { isCod, netShipperFee } from '@/features/shipper'
import { colors } from '@/theme/colors'
import type { OrderItem } from '@/types/order.types'
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
  const orderQuery = useOrder(orderId)
  const order = orderQuery.data
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  if (orderQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-paper">
        <CapNongLoading />
      </SafeAreaView>
    )
  }

  if (orderQuery.isError || !order) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center gap-2 px-4 py-3">
          <BackButton onPress={() => router.back()} />
          <AppText weight="extrabold" className="text-base">
            Chi tiết đơn hàng
          </AppText>
        </View>
        <ErrorState onRetry={() => void orderQuery.refetch()} />
      </SafeAreaView>
    )
  }

  const cod = isCod(order) ? Number(order.codAmount ?? order.totalAmount ?? 0) : 0
  const shipFee = Number(order.shippingFee ?? 0)
  const netIncome = netShipperFee(shipFee)
  const isActive = order.status === 'SHIPPING' || order.status === 'PICKED_UP'
  const isFail = order.status === 'FAILED'

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
            <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-amber-100">
              <Store size={14} color="#d97706" />
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center justify-between">
                <AppText weight="bold" className="text-sm">
                  {order.shopName || 'Nhà vườn'}
                </AppText>
                <View className="flex-row items-center gap-1.5">
                  {Boolean(order.shopPhone) && (
                    <Button
                      title="Gọi vườn"
                      icon={Phone}
                      variant="outline"
                      onPress={() => callPhone(order.shopPhone)}
                      className="h-7 px-2.5 py-0"
                    />
                  )}
                  <Button
                    title="Nhắn tin"
                    icon={MessageSquare}
                    variant="outline"
                    onPress={() => router.push('/shipper/messages' as any)}
                    className="h-7 px-2.5 py-0"
                  />
                </View>
              </View>
              <AppText numberOfLines={2} className="mt-0.5 text-xs text-ink-muted">
                {order.shopAddress || 'Chưa có địa chỉ vườn'}
              </AppText>
              {Boolean(order.shopAddress) && (
                <Button
                  title="Chỉ đường đến vườn"
                  icon={Navigation}
                  variant="ghost"
                  onPress={() => openMaps(order.shopAddress)}
                  className="mt-1 h-7 self-start px-0 py-0"
                />
              )}
            </View>
          </View>

          <View className="my-2 ml-3 h-5 w-0.5 bg-line" />

          {/* Điểm giao hàng */}
          <View className="flex-row gap-3">
            <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-leaf-100">
              <MapPin size={14} color={colors.leaf700} />
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center justify-between">
                <AppText weight="bold" className="text-sm">
                  {order.recipientName || 'Người nhận'}
                </AppText>
                <View className="flex-row items-center gap-1.5">
                  {Boolean(order.recipientPhone) && (
                    <Button
                      title="Gọi khách"
                      icon={Phone}
                      variant="outline"
                      onPress={() => callPhone(order.recipientPhone)}
                      className="h-7 px-2.5 py-0"
                    />
                  )}
                  <Button
                    title="Nhắn tin"
                    icon={MessageSquare}
                    variant="outline"
                    onPress={() => router.push('/shipper/messages' as any)}
                    className="h-7 px-2.5 py-0"
                  />
                </View>
              </View>
              <AppText numberOfLines={2} className="mt-0.5 text-xs text-ink-muted">
                {order.shippingAddress}
              </AppText>
              {Boolean(order.shippingAddress) && (
                <Button
                  title="Chỉ đường đến khách"
                  icon={Navigation}
                  variant="ghost"
                  onPress={() => openMaps(order.shippingAddress)}
                  className="mt-1 h-7 self-start px-0 py-0"
                />
              )}
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
                      <Image source={{ uri: item.imageUrl }} className="h-full w-full" contentFit="cover" />
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
                  <Image source={{ uri: url }} className="h-full w-full" contentFit="cover" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Nút hành động nếu đơn đang giao */}
        {isActive && (
          <View className="mt-2 gap-2">
            <Button
              title="Mở bản đồ điều hướng realtime"
              icon={Navigation}
              onPress={() => router.push(`/shipper/tracking/${orderIdOf(order)}` as any)}
              className="min-h-[48px]"
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
              className="h-[80%] w-full"
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  )
}
