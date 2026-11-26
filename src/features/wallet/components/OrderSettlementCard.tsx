import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, View } from 'react-native'
import { AppText } from '@/components/ui'
import { money } from '@/features/product'
import { walletService } from '@/services/wallet.service'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

export interface OrderSettlementData {
  orderId: number
  status?: string | null
  paymentMethod?: string | null
  settled?: boolean
  settledAt?: string | null
  goodsAmount: number
  shopVoucherDiscount: number
  platformVoucherDiscount: number
  platformFreeshipDiscount: number
  shippingFee: number
  buyerPaid: number
  farmerFeeRate: number
  farmerFee: number
  shipperFeeRate: number
  shipperFee: number
  shopReceive: number
  shipperReceive: number
  platformReceive: number
  refundAmount?: number | null
  refundReason?: string | null
  shipper?: { name?: string | null } | null
  codAmount?: number | null
  codSettled?: boolean | null
}

const pct = (rate: number) => `${Math.round((rate || 0) * 1000) / 10}%`

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'plus' | 'minus' }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-1">
      <AppText weight={strong ? 'bold' : 'regular'} className={cn('text-xs flex-1', strong ? 'text-ink' : 'text-ink-muted')}>
        {label}
      </AppText>
      <AppText
        weight={strong ? 'extrabold' : 'semibold'}
        className={cn('text-xs', tone === 'minus' ? 'text-sale' : tone === 'plus' ? 'text-leaf-700' : 'text-ink')}
      >
        {value}
      </AppText>
    </View>
  )
}

export function OrderSettlementCard({ orderId, viewer }: { orderId: number; viewer: 'SHOP' | 'SHIPPER' | 'ADMIN' }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['order-settlement', orderId],
    queryFn: () => walletService.getOrderSettlement(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
  })

  if (isLoading) {
    return (
      <View className="flex-row items-center gap-2 rounded-panel border border-line bg-white p-4">
        <ActivityIndicator size="small" color={colors.leaf700} />
        <AppText className="text-xs text-ink-muted">Đang tính bảng chia tiền...</AppText>
      </View>
    )
  }

  if (error || !data) return null

  const s = data
  const showShop = viewer !== 'SHIPPER'
  const showShipper = viewer !== 'SHOP'

  return (
    <View className="gap-3 rounded-panel border border-line bg-white p-4">
      <View className="flex-row items-center justify-between gap-2">
        <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
          Chia tiền đơn #{s.orderId}
        </AppText>
        <View className={cn('rounded-full px-2.5 py-0.5', s.settled ? 'bg-leaf-100' : 'bg-amber-50')}>
          <AppText weight="bold" className={cn('text-[10px]', s.settled ? 'text-leaf-800' : 'text-amber-800')}>
            {s.settled ? 'Đã quyết toán' : 'Dự kiến (về ví khi hoàn tất)'}
          </AppText>
        </View>
      </View>

      {showShop && (
        <View className="rounded-xl border border-line bg-paper p-3">
          <Row label="Tiền hàng" value={money(s.goodsAmount)} />
          {s.shopVoucherDiscount > 0 && (
            <Row label="Voucher của shop (shop chịu)" value={`-${money(s.shopVoucherDiscount)}`} tone="minus" />
          )}
          {s.platformVoucherDiscount > 0 && (
            <Row label="Voucher sàn (sàn bù)" value={money(s.platformVoucherDiscount)} />
          )}
          <Row label={`Phí dịch vụ nông dân ${pct(s.farmerFeeRate)}`} value={`-${money(s.farmerFee)}`} tone="minus" />
          <Row label="Shop nhận" value={money(s.shopReceive)} strong tone="plus" />
        </View>
      )}

      {showShipper && (
        <View className="rounded-xl border border-line bg-paper p-3">
          <Row label="Cước giao hàng" value={money(s.shippingFee)} />
          {s.platformFreeshipDiscount > 0 && (
            <Row label="Freeship sàn (sàn bù)" value={money(s.platformFreeshipDiscount)} />
          )}
          <Row label={`Phí dịch vụ shipper ${pct(s.shipperFeeRate)}`} value={`-${money(s.shipperFee)}`} tone="minus" />
          <Row
            label={s.shipper?.name ? `Shipper nhận (${s.shipper.name})` : 'Shipper nhận'}
            value={money(s.shipperReceive)}
            strong
            tone="plus"
          />
          {s.paymentMethod === 'COD' && s.codAmount != null && (
            <Row
              label={s.codSettled ? 'Tiền mặt COD đã nộp về sàn' : 'Tiền mặt COD shipper đang giữ'}
              value={money(s.codAmount)}
            />
          )}
        </View>
      )}

      {!!s.refundAmount && s.refundAmount > 0 && (
        <View className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
          <Row label="Hoàn cho khách" value={money(s.refundAmount)} strong tone="minus" />
          {Boolean(s.refundReason) && <AppText className="text-[11px] text-rose-700">{s.refundReason}</AppText>}
        </View>
      )}
    </View>
  )
}

