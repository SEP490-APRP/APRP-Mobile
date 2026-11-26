import { View } from 'react-native'
import { AppText } from '@/components/ui'
import type { SupplySummary } from '@/services'
import { formatKg } from '../utils/campaignFormat'

const num = (v?: number | null) => Number(v ?? 0)

/** Hàng tại điểm tập kết của chiến dịch đã hoàn tất: vườn giao, hư hỏng, bổ sung, phần bớt khỏi đơn */
export function SupplyStory({ s }: { s: SupplySummary }) {
  const ordered = num(s.orderedKg)
  const delivered = Math.max(0, ordered - num(s.cutKg) - num(s.remainingShortKg))
  const rows: { label: string; value: string; hint?: string; tone?: string }[] = [
    { label: 'Người mua đã đặt', value: formatKg(ordered) },
    { label: 'Nhà vườn giao đợt đầu', value: formatKg(s.deliveredByFarmsKg) },
    { label: 'Hư hỏng, bị loại', value: formatKg(s.rejectedKg), tone: num(s.rejectedKg) > 0 ? 'text-sale' : undefined },
    { label: 'Thiếu sau khi cân', value: formatKg(s.shortAfterWeighingKg), tone: num(s.shortAfterWeighingKg) > 0 ? 'text-amber-700' : undefined },
  ]
  if (num(s.supplementKg) > 0) {
    rows.push({ label: 'Bổ sung thêm', value: `+${formatKg(s.supplementKg)}`, hint: s.supplements.map((x) => `${x.shopName} ${formatKg(x.kg)}`).join(', '), tone: 'text-leaf-700' })
  }
  if (num(s.cutKg) > 0) {
    const hint = [s.reducedOrderCount ? `${s.reducedOrderCount} đơn giảm thùng` : '', s.cancelledOrderCount ? `${s.cancelledOrderCount} đơn huỷ` : '', 'đã hoàn cọc phần dư'].filter(Boolean).join(' · ')
    rows.push({ label: 'Không bù được, bớt khỏi đơn', value: `−${formatKg(s.cutKg)}`, hint, tone: 'text-amber-700' })
  }
  rows.push({ label: 'Hàng giao cho người mua', value: formatKg(delivered), tone: 'text-leaf-700' })

  return (
    <View className="rounded-panel border border-line bg-white px-4 py-3">
      <AppText weight="extrabold" className="pb-1 text-base">
        Hàng tại điểm tập kết
      </AppText>
      {rows.map((r, i) => (
        <View key={r.label} className={`flex-row items-start justify-between gap-3 py-2 ${i > 0 ? 'border-t border-line' : ''}`}>
          <View className="min-w-0 flex-1">
            <AppText className="text-sm text-ink-muted">{r.label}</AppText>
            {!!r.hint && <AppText className="text-[11px] text-ink-subtle">{r.hint}</AppText>}
          </View>
          <AppText weight="extrabold" className={`text-sm ${r.tone ?? ''}`}>
            {r.value}
          </AppText>
        </View>
      ))}
    </View>
  )
}
