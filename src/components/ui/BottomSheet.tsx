import { X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { AppText } from './AppText'

/** Tấm trượt từ dưới lên, thay cho các modal giữa màn hình của bản web. */
export function BottomSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  visible: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  /** Vùng nút cố định ở đáy tấm */
  footer?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/40">
        <Pressable accessibilityLabel={`Đóng ${title}`} className="flex-1" onPress={onClose} />
        <View
          className="w-full max-w-lg mx-auto max-h-[85%] rounded-t-panel bg-white shadow-2xl overflow-hidden"
          style={{ paddingBottom: Math.max(insets.bottom, 8) + 6 }}
        >
          <View className="flex-row items-center gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-3.5">
            <View className="flex-1">
              <AppText accessibilityRole="header" weight="extrabold" numberOfLines={1} className="text-base sm:text-lg">
                {title}
              </AppText>
              {!!subtitle && <AppText numberOfLines={1} className="text-xs text-ink-muted">{subtitle}</AppText>}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-paper"
            >
              <X size={18} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-2.5 px-4 py-3 sm:px-5 sm:py-4">
            {children}
          </ScrollView>
          {footer && <View className="border-t border-line px-4 pt-2.5 sm:px-5 sm:pt-3">{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
