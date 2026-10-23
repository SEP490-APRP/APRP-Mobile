import { Camera, ImagePlus, type LucideIcon } from 'lucide-react-native'
import { Platform, Pressable, View } from 'react-native'
import { AppText, BottomSheet } from '@/components/ui'
import { colors } from '@/theme/colors'
import type { ImageSource } from '../hooks/usePickProductImage'

const OPTIONS: { source: ImageSource; icon: LucideIcon; title: string; hint: string }[] = [
  { source: 'camera', icon: Camera, title: 'Chụp ảnh mới', hint: 'Chụp nông sản ngay tại vườn, đủ sáng, rõ hình' },
  { source: 'library', icon: ImagePlus, title: 'Chọn từ thư viện', hint: 'JPEG, PNG hoặc WebP, tối đa 5MB' },
]

/** Hỏi lấy ảnh từ camera hay thư viện (web chỉ có ô chọn tệp). */
export function ImageSourceSheet({
  visible,
  onClose,
  onPick,
  title = 'Thêm ảnh nông sản',
  subtitle = 'AI sẽ kiểm tra ảnh có đúng là nông sản thật',
}: {
  title?: string
  subtitle?: string
  visible: boolean
  onClose: () => void
  onPick: (source: ImageSource) => void
}) {
  return (
    <BottomSheet visible={visible} title={title} subtitle={subtitle} onClose={onClose}>
      <View className="gap-3">
        {OPTIONS.map(({ source, icon: Icon, title, hint }) => (
          <Pressable
            key={source}
            onPress={() => {
              onClose()
              // iOS không mở được trình chọn ảnh khi tấm còn đang trượt xuống.
              setTimeout(() => onPick(source), Platform.OS === 'ios' ? 400 : 0)
            }}
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-card border border-line bg-white p-4 active:bg-leaf-50"
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-leaf-50">
              <Icon size={20} color={colors.leaf700} />
            </View>
            <View className="flex-1">
              <AppText weight="bold" className="text-base">
                {title}
              </AppText>
              <AppText className="text-sm text-ink-muted">{hint}</AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  )
}
