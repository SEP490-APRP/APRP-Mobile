import { Pressable, View } from 'react-native'
import { cn } from '@/utils/helpers'
import { AppText } from './AppText'

export type Choice = { value: string; label: string }

/** Chọn một giá trị trong danh sách ngắn (thay cho thẻ <select> của bản web). */
export function ChoiceChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly Choice[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <View className="gap-1.5">
      <AppText weight="semibold" className="text-sm text-ink">
        {label}
      </AppText>
      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={cn(
                'rounded-full border px-3.5 py-2',
                selected ? 'border-leaf-700 bg-leaf-50' : 'border-line-strong bg-white',
              )}
            >
              <AppText
                weight={selected ? 'semibold' : 'regular'}
                className={cn('text-sm', selected ? 'text-leaf-800' : 'text-ink-muted')}
              >
                {option.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
