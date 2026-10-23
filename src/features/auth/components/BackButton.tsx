import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { colors } from '@/theme/colors'

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/login')))}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Quay lại"
      className="h-10 w-10 items-center justify-center rounded-full active:bg-leaf-50"
    >
      <ArrowLeft size={22} color={colors.ink} />
    </Pressable>
  )
}
