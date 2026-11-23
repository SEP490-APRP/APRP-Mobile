import { Image } from 'expo-image'
import { Eye, Leaf, type LucideIcon } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { money } from '@/features/product'
import type { AiItemOption } from '@/services/chatbot.types'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { openChatbotItem } from '../../chatbotLinks'
import { useChatbotStore } from '../../stores/useChatbotStore'
import { itemPrice } from '../../utils/chatbotCards'

type Tone = 'default' | 'leaf' | 'sun' | 'soil' | 'danger'

const toneClass: Record<Tone, string> = {
  default: 'border-line bg-white',
  leaf: 'border-leaf-200 bg-leaf-50',
  sun: 'border-sun-500 bg-sun-100',
  soil: 'border-soil-100 bg-soil-50',
  danger: 'border-sale bg-sale-soft',
}

export function ChatCard({ tone = 'default', children }: { tone?: Tone; children: ReactNode }) {
  return <View className={cn('gap-2.5 rounded-card border p-3', toneClass[tone])}>{children}</View>
}

export function CardTitle({
  icon: Icon,
  title,
  subtitle,
  right,
  danger = false,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  right?: ReactNode
  danger?: boolean
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon size={18} color={danger ? colors.sale : colors.leaf700} />
      <View className="flex-1">
        <AppText weight="bold" className={cn('text-sm', danger && 'text-sale')}>
          {title}
        </AppText>
        {!!subtitle && <AppText className="text-caption text-ink-muted">{subtitle}</AppText>}
      </View>
      {right}
    </View>
  )
}

export function CardText({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <AppText className={cn('text-sm leading-relaxed', muted && 'text-ink-muted')}>{children}</AppText>
}

export function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between gap-3">
      <AppText className="text-caption text-ink-muted">{label}</AppText>
      <AppText weight={strong ? 'bold' : 'medium'} className={cn('flex-1 text-right', strong ? 'text-sm' : 'text-caption')}>
        {value}
      </AppText>
    </View>
  )
}

export function Chip({ label, tone = 'leaf' }: { label: string; tone?: 'leaf' | 'danger' | 'sun' }) {
  const box = { leaf: 'bg-leaf-100', danger: 'bg-sale-soft', sun: 'bg-sun-100' }[tone]
  const text = { leaf: 'text-leaf-800', danger: 'text-sale', sun: 'text-soil-700' }[tone]
  return (
    <View className={cn('rounded-full px-2 py-0.5', box)}>
      <AppText weight="semibold" className={cn('text-caption', text)}>
        {label}
      </AppText>
    </View>
  )
}

type ActionVariant = 'primary' | 'outline' | 'danger'

/** Nút trong thẻ: thấp hơn Button chung vì một thẻ có nhiều nút, vẫn giữ vùng bấm tối thiểu 44. */
export function ChatAction({
  label,
  icon: Icon,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className,
}: {
  label: string
  icon?: LucideIcon
  onPress: () => void
  variant?: ActionVariant
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  const isDisabled = disabled || loading
  const foreground = variant === 'outline' ? colors.leaf700 : colors.white
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={cn(
        'min-h-11 flex-row items-center justify-center gap-1.5 rounded-card px-3 py-2',
        variant === 'primary' && 'bg-leaf-700 active:bg-leaf-800',
        variant === 'outline' && 'border border-leaf-700 bg-white active:bg-leaf-50',
        variant === 'danger' && 'bg-sale active:opacity-90',
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {loading ? <ActivityIndicator size="small" color={foreground} /> : Icon && <Icon size={15} color={foreground} />}
      <AppText weight="semibold" className={cn('shrink text-center text-sm', variant === 'outline' ? 'text-leaf-700' : 'text-white')}>
        {label}
      </AppText>
    </Pressable>
  )
}

export function ItemImage({ uri, size = 56, dimmed = false }: { uri?: string; size?: number; dimmed?: boolean }) {
  const style = { width: size, height: size, borderRadius: 10, opacity: dimmed ? 0.5 : 1 }
  if (uri) return <Image source={{ uri }} contentFit="cover" style={style} />
  return (
    <View style={style} className="items-center justify-center bg-leaf-100">
      <Leaf size={size / 2.5} color={colors.leaf600} />
    </View>
  )
}

export function ItemPrice({ item }: { item: AiItemOption }) {
  const { current, original } = itemPrice(item)
  return (
    <View className="flex-row flex-wrap items-baseline gap-x-1.5">
      <AppText weight="bold" className="text-sm text-sale">
        {money(current)}
        {item.unit ? `/${item.unit}` : ''}
      </AppText>
      {!!original && <AppText className="text-caption text-ink-subtle line-through">{money(original)}</AppText>}
    </View>
  )
}

/** Dòng sản phẩm dùng chung: bấm vào mở chi tiết, nút bên phải thêm vào giỏ qua chatbot. */
export function ChatItemRow({
  item,
  quantity,
  addLabel = 'Chọn',
  hint,
}: {
  item: AiItemOption
  quantity?: number
  addLabel?: string
  hint?: ReactNode
}) {
  const selectOption = useChatbotStore((s) => s.selectOption)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const outOfStock = !!item.isOutOfStock
  return (
    <View className="flex-row items-center gap-2.5 rounded-card border border-line bg-white p-2">
      <Pressable
        onPress={() => openChatbotItem(item)}
        accessibilityRole="button"
        accessibilityLabel={`Xem chi tiết ${item.name}`}
        className="flex-1 flex-row items-center gap-2.5 active:opacity-70"
      >
        <ItemImage uri={item.imageUrl} dimmed={outOfStock} />
        <View className="flex-1 gap-0.5">
          <AppText weight="semibold" numberOfLines={2} className={cn('text-sm', outOfStock && 'text-ink-subtle line-through')}>
            {item.name}
          </AppText>
          <ItemPrice item={item} />
          {hint}
          <View className="flex-row items-center gap-1">
            <Eye size={12} color={colors.inkSubtle} />
            <AppText className="text-caption text-ink-subtle">Xem chi tiết</AppText>
          </View>
        </View>
      </Pressable>
      <ChatAction
        label={outOfStock ? 'Hết hàng' : addLabel}
        disabled={outOfStock || isLoading}
        onPress={() => void selectOption(item, quantity ?? item.orderQuantity ?? 1)}
      />
    </View>
  )
}
