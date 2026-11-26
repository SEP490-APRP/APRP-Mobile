import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  DeliveringActions,
  groupByHub,
  HubPickupGroup,
  HubRunPicker,
  HubTripCard,
  routeOrder,
  ShipperPreOrderCard,
  useHubTrips,
  useShipperPreOrderAction,
  useShipperPreOrders,
  type CrateTicks,
} from '@/features/campaign'
import { formatKg, formatVnd } from '@/features/campaign/utils/campaignFormat'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

type Tab = 'trips' | 'pick' | 'orders'

/** Đơn chiến dịch của tài xế (ShipperCampaignOrders bản web), chia 3 tab: xe ra hub, nhận đơn ở hub, đơn đang giữ */
export default function ShipperCampaignOrdersScreen() {
  const { ready, mine } = useShipperPreOrders()
  const hubTrips = useHubTrips()
  const { deliver, fail } = useShipperPreOrderAction()
  const showToast = useUiStore((s) => s.showToast)
  const [refreshing, setRefreshing] = useState(false)
  const [picked, setPicked] = useState<Tab | null>(null)
  const [ticks, setTicks] = useState<CrateTicks>({})
  const [showDeclined, setShowDeclined] = useState(false)

  const onError = (e: unknown) => showToast(getErrorMessage(e, 'Thao tác thất bại.'))
  const all = mine.data ?? []
  // READY chưa lấy khỏi hub; SHIPPING (hoặc đơn cũ READY đã lấy) là đang giao
  const waiting = all.filter((o) => o.status === 'READY' && !o.pickedUpAt)
  const carrying = all.filter((o) => o.status === 'SHIPPING' || (o.status === 'READY' && o.pickedUpAt))
  // Đang giao xếp theo đường ngắn, xuất phát từ hub của đơn đầu tiên
  const first = carrying[0]
  const delivering = routeOrder(first?.hubLatitude != null ? [Number(first.hubLatitude), Number(first.hubLongitude)] : null, carrying)
  const done = all.filter((o) => o.status === 'DELIVERED' || o.status === 'FAILED').slice(0, 10)
  const tripsMine = (hubTrips.mine.data ?? []).filter((t) => t.status !== 'DELIVERED')
  const tripsDone = (hubTrips.mine.data ?? []).filter((t) => t.status === 'DELIVERED').slice(0, 5)
  const tripsOpen = (hubTrips.open.data ?? []).filter((t) => !t.declined)
  const tripsDeclined = (hubTrips.open.data ?? []).filter((t) => t.declined)

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'trips', label: 'Chuyến xe', count: tripsMine.length + tripsOpen.length },
    { id: 'pick', label: 'Nhận đơn', count: ready.data?.length ?? 0 },
    { id: 'orders', label: 'Đơn của tôi', count: waiting.length + delivering.length },
  ]
  // Lần đầu có dữ liệu: mở tab đang có việc của mình trước, sau đó giữ nguyên để không tự nhảy tab
  const auto: Tab = waiting.length + delivering.length > 0 ? 'orders' : tripsMine.length + tripsOpen.length > 0 ? 'trips' : 'pick'
  if (!picked && !mine.isPending && !hubTrips.mine.isPending && !hubTrips.open.isPending) setPicked(auto)
  const tab = picked ?? auto

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([ready.refetch(), mine.refetch(), hubTrips.open.refetch(), hubTrips.mine.refetch()])
    setRefreshing(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-2">
        <BackButton />
        <AppText weight="extrabold" className="flex-1 text-lg">
          Đơn chiến dịch
        </AppText>
      </View>
      <View className="mx-4 mb-3 flex-row rounded-xl bg-slate-200/70 p-1">
        {tabs.map((t) => {
          const on = tab === t.id
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setPicked(t.id)}
              className={cn('min-h-[40px] flex-1 flex-row items-center justify-center gap-1.5 rounded-lg', on && 'bg-white')}
            >
              <AppText weight="bold" className={cn('text-xs', on ? 'text-leaf-800' : 'text-ink-muted')}>
                {t.label}
              </AppText>
              {t.count > 0 && (
                <View className="h-5 min-w-5 items-center justify-center rounded-full bg-sale px-1">
                  <AppText weight="extrabold" className="text-[11px] text-white">
                    {t.count}
                  </AppText>
                </View>
              )}
            </Pressable>
          )
        })}
      </View>
      <ScrollView
        contentContainerClassName="gap-6 px-4 pb-12"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />}
      >
        {tab === 'trips' &&
          (hubTrips.open.isPending || hubTrips.mine.isPending ? (
            <Skeleton className="h-60 rounded-panel" />
          ) : (
            <>
              {tripsMine.length + tripsOpen.length === 0 && <Empty text="Chưa có chuyến xe ra hub nào." />}
              {tripsMine.length > 0 && (
                <Group title="Chuyến của bạn">
                  {tripsMine.map((t) => (
                    <HubTripCard key={t.tripId} t={t} />
                  ))}
                </Group>
              )}
              {tripsOpen.length > 0 && (
                <Group title="Đang chờ tài xế">
                  {tripsOpen.map((t) => (
                    <HubTripCard key={t.tripId} t={t} />
                  ))}
                </Group>
              )}
              {tripsDeclined.length > 0 && (
                <View className="gap-3">
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDeclined }} onPress={() => setShowDeclined((x) => !x)} className="flex-row items-center gap-1.5 py-1">
                    <AppText weight="bold" className="flex-1 text-sm text-ink-muted">
                      Chuyến bạn không nhận ({tripsDeclined.length})
                    </AppText>
                    {showDeclined ? <ChevronUp size={18} color={colors.inkMuted} /> : <ChevronDown size={18} color={colors.inkMuted} />}
                  </Pressable>
                  {showDeclined && tripsDeclined.map((t) => <HubTripCard key={t.tripId} t={t} />)}
                </View>
              )}
              {tripsDone.length > 0 && (
                <Group title="Đã giao tới hub">
                  <History
                    rows={tripsDone.map((t) => ({
                      key: t.tripId,
                      title: `Xe ${t.tripNo} · ${t.campaignTitle}`,
                      note: `${formatKg(t.totalKg)} · cước +${formatVnd(t.netAmount)}`,
                    }))}
                  />
                </Group>
              )}
            </>
          ))}

        {tab === 'pick' &&
          (ready.isPending ? (
            <Skeleton className="h-60 rounded-panel" />
          ) : (ready.data?.length ?? 0) === 0 ? (
            <Empty text="Chưa có đơn nào. Đơn chỉ hiện sau khi hub xác nhận đã nhận hàng." />
          ) : (
            <HubRunPicker orders={ready.data ?? []} />
          ))}

        {tab === 'orders' &&
          (mine.isPending ? (
            <Skeleton className="h-60 rounded-panel" />
          ) : (
            <>
              {waiting.length + delivering.length === 0 && <Empty text="Bạn chưa giữ đơn nào. Qua tab Nhận đơn để chọn." />}
              {waiting.length > 0 && (
                <Group title="Cần lấy ở hub">
                  {groupByHub(waiting).map((hub) => (
                    <HubPickupGroup key={hub.hubId} hub={hub} ticks={ticks} onTick={(id, crates) => setTicks((x) => ({ ...x, [id]: crates }))} />
                  ))}
                </Group>
              )}
              {delivering.length > 0 && (
                <Group title="Đang giao · theo thứ tự nên đi">
                  {delivering.map((o) => (
                    <ShipperPreOrderCard
                      key={o.preOrderId}
                      o={o}
                      action={
                        <DeliveringActions
                          o={o}
                          busy={(deliver.isPending && deliver.variables?.id === o.preOrderId) || (fail.isPending && fail.variables?.id === o.preOrderId)}
                          onDeliver={(pod) => deliver.mutate({ id: o.preOrderId, pod }, { onError, onSuccess: () => showToast('Đã giao xong đơn.') })}
                          onFail={(reason) => fail.mutate({ id: o.preOrderId, reason }, { onError, onSuccess: () => showToast('Đã báo giao thất bại.') })}
                        />
                      }
                    />
                  ))}
                </Group>
              )}
              {done.length > 0 && (
                <Group title="Đã xử lý gần đây">
                  <History
                    rows={done.map((o) => ({
                      key: o.preOrderId,
                      title: `${o.code} · ${o.recipientName}`,
                      note: `${o.status === 'DELIVERED' ? `Đã giao · thu ${formatVnd(o.remainingAmount)}` : `Thất bại${o.failReason ? `: ${o.failReason}` : ''}`}${
                        Number(o.shipperIncomeAmount ?? 0) > 0 ? ` · cước +${formatVnd(o.shipperIncomeAmount)}` : ''
                      }`,
                      bad: o.status !== 'DELIVERED',
                    }))}
                  />
                </Group>
              )}
            </>
          ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <AppText accessibilityRole="header" weight="extrabold" className="text-sm text-ink-muted">
        {title}
      </AppText>
      {children}
    </View>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <View className="rounded-2xl border border-dashed border-line bg-white p-6">
      <AppText className="text-center text-sm text-ink-subtle">{text}</AppText>
    </View>
  )
}

function History({ rows }: { rows: { key: number; title: string; note: string; bad?: boolean }[] }) {
  return (
    <View className="rounded-2xl border border-line bg-white">
      {rows.map((r, i) => (
        <View key={r.key} className={cn('gap-0.5 px-4 py-3', i > 0 && 'border-t border-line')}>
          <AppText weight="bold" className="text-sm">
            {r.title}
          </AppText>
          <AppText weight="bold" className={cn('text-xs', r.bad ? 'text-sale' : 'text-leaf-700')}>
            {r.note}
          </AppText>
        </View>
      ))}
    </View>
  )
}
