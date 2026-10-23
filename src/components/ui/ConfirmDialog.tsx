import { Modal, Pressable, View } from 'react-native'
import { AppText } from './AppText'
import { Button } from './Button'

/** Hộp xác nhận nhỏ giữa màn hình (Alert.alert không chạy trên web nên tự vẽ). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 p-6">
        <Pressable accessibilityLabel="Đóng" className="absolute inset-0" onPress={onCancel} />
        <View accessibilityViewIsModal className="w-full max-w-sm gap-2 rounded-panel bg-white p-5">
          <AppText accessibilityRole="header" weight="extrabold" className="text-lg">
            {title}
          </AppText>
          {!!message && <AppText className="text-sm leading-relaxed text-ink-muted">{message}</AppText>}
          <View className="mt-3 flex-row gap-3">
            <Button title={cancelLabel} variant="outline" onPress={onCancel} className="flex-1" />
            <Button
              title={confirmLabel}
              loading={loading}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              className="flex-1"
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}
