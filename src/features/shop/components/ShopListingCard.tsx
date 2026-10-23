import { AlertTriangle, CalendarClock, Pencil, Trash2 } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { AppText } from '@/components/ui'
import { money, ProduceImage } from '@/features/product'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { daysUntil, LISTING_KIND_LABEL, type ShopListing } from '../utils/shopListings'
import { ListingStatusChip } from './ShopWidgets'

const KIND_CHIP: Record<ShopListing['kind'], string> = {
  SINGLE: 'bg-leaf-50 text-leaf-800',
  COMBO: 'bg-amber-50 text-amber-800',
  MYSTERY_BOX: 'bg-violet-50 text-violet-800',
}

function expiryText(date?: string): { text: string; urgent: boolean } | undefined {
  const d = daysUntil(date)
  if (d == null) return undefined
  if (d < 0) return { text: 'Đã quá hạn', urgent: true }
  if (d === 0) return { text: 'Hết hạn hôm nay', urgent: true }
  return { text: `Hết hạn sau ${d} ngày`, urgent: d <= 3 }
}

/** Thẻ tin đăng trên tab Sản phẩm: ảnh, loại, giá, tồn kho, hạn dùng, lý do bị từ chối, nút Sửa/Xoá. */
export function ShopListingCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ShopListing
  onEdit: () => void
  onDelete: () => void
}) {
  const expiry = expiryText(item.expiryDate)
  const [chipBg, chipText] = KIND_CHIP[item.kind].split(' ')
  return (
    <View className="rounded-panel border border-line bg-white p-3">
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Sửa ${item.name}`}
        className="flex-row gap-3"
      >
        <View className="h-20 w-20 overflow-hidden rounded-xl border border-line">
          <ProduceImage src={item.image ?? ''} alt={item.name} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-start gap-2">
            <AppText weight="bold" numberOfLines={2} className="flex-1 text-base leading-snug">
              {item.name}
            </AppText>
            <ListingStatusChip {...item.status} />
          </View>
          <View className="flex-row flex-wrap items-center gap-1.5">
            <View className={cn('rounded-md px-1.5 py-0.5', chipBg)}>
              <AppText weight="bold" className={cn('text-xs', chipText)}>
                {LISTING_KIND_LABEL[item.kind]}
              </AppText>
            </View>
            <AppText numberOfLines={1} className="flex-1 text-xs text-ink-muted">
              {item.category} · #{item.id}
            </AppText>
          </View>
          <AppText weight="extrabold" className="text-base text-leaf-700">
            {money(item.price)}
            <Text className="text-xs text-ink-muted">/{item.unit}</Text>
          </AppText>
        </View>
      </Pressable>

      <View className="mt-2.5 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <AppText className={cn('text-xs', item.stock === 0 ? 'text-sale' : 'text-ink-muted')}>
          {item.stock === 0
            ? 'Hết hàng'
            : item.sold != null
              ? `Đã bán ${item.sold}/${item.sold + item.stock}`
              : `Còn ${item.stock} ${item.unit}`}
        </AppText>
        {expiry && (
          <View className="flex-row items-center gap-1">
            <CalendarClock size={13} color={expiry.urgent ? '#b45309' : colors.inkSubtle} />
            <AppText className={cn('text-xs', expiry.urgent ? 'text-amber-800' : 'text-ink-muted')}>
              {expiry.text}
            </AppText>
          </View>
        )}
      </View>

      {!!item.rejectReason && (
        <View className="mt-2.5 flex-row gap-2 rounded-xl bg-rose-50 p-2.5">
          <AlertTriangle size={15} color={colors.sale} />
          <AppText className="flex-1 text-sm text-rose-800">Lý do từ chối: {item.rejectReason}</AppText>
        </View>
      )}

      <View className="mt-3 flex-row gap-2 border-t border-line pt-3">
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Sửa ${item.name}`}
          className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-leaf-50 active:bg-leaf-100"
        >
          <Pencil size={15} color={colors.leaf700} />
          <AppText weight="bold" className="text-sm text-leaf-700">
            {item.kind === 'SINGLE' ? 'Sửa & ảnh' : 'Sửa'}
          </AppText>
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Xoá ${item.name}`}
          className="h-10 w-12 items-center justify-center rounded-xl border border-line active:bg-rose-50"
        >
          <Trash2 size={16} color={colors.sale} />
        </Pressable>
      </View>
    </View>
  )
}
