import { Text, type TextProps } from 'react-native'
import { cn } from '@/utils/helpers'
import { fontFamily, type FontWeight } from '@/theme/fonts'

export type AppTextProps = TextProps & {
  weight?: FontWeight
  className?: string
}

const SIZE_CLASS = /(^|\s)text-(xs|sm|base|lg|\d?xl|caption|\[\d)/
const NON_COLOR = /^text-(xs|sm|base|lg|\d?xl|caption|left|center|right|justify|\[\d)/
const hasColorClass = (className: string) =>
  className.split(/\s+/).some((c) => c.startsWith('text-') && !NON_COLOR.test(c))

/**
 * Text mặc định của app: font Be Vietnam Pro, cỡ base, màu ink.
 * Chỉ thêm cỡ/màu mặc định khi className chưa có, vì cn không gộp class trùng nhóm
 * (để cả "text-base" lẫn "text-xs" thì class nào thắng tùy thứ tự trong CSS).
 */
export function AppText({ weight = 'regular', className = '', style, ...props }: AppTextProps) {
  return (
    <Text
      className={cn(
        !SIZE_CLASS.test(className) && 'text-base',
        !hasColorClass(className) && 'text-ink',
        className,
      )}
      style={[{ fontFamily: fontFamily[weight] }, style]}
      {...props}
    />
  )
}
