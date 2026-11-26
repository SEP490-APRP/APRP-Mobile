import { Check, Navigation, Package, Warehouse } from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import type { PreOrderResponse } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { useShipperCapacity, useShipperPreOrderAction } from '../hooks/useCampaignQueries'
import { formatKg, formatVnd, hubConfirmText } from '../utils/campaignFormat'
import {
  blockedReason,
  codOf,
  feeOf,
  groupByHub,
  kgOf,
  limitsOf,
  mapsRoute,
  pointOf,
  roadKm,
  routeKm,
  routeOrder,
  runTotals,
  suggestRun,
  type SuggestMode,
} from '../utils/hubRun'

const MODES: { id: SuggestMode; label: string }[] = [
  { id: 'near', label: 'Gần nhau' },
  { id: 'fee', label: 'Cước cao nhất' },
  { id: 'urgent', label: 'Đơn gấp trước' },
]

/** Đơn tại hub: tài xế chọn hub, tick nhiều đơn hoặc bấm gợi ý, rồi nhận cả chuyến một lần */
export function HubRunPicker({ orders }: { orders: PreOrderResponse[] }) {
  const capacity = useShipperCapacity()
  const { acceptBatch } = useShipperPreOrderAction()
  const showToast = useUiStore((s) => s.showToast)
  const [hubId, setHubId] = useState<number | null>(null)
  const [ids, setIds] = useState<number[]>([])
  const [mode, setMode] = useState<SuggestMode | null>(null)

  const groups = groupByHub(orders)
  const hub = groups.find((g) => g.hubId === hubId) ?? groups[0]
  if (!hub) return null
  const limits = capacity.data ? limitsOf(capacity.data) : null
  const picked = routeOrder(hub.point, hub.orders.filter((o) => ids.includes(o.preOrderId)))
  const rest = hub.orders
    .filter((o) => !ids.includes(o.preOrderId))
    .sort((a, b) => (roadKm(hub.point, pointOf(a)) || 0) - (roadKm(hub.point, pointOf(b)) || 0))
  const totals = runTotals(picked)
  const km = routeKm(hub.point, picked)
  const link = picked.length ? mapsRoute(hub.point, picked) : null
  const overLimit = !!limits && (totals.kg > limits.kg || totals.cod > limits.cod)

  const reset = () => {
    setIds([])
    setMode(null)
  }
  const suggest = (m: SuggestMode) => {
    if (!limits) return
    const next = suggestRun(hub.point, hub.orders, m, limits)
    setMode(m)
    setIds(next)
    if (!next.length) showToast('Không có đơn nào vừa sức chở và số dư ví hiện tại.')
  }
  const toggle = (id: number) => {
    setMode(null)
    setIds((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]))
  }
  const accept = () =>
    acceptBatch.mutate(
      picked.map((o) => o.preOrderId),
      {
        onSuccess: () => {
          reset()
          showToast('Đã nhận đơn. Tới hub lấy đủ thùng rồi giao.')
        },
        onError: (e) => showToast(getErrorMessage(e, 'Chưa nhận được chuyến.')),
      },
    )

  const row = (o: PreOrderResponse, index: number | null) => {
    const on = index != null
    const blocked = !on && limits ? blockedReason(o, picked, limits) : null
    const dist = roadKm(hub.point, pointOf(o))
    return (
      <Pressable
        key={o.preOrderId}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on, disabled: !!blocked }}
        disabled={!!blocked}
        onPress={() => toggle(o.preOrderId)}
        className={`flex-row items-start gap-3 border-t border-line px-4 py-3 ${on ? 'bg-leaf-50' : ''} ${blocked ? 'opacity-50' : 'active:bg-paper'}`}
      >
        <View className={`h-6 w-6 items-center justify-center rounded-full ${on ? 'bg-leaf-700' : 'border-2 border-line'}`}>
          {on && (
            <AppText weight="extrabold" className="text-xs text-white">
              {index + 1}
            </AppText>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" className="text-sm">
            {o.recipientName}
            {o.priorityLevel === 'URGENT' ? ' · Gấp' : ''}
          </AppText>
          <AppText className="text-xs text-ink-muted">{o.shippingAddress}</AppText>
          <AppText className="text-[11px] text-ink-subtle">
            {formatKg(kgOf(o))}
            {Number.isFinite(dist) ? ` · cách hub ${dist.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km` : ''} · thu hộ {formatVnd(codOf(o))}
          </AppText>
          {!!hubConfirmText(o) && (
            <AppText weight="bold" className="text-[11px] text-leaf-700">
              ✓ {hubConfirmText(o)}
            </AppText>
          )}
          {!!blocked && (
            <AppText weight="bold" className="text-[11px] text-sale">
              {blocked}
            </AppText>
          )}
        </View>
        <AppText weight="extrabold" className="text-sm text-leaf-700">
          +{formatVnd(feeOf(o))}
        </AppText>
      </Pressable>
    )
  }

  return (
    <View className="overflow-hidden rounded-panel border border-line bg-white">
      {capacity.data && limits && (
        <View className="bg-paper px-4 py-2.5">
          <AppText className="text-xs text-ink-muted">
            {capacity.data.vehicleLabel}: còn chở được {formatKg(limits.kg)} / {formatKg(capacity.data.capacityKg)} · ví còn ký quỹ được {formatVnd(limits.cod)}
          </AppText>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 p-3">
        {groups.map((g) => {
          const on = g.hubId === hub.hubId
          return (
            <Pressable
              key={g.hubId}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setHubId(g.hubId)
                reset()
              }}
              className={`flex-row items-center gap-1.5 rounded-2xl px-3.5 py-2 ${on ? 'bg-leaf-700' : 'bg-paper'}`}
            >
              <Warehouse size={14} color={on ? colors.white : colors.ink} />
              <AppText weight="bold" className={`text-sm ${on ? 'text-white' : ''}`}>
                {g.name} ({g.orders.length})
              </AppText>
            </Pressable>
          )
        })}
      </ScrollView>
      <View className="flex-row flex-wrap items-center gap-2 px-4 pb-3">
        <AppText weight="bold" className="text-xs text-ink-subtle">
          Gợi ý chuyến
        </AppText>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            disabled={!limits}
            onPress={() => suggest(m.id)}
            className={`rounded-full border px-3 py-1.5 ${mode === m.id ? 'border-leaf-700 bg-sun-300' : 'border-line'}`}
          >
            <AppText weight="bold" className="text-xs">
              {m.label}
            </AppText>
          </Pressable>
        ))}
        {ids.length > 0 && (
          <Pressable onPress={reset} className="ml-auto py-1.5">
            <AppText weight="bold" className="text-xs text-ink-muted underline">
              Bỏ chọn
            </AppText>
          </Pressable>
        )}
      </View>
      {!!hub.address && <AppText className="px-4 pb-2 text-[11px] text-ink-subtle">Lấy hàng tại: {hub.address}</AppText>}

      {picked.map((o, i) => row(o, i))}
      {rest.map((o) => row(o, null))}

      <View className="gap-3 border-t border-line bg-paper p-4">
        <View className="flex-row flex-wrap gap-2">
          <Tile label="Tải" value={limits ? `${formatKg(totals.kg)} / ${formatKg(limits.kg)}` : formatKg(totals.kg)} />
          <Tile label="Bạn nhận" value={formatVnd(totals.fee)} cls="text-leaf-700" />
          <Tile label="Thu hộ cần giữ" value={formatVnd(totals.cod)} cls="text-amber-700" />
          <Tile label="Quãng đường" value={picked.length && km != null ? `~${km.toLocaleString('vi-VN')} km` : '—'} />
        </View>
        {link && (
          <Pressable onPress={() => void Linking.openURL(link)} className="flex-row items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-2.5">
            <Navigation size={15} color={colors.ink} />
            <AppText weight="bold" className="text-sm">
              Xem lộ trình
            </AppText>
          </Pressable>
        )}
        <Button
          title={picked.length ? `Nhận ${picked.length} đơn` : 'Chọn đơn để nhận'}
          icon={picked.length ? Check : Package}
          disabled={!picked.length || overLimit}
          loading={acceptBatch.isPending}
          onPress={accept}
        />
      </View>
    </View>
  )
}

function Tile({ label, value, cls = '' }: { label: string; value: string; cls?: string }) {
  return (
    <View className="min-w-[46%] flex-1 rounded-xl border border-line bg-white px-3 py-2">
      <AppText className="text-[11px] text-ink-subtle">{label}</AppText>
      <AppText weight="extrabold" className={`text-sm ${cls}`}>
        {value}
      </AppText>
    </View>
  )
}
