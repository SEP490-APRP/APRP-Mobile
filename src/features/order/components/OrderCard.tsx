import { Image } from 'expo-image'
import { ChevronRight, CreditCard, Navigation, ShoppingBasket, Store, XCircle } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import { money } from '@/features/product'
import { canTrackOrder } from '@/features/tracking'
import { colors } from '@/theme/colors'
import type { OrderResponse } from '@/types/order.types'
import { cn } from '@/utils/helpers'
import { canCancelOrder, isUnpaidOrder, orderIdOf, paymentMethodLabel } from '../utils/orderStatus'
import { OrderStatusBadge } from './OrderStatusBadge'

const MAX_ITEMS = 2

/** Thẻ đơn trong danh sách: shop, trạng thái, tối đa 2 món, tổng tiền và nút theo trạng thái. */
export function OrderCard({
  order,
  paying,
  onOpen,
  onPay,
  onCancel,
  onTrack,
}: {
  order: OrderResponse
  paying: boolean
  onOpen: () => void
  onPay: () => void
  onCancel: () => void
  /** Mở bản đồ theo dõi shipper (chỉ hiện khi đơn đang giao) */
  onTrack?: () => void
}) {
  const id = orderIdOf(order)
  const unpaid = isUnpaidOrder(order)
  const items = order.items ?? []
  const more = items.length - MAX_ITEMS
  const trackable = !!onTrack && canTrackOrder(order.status, 'BUYER')

  return (
    <View className={cn('overflow-hidden rounded-panel border bg-white', unpaid ? 'border-amber-300' : 'border-line')}>
      {/* Phần thân bấm được để mở chi tiết; nút hành động nằm ngoài để không lồng nút trong nút. */}
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Đơn #${id}, ${order.shopName ?? 'nhà vườn'}`}
        className="active:opacity-80"
      >
        <View className="flex-row items-center gap-2 border-b border-line bg-paper px-4 py-3">
          <Store size={16} color={colors.leaf700} />
          <View className="min-w-0 flex-1">
            <AppText weight="bold" numberOfLines={1} className="text-sm">
              {order.shopName || 'Nhà vườn'}
            </AppText>
            <AppText className="text-xs text-ink-muted">
              #{id}
              {order.createdAt ? ` · ${new Date(order.createdAt).toLocaleDateString('vi-VN')}` : ''}
            </AppText>
          </View>
          <OrderStatusBadge status={order.status} />
        </View>

        <View className="px-4 py-2">
          {items.length === 0 ? (
            <AppText className="py-2 text-xs italic text-ink-muted">Chi tiết sản phẩm đang được cập nhật</AppText>
          ) : (
            items.slice(0, MAX_ITEMS).map((it, i) => (
              <View key={i} className="flex-row items-center gap-3 py-2">
                <View className="h-12 w-12 overflow-hidden rounded-xl border border-line bg-paper">
                  {it.imageUrl ? (
                    <Image source={{ uri: it.imageUrl }} style={{ width: 48, height: 48 }} contentFit="cover" />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <ShoppingBasket size={18} color={colors.inkSubtle} />
                    </View>
                  )}
                </View>
                <View className="min-w-0 flex-1">
                  <AppText weight="semibold" numberOfLines={1} className="text-sm">
                    {it.productName || it.itemName || it.mysteryBoxType || 'Nông sản'}
                  </AppText>
                  <AppText className="text-xs text-ink-muted">x{it.quantity}</AppText>
                </View>
                <AppText weight="semibold" className="text-sm">
                  {money(Number(it.unitPrice || 0))}
                </AppText>
              </View>
            ))
          )}
          {more > 0 && <AppText className="pb-1 text-xs text-ink-muted">và {more} món khác</AppText>}
        </View>
      </Pressable>

      <View className="gap-3 border-t border-line px-4 py-3">
        <View className="flex-row items-center justify-between">
          <AppText className="text-xs text-ink-muted">{paymentMethodLabel(order.paymentMethod)}</AppText>
          <View className="flex-row items-baseline gap-1">
            <AppText className="text-xs text-ink-muted">Tổng</AppText>
            <AppText weight="extrabold" className="text-base text-leaf-700">
              {money(Number(order.totalAmount || 0))}
            </AppText>
          </View>
        </View>
        {(unpaid || canCancelOrder(order)) && (
          <View className="flex-row gap-2">
            {canCancelOrder(order) && (
              <Button
                title="Huỷ đơn"
                icon={XCircle}
                variant="outline"
                onPress={onCancel}
                className="min-h-[44px] flex-1"
              />
            )}
            {unpaid && (
              <Button
                title="Thanh toán ngay"
                icon={CreditCard}
                loading={paying}
                onPress={onPay}
                className="min-h-[44px] flex-[1.4]"
              />
            )}
          </View>
        )}
        {!unpaid && !canCancelOrder(order) && (
          <View className="flex-row items-center justify-end gap-3">
            <Pressable onPress={onOpen} accessibilityRole="link" hitSlop={8} className="flex-row items-center gap-1">
              <AppText weight="semibold" className="text-sm text-leaf-700">
                Xem chi tiết
              </AppText>
              <ChevronRight size={16} color={colors.leaf700} />
            </Pressable>
            {trackable && (
              <Button title="Theo dõi shipper" icon={Navigation} onPress={onTrack} className="min-h-[40px] px-4" />
            )}
          </View>
        )}
      </View>
    </View>
  )
}
