import { Check } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

/** Ô chọn vuông, vùng chạm 44px như các nút khác của app. */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  /** Nhãn cho trình đọc màn hình */
  label: string
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onChange}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      hitSlop={6}
      className={cn('h-11 w-11 items-center justify-center', disabled && 'opacity-40')}
    >
      <View
        className={cn(
          'h-[22px] w-[22px] items-center justify-center rounded-md border-2',
          checked ? 'border-leaf-700 bg-leaf-700' : 'border-line-strong bg-white',
        )}
      >
        {checked && <Check size={14} strokeWidth={3} color={colors.white} />}
      </View>
    </Pressable>
  )
}
