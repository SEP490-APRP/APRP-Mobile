import { AlertTriangle, XCircle } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { AppText, BottomSheet, Button } from '@/components/ui'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import { ORDER_CANCEL_REASONS } from '../utils/orderStatus'

export function CancelOrderSheet({
  visible,
  orderId,
  loading,
  onClose,
  onConfirm,
}: {
  visible: boolean
  orderId: number | null
  loading?: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [selectedReason, setSelectedReason] = useState<string>(ORDER_CANCEL_REASONS[0])
  const [customReason, setCustomReason] = useState('')

  useEffect(() => {
    if (visible) {
      setSelectedReason(ORDER_CANCEL_REASONS[0])
      setCustomReason('')
    }
  }, [visible])

  if (!orderId) return null

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Lý do khác' ? customReason.trim() : selectedReason
    onConfirm(finalReason || selectedReason)
  }

  return (
    <BottomSheet
      visible={visible}
      title={`Huỷ đơn hàng #${orderId}`}
      subtitle="Vui lòng cho biết lý do bạn muốn huỷ đơn"
      onClose={onClose}
      footer={
        <>
          <Button title="Giữ đơn" variant="outline" onPress={onClose} disabled={loading} className="min-h-[44px] flex-1" />
          <Button
            title="Xác nhận huỷ"
            variant="primary"
            destructive
            loading={loading}
            onPress={handleConfirm}
            className="min-h-[44px] flex-1"
          />
        </>
      }
    >
      <View className="gap-3.5">
        <View className="flex-row items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={18} color="#b45309" />
          <AppText className="flex-1 text-xs text-amber-900 leading-relaxed">
            Nông sản sẽ được hoàn lại kho của nhà vườn. Bạn không thể hoàn tác sau khi đã huỷ đơn.
          </AppText>
        </View>

        <View className="gap-2">
          {ORDER_CANCEL_REASONS.map((reason) => {
            const active = selectedReason === reason
            return (
              <Pressable
                key={reason}
                onPress={() => setSelectedReason(reason)}
                className={cn(
                  'flex-row items-center gap-2.5 rounded-xl border p-3',
                  active ? 'border-leaf-700 bg-leaf-50' : 'border-line bg-white',
                )}
              >
                <View
                  className={cn(
                    'h-4 w-4 items-center justify-center rounded-full border-2',
                    active ? 'border-leaf-700' : 'border-line-strong',
                  )}
                >
                  {active && <View className="h-2 w-2 rounded-full bg-leaf-700" />}
                </View>
                <AppText className={cn('flex-1 text-xs leading-relaxed', active ? 'text-leaf-900 font-semibold' : 'text-ink')}>
                  {reason}
                </AppText>
              </Pressable>
            )
          })}
        </View>

        {selectedReason === 'Lý do khác' && (
          <TextInput
            value={customReason}
            onChangeText={setCustomReason}
            placeholder="Nhập lý do huỷ của bạn..."
            placeholderTextColor={colors.inkSubtle}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            className="min-h-[60px] rounded-2xl border border-line bg-white p-3 text-xs text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
        )}
      </View>
    </BottomSheet>
  )
}

