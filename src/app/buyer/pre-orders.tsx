import { router } from 'expo-router'
import { Flame } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  DamageClaimSheet,
  PRE_ORDER_FILTERS,
  PreOrderCard,
  useCancelPreOrder,
  useDepositCheckout,
  useMyPreOrders,
} from '@/features/campaign'
import type { PreOrderResponse } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/** Đơn đặt trước chiến dịch của người mua (phần pre-order trong BuyerOrdersView bản web) */
export default function PreOrdersScreen() {
  const q = useMyPreOrders()
  const cancel = useCancelPreOrder()
  const payDeposit = useDepositCheckout()
  const showToast = useUiStore((s) => s.showToast)
  const [filter, setFilter] = useState('ALL')
  const [payingId, setPayingId] = useState<number | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<PreOrderResponse | null>(null)
  const [claiming, setClaiming] = useState<PreOrderResponse | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const statuses = PRE_ORDER_FILTERS.find((f) => f.id === filter)?.statuses
  const list = useMemo(() => (q.data ?? []).filter((p) => !statuses || statuses.includes(p.status)), [q.data, statuses])

  const refresh = async () => {
    setRefreshing(true)
    await q.refetch()
    setRefreshing(false)
  }

  const pay = async (p: PreOrderResponse) => {
    setPayingId(p.preOrderId)
    try {
      const checked = await payDeposit(p)
      showToast(checked && checked.status !== 'PENDING' ? 'Đã nhận tiền cọc.' : 'Chưa nhận được tiền cọc. Kéo xuống để tải lại sau ít phút.')
    } catch (e) {
      showToast(getErrorMessage(e, 'Chưa mở được cổng PayOS.'))
    } finally {
      setPayingId(null)
    }
  }

  const doCancel = async () => {
    if (!confirmCancel) return
    try {
      await cancel.mutateAsync(confirmCancel.preOrderId)
      showToast('Đã huỷ đơn đặt trước.')
    } catch (e) {
      showToast(getErrorMessage(e, 'Huỷ đơn không thành công.'))
    } finally {
      setConfirmCancel(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-2">
        <BackButton />
        <AppText weight="extrabold" className="flex-1 text-lg">
          Đơn đặt trước chiến dịch
        </AppText>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 pb-3">
          {PRE_ORDER_FILTERS.map((f) => {
            const on = f.id === filter
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                className={cn('rounded-full border px-3.5 py-1.5', on ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white')}
              >
                <AppText weight="bold" className={cn('text-xs', on ? 'text-white' : 'text-ink')}>
                  {f.label}
                </AppText>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
      <FlatList
        data={list}
        keyExtractor={(p) => String(p.preOrderId)}
        contentContainerClassName="gap-4 px-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />}
        renderItem={({ item }) => (
          <PreOrderCard
            p={item}
            campaignHref={`/buyer/campaign/${item.campaignId}`}
            paying={payingId === item.preOrderId}
            cancelling={cancel.isPending && cancel.variables === item.preOrderId}
            onPay={() => void pay(item)}
            onCancel={() => setConfirmCancel(item)}
            onClaim={() => setClaiming(item)}
          />
        )}
        ListEmptyComponent={
          q.isPending ? (
            <View className="gap-4">
              <Skeleton className="h-56 rounded-panel" />
              <Skeleton className="h-56 rounded-panel" />
            </View>
          ) : q.isError ? (
            <ErrorState onRetry={() => void q.refetch()} />
          ) : (
            <EmptyState
              icon={<Flame size={32} color={colors.leaf600} />}
              title="Chưa có đơn đặt trước nào"
              description="Đặt trước thùng nông sản trong các chiến dịch giải cứu để giúp nhà vườn."
              action={<Button title="Xem chiến dịch" onPress={() => router.push('/buyer/campaigns' as never)} />}
            />
          )
        }
      />
      <ConfirmDialog
        visible={!!confirmCancel}
        title="Huỷ đơn đặt trước?"
        message={confirmCancel ? `Đơn ${confirmCancel.code} chưa cọc sẽ bị huỷ.` : undefined}
        confirmLabel="Huỷ đơn"
        cancelLabel="Giữ lại"
        destructive
        loading={cancel.isPending}
        onConfirm={() => void doCancel()}
        onCancel={() => setConfirmCancel(null)}
      />
      <DamageClaimSheet
        p={claiming}
        onClose={() => setClaiming(null)}
        onDone={() => {
          setClaiming(null)
          void q.refetch()
        }}
      />
    </SafeAreaView>
  )
}
