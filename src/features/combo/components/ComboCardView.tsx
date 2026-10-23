import { router } from 'expo-router'
import { Gift, Package, ShoppingBasket } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText, Button, Skeleton } from '@/components/ui'
import { money } from '@/features/product'
import { colors } from '@/theme/colors'
import { discountLabel, soldPercent, type ComboCard } from '../utils/comboCards'
import { ComboImage } from './ComboImage'

export const openComboDetail = (c: Pick<ComboCard, 'kind' | 'id'>) =>
  router.push({ pathname: '/buyer/combo/[id]', params: { id: String(c.id), kind: c.kind } })

/** Thẻ combo / túi mù trong danh sách. Nút thêm giỏ nằm ngoài vùng bấm mở chi tiết. */
export function ComboCardView({ card: c, adding, onAdd }: { card: ComboCard; adding: boolean; onAdd: () => void }) {
  const discount = discountLabel(c)
  const mystery = c.kind === 'MYSTERY_BOX'
  const soldOut = c.stock <= 0

  return (
    <View className="overflow-hidden rounded-panel border border-line bg-white">
      <Pressable onPress={() => openComboDetail(c)} accessibilityRole="link" accessibilityLabel={`Xem ${c.name}`}>
        <View className="aspect-[16/10] bg-leaf-50">
          <ComboImage uri={c.imageUrl} kind={c.kind} alt={c.name} />
          {!!discount && (
            <View className="absolute left-3 top-3 rounded-lg bg-sale px-2.5 py-1">
              <AppText weight="extrabold" className="text-xs text-white">
                {discount}
              </AppText>
            </View>
          )}
          <View className="absolute right-3 top-3 rounded-lg bg-black/60 px-2.5 py-1">
            <AppText weight="bold" className="text-xs text-sun-300">
              {c.tag}
            </AppText>
          </View>
          <View className="absolute bottom-3 left-3 flex-row items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1">
            {mystery ? <Gift size={12} color="#7c3aed" /> : <Package size={12} color={colors.leaf700} />}
            <AppText weight="bold" className={mystery ? 'text-xs text-purple-700' : 'text-xs text-leaf-800'}>
              {mystery ? 'Túi mù' : 'Combo'}
            </AppText>
          </View>
        </View>

        <View className="gap-1.5 px-4 pt-3">
          <View className="flex-row items-center justify-between gap-2">
            <AppText numberOfLines={1} className="flex-1 text-xs text-ink-muted">
              {c.shopName ? `${c.shopName} · ` : ''}
              {c.portion}
            </AppText>
          </View>
          <AppText weight="bold" numberOfLines={2} className="text-base leading-snug">
            {c.name}
          </AppText>
          <AppText numberOfLines={2} className="text-xs leading-relaxed text-ink-muted">
            {c.description}
          </AppText>
          <View className="mt-1 flex-row flex-wrap items-baseline gap-x-2">
            <AppText weight="extrabold" className="text-xl text-leaf-800">
              {money(c.price)}
            </AppText>
            {c.original > c.price && (
              <AppText className="text-xs text-ink-subtle line-through">
                {money(c.original)}/{c.unit}
              </AppText>
            )}
          </View>
          <View className="gap-1">
            <View className="h-2 overflow-hidden rounded-full bg-line">
              <View className="h-full rounded-full bg-leaf-600" style={{ width: `${soldPercent(c)}%` }} />
            </View>
            <View className="flex-row justify-between">
              <AppText className="text-xs text-ink-muted">Đã bán {c.sold}</AppText>
              <AppText weight="semibold" className={soldOut ? 'text-xs text-sale' : 'text-xs text-leaf-700'}>
                {soldOut ? 'Tạm hết' : `Còn ${c.stock} ${c.unit}`}
              </AppText>
            </View>
          </View>
        </View>
      </Pressable>
      <View className="px-4 pb-4 pt-3">
        <Button
          title={soldOut ? 'Tạm hết hàng' : mystery ? 'Thêm túi mù vào giỏ' : 'Thêm combo vào giỏ'}
          icon={ShoppingBasket}
          loading={adding}
          disabled={soldOut}
          onPress={onAdd}
          className="min-h-[44px]"
        />
      </View>
    </View>
  )
}

export function ComboCardSkeleton() {
  return (
    <View className="overflow-hidden rounded-panel border border-line bg-white">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <View className="gap-2 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-2 h-11 w-full rounded-xl" />
      </View>
    </View>
  )
}
