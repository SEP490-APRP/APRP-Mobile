import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native'
import { forwardRef, useState } from 'react'
import { Pressable, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import { AppText } from './AppText'

export type TextFieldProps = TextInputProps & {
  label: string
  icon?: LucideIcon
  error?: string
  /** Hiện nút ẩn/hiện cho ô mật khẩu */
  password?: boolean
  className?: string
}

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, icon: Icon, error, password = false, className, editable = true, ...props },
  ref,
) {
  const [hidden, setHidden] = useState(true)
  const [focused, setFocused] = useState(false)

  return (
    <View className={cn('gap-1.5', className)}>
      <AppText weight="semibold" className="text-sm text-ink">
        {label}
      </AppText>
      <View
        className={cn(
          'min-h-[52px] flex-row items-center rounded-card border bg-white px-3.5',
          error ? 'border-sale' : focused ? 'border-leaf-700' : 'border-line-strong',
          !editable && 'bg-paper',
        )}
      >
        {Icon && <Icon size={18} color={error ? colors.sale : colors.inkSubtle} />}
        <TextInput
          {...props}
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.inkSubtle}
          secureTextEntry={password && hidden}
          accessibilityLabel={label}
          className="flex-1 px-2.5 py-3 text-base text-ink"
          style={{ fontFamily: fontFamily.regular }}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
          >
            {hidden ? (
              <Eye size={18} color={colors.inkSubtle} />
            ) : (
              <EyeOff size={18} color={colors.inkSubtle} />
            )}
          </Pressable>
        )}
      </View>
      {error ? <AppText className="text-caption text-sale">{error}</AppText> : null}
    </View>
  )
})
