import { CheckCircle2, Flame, Package, Truck, type LucideIcon } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { DeliveringActions, ShipperPreOrderCard, useShipperPreOrderAction, useShipperPreOrders } from '@/features/campaign'
import { formatVnd } from '@/features/campaign/utils/campaignFormat'
import type { PreOrderResponse } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'

/** Đơn chiến dịch của tài xế (ShipperCampaignOrders bản web): đang giao, được giao, tại hub chờ nhận */
export default function ShipperCampaignOrdersScreen() {
  const { ready, mine } = useShipperPreOrders()
  const { accept, deliver, fail } = useShipperPreOrderAction()
  const showToast = useUiStore((s) => s.showToast)
  const [refreshing, setRefreshing] = useState(false)

  const onError = (e: unknown) => showToast(getErrorMessage(e, 'Thao tác thất bại.'))
  const all = mine.data ?? []
  const assignedWaiting = all.filter((o) => o.status === 'READY' && !o.pickedUpAt)
  const delivering = all.filter((o) => o.status === 'SHIPPING' || (o.status === 'READY' && o.pickedUpAt))
  const done = all.filter((o) => o.status === 'DELIVERED' || o.status === 'FAILED').slice(0, 10)

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([ready.refetch(), mine.refetch()])
    setRefreshing(false)
  }

  const acceptBtn = (o: PreOrderResponse, title: string, icon: LucideIcon) => (
    <Button
      title={title}
      icon={icon}
      loading={accept.isPending && accept.variables === o.preOrderId}
      onPress={() => accept.mutate(o.preOrderId, { onError, onSuccess: () => showToast('Đã nhận đơn.') })}
    />
  )

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-2">
        <BackButton />
        <AppText weight="extrabold" className="flex-1 text-lg">
          Đơn chiến dịch
        </AppText>
      </View>
      <ScrollView
        contentContainerClassName="gap-7 px-4 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />}
      >
        <Section icon={Truck} title="Đang giao" hint="Đã lấy hàng ở hub, giao tới khách và thu tiền còn lại" empty="Chưa có đơn chiến dịch nào đang giao." loading={mine.isPending} count={delivering.length}>
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
        </Section>

        <Section icon={Package} title="Admin đã giao cho bạn" hint="Tới điểm tập kết lấy hàng rồi bấm Đã lấy hàng" empty="Chưa có đơn nào được giao cho bạn." loading={mine.isPending} count={assignedWaiting.length}>
          {assignedWaiting.map((o) => (
            <ShipperPreOrderCard key={o.preOrderId} o={o} action={acceptBtn(o, 'Đã lấy hàng ở hub', Package)} />
          ))}
        </Section>

        <Section icon={Flame} title="Tại hub chờ nhận" hint="Đơn gấp nằm trên cùng, nhận để giao" empty="Hub chưa có đơn chiến dịch nào chờ shipper." loading={ready.isPending} count={ready.data?.length ?? 0}>
          {(ready.data ?? []).map((o) => (
            <ShipperPreOrderCard key={o.preOrderId} o={o} action={acceptBtn(o, 'Nhận đơn', CheckCircle2)} />
          ))}
        </Section>

        {done.length > 0 && (
          <View className="gap-2">
            <AppText weight="extrabold" className="text-sm uppercase text-ink-subtle">
              Đã xử lý gần đây
            </AppText>
            <View className="rounded-2xl border border-line bg-white">
              {done.map((o, i) => (
                <View key={o.preOrderId} className={`gap-0.5 px-4 py-3 ${i > 0 ? 'border-t border-line' : ''}`}>
                  <AppText weight="bold" className="text-sm">
                    {o.code} · {o.recipientName}
                  </AppText>
                  <AppText weight="bold" className={`text-xs ${o.status === 'DELIVERED' ? 'text-leaf-700' : 'text-sale'}`}>
                    {o.status === 'DELIVERED' ? `Đã giao · thu ${formatVnd(o.remainingAmount)}` : `Thất bại${o.failReason ? `: ${o.failReason}` : ''}`}
                    {Number(o.shipperIncomeAmount ?? 0) > 0 ? ` · cước +${formatVnd(o.shipperIncomeAmount)}` : ''}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({
  icon: Icon,
  title,
  hint,
  empty,
  loading,
  count,
  children,
}: {
  icon: LucideIcon
  title: string
  hint: string
  empty: string
  loading: boolean
  count: number
  children: ReactNode
}) {
  return (
    <View className="gap-3">
      <View className="gap-0.5">
        <View className="flex-row items-center gap-2">
          <Icon size={18} color={colors.leaf700} />
          <AppText weight="extrabold" className="text-base">
            {title}
          </AppText>
          <View className="rounded-full bg-white px-2">
            <AppText weight="extrabold" className="text-xs text-ink-muted">
              {count}
            </AppText>
          </View>
        </View>
        <AppText className="text-xs text-ink-subtle">{hint}</AppText>
      </View>
      {loading ? (
        <Skeleton className="h-32 rounded-panel" />
      ) : count === 0 ? (
        <View className="rounded-2xl border border-dashed border-line bg-white p-6">
          <AppText className="text-center text-sm text-ink-subtle">{empty}</AppText>
        </View>
      ) : (
        children
      )}
    </View>
  )
}
