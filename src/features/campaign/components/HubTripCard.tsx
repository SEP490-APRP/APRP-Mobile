import { Image } from 'expo-image'
import { Ban, CalendarClock, CheckCircle2, Navigation, PackageCheck, Undo2 } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import type { HubTrip } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { useArriveStop, useHubTripAction, useStartTrip } from '../hooks/useCampaignQueries'
import { directionsUrl, fmtDate, formatKg, formatVnd } from '../utils/campaignFormat'
import { Notice, Pill } from './CampaignBits'
import { HubTripBoxes } from './HubTripBoxes'
import { PhotoConfirm } from './PhotoConfirm'

const STATUS: Record<string, { label: string; tone: 'amber' | 'leaf' | 'blue' | 'gray' }> = {
  OPEN: { label: 'Đang chờ tài xế', tone: 'amber' },
  ACCEPTED: { label: 'Bạn đã nhận', tone: 'leaf' },
  IN_TRANSIT: { label: 'Đang chở ra hub', tone: 'blue' },
  DELIVERED: { label: 'Đã giao tới hub', tone: 'leaf' },
}

type Kind = 'accept' | 'decline' | 'release'

/** Chuyến chở hàng chiến dịch từ điểm tập kết ra hub: nhận hoặc không nhận chuyến, lấy hàng, giao tới hub */
export function HubTripCard({ t }: { t: HubTrip }) {
  const act = useHubTripAction()
  const start = useStartTrip()
  const arrive = useArriveStop()
  const showToast = useUiStore((s) => s.showToast)
  const [pending, setPending] = useState<Kind | null>(null)
  const st = STATUS[t.status] ?? STATUS.OPEN

  const run = async (kind: Kind, done: string) => {
    setPending(kind)
    try {
      await act.mutateAsync({ id: t.tripId, kind })
      showToast(done)
    } catch (e) {
      showToast(getErrorMessage(e, 'Thao tác chưa thành công.'))
    } finally {
      setPending(null)
    }
  }
  const accept = () => void run('accept', 'Đã nhận chuyến. CapNong sẽ báo khi chốt sau khi cân hàng.')

  // Chuyến đã bấm không nhận: thu gọn một khối, vẫn nhận lại được
  if (t.declined) {
    return (
      <View className="gap-2 rounded-panel border border-dashed border-line bg-white p-4">
        <AppText weight="bold" className="text-sm text-ink-muted">
          Bạn không nhận · Xe {t.tripNo} · {formatKg(t.totalKg)} · {formatVnd(t.netAmount)}
        </AppText>
        <AppText className="text-xs text-ink-subtle">{t.stops.map((s) => s.hubName).join(', ')}</AppText>
        <Button title="Nhận lại" variant="ghost" icon={CheckCircle2} loading={pending === 'accept'} onPress={accept} />
      </View>
    )
  }

  // Hàng chỉ rời điểm tập kết từ ngày cần xe (ngày kết thúc mở điểm tập kết)
  const tooEarly = !!t.pickupDate && new Date(`${String(t.pickupDate).slice(0, 10)}T00:00:00`).getTime() > Date.now()

  const boxesLeft = Math.max(0, (t.boxTotal ?? 0) - (t.boxLoaded ?? 0))

  let actions: ReactNode = null
  if (t.status === 'OPEN') {
    actions = (
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button title="Không nhận" variant="ghost" icon={Ban} loading={pending === 'decline'} onPress={() => void run('decline', 'Đã bỏ qua chuyến này. Bạn vẫn nhận lại được nếu chưa ai nhận.')} />
        </View>
        <View className="flex-[1.4]">
          <Button title="Nhận chuyến" icon={CheckCircle2} loading={pending === 'accept'} onPress={accept} />
        </View>
      </View>
    )
  } else if (t.status === 'ACCEPTED') {
    actions = (
      <View className="gap-2">
        {tooEarly && <Notice>Hàng chỉ rời điểm tập kết từ ngày {fmtDate(t.pickupDate!)}.</Notice>}
        {t.confirmed && !tooEarly && boxesLeft > 0 && <Notice>Còn {boxesLeft} thùng chưa nhận lên xe, nhận đủ mới chạy ra hub.</Notice>}
        {t.confirmed && !tooEarly && boxesLeft === 0 && (
          <PhotoConfirm
            subtitle="Chụp thùng hàng đã bốc lên xe"
            captureLabel="Chụp ảnh hàng trên xe"
            confirmLabel="Chạy ra hub"
            busy={start.isPending}
            onConfirm={(photoUrl) =>
              start.mutate(
                { id: t.tripId, photoUrl },
                { onSuccess: () => showToast('Đã ghi nhận lấy hàng, chúc bạn chạy an toàn.'), onError: (e) => showToast(getErrorMessage(e, 'Thao tác chưa thành công.')) },
              )
            }
          />
        )}
        <Button title="Không nhận nữa" variant="ghost" icon={Undo2} loading={pending === 'release'} onPress={() => void run('release', 'Đã trả chuyến, tài xế khác có thể nhận.')} />
      </View>
    )
  } else if (t.status === 'IN_TRANSIT') {
    actions = (
      <Notice>
        Đã giao {t.stops.filter((s) => s.arrivedAt).length}/{t.stops.length} hub. Tới hub nào bấm nút ở hub đó.
      </Notice>
    )
  }

  return (
    <View className="overflow-hidden rounded-panel border border-line bg-white">
      <View className="flex-row items-start justify-between gap-3 bg-leaf-700 p-4">
        <View className="min-w-0 flex-1 gap-0.5">
          <AppText className="text-xs text-white/75" numberOfLines={1}>
            {t.campaignTitle}
          </AppText>
          <AppText weight="extrabold" className="text-2xl text-white">
            Xe {t.tripNo}
          </AppText>
          <View className="flex-row items-center gap-1.5">
            <CalendarClock size={14} color={colors.sun300} />
            <AppText weight="bold" className="text-sm text-white">
              Cần xe ngày {t.pickupDate ? fmtDate(t.pickupDate) : 'chưa rõ'}
            </AppText>
          </View>
        </View>
        <Pill tone={st.tone} text={st.label} />
      </View>

      {/* 3 con số tài xế cần để quyết định */}
      <View className="flex-row border-b border-line">
        <View className="flex-[1.5] px-4 py-3">
          <AppText className="text-xs text-ink-subtle">{t.paidAt ? 'Bạn đã nhận' : 'Bạn nhận'}</AppText>
          <AppText weight="extrabold" className="text-xl text-leaf-700">
            {formatVnd(t.netAmount)}
          </AppText>
          <AppText className="text-[10px] text-ink-subtle">
            {t.serviceFeeRate > 0 ? `Cước ${formatVnd(t.feeAmount)}, phí ${Math.round(t.serviceFeeRate * 100)}%` : 'Đủ cước theo bảng giá'}
          </AppText>
        </View>
        <View className="flex-1 border-l border-line px-3 py-3">
          <AppText className="text-xs text-ink-subtle">Chở</AppText>
          <AppText weight="extrabold" className="text-base">
            {formatKg(t.totalKg)}
          </AppText>
        </View>
        <View className="flex-1 border-l border-line px-3 py-3">
          <AppText className="text-xs text-ink-subtle">Đường</AppText>
          <AppText weight="extrabold" className="text-base">
            {t.routeKm != null ? `${Math.round(t.routeKm)} km` : '—'}
          </AppText>
        </View>
      </View>

      <View className="gap-4 p-4">
        {/* Lộ trình: lấy hàng rồi lần lượt từng hub */}
        <View>
          <Stop
            mark={<PackageCheck size={14} color={colors.white} />}
            markCls="bg-amber-500"
            kicker="Lấy hàng"
            title={t.collectionSiteName || 'Điểm tập kết'}
            address={t.collectionSiteAddress}
            href={directionsUrl(t.collectionSiteLatitude, t.collectionSiteLongitude, t.collectionSiteAddress)}
            last={t.stops.length === 0}
            footer={
              t.loadPhotoUrl ? (
                <View className="h-14 w-14 overflow-hidden rounded-xl border border-line">
                  <Image source={{ uri: t.loadPhotoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              ) : null
            }
          />
          {t.stops.map((s, i) => (
            <Stop
              key={`${s.hubId}-${i}`}
              mark={
                <AppText weight="extrabold" className="text-xs text-white">
                  {i + 1}
                </AppText>
              }
              markCls="bg-leaf-700"
              kicker={`Giao ${formatKg(s.kg)}${s.orderCount ? ` · ${s.orderCount} đơn` : ''}`}
              title={s.hubName || 'Hub'}
              address={s.hubAddress}
              href={directionsUrl(s.hubLatitude, s.hubLongitude, s.hubAddress)}
              last={i === t.stops.length - 1}
              footer={
                s.arrivedAt ? (
                  <View className="flex-row items-center gap-2">
                    {!!s.photoUrl && (
                      <View className="h-14 w-14 overflow-hidden rounded-xl border border-line">
                        <Image source={{ uri: s.photoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      </View>
                    )}
                    <AppText weight="bold" className="text-xs text-leaf-700">
                      Đã giao tới hub này
                    </AppText>
                  </View>
                ) : t.status === 'IN_TRANSIT' && s.hubId != null ? (
                  <PhotoConfirm
                    subtitle={`Chụp thùng hàng tại ${s.hubName || 'hub'}`}
                    captureLabel="Chụp ảnh hàng tại hub"
                    confirmLabel={`Đã giao tới ${s.hubName || 'hub'}`}
                    busy={arrive.isPending && arrive.variables?.hubId === s.hubId}
                    onConfirm={(photoUrl) =>
                      arrive.mutate(
                        { id: t.tripId, hubId: s.hubId as number, photoUrl },
                        { onSuccess: () => showToast(`Đã ghi nhận giao tới ${s.hubName || 'hub'}.`), onError: (e) => showToast(getErrorMessage(e, 'Thao tác chưa thành công.')) },
                      )
                    }
                  />
                ) : null
              }
            />
          ))}
        </View>

        {t.status === 'ACCEPTED' && <HubTripBoxes t={t} locked={!t.confirmed || tooEarly} />}
        {!t.confirmed && t.status !== 'DELIVERED' && <Notice>Kế hoạch dự kiến, CapNong xác nhận sau khi cân hàng tại điểm tập kết.</Notice>}
        {actions}
      </View>
    </View>
  )
}

/** Một điểm trên lộ trình, nối với điểm kế tiếp bằng đường kẻ dọc */
function Stop({ mark, markCls, kicker, title, address, href, last, footer }: {
  mark: ReactNode
  markCls: string
  kicker: string
  title: string
  address?: string | null
  href: string | null
  last: boolean
  footer?: ReactNode
}) {
  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View className={`h-7 w-7 items-center justify-center rounded-full ${markCls}`}>{mark}</View>
        {!last && <View className="my-1 w-0.5 flex-1 bg-line" />}
      </View>
      <View className={`min-w-0 flex-1 ${last ? '' : 'pb-4'}`}>
        <AppText weight="bold" className="text-[11px] text-ink-subtle">
          {kicker}
        </AppText>
        <AppText weight="extrabold" className="text-sm">
          {title}
        </AppText>
        {!!address && <AppText className="text-[11px] text-ink-muted">{address}</AppText>}
        {footer && <View className="mt-2">{footer}</View>}
      </View>
      {href && (
        <Pressable accessibilityRole="link" accessibilityLabel={`Chỉ đường tới ${title}`} onPress={() => void Linking.openURL(href)} className="h-9 w-9 items-center justify-center rounded-xl border border-line active:bg-paper">
          <Navigation size={15} color={colors.ink} />
        </Pressable>
      )}
    </View>
  )
}
