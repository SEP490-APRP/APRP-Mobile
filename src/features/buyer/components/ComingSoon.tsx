import type { LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { EmptyState, Screen } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { colors } from '@/theme/colors'

/** Màn tạm cho phần chưa chuyển xong, nói rõ khi nào có thay vì để trống. */
export function ComingSoon({
  icon: Icon,
  title,
  description,
  showBack = false,
}: {
  icon: LucideIcon
  title: string
  description: string
  showBack?: boolean
}) {
  return (
    <Screen className="justify-center">
      {showBack && (
        <View className="absolute left-3 top-2">
          <BackButton />
        </View>
      )}
      <EmptyState icon={<Icon size={32} color={colors.leaf600} />} title={title} description={description} />
    </Screen>
  )
}
