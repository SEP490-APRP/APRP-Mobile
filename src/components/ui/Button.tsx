import type { LucideIcon } from 'lucide-react-native'
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { AppText } from './AppText'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string
  variant?: Variant
  loading?: boolean
  icon?: LucideIcon
  className?: string
}

const containerByVariant: Record<Variant, string> = {
  primary: 'bg-leaf-700 active:bg-leaf-800',
  outline: 'border border-leaf-700 bg-white active:bg-leaf-50',
  ghost: 'bg-transparent active:bg-leaf-50',
  danger: 'bg-sale active:opacity-90',
}

const textByVariant: Record<Variant, string> = {
  primary: 'text-white',
  outline: 'text-leaf-700',
  ghost: 'text-leaf-700',
  danger: 'text-white',
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  icon: Icon,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  const iconColor = variant === 'primary' || variant === 'danger' ? colors.white : colors.leaf700
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'min-h-[52px] flex-row items-center justify-center rounded-card px-5',
        containerByVariant[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      <View className="flex-row items-center gap-2">
        {loading ? (
          <ActivityIndicator color={iconColor} />
        ) : (
          Icon && <Icon size={18} color={iconColor} />
        )}
        <AppText weight="bold" className={cn('text-base', textByVariant[variant])}>
          {title}
        </AppText>
      </View>
    </Pressable>
  )
}
