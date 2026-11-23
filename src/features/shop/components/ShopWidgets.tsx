import type { LucideIcon } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { OrderStatusBadge, orderIdOf } from '@/features/order'
import { money, ProduceImage } from '@/features/product'
import { colors } from '@/theme/colors'
import type { OrderResponse } from '@/types/order.types'
import { cn } from '@/utils/helpers'
import type { ListingTone } from '../utils/shopStats'

/** Ô số liệu trên trang Tổng quan: thiết kế chuẩn, chống sập layout Flexbox. */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'leaf',
  onPress,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint: string
  tone?: 'leaf' | 'amber'
  onPress?: () => void
}) {
  const isAlert = tone === 'amber'
  const tileContent = (
    <View
      className={cn(
        'w-full gap-2.5 rounded-2xl border bg-white p-3.5 shadow-2xs',
        isAlert ? 'border-amber-200' : 'border-line',
        onPress && 'active:bg-leaf-50/50',
      )}
    >
      <View className="flex-row items-center justify-between">
        <View
          className={cn(
            'h-10 w-10 items-center justify-center rounded-xl',
            isAlert ? 'bg-amber-100' : 'bg-leaf-100',
          )}
        >
          <Icon size={20} color={isAlert ? '#b45309' : colors.leaf700} />
        </View>
        <AppText weight="extrabold" className={cn('text-2xl', isAlert ? 'text-amber-800' : 'text-ink')}>
          {value}
        </AppText>
      </View>
      <View>
        <AppText weight="bold" className="text-xs text-ink">
          {label}
        </AppText>
        <AppText numberOfLines={1} className="mt-0.5 text-[11px] text-ink-muted">
          {hint}
        </AppText>
      </View>
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="flex-1">
        {tileContent}
      </Pressable>
    )
  }

  return <View className="flex-1">{tileContent}</View>
}

const CHIP: Record<ListingTone, { box: string; text: string }> = {
  leaf: { box: 'bg-leaf-50 border-leaf-200', text: 'text-leaf-700' },
  amber: { box: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  rose: { box: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
  gray: { box: 'bg-gray-100 border-gray-200', text: 'text-gray-600' },
}

export function ListingStatusChip({ label, tone }: { label: string; tone: ListingTone }) {
  return (
    <View className={cn('items-center justify-center rounded-full border px-2.5 py-1', CHIP[tone].box)}>
      <AppText weight="bold" className={cn('text-[11px]', CHIP[tone].text)}>
        {label}
      </AppText>
    </View>
  )
}

/** Dòng tin đăng gọn: ảnh, tên, giá, tồn kho, trạng thái căn chuẩn trục giữa. */
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
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-14 w-14 overflow-hidden rounded-xl border border-line bg-paper">
        <ProduceImage src={image ?? ''} alt={name} />
      </View>
      <View className="min-w-0 flex-1 justify-center gap-1">
        <AppText weight="bold" numberOfLines={1} className="text-sm text-ink">
          {name}
        </AppText>
        <AppText className="text-xs text-ink-muted">
          <AppText weight="bold" className="text-xs text-leaf-700">
            {priceText}
          </AppText>{' '}
          · {stockText}
        </AppText>
      </View>
      <View className="items-end justify-center">
        <ListingStatusChip {...status} />
      </View>
    </View>
  )
}

/** Dòng đơn gọn trên trang Tổng quan: căn chỉnh nhãn mã đơn, tên khách và tổng tiền. */
export function ShopOrderRow({ order }: { order: OrderResponse }) {
  const items = order.items ?? []
  const first = items[0]
  const rawBuyer = order.recipientName || order.buyerName || 'Khách mua'
  const buyerName = rawBuyer.replace(/\s*\(Khách mua\)/gi, '').trim() || 'Khách mua'
  const label = first ? first.productName || first.itemName || first.mysteryBoxType || 'Nông sản' : 'Đơn hàng'

  return (
    <View className="gap-2 py-3.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1 min-w-0 pr-2">
          <View className="rounded-md bg-paper px-1.5 py-0.5 border border-line">
            <AppText weight="extrabold" className="text-xs text-ink">
              #{orderIdOf(order)}
            </AppText>
          </View>
          <AppText weight="bold" numberOfLines={1} className="text-sm text-ink flex-1">
            {buyerName}
          </AppText>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>
      <View className="flex-row items-center justify-between gap-2">
        <AppText numberOfLines={1} className="flex-1 text-xs text-ink-muted">
          {label}
          {items.length > 1 ? ` · +${items.length - 1} món khác` : ''}
        </AppText>
        <AppText weight="extrabold" className="text-sm text-leaf-800">
          {money(Number(order.totalAmount || 0))}
        </AppText>
      </View>
    </View>
  )
}
