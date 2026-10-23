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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <Pressable accessibilityLabel={`Đóng ${title}`} className="flex-1 bg-black/40" onPress={onClose} />
        <View className="max-h-[85%] rounded-t-panel bg-white" style={{ paddingBottom: insets.bottom + 12 }}>
          <View className="flex-row items-center gap-3 border-b border-line px-5 py-4">
            <View className="flex-1">
              <AppText accessibilityRole="header" weight="extrabold" className="text-lg">
                {title}
              </AppText>
              {!!subtitle && <AppText className="text-xs text-ink-muted">{subtitle}</AppText>}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-paper"
            >
              <X size={20} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3 px-5 py-4">
            {children}
          </ScrollView>
          {footer && <View className="flex-row gap-3 border-t border-line px-5 pt-3">{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
