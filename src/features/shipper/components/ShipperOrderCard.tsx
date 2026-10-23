import { Banknote, Clock, CreditCard, Navigation, Package, Store } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { orderIdOf } from '@/features/order/utils/orderStatus'
import { money } from '@/features/product'
import type { OrderResponse } from '@/types/order.types'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { codToCollect, formatKm, itemsSummary, minutesAgo, orderLegs, type LatLng } from '../utils/shipperOrders'

/** Một chặng trên lộ trình: chấm màu, nhãn nhỏ, tên và địa chỉ. */
function Stop({
  tone,
  label,
  name,
  address,
  badge,
}: {
  tone: 'shop' | 'buyer'
  label: string
  name?: string
  address?: string
  badge?: string
}) {
  return (
    <View className="flex-row gap-3">
      <View
        className={cn(
          'mt-1 h-5 w-5 items-center justify-center rounded-full',
          tone === 'shop' ? 'bg-amber-100' : 'bg-leaf-100',
        )}
      >
        <View className={cn('h-2 w-2 rounded-full', tone === 'shop' ? 'bg-amber-600' : 'bg-leaf-700')} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-2">
          <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
            {label}
          </AppText>
          {!!badge && (
            <AppText weight="bold" className={cn('text-xs', tone === 'shop' ? 'text-amber-800' : 'text-leaf-700')}>
              {badge}
            </AppText>
          )}
        </View>
        <AppText weight="bold" numberOfLines={1} className="text-base">
          {name || '—'}
        </AppText>
        {!!address && (
          <AppText numberOfLines={2} className="text-sm leading-snug text-ink-muted">
            {address}
          </AppText>
        )}
      </View>
    </View>
  )
}

/** Thẻ đơn cho tài xế: phí ship nhận được, lộ trình 2 chặng, tiền COD cần thu. Nút hành động truyền qua `footer`. */
export function ShipperOrderCard({
  order,
  me,
  footer,
  highlight,
}: {
  order: OrderResponse
  me?: LatLng | null
  footer?: ReactNode
  highlight?: boolean
}) {
  const legs = orderLegs(order, me)
  const cod = codToCollect(order)
  return (
    <View
      className={cn('overflow-hidden rounded-panel border bg-white', highlight ? 'border-leaf-500' : 'border-line')}
    >
      <View className="flex-row items-start justify-between gap-3 px-4 pt-4">
        <View className="gap-1">
          <AppText weight="extrabold" className="text-base">
            Đơn #{orderIdOf(order)}
          </AppText>
          <View className="flex-row items-center gap-1">
            <Clock size={13} color={colors.inkSubtle} />
            <AppText className="text-xs text-ink-muted">{minutesAgo(order.createdAt)}</AppText>
          </View>
        </View>
        <View className="items-end">
          <AppText className="text-xs text-ink-muted">Phí ship</AppText>
          <AppText weight="extrabold" className="text-xl text-leaf-700">
            {money(Number(order.shippingFee ?? 0))}
          </AppText>
        </View>
      </View>

      <View className="gap-3 px-4 py-4">
        <Stop
          tone="shop"
          label="Lấy hàng"
          name={order.shopName}
          address={order.shopAddress}
          badge={legs.toShop != null && order.status !== 'PICKED_UP' ? `Cách bạn ${formatKm(legs.toShop)}` : undefined}
        />
        <Stop
          tone="buyer"
          label="Giao đến"
          name={order.recipientName}
          address={order.shippingAddress}
          badge={legs.toBuyer != null ? `Giao ${formatKm(legs.toBuyer)}` : undefined}
        />
      </View>

      <View className="flex-row flex-wrap gap-2 px-4 pb-4">
        <Chip icon={<Package size={13} color={colors.inkMuted} />} text={itemsSummary(order)} />
        {legs.total != null && (
          <Chip icon={<Navigation size={13} color={colors.inkMuted} />} text={`Tổng ~${formatKm(legs.total)}`} />
        )}
        {cod > 0 ? (
          <Chip tone="amber" icon={<Banknote size={13} color="#92400e" />} text={`Thu của khách ${money(cod)}`} />
        ) : (
          <Chip tone="leaf" icon={<CreditCard size={13} color={colors.leaf700} />} text="Khách đã trả trước" />
        )}
        {!order.shopAddress && <Chip icon={<Store size={13} color={colors.inkMuted} />} text="Chưa có địa chỉ vườn" />}
      </View>

      {!!footer && <View className="border-t border-line px-4 py-3">{footer}</View>}
    </View>
  )
}

function Chip({ icon, text, tone }: { icon: ReactNode; text: string; tone?: 'amber' | 'leaf' }) {
  return (
    <View
      className={cn(
        'max-w-full flex-row items-center gap-1.5 rounded-full px-2.5 py-1',
        tone === 'amber' ? 'bg-amber-50' : tone === 'leaf' ? 'bg-leaf-50' : 'bg-paper',
      )}
    >
      {icon}
      <AppText
        weight="semibold"
        numberOfLines={1}
        className={cn(
          'shrink text-xs',
          tone === 'amber' ? 'text-amber-800' : tone === 'leaf' ? 'text-leaf-800' : 'text-ink-muted',
        )}
      >
        {text}
      </AppText>
    </View>
  )
}
