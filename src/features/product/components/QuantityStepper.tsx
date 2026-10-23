import { Minus, Plus } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

/** Nút − số lượng + ; tự chặn trong khoảng [min, max]. */
export function QuantityStepper({
  value,
  min,
  max,
  unit,
  disabled = false,
  onChange,
}: {
  value: number
  min: number
  max: number
  unit: string
  disabled?: boolean
  onChange: (next: number) => void
}) {
  const canDec = !disabled && value > min
  const canInc = !disabled && value < max
  const button = (dir: 'dec' | 'inc') => {
    const enabled = dir === 'dec' ? canDec : canInc
    const Icon = dir === 'dec' ? Minus : Plus
    return (
      <Pressable
        onPress={() => onChange(dir === 'dec' ? value - 1 : value + 1)}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={dir === 'dec' ? 'Giảm số lượng' : 'Tăng số lượng'}
        className={cn('h-full w-11 items-center justify-center active:bg-line', !enabled && 'opacity-40')}
      >
        <Icon size={16} color={colors.ink} />
      </Pressable>
    )
  }
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value, text: `${value} ${unit}` }}
      className="h-[52px] flex-row items-center overflow-hidden rounded-xl border border-line bg-paper"
    >
      {button('dec')}
      <AppText weight="extrabold" className="w-14 text-center text-base">
        {disabled ? 0 : value} {unit}
      </AppText>
      {button('inc')}
    </View>
  )
}
