import { router } from 'expo-router'
import { CalendarClock, TicketPercent } from 'lucide-react-native'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Checkbox, ChoiceChips, TextField } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { money } from '@/features/product'
import {
  addDays,
  digitsOnly,
  emptyVoucherForm,
  normalizeVoucherCode,
  useCreateShopVoucher,
  validateVoucher,
  VOUCHER_TYPE_OPTIONS,
  type VoucherFormErrors,
  type VoucherFormValues,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

const EXPIRY_PRESETS = [7, 14, 30, 60] as const

/** Tạo mã giảm giá cho gian hàng (modal "Tạo mã giảm giá mới" bản web). */
export default function NewShopVoucher() {
  const create = useCreateShopVoucher()
  const showToast = useUiStore((s) => s.showToast)
  const [v, setV] = useState<VoucherFormValues>(() => emptyVoucherForm())
  const [errors, setErrors] = useState<VoucherFormErrors>({})

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/vouchers'))
  const change = (patch: Partial<VoucherFormValues>) => {
    setV((x) => ({ ...x, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      for (const k of Object.keys(patch) as (keyof VoucherFormValues)[]) delete next[k]
      return next
    })
  }

  const percent = v.type === 'PERCENTAGE'
  const freeShip = v.type === 'FREE_SHIPPING'
  const value = Number(v.discountValue) || 0
  const preview = freeShip
    ? `Miễn phí vận chuyển${value ? ` tới ${money(value)}` : ''}`
    : percent
      ? `Giảm ${value}%${v.maxDiscount ? `, tối đa ${money(Number(v.maxDiscount))}` : ''}`
      : `Giảm ${money(value)}`

  const submit = () => {
    const next = validateVoucher(v)
    setErrors(next)
    if (Object.keys(next).length > 0) return showToast('Kiểm tra lại các ô được đánh dấu đỏ nhé.')
    create.mutate(v, {
      onSuccess: () => {
        showToast(`Đã tạo mã ${v.code}.`)
        goBack()
      },
      onError: (err) => {
        const msg = getErrorMessage(err, 'Chưa tạo được mã, thử lại nhé.')
        if (/exist|tồn tại|đã có/i.test(msg)) setErrors((e) => ({ ...e, code: 'Mã này đã có, chọn mã khác' }))
        showToast(msg)
      },
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={goBack} />
        <View className="flex-1">
          <AppText accessibilityRole="header" weight="extrabold" className="text-base">
            Tạo mã giảm giá
          </AppText>
          <AppText className="text-xs text-ink-muted">Ưu đãi riêng cho khách mua tại vườn bạn</AppText>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 p-4 pb-8" keyboardShouldPersistTaps="handled">
          {/* Xem trước mã */}
          <View className="flex-row items-center gap-3 rounded-panel border border-dashed border-leaf-300 bg-leaf-50 p-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <TicketPercent size={22} color={colors.leaf700} />
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="extrabold" className="text-lg tracking-wide text-leaf-800">
                {v.code || 'MÃ CỦA BẠN'}
              </AppText>
              <AppText weight="bold" className="text-sm text-leaf-700">
                {preview}
              </AppText>
              <AppText className="text-xs text-ink-muted">Đơn từ {money(Number(v.minOrderValue) || 0)}</AppText>
            </View>
          </View>

          <TextField
            label="Mã giảm giá *"
            value={v.code}
            onChangeText={(t) => change({ code: normalizeVoucherCode(t) })}
            placeholder="VD: GIAM20K, RAUSACH15"
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.code}
          />

          <ChoiceChips
            label="Loại ưu đãi"
            options={VOUCHER_TYPE_OPTIONS}
            value={v.type}
            onChange={(t) =>
              change({
                type: t as VoucherFormValues['type'],
                discountValue: t === 'PERCENTAGE' ? '10' : t === 'FREE_SHIPPING' ? '30000' : '10000',
                maxDiscount: '',
              })
            }
          />

          <View className="flex-row gap-3">
            <TextField
              label={percent ? 'Giảm (%) *' : freeShip ? 'Hỗ trợ ship tới (đ) *' : 'Giảm (đ) *'}
              value={v.discountValue}
              onChangeText={(t) => change({ discountValue: digitsOnly(t).slice(0, percent ? 3 : 9) })}
              keyboardType="number-pad"
              error={errors.discountValue}
              className="flex-1"
            />
            {percent ? (
              <TextField
                label="Giảm tối đa (đ)"
                value={v.maxDiscount}
                onChangeText={(t) => change({ maxDiscount: digitsOnly(t).slice(0, 9) })}
                keyboardType="number-pad"
                placeholder="Không giới hạn"
                error={errors.maxDiscount}
                className="flex-1"
              />
            ) : (
              <TextField
                label="Đơn tối thiểu (đ) *"
                value={v.minOrderValue}
                onChangeText={(t) => change({ minOrderValue: digitsOnly(t).slice(0, 9) })}
                keyboardType="number-pad"
                error={errors.minOrderValue}
                className="flex-1"
              />
            )}
          </View>
          {percent && (
            <TextField
              label="Đơn tối thiểu (đ) *"
              value={v.minOrderValue}
              onChangeText={(t) => change({ minOrderValue: digitsOnly(t).slice(0, 9) })}
              keyboardType="number-pad"
              error={errors.minOrderValue}
            />
          )}

          <View className="flex-row gap-3">
            <TextField
              label="Tổng lượt phát *"
              value={v.claimLimit}
              onChangeText={(t) => change({ claimLimit: digitsOnly(t).slice(0, 6) })}
              keyboardType="number-pad"
              error={errors.claimLimit}
              className="flex-1"
            />
            <TextField
              label="Mỗi khách dùng *"
              value={v.perUserLimit}
              onChangeText={(t) => change({ perUserLimit: digitsOnly(t).slice(0, 3) })}
              keyboardType="number-pad"
              error={errors.perUserLimit}
              className="flex-1"
            />
          </View>

          <View className="gap-2">
            <TextField
              label="Hết hạn ngày *"
              icon={CalendarClock}
              value={v.expiryDate}
              onChangeText={(expiryDate) => change({ expiryDate })}
              placeholder="NNNN-TT-NN"
              maxLength={10}
              error={errors.expiryDate}
            />
            <View className="flex-row flex-wrap gap-2">
              {EXPIRY_PRESETS.map((d) => {
                const date = addDays(d)
                const active = v.expiryDate === date
                return (
                  <Pressable
                    key={d}
                    onPress={() => change({ expiryDate: date })}
                    accessibilityRole="button"
                    accessibilityLabel={`Hết hạn sau ${d} ngày`}
                    accessibilityState={{ selected: active }}
                    className={cn(
                      'rounded-full border px-3 py-1.5',
                      active ? 'border-leaf-700 bg-leaf-50' : 'border-line-strong bg-white',
                    )}
                  >
                    <AppText weight="semibold" className={cn('text-sm', active ? 'text-leaf-800' : 'text-ink-muted')}>
                      {d} ngày
                    </AppText>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View className="flex-row items-center rounded-card border border-line bg-white pr-3">
            <Checkbox checked={v.isPublic} onChange={() => change({ isPublic: !v.isPublic })} label="Hiện công khai" />
            <Pressable onPress={() => change({ isPublic: !v.isPublic })} accessible={false} className="flex-1 py-3">
              <AppText weight="semibold" className="text-sm">
                Hiện công khai trên trang vườn
              </AppText>
              <AppText className="text-xs text-ink-muted">
                Tắt nếu chỉ muốn gửi mã riêng cho khách quen (khách nhập mã để nhận).
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <Button
          title="Tạo mã"
          icon={TicketPercent}
          loading={create.isPending}
          onPress={submit}
          className="min-h-[48px]"
        />
      </View>
    </SafeAreaView>
  )
}
