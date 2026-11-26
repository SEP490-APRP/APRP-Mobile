import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  ArrowLeft,
  CheckCircle2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Package,
  Phone,
  RotateCcw,
  ShieldAlert,
  Store,
} from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ErrorState, Skeleton } from '@/components/ui'
import { OrderStatusBadge } from '@/features/order'
import { money } from '@/features/product'
import {
  ShipperReturnActions,
  shipperErrorMessage,
  useShipperAcceptReturn,
  useShipperReturnDetail,
} from '@/features/shipper'
import { useAuthStore, useUiStore } from '@/stores'
import { colors } from '@/theme/colors'

function formatDateTime(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString('vi-VN')}`
}

function callPhone(phone?: string) {
  if (phone) void Linking.openURL(`tel:${phone.replace(/\s/g, '')}`)
}

function openMaps(address?: string) {
  if (!address) return
  void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=two-wheeler`)
}

/** Chi tiết 1 đơn hoàn trả dành cho Shipper: nhận đơn hoàn, theo dõi bản đồ, lộ trình 2 chặng và bằng chứng. */
export default function ShipperReturnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const returnId = Number(id)
  const user = useAuthStore((s) => s.user)
  const showToast = useUiStore((s) => s.showToast)
  const detail = useShipperReturnDetail(returnId)
  const acceptReturn = useShipperAcceptReturn()
  const [refreshing, setRefreshing] = useState(false)

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shipper/delivering' as any))

  const refresh = async () => {
    setRefreshing(true)
    await detail.refetch()
    setRefreshing(false)
  }

  const r = detail.data
  if (detail.isPending || detail.isError || !r) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center px-3 pb-2">
          <Pressable
            onPress={goBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-black/5"
          >
            <ArrowLeft size={20} color={colors.ink} />
          </Pressable>
        </View>
        {detail.isPending ? (
          <View className="gap-4 p-4">
            <Skeleton className="h-24 rounded-panel" />
            <Skeleton className="h-44 rounded-panel" />
            <Skeleton className="h-44 rounded-panel" />
          </View>
        ) : (
          <ErrorState title="Không mở được đơn hoàn trả" onRetry={() => void detail.refetch()} />
        )}
      </SafeAreaView>
    )
  }

  const isAssignedToMe = Boolean(r.shipperId && user?.id && Number(r.shipperId) === Number(user.id))
  const isAvailableToAccept = r.status === 'RETURN_SHIPPING' && !r.shipperId
  const isActiveMine = isAssignedToMe && (r.status === 'RETURN_SHIPPING' || r.status === 'RETURN_PICKED_UP')
  const isPickedUp = r.status === 'RETURN_PICKED_UP'

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2.5 pt-1">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="h-10 w-10 items-center justify-center rounded-full active:bg-black/5"
        >
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <AppText accessibilityRole="header" weight="extrabold" className="text-base">
            Đơn hoàn trả #{r.id}
          </AppText>
          <AppText className="text-xs text-ink-muted">
            Đơn gốc #{r.orderId} · {formatDateTime(r.createdAt)}
          </AppText>
        </View>
        <OrderStatusBadge status={r.status} />
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
        }
      >
        {isActiveMine && (
          <View className="flex-row items-center gap-2 rounded-panel border border-amber-200 bg-amber-50 p-3.5">
            <RotateCcw size={18} color="#92400e" />
            <AppText weight="semibold" className="flex-1 text-xs leading-relaxed text-amber-900">
              {isPickedUp
                ? 'Đã lấy hàng hoàn từ khách. Hãy mang về bàn giao cho nhà vườn!'
                : 'Hãy liên hệ người mua để lấy hàng hoàn trả và chụp ảnh xác nhận.'}
            </AppText>
          </View>
        )}

        {r.status === 'COMPLETED' && (
          <View className="flex-row items-center gap-2 rounded-panel border border-leaf-200 bg-leaf-50 p-3.5">
            <CheckCircle2 size={18} color={colors.leaf700} />
            <AppText weight="semibold" className="flex-1 text-xs text-leaf-900">
              Đơn hoàn trả đã giao về Shop thành công.
            </AppText>
          </View>
        )}

        {(r.status === 'RETURN_FAILED' || r.status === 'DISPUTED') && (
          <View className="flex-row items-center gap-2 rounded-panel border border-rose-200 bg-rose-50 p-3.5">
            <ShieldAlert size={18} color={colors.sale} />
            <AppText weight="semibold" className="flex-1 text-xs text-rose-900">
              {r.adminRemark || 'Đơn hoàn trả gặp sự cố giao nhận.'}
            </AppText>
          </View>
        )}

        {/* Sản phẩm & Cước */}
        <View className="gap-3 rounded-panel border border-line bg-white p-4">
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
              Sản phẩm hoàn trả
            </AppText>
            <AppText weight="extrabold" className="text-base text-leaf-700">
              Cước: {money(Number(r.returnShippingFee ?? 0))}
            </AppText>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-line bg-paper">
              {r.productImage ? (
                <Image source={{ uri: r.productImage }} style={{ width: 56, height: 56 }} contentFit="cover" />
              ) : (
                <Package size={20} color={colors.leaf700} />
              )}
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="bold" numberOfLines={2} className="text-sm text-ink">
                {r.productName}
              </AppText>
              <AppText className="mt-0.5 text-xs text-ink-muted">
                Số lượng: x{r.quantity ?? 1} · Tiền hoàn khách: {money(Number(r.refundAmount ?? 0))}
              </AppText>
            </View>
          </View>

          <View className="rounded-xl bg-slate-50 p-3">
            <AppText className="text-xs text-ink-muted">
              <AppText weight="bold" className="text-ink">
                Lý do hoàn:
              </AppText>{' '}
              {r.reason || 'Sản phẩm lỗi/hư hỏng'}
            </AppText>
            {Boolean(r.shopResponse) && (
              <AppText className="mt-1 text-xs text-ink-muted">
                <AppText weight="bold" className="text-ink">
                  Phản hồi Shop:
                </AppText>{' '}
                {r.shopResponse}
              </AppText>
            )}
          </View>
        </View>

        {/* Lộ trình 2 chặng: Khách -> Shop */}
        <View className="rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="mb-3 text-xs uppercase tracking-wide text-ink-muted">
            Lộ trình thu hồi (Khách ➔ Nhà vườn)
          </AppText>

          {/* 1. Lấy từ khách */}
          <View className="flex-row gap-3">
            <View className="mt-1 h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <MapPin size={14} color="#d97706" />
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="bold" className="text-xs uppercase text-amber-800">
                1. Lấy hàng từ người mua
              </AppText>
              <AppText weight="bold" className="mt-0.5 text-sm">
                {r.buyerName || 'Người mua'}
              </AppText>
              <AppText className="mt-0.5 text-xs text-ink-muted">
                {r.buyerAddress || 'Chưa có địa chỉ'}
              </AppText>
              <View className="mt-2.5 flex-row flex-wrap gap-2">
                {Boolean(r.buyerPhone) && (
                  <Button
                    title="Gọi khách"
                    icon={Phone}
                    variant="outline"
                    onPress={() => callPhone(r.buyerPhone)}
                    className="h-9 px-3 py-0"
                  />
                )}
                {Boolean(r.buyerAddress) && (
                  <Button
                    title="Chỉ đường"
                    icon={Navigation}
                    variant="outline"
                    onPress={() => openMaps(r.buyerAddress)}
                    className="h-9 border-leaf-600/30 bg-leaf-50 px-3 py-0"
                  />
                )}
              </View>
            </View>
          </View>

          <View className="my-2.5 ml-3 h-4 w-0.5 bg-line" />

          {/* 2. Trả về Shop */}
          <View className="flex-row gap-3">
            <View className="mt-1 h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-100">
              <Store size={14} color={colors.leaf700} />
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="bold" className="text-xs uppercase text-leaf-700">
                2. Trả về nhà vườn
              </AppText>
              <AppText weight="bold" className="mt-0.5 text-sm">
                {r.shopName || 'Nhà vườn'}
              </AppText>
              <AppText className="mt-0.5 text-xs text-ink-muted">
                {r.shopAddress || 'Chưa có địa chỉ vườn'}
              </AppText>
              <View className="mt-2.5 flex-row flex-wrap gap-2">
                {Boolean(r.shopPhone) && (
                  <Button
                    title="Gọi vườn"
                    icon={Phone}
                    variant="outline"
                    onPress={() => callPhone(r.shopPhone)}
                    className="h-9 px-3 py-0"
                  />
                )}
                {Boolean(r.shopAddress) && (
                  <Button
                    title="Chỉ đường"
                    icon={Navigation}
                    variant="outline"
                    onPress={() => openMaps(r.shopAddress)}
                    className="h-9 border-leaf-600/30 bg-leaf-50 px-3 py-0"
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Ảnh bằng chứng */}
        {r.evidenceUrls && r.evidenceUrls.length > 0 && (
          <View className="gap-2.5 rounded-panel border border-line bg-white p-4">
            <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
              Ảnh bằng chứng ({r.evidenceUrls.length})
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {r.evidenceUrls.map((url, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => void Linking.openURL(url)}
                  className="h-20 w-20 overflow-hidden rounded-xl border border-line bg-paper"
                >
                  <Image source={{ uri: url }} style={{ width: 80, height: 80 }} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Mốc thời gian */}
        <View className="gap-2 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
            Nhật ký hoàn trả
          </AppText>
          <View className="flex-row items-center justify-between">
            <AppText className="text-xs text-ink-muted">Tạo yêu cầu</AppText>
            <AppText className="text-xs text-ink">{formatDateTime(r.createdAt)}</AppText>
          </View>
          {Boolean(r.pickedUpAt) && (
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-ink-muted">Đã lấy từ khách</AppText>
              <AppText className="text-xs text-ink">{formatDateTime(r.pickedUpAt)}</AppText>
            </View>
          )}
          {Boolean(r.returnedAt) && (
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-leaf-800">Đã giao về Shop</AppText>
              <AppText weight="bold" className="text-xs text-leaf-800">
                {formatDateTime(r.returnedAt)}
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Thanh hành động dưới cùng */}
      {(isAvailableToAccept || isActiveMine) && (
        <View className="gap-2 border-t border-line bg-white px-4 pb-3 pt-3">
          {isAvailableToAccept && (
            <Button
              title={`Nhận đơn hoàn #${r.id}`}
              icon={CheckCircle2}
              loading={acceptReturn.isPending}
              onPress={() => {
                acceptReturn.mutate(r.id, {
                  onSuccess: () => {
                    showToast(`Đã nhận đơn hoàn #${r.id}. Hãy liên hệ người mua để lấy hàng!`)
                    router.replace('/shipper/delivering' as any)
                  },
                  onError: (e) => showToast(shipperErrorMessage(e, 'Chưa nhận được đơn hoàn.')),
                })
              }}
              className="min-h-[48px] w-full"
            />
          )}

          {isActiveMine && (
            <>
              <Button
                title="Mở bản đồ dẫn đường"
                icon={MapIcon}
                variant="outline"
                onPress={() => router.push({ pathname: '/shipper/return-tracking/[id]' as any, params: { id: String(r.id) } })}
                className="min-h-[44px] w-full"
              />
              <ShipperReturnActions
                returnItem={r}
                onSuccess={(action) => {
                  void detail.refetch()
                  if (action === 'deliver' || action === 'fail') {
                    router.replace('/shipper/delivering' as any)
                  }
                }}
              />
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}
