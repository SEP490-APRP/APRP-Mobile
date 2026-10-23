import { Image } from 'expo-image'
import { Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react-native'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { AppText, Checkbox } from '@/components/ui'
import { money } from '@/features/product'
import { colors } from '@/theme/colors'
import type { CartItemResponse } from '@/types/cart.types'
import { cn } from '@/utils/helpers'
import { cartItemName, isItemAvailable } from '../utils/cartSelection'

function StepButton({ kind, disabled, onPress, label }: { kind: 'dec' | 'inc'; disabled: boolean; onPress: () => void; label: string }) {
  const Icon = kind === 'dec' ? Minus : Plus
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      className={cn('h-9 w-9 items-center justify-center active:bg-line', disabled && 'opacity-30')}
    >
      <Icon size={15} color={colors.ink} />
    </Pressable>
  )
}

/** Một món trong giỏ: chọn, ảnh, giá, − số lượng +, thành tiền và nút xoá. */
export function CartItemRow({
  item,
  selected,
  busy,
  onToggle,
  onChangeQuantity,
  onRemove,
}: {
  item: CartItemResponse
  selected: boolean
  busy: boolean
  onToggle: () => void
  onChangeQuantity: (delta: number) => void
  onRemove: () => void
}) {
  const name = cartItemName(item)
  const available = isItemAvailable(item)
  const max = item.stockQuantity ?? item.stockAvailable
  const atMax = max != null && item.quantity >= max

  return (
    <View className={cn('flex-row items-start gap-1 py-3', busy && 'opacity-60')}>
      <Checkbox checked={selected} disabled={!available} onChange={onToggle} label={`Chọn ${name}`} />
      <View className="h-[72px] w-[72px] overflow-hidden rounded-xl border border-line bg-paper">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: 72, height: 72 }} contentFit="cover" accessibilityIgnoresInvertColors />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ShoppingBasket size={24} color={colors.inkSubtle} />
          </View>
        )}
      </View>
      <View className="min-w-0 flex-1 gap-1 pl-2">
        <AppText weight="bold" numberOfLines={2} className="text-sm leading-snug">
          {name}
        </AppText>
        <AppText className="text-xs text-ink-muted">{money(item.unitPrice)}</AppText>
        {!available && (
          <AppText weight="semibold" className="text-xs text-sale">
            Tạm hết hàng
          </AppText>
        )}
        {!!item.errorNote && <AppText className="text-xs text-sale">{item.errorNote}</AppText>}
        <View className="mt-1 flex-row items-center justify-between">
          <View
            accessibilityRole="adjustable"
            accessibilityLabel={`Số lượng ${name}`}
            accessibilityValue={{ now: item.quantity, text: String(item.quantity) }}
            className="h-9 flex-row items-center overflow-hidden rounded-lg border border-line bg-paper"
          >
            <StepButton kind="dec" disabled={busy} onPress={() => onChangeQuantity(-1)} label="Giảm số lượng" />
            <View className="w-9 items-center">
              {busy ? (
                <ActivityIndicator size="small" color={colors.leaf700} />
              ) : (
                <AppText weight="extrabold" className="text-sm">
                  {item.quantity}
                </AppText>
              )}
            </View>
            <StepButton kind="inc" disabled={busy || atMax} onPress={() => onChangeQuantity(1)} label="Tăng số lượng" />
          </View>
          <AppText weight="extrabold" className="text-sm text-leaf-700">
            {money(item.unitPrice * item.quantity)}
          </AppText>
        </View>
      </View>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Xoá ${name}`}
        hitSlop={6}
        className="h-11 w-10 items-center justify-center rounded-lg active:bg-sale-soft"
      >
        <Trash2 size={17} color={colors.inkSubtle} />
      </Pressable>
    </View>
  )
}
