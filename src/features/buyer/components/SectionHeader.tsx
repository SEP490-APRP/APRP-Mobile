import { ArrowRight, type LucideIcon } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'

/** Tiêu đề khối nội dung: dòng nhỏ phía trên, tiêu đề lớn và link "Xem tất cả". */
export function SectionHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  actionLabel,
  onAction,
}: {
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  title: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View className="flex-row items-end justify-between gap-3">
      <View className="flex-1">
        {!!eyebrow && (
          <View className="flex-row items-center gap-1.5">
            {EyebrowIcon && <EyebrowIcon size={14} color={colors.soil600} />}
            <AppText weight="bold" className="text-xs uppercase tracking-wider text-leaf-700">
              {eyebrow}
            </AppText>
          </View>
        )}
        <AppText accessibilityRole="header" weight="extrabold" className="mt-0.5 text-2xl tracking-tight">
          {title}
        </AppText>
      </View>
      {!!actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="link"
          hitSlop={8}
          className="min-h-[44px] flex-row items-center gap-1"
        >
          <AppText weight="bold" className="text-sm text-leaf-700">
            {actionLabel}
          </AppText>
          <ArrowRight size={16} color={colors.leaf700} />
        </Pressable>
      )}
    </View>
  )
}
