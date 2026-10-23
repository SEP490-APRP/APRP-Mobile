import type { LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { OrderStatusBadge, orderIdOf } from '@/features/order'
import { money, ProduceImage } from '@/features/product'
import { colors } from '@/theme/colors'
import type { OrderResponse } from '@/types/order.types'
import { cn } from '@/utils/helpers'
import type { ListingTone } from '../utils/shopStats'

/** Ô số liệu trên trang Tổng quan. */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'leaf',
}: {
  icon: LucideIcon
  label: string
  value: string
  hint: string
  tone?: 'leaf' | 'amber'
}) {
  return (
    <View className="min-w-0 flex-1 gap-2 rounded-2xl border border-line bg-white p-4">
      <View
        className={cn(
          'h-9 w-9 items-center justify-center rounded-xl',
          tone === 'amber' ? 'bg-amber-50' : 'bg-leaf-50',
        )}
      >
        <Icon size={18} color={tone === 'amber' ? '#b45309' : colors.leaf700} />
      </View>
      <AppText weight="semibold" className="text-xs uppercase tracking-wide text-ink-muted">
        {label}
      </AppText>
      <AppText weight="extrabold" numberOfLines={1} className="text-2xl">
        {value}
      </AppText>
      <AppText numberOfLines={2} className="text-xs text-ink-muted">
        {hint}
      </AppText>
    </View>
  )
}

const CHIP: Record<ListingTone, { box: string; text: string }> = {
  leaf: { box: 'bg-leaf-50 border-leaf-200', text: 'text-leaf-700' },
  amber: { box: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  rose: { box: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
  gray: { box: 'bg-gray-100 border-gray-200', text: 'text-gray-600' },
}

export function ListingStatusChip({ label, tone }: { label: string; tone: ListingTone }) {
  return (
    <View className={cn('self-start rounded-full border px-2 py-0.5', CHIP[tone].box)}>
      <AppText weight="bold" className={cn('text-xs', CHIP[tone].text)}>
        {label}
      </AppText>
    </View>
  )
}

/** Dòng tin đăng gọn: ảnh, tên, giá, tồn kho, trạng thái. */
export function ListingRow({
  name,
  image,
  priceText,
  stockText,
  status,
}: {
  name: string
  image?: string
  priceText: string
  stockText: string
  status: { label: string; tone: ListingTone }
}) {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="h-14 w-14 overflow-hidden rounded-xl border border-line">
        <ProduceImage src={image ?? ''} alt={name} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <AppText weight="bold" numberOfLines={1} className="text-sm">
          {name}
        </AppText>
        <AppText className="text-xs text-ink-muted">
          <AppText weight="bold" className="text-xs text-leaf-700">
            {priceText}
          </AppText>{' '}
          · {stockText}
        </AppText>
      </View>
      <ListingStatusChip {...status} />
    </View>
  )
}

/** Dòng đơn gọn trên trang Tổng quan. */
export function ShopOrderRow({ order }: { order: OrderResponse }) {
  const items = order.items ?? []
  const first = items[0]
  const label = first ? first.productName || first.itemName || first.mysteryBoxType || 'Nông sản' : 'Đơn hàng'
  return (
    <View className="gap-1.5 py-3">
      <View className="flex-row items-center gap-2">
        <AppText weight="bold" className="text-sm">
          #{orderIdOf(order)}
        </AppText>
        <AppText numberOfLines={1} className="flex-1 text-sm text-ink-muted">
          {order.recipientName || order.buyerName || 'Khách mua'}
        </AppText>
        <OrderStatusBadge status={order.status} />
      </View>
      <View className="flex-row items-center justify-between gap-2">
        <AppText numberOfLines={1} className="flex-1 text-xs text-ink-muted">
          {label}
          {items.length > 1 ? ` và ${items.length - 1} món khác` : ''}
        </AppText>
        <AppText weight="extrabold" className="text-sm text-leaf-700">
          {money(Number(order.totalAmount || 0))}
        </AppText>
      </View>
    </View>
  )
}
