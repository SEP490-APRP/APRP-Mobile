import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button, TextField } from '@/components/ui'
import { money } from '@/features/product'
import { cn } from '@/utils/helpers'
import { useTopupFlow } from '../hooks/useTopupFlow'
import { parseAmount, QUICK_TOPUP_AMOUNTS, suggestTopup, topupAmountError } from '../utils/topup'

/** Nạp tiền vào ví qua PayOS. Shipper cần số dư khả dụng để ký quỹ đơn COD. */
export function TopupSheet({
  visible,
  onClose,
  missing,
  onPaid,
}: {
  visible: boolean
  onClose: () => void
  /** Số tiền còn thiếu để nhận đơn COD (gợi ý sẵn) */
  missing?: number
  onPaid?: () => void
}) {
  const flow = useTopupFlow()
  const [text, setText] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!visible) return
    setTouched(false)
    const s = suggestTopup(missing)
    setText(s ? String(s) : '')
  }, [visible, missing])

  const amount = parseAmount(text)
  const error = topupAmountError(amount)

  const submit = async () => {
    setTouched(true)
    if (error) return
    const paid = await flow.start(amount)
    if (paid) {
      onPaid?.()
      onClose()
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={() => !flow.isPending && onClose()}
      title="Nạp tiền vào ví"
      subtitle="Thanh toán qua PayOS (chuyển khoản / QR), tiền vào ví ngay"
      footer={
        <>
          <Button title="Huỷ" variant="outline" disabled={flow.isPending} onPress={onClose} className="min-h-[48px] flex-1" />
          <Button
            title={amount ? `Nạp ${money(amount)}` : 'Nạp tiền'}
            loading={flow.isPending}
            onPress={() => void submit()}
            className="min-h-[48px] flex-[1.6]"
          />
        </>
      }
    >
      <View className="gap-4">
        <View className="flex-row flex-wrap gap-2">
          {QUICK_TOPUP_AMOUNTS.map((v) => (
            <Pressable
              key={v}
              onPress={() => setText(String(v))}
              accessibilityRole="button"
              className={cn(
                'min-h-[44px] flex-1 items-center justify-center rounded-xl border px-3',
                amount === v ? 'border-leaf-600 bg-leaf-50' : 'border-line bg-white',
              )}
            >
              <AppText weight="bold" className={cn('text-sm', amount === v ? 'text-leaf-800' : 'text-ink')}>
                {money(v)}
              </AppText>
            </Pressable>
          ))}
        </View>
        <TextField
          label="Số tiền (đ)"
          keyboardType="number-pad"
          value={amount ? new Intl.NumberFormat('vi-VN').format(amount) : ''}
          onChangeText={setText}
          placeholder="Nhập số tiền"
          error={touched ? error : undefined}
        />
      </View>
    </BottomSheet>
  )
}
