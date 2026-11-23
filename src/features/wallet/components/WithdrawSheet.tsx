import { useEffect, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native'
import { AppText, BottomSheet, Button, TextField } from '@/components/ui'
import { money } from '@/features/product'
import { MIN_WITHDRAW_AMOUNT, VIETNAM_BANKS } from '@/services/wallet.service'
import { cn } from '@/utils/helpers'
import { useRequestWithdraw } from '../hooks/useWalletQueries'
import { parseAmount } from '../utils/topup'

export function WithdrawSheet({
  visible,
  onClose,
  availableBalance = 0,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  availableBalance?: number
  onSuccess?: () => void
}) {
  const withdrawMutation = useRequestWithdraw()
  const [textAmount, setTextAmount] = useState('')
  const [selectedBank, setSelectedBank] = useState(VIETNAM_BANKS[0].name)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [note, setNote] = useState('')
  const [showBankPicker, setShowBankPicker] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!visible) return
    setTouched(false)
    setTextAmount('')
    setAccountNumber('')
    setAccountHolder('')
    setNote('')
  }, [visible])

  const amount = parseAmount(textAmount)

  // Validation
  let amountError: string | undefined
  if (touched) {
    if (!amount) {
      amountError = 'Vui lòng nhập số tiền muốn rút'
    } else if (amount < MIN_WITHDRAW_AMOUNT) {
      amountError = `Số tiền rút tối thiểu là ${money(MIN_WITHDRAW_AMOUNT)}`
    } else if (amount > availableBalance) {
      amountError = `Số dư khả dụng không đủ (tối đa ${money(availableBalance)})`
    }
  }

  const accountError = touched && accountNumber.trim().length < 6 ? 'Số tài khoản không hợp lệ' : undefined
  const holderError = touched && accountHolder.trim().length < 3 ? 'Vui lòng nhập họ tên chủ tài khoản' : undefined

  const isValid =
    amount >= MIN_WITHDRAW_AMOUNT &&
    amount <= availableBalance &&
    accountNumber.trim().length >= 6 &&
    accountHolder.trim().length >= 3 &&
    Boolean(selectedBank)

  const handleMaxPress = () => {
    if (availableBalance >= MIN_WITHDRAW_AMOUNT) {
      setTextAmount(String(availableBalance))
    }
  }

  const handleSubmit = async () => {
    setTouched(true)
    if (!isValid) return

    try {
      await withdrawMutation.mutateAsync({
        amount,
        bankName: selectedBank,
        bankAccountNumber: accountNumber.trim(),
        bankAccountName: accountHolder.trim().toUpperCase(),
        bankAccountHolder: accountHolder.trim().toUpperCase(),
        note: note.trim() || undefined,
      })

      Alert.alert(
        'Đã gửi yêu cầu rút tiền',
        `Yêu cầu rút ${money(amount)} về ngân hàng ${selectedBank} đã được tạo thành công. Ban quản trị sẽ đối soát và giải ngân trong 24h làm việc.`,
        [{ text: 'Đã hiểu', onPress: () => onClose() }],
      )
      onSuccess?.()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo yêu cầu rút tiền'
      Alert.alert('Không thể tạo yêu cầu', msg)
    }
  }

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={() => !withdrawMutation.isPending && onClose()}
        title="Rút tiền về ngân hàng"
        subtitle={`Số dư khả dụng: ${money(availableBalance)}`}
        footer={
          <>
            <Button
              title="Huỷ"
              variant="outline"
              disabled={withdrawMutation.isPending}
              onPress={onClose}
              className="min-h-[48px] flex-1"
            />
            <Button
              title={amount ? `Rút ${money(amount)}` : 'Rút tiền'}
              loading={withdrawMutation.isPending}
              onPress={() => void handleSubmit()}
              className="min-h-[48px] flex-[1.6]"
            />
          </>
        }
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-4">
          {/* Nhập số tiền */}
          <View className="gap-1">
            <View className="flex-row items-center justify-between">
              <AppText weight="semibold" className="text-sm text-ink">
                Số tiền cần rút (đ)
              </AppText>
              <Pressable onPress={handleMaxPress}>
                <AppText weight="bold" className="text-xs text-leaf-700">
                  Rút tất cả ({money(availableBalance)})
                </AppText>
              </Pressable>
            </View>
            <TextField
              label="Số tiền cần rút (đ)"
              keyboardType="number-pad"
              value={amount ? new Intl.NumberFormat('vi-VN').format(amount) : ''}
              onChangeText={setTextAmount}
              placeholder={`Tối thiểu ${money(MIN_WITHDRAW_AMOUNT)}`}
              error={amountError}
            />
          </View>

          {/* Chọn ngân hàng */}
          <View className="gap-1">
            <AppText weight="semibold" className="text-sm text-ink">
              Ngân hàng thụ hưởng
            </AppText>
            <Pressable
              onPress={() => setShowBankPicker(true)}
              className="min-h-[48px] flex-row items-center justify-between rounded-xl border border-line bg-white px-3"
            >
              <AppText weight="medium" className="text-sm text-ink">
                {selectedBank}
              </AppText>
              <AppText weight="bold" className="text-xs text-leaf-700">
                Thay đổi
              </AppText>
            </Pressable>
          </View>

          {/* Số tài khoản */}
          <View className="gap-1">
            <TextField
              label="Số tài khoản ngân hàng"
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="VD: 1029384756"
              error={accountError}
            />
          </View>

          {/* Tên chủ tài khoản */}
          <View className="gap-1">
            <TextField
              label="Tên chủ tài khoản (in hoa không dấu)"
              value={accountHolder}
              onChangeText={(txt) => setAccountHolder(txt.toUpperCase())}
              placeholder="VD: NGUYEN VAN A"
              autoCapitalize="characters"
              error={holderError}
            />
          </View>

          {/* Ghi chú */}
          <View className="gap-1">
            <TextField
              label="Ghi chú (tuỳ chọn)"
              value={note}
              onChangeText={setNote}
              placeholder="VD: Rút cước giao hàng tuần này"
            />
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Modal chọn ngân hàng */}
      <Modal visible={showBankPicker} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setShowBankPicker(false)}
        >
          <View className="max-h-[70%] rounded-t-3xl bg-white p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <AppText weight="bold" className="text-base text-ink">
                Chọn ngân hàng thụ hưởng
              </AppText>
              <Pressable onPress={() => setShowBankPicker(false)}>
                <AppText weight="semibold" className="text-sm text-leaf-700">
                  Đóng
                </AppText>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {VIETNAM_BANKS.map((b: { code: string; name: string }) => (
                <Pressable
                  key={b.code}
                  onPress={() => {
                    setSelectedBank(b.name)
                    setShowBankPicker(false)
                  }}
                  className={cn(
                    'flex-row items-center justify-between border-b border-line/60 py-3.5 px-2',
                    selectedBank === b.name && 'bg-leaf-50 rounded-lg',
                  )}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-14 items-center justify-center rounded bg-slate-100">
                      <AppText weight="bold" className="text-xs text-ink-muted">
                        {b.code}
                      </AppText>
                    </View>
                    <AppText weight="medium" className="text-sm text-ink">
                      {b.name}
                    </AppText>
                  </View>
                  {selectedBank === b.name && (
                    <AppText weight="bold" className="text-xs text-leaf-700">
                      ✓
                    </AppText>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}
