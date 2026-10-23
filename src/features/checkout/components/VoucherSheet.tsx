import { Ticket } from 'lucide-react-native'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { AppText, BottomSheet, Button, Checkbox, EmptyState } from '@/components/ui'
import { voucherLabels } from '@/features/voucher'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import { normalizeCode, type CheckoutVoucher } from '../utils/voucherRules'

type Row = { voucher: CheckoutVoucher; eligible: boolean }

/** Chọn voucher cho đơn: nhập mã, lưu mã công khai vào ví, bật/tắt mã đủ điều kiện. */
export function VoucherSheet({
  visible,
  rows,
  selectedCodes,
  savingCode,
  applyingCode,
  error,
  onToggle,
  onSave,
  onApplyCode,
  onClose,
}: {
  visible: boolean
  rows: readonly Row[]
  selectedCodes: readonly string[]
  savingCode: string | null
  applyingCode: boolean
  error: string | null
  onToggle: (voucher: CheckoutVoucher) => void
  onSave: (voucher: CheckoutVoucher) => void
  onApplyCode: (code: string) => void
  onClose: () => void
}) {
  const [code, setCode] = useState('')
  // Mã dùng được lên đầu, mã chưa đủ điều kiện xuống cuối.
  const sorted = [...rows].sort((a, b) => Number(b.eligible) - Number(a.eligible))

  return (
    <BottomSheet
      visible={visible}
      title="CapNong Voucher"
      subtitle="Mỗi đơn dùng tối đa 1 mã freeship, 1 mã sàn và 1 mã cho mỗi shop"
      onClose={onClose}
      footer={<Button title={`Xong (${selectedCodes.length} mã)`} onPress={onClose} className="flex-1" />}
    >
      <View className="flex-row gap-2">
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          placeholder="Nhập mã voucher"
          placeholderTextColor={colors.inkSubtle}
          autoCapitalize="characters"
          accessibilityLabel="Mã voucher"
          className="min-h-[48px] flex-1 rounded-xl border border-line-strong bg-white px-3.5 text-base text-ink"
          style={{ fontFamily: fontFamily.semibold }}
        />
        <Button
          title="Áp dụng"
          variant="outline"
          loading={applyingCode}
          disabled={!code.trim()}
          onPress={() => {
            onApplyCode(code)
            setCode('')
          }}
          className="min-h-[48px]"
        />
      </View>
      {!!error && <AppText className="text-sm text-sale">{error}</AppText>}

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Ticket size={30} color={colors.leaf600} />}
          title="Chưa có voucher"
          description="Lưu voucher ở trang cửa hàng hoặc nhập mã bạn có."
        />
      ) : (
        sorted.map(({ voucher, eligible }) => {
          const upper = normalizeCode(voucher.voucherCode)
          const checked = selectedCodes.includes(upper)
          const { discount, condition, isFreeShip, isPlatform } = voucherLabels(voucher)
          return (
            <View
              key={upper}
              className={cn(
                'flex-row items-center gap-2 rounded-2xl border border-dashed p-3',
                checked ? 'border-leaf-700 bg-leaf-50' : 'border-emerald-300 bg-white',
                !eligible && 'opacity-55',
              )}
            >
              <View
                className={cn(
                  'h-12 w-12 items-center justify-center rounded-xl',
                  isFreeShip ? 'bg-blue-100' : isPlatform ? 'bg-purple-100' : 'bg-amber-100',
                )}
              >
                <Ticket size={22} color={isFreeShip ? '#1d4ed8' : isPlatform ? '#7e22ce' : '#92400e'} />
              </View>
              <View className="min-w-0 flex-1">
                <AppText weight="extrabold" className="text-sm">
                  {discount}
                </AppText>
                <AppText numberOfLines={1} className="text-xs text-ink-muted">
                  {voucher.voucherCode} · {isFreeShip ? 'Freeship' : isPlatform ? 'Toàn sàn' : 'Shop'}
                </AppText>
                <AppText numberOfLines={1} className={cn('text-xs', eligible ? 'text-ink-muted' : 'text-sale')}>
                  {eligible ? condition : `Chưa đủ điều kiện · ${condition}`}
                </AppText>
              </View>
              {voucher.isCollected ? (
                <Checkbox
                  checked={checked}
                  disabled={!eligible && !checked}
                  onChange={() => onToggle(voucher)}
                  label={`Dùng mã ${voucher.voucherCode}`}
                />
              ) : (
                <Button
                  title="Lưu"
                  variant="outline"
                  loading={savingCode === upper}
                  onPress={() => onSave(voucher)}
                  className="min-h-[40px] px-4"
                />
              )}
            </View>
          )
        })
      )}
    </BottomSheet>
  )
}
