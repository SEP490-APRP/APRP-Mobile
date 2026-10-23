import type { LucideIcon } from 'lucide-react-native'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'

export function RoleCard({
  icon: Icon,
  title,
  description,
  onPress,
}: {
  icon: LucideIcon
  title: string
  description: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Đăng ký ${title}`}
      className="flex-row items-center gap-3.5 rounded-panel border border-line bg-white p-4 active:border-leaf-700 active:bg-leaf-50"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-leaf-100">
        <Icon size={24} color={colors.leaf700} />
      </View>
      <View className="flex-1">
        <AppText weight="bold" className="text-base text-ink">
          {title}
        </AppText>
        <AppText className="mt-0.5 text-sm text-ink-muted">{description}</AppText>
      </View>
      <ChevronRight size={20} color={colors.inkSubtle} />
    </Pressable>
  )
}
