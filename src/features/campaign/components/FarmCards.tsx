import { Image } from 'expo-image'
import { router } from 'expo-router'
import { CheckCircle2, Clock, Megaphone, Package, Sprout } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import type { CampaignResponse, FarmRegistrationResponse } from '@/services'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { fmtDate, formatKg, formatVnd, REGISTRATION_STATUS, shelfLabel, timeLeftLabel } from '../utils/campaignFormat'
import { openingText, registrationOpen } from '../utils/campaignInvites'
import { Notice, Pill, ProgressBar, SiteLocation, Stat } from './CampaignBits'

/** Thẻ lời kêu gọi góp hàng (CallCard bản web) */
export function CallCard({
  c,
  mine,
  invited,
  onRegister,
}: {
  c: CampaignResponse
  mine: FarmRegistrationResponse[]
  invited?: boolean
  onRegister: () => void
}) {
  const gathered = Number(c.approvedSurplusKg ?? 0)
  const pct = c.targetVolumeKg > 0 ? Math.min(100, (gathered / c.targetVolumeKg) * 100) : 0
  const remaining = Math.max(0, c.targetVolumeKg - gathered)
  const myKg = mine.reduce((s, r) => s + Number(r.surplusVolumeKg ?? 0), 0)
  const topUp = !!c.topUpOpen
  const need = Number(c.topUpRemainingKg ?? 0)
  return (
    <View className={cn('overflow-hidden rounded-panel border bg-white', invited ? 'border-amber-300' : 'border-line')}>
      <View className="h-36 items-center justify-center bg-leaf-50">
        {c.coverImageUrl ? (
          <Image source={{ uri: c.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Sprout size={40} color={colors.leaf600} />
        )}
        {invited && (
          <View className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1">
            <Megaphone size={12} color={colors.white} />
            <AppText weight="extrabold" className="text-[11px] text-white">
              CapNong mời bạn
            </AppText>
          </View>
        )}
      </View>
      <View className="gap-3 p-4">
        <View className="flex-row flex-wrap gap-2">
          <Pill text={[c.categoryName, c.season].filter(Boolean).join(' · ') || 'Chiến dịch'} />
          {topUp ? <Pill tone="rose" icon={Clock} text="Cần bổ sung gấp" /> : <Pill tone="amber" icon={Clock} text={timeLeftLabel(c.farmCutoffAt ?? c.cutoffAt)} />}
        </View>
        <AppText weight="extrabold" numberOfLines={2} className="text-lg leading-snug">
          {c.title}
        </AppText>
        <AppText weight="bold" className="text-sm text-leaf-700" onPress={() => router.push(`/shop/campaign/${c.campaignId}` as never)}>
          Đọc bài chiến dịch →
        </AppText>
        <View className="flex-row gap-2 rounded-2xl bg-paper p-3">
          <Stat label="Giá thu mua" value={`${formatVnd(c.rescuePricePerKg)}/kg`} />
          {topUp ? <Stat label="Còn cần bổ sung" value={formatKg(need)} /> : <Stat label="Còn cần gom" value={formatKg(remaining)} />}
          <Stat label={topUp ? 'Mở bổ sung' : 'Hạn góp hàng'} value={topUp ? fmtDate(c.topUpCallAt) : fmtDate(c.farmCutoffAt ?? c.cutoffAt)} />
        </View>
        {topUp ? (
          <Notice tone="rose">
            Các nhà vườn đã giao hết phần được chia nhưng hàng đạt chuẩn vẫn thiếu {formatKg(need)}. Bạn có thể đăng ký thêm lô, tối đa {formatKg(need)}.
          </Notice>
        ) : (
          <View className="gap-1.5">
            <View className="flex-row justify-between">
              <AppText weight="bold" className="text-sm">
                Đã gom {formatKg(gathered)}
              </AppText>
              <AppText className="text-xs text-ink-muted">
                {c.approvedFarmCount ?? 0} nhà vườn · {Math.round(pct)}%
              </AppText>
            </View>
            <ProgressBar pct={pct} />
          </View>
        )}
        <SiteLocation label="Điểm gom hàng" name={c.collectionSiteName} address={c.collectionSiteAddress} lat={c.collectionSiteLatitude} lng={c.collectionSiteLongitude} />
        {mine.length > 0 && (
          <View className="gap-2 rounded-2xl border border-line p-3">
            <AppText weight="extrabold" className="text-[11px] uppercase text-ink-subtle">
              Lô bạn đã đăng ký · {mine.length} lô · {formatKg(myKg)}
            </AppText>
            {mine.map((r, i) => (
              <View key={r.registrationId} className="flex-row items-center justify-between gap-2">
                <AppText className="flex-1 text-sm" numberOfLines={1}>
                  Lô {i + 1} · {r.productName || 'Nông sản'} · {formatKg(r.surplusVolumeKg)}
                </AppText>
                <Pill tone={REGISTRATION_STATUS[r.status].tone} text={REGISTRATION_STATUS[r.status].label} />
              </View>
            ))}
          </View>
        )}
        <Button
          title={!registrationOpen(c) ? openingText(c) : topUp ? 'Đăng ký lô bổ sung' : mine.length ? 'Đăng ký thêm lô hàng' : 'Đăng ký góp hàng'}
          icon={Sprout}
          disabled={!registrationOpen(c)}
          onPress={onRegister}
        />
      </View>
    </View>
  )
}

/** Lô đã đăng ký: duyệt, cân, chi trả (RegistrationRow bản web) */
export function RegistrationCard({ r }: { r: FarmRegistrationResponse }) {
  const st = REGISTRATION_STATUS[r.status]
  const steps = [
    { label: 'Gửi đăng ký', done: true },
    { label: 'Được duyệt', done: r.status === 'APPROVED' },
    { label: 'Cân tại điểm gom', done: !!r.intakeAt },
    { label: 'Nhận tiền', done: !!r.paidOutAt },
  ]
  const facts: [string, string][] = [
    ['Số kg khai', formatKg(r.surplusVolumeKg)],
    ['Thu hoạch', fmtDate(r.harvestDate)],
    ['Bảo quản', shelfLabel(r.shelfLifeTier)],
    ['Giá thu mua', r.effectivePricePerKg != null ? `${formatVnd(r.effectivePricePerKg)}/kg` : '—'],
  ]
  if (r.allocatedVolumeKg != null) facts.push(['Được phân bổ', formatKg(r.allocatedVolumeKg)])
  if (r.receivedWeightKg != null) facts.push(['Cân thực tế', `${formatKg(r.receivedWeightKg)}${r.qualityPassed === false ? ' · không đạt' : ''}`])
  if (r.intakeAt != null && r.countedWeightKg != null) facts.push(['Kg được tính tiền', formatKg(r.countedWeightKg)])
  if (r.payoutAmount == null && r.estimatedPayoutAmount != null) facts.push(['Tiền dự tính', formatVnd(r.estimatedPayoutAmount)])
  if (r.payoutAmount != null) facts.push(['Đã nhận', formatVnd(r.payoutAmount)])
  facts.push(['Điểm gom', r.collectionSiteName || '—'])

  return (
    <View className="gap-3 rounded-panel border border-line bg-white p-4">
      <View className="flex-row gap-3">
        <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-leaf-50">
          {r.productImageUrls?.[0] ? (
            <Image source={{ uri: r.productImageUrls[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Package size={26} color={colors.leaf600} />
          )}
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <AppText className="text-[11px] text-ink-subtle" numberOfLines={1}>
            {r.campaignTitle}
          </AppText>
          <AppText weight="extrabold" className="text-base" numberOfLines={1}>
            {r.productName || 'Lô hàng'}
          </AppText>
          <Pill tone={st.tone} text={st.label} />
        </View>
      </View>
      <View className="flex-row flex-wrap gap-y-2">
        {facts.map(([l, v]) => (
          <Stat key={l} label={l} value={v} className="min-w-[48%]" />
        ))}
      </View>
      {r.payoutAmount == null && r.estimatedPayoutAmount != null && (
        <AppText className="text-[11px] text-ink-subtle">Tiền thật chuyển vào ví khi chiến dịch hoàn tất.</AppText>
      )}
      {!!r.reviewNote && <Notice tone="gray">CapNong: {r.reviewNote}</Notice>}
      {r.status !== 'REJECTED' && r.status !== 'CANCELLED' && (
        <View className="flex-row gap-1">
          {steps.map((s, i) => (
            <View key={s.label} className="flex-1 items-center gap-1">
              <View className={cn('h-5 w-5 items-center justify-center rounded-full', s.done ? 'bg-leaf-700' : 'bg-line')}>
                {s.done ? (
                  <CheckCircle2 size={12} color={colors.white} />
                ) : (
                  <AppText weight="bold" className="text-[10px] text-ink-subtle">
                    {i + 1}
                  </AppText>
                )}
              </View>
              <AppText weight="bold" className={cn('text-center text-[10px]', s.done ? 'text-leaf-700' : 'text-ink-subtle')}>
                {s.label}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
