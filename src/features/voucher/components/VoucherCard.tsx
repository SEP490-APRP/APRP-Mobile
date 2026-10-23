import { View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import type { VoucherResponse } from '@/services/voucher.types'
import { cn } from '@/utils/helpers'

const vnd = (n: number | null | undefined) => `${Number(n ?? 0).toLocaleString('vi-VN')}đ`

export function voucherLabels(v: VoucherResponse) {
  const isFreeShip = v.voucherType === 'FREE_SHIPPING' || v.voucherTarget === 'SHIPPING'
  const discount =
    v.voucherType === 'PERCENTAGE'
      ? `Giảm ${v.discountValue}%`
      : isFreeShip
        ? 'Miễn phí vận chuyển'
        : `Giảm ${vnd(v.discountValue)}`
  const isPlatform = v.voucherScope === 'PLATFORM' || v.creatorRole === 'ADMIN'
  const condition = `${v.maxDiscount ? `Tối đa ${vnd(v.maxDiscount)} · ` : ''}Đơn từ ${vnd(v.minOrderValue)}`
  return { discount, isFreeShip, isPlatform, condition }
}

/** Thẻ voucher có nút Lưu, giống khối "Voucher của shop" bản web. */
export function VoucherCard({
  voucher,
  canReceive,
  saving,
  onSave,
}: {
  voucher: VoucherResponse
  canReceive: boolean
  saving: boolean
  onSave: () => void
}) {
  const { discount, isFreeShip, isPlatform, condition } = voucherLabels(voucher)
  return (
    <View className="w-60 justify-between gap-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-4">
      <View className="gap-1">
        <View className="flex-row flex-wrap items-center gap-1.5">
          <View className="rounded-md bg-emerald-100 px-2 py-0.5">
            <AppText weight="extrabold" className="text-xs uppercase text-emerald-800">
              {voucher.voucherCode}
            </AppText>
          </View>
          <View className={cn('rounded-full px-2 py-0.5', isPlatform ? 'bg-purple-100' : 'bg-amber-100')}>
            <AppText weight="bold" className={cn('text-xs', isPlatform ? 'text-purple-700' : 'text-amber-800')}>
              {isPlatform ? 'Toàn sàn' : 'Shop'}
            </AppText>
          </View>
          {isFreeShip && (
            <View className="rounded-full bg-blue-100 px-2 py-0.5">
              <AppText weight="bold" className="text-xs text-blue-700">
                Freeship
              </AppText>
            </View>
          )}
        </View>
        <AppText weight="extrabold" className="text-base">
          {discount}
        </AppText>
        <AppText className="text-xs text-ink-muted">{condition}</AppText>
      </View>
      <Button
        title={saving ? 'Đang lưu...' : canReceive ? 'Lưu voucher' : 'Đã trong ví voucher'}
        disabled={!canReceive || saving}
        onPress={onSave}
      />
    </View>
  )
}
