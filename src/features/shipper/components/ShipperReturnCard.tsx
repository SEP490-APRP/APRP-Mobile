import { ChevronRight, Map as MapIcon, Navigation, Phone } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { money } from '@/features/product'
import type { ReturnRequestResponse } from '@/services/return.types'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

export function ShipperReturnCard({
  returnItem,
  onOpen,
  onTrack,
  footer,
}: {
  returnItem: ReturnRequestResponse
  onOpen?: () => void
  onTrack?: () => void
  footer?: ReactNode
}) {
  const isPickedUp = returnItem.status === 'RETURN_PICKED_UP'
  const targetPhone = isPickedUp ? returnItem.shopPhone : returnItem.buyerPhone
  const targetAddress = isPickedUp ? returnItem.shopAddress : returnItem.buyerAddress

  const openDirections = () => {
    if (!targetAddress) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(targetAddress)}&travelmode=two-wheeler`
    void Linking.openURL(url)
  }

  const callTarget = () => {
    if (targetPhone) void Linking.openURL(`tel:${targetPhone}`)
  }

  return (
    <View className="overflow-hidden rounded-panel border border-leaf-500 bg-white">
      {/* Header */}
      <Pressable
        onPress={onOpen}
        disabled={!onOpen}
        className="flex-row items-start justify-between gap-3 px-4 pt-4 active:opacity-80"
      >
        <View className="gap-1">
          <View className="flex-row items-center gap-1.5">
            <View className="rounded-md bg-amber-100 px-2 py-0.5">
              <AppText weight="bold" className="text-xs text-amber-800">
                ĐƠN HOÀN TRẢ #{returnItem.id}
              </AppText>
            </View>
            {onOpen && <ChevronRight size={15} color={colors.inkMuted} />}
          </View>
          <AppText className="text-xs text-ink-muted">
            Đơn gốc #{returnItem.orderId}
          </AppText>
        </View>
        <View className="items-end">
          <AppText className="text-xs text-ink-muted">Cước nhận</AppText>
          <AppText weight="extrabold" className="text-xl text-leaf-700">
            {money(Number(returnItem.returnShippingFee ?? 0))}
          </AppText>
        </View>
      </Pressable>

      {/* Thông tin món hàng */}
      <View className="mx-4 mt-3 rounded-card bg-slate-50 p-3">
        <View className="flex-row items-center justify-between">
          <AppText weight="bold" numberOfLines={1} className="flex-1 text-sm text-ink">
            {returnItem.productName}
          </AppText>
          {returnItem.quantity && (
            <AppText weight="semibold" className="text-xs text-ink-muted">
              x{returnItem.quantity}
            </AppText>
          )}
        </View>
        <AppText className="mt-0.5 text-xs text-ink-muted">
          Lý do hoàn: {returnItem.reason || 'Sản phẩm lỗi/hư hỏng'}
        </AppText>
      </View>

      {/* Lộ trình thu hồi */}
      <View className="gap-3 px-4 py-4">
        {/* Điểm lấy hàng từ người mua */}
        <View className="flex-row gap-3">
          <View className={cn('mt-1 h-5 w-5 items-center justify-center rounded-full', !isPickedUp ? 'bg-amber-100' : 'bg-slate-100')}>
            <View className={cn('h-2 w-2 rounded-full', !isPickedUp ? 'bg-amber-600' : 'bg-slate-400')} />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <View className="flex-row items-center justify-between gap-2">
              <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
                1. LẤY TỪ NGƯỜI MUA
              </AppText>
              {!isPickedUp && (
                <AppText weight="bold" className="text-xs text-amber-800">
                  Đang cần lấy
                </AppText>
              )}
            </View>
            <AppText weight="bold" numberOfLines={1} className="text-base">
              {returnItem.buyerName || 'Người mua'}
            </AppText>
            {!!returnItem.buyerAddress && (
              <AppText numberOfLines={2} className="text-sm leading-snug text-ink-muted">
                {returnItem.buyerAddress}
              </AppText>
            )}
          </View>
        </View>

        {/* Điểm trả về nhà vườn */}
        <View className="flex-row gap-3">
          <View className={cn('mt-1 h-5 w-5 items-center justify-center rounded-full', isPickedUp ? 'bg-leaf-100' : 'bg-slate-100')}>
            <View className={cn('h-2 w-2 rounded-full', isPickedUp ? 'bg-leaf-700' : 'bg-slate-400')} />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <View className="flex-row items-center justify-between gap-2">
              <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
                2. TRẢ VỀ CHO VƯỜN
              </AppText>
              {isPickedUp && (
                <AppText weight="bold" className="text-xs text-leaf-700">
                  Đang giao về vườn
                </AppText>
              )}
            </View>
            <AppText weight="bold" numberOfLines={1} className="text-base">
              {returnItem.shopName || 'Nhà vườn'}
            </AppText>
            {!!returnItem.shopAddress && (
              <AppText numberOfLines={2} className="text-sm leading-snug text-ink-muted">
                {returnItem.shopAddress}
              </AppText>
            )}
          </View>
        </View>
      </View>

      {/* Nút thao tác nhanh bản đồ, chỉ đường & gọi */}
      <View className="flex-row gap-2 px-4 pb-3">
        {onTrack && (
          <Pressable
            onPress={onTrack}
            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-leaf-200 bg-white active:bg-leaf-50"
          >
            <MapIcon size={15} color={colors.leaf700} />
            <AppText weight="bold" className="text-sm text-leaf-700">
              Bản đồ
            </AppText>
          </Pressable>
        )}

        <Pressable
          onPress={openDirections}
          disabled={!targetAddress}
          className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-leaf-200 bg-white active:bg-leaf-50"
        >
          <Navigation size={15} color={colors.leaf700} />
          <AppText weight="bold" className="text-sm text-leaf-700">
            Chỉ đường
          </AppText>
        </Pressable>

        <Pressable
          onPress={callTarget}
          disabled={!targetPhone}
          className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-leaf-50 active:bg-leaf-100"
        >
          <Phone size={15} color={colors.leaf700} />
          <AppText weight="bold" className="text-sm text-leaf-700">
            {isPickedUp ? 'Gọi vườn' : 'Gọi khách'}
          </AppText>
        </Pressable>
      </View>

      {!!footer && <View className="border-t border-line px-4 py-3">{footer}</View>}
    </View>
  )
}
