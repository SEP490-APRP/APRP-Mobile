import { router } from 'expo-router'
import { ChevronRight, LocateOff, Power, RefreshCw, Truck, Zap } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, BottomSheet, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { orderIdOf } from '@/features/order/utils/orderStatus'
import { money } from '@/features/product'
import { useMyProfile } from '@/features/profile'
import {
  codToCollect,
  formatKm,
  orderLegs,
  ShipperOrderCard,
  shipperErrorMessage,
  sortReadyOrders,
  useAcceptOrder,
  useActiveOrders,
  useCurrentPosition,
  useReadyOrders,
  useShipperStatus,
  useToggleOnline,
} from '@/features/shipper'
import { useAuth, useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { OrderResponse } from '@/types/order.types'
import { cn } from '@/utils/helpers'

/** Đơn mới của Shipper, chuyển từ thẻ "Đơn hàng mới" trong pages/shipper/Dashboard.tsx. */
export default function ShipperHome() {
  const { user } = useAuth()
  const profile = useMyProfile()
  const status = useShipperStatus()
  const toggle = useToggleOnline()
  const gps = useCurrentPosition()
  const online = status.data?.online === true
  const ready = useReadyOrders(online)
  const active = useActiveOrders()
  const accept = useAcceptOrder()
  const showToast = useUiStore((s) => s.showToast)
  const [picked, setPicked] = useState<OrderResponse | null>(null)

  const name = profile.data?.fullName || user?.name || 'Tài xế'
  const current = active.data?.[0]
  const busy = current != null
  const orders = useMemo(() => sortReadyOrders(ready.data?.content ?? [], gps.position), [ready.data, gps.position])

  const switchOnline = async () => {
    if (online) {
      toggle.mutate(
        { online: false },
        {
          onSuccess: () => showToast('Đã tắt nhận đơn. Nghỉ ngơi chút nhé!'),
          onError: (e) => showToast(shipperErrorMessage(e, 'Chưa tắt được, thử lại nhé.')),
        },
      )
      return
    }
    const at = gps.position ?? (await gps.refresh())
    if (!at) return showToast('Cần bật quyền vị trí để hệ thống tìm đơn quanh bạn.')
    toggle.mutate(
      { online: true, at },
      {
        onSuccess: () => showToast('Đã bật nhận đơn. Đơn sẵn sàng sẽ hiện ngay bên dưới.'),
        onError: (e) => showToast(shipperErrorMessage(e, 'Chưa bật được, thử lại nhé.')),
      },
    )
  }

  const confirmAccept = () => {
    if (!picked) return
    const id = orderIdOf(picked)
    accept.mutate(id, {
      onSuccess: () => {
        setPicked(null)
        showToast(`Đã nhận đơn #${id}. Đến nhà vườn lấy hàng nhé!`)
        router.navigate('/shipper/delivering')
      },
      onError: (e) => {
        setPicked(null)
        showToast(shipperErrorMessage(e, 'Chưa nhận được đơn, thử lại nhé.'))
      },
    })
  }

  const refreshing = ready.isRefetching || active.isRefetching || status.isRefetching
  const refresh = () => {
    void status.refetch()
    void active.refetch()
    if (online) void ready.refetch()
    void gps.refresh()
  }

  const header = (
    <View className="gap-4 bg-leaf-800 px-5 pb-5 pt-3">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
          <AppText weight="extrabold" className="text-lg text-sun-300">
            {name.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-xs text-white/70">Xin chào,</AppText>
          <AppText weight="extrabold" numberOfLines={1} className="text-lg text-white">
            {name}
          </AppText>
        </View>
      </View>
      <Pressable
        onPress={() => void switchOnline()}
        disabled={toggle.isPending || status.isPending}
        accessibilityRole="switch"
        accessibilityState={{ checked: online, busy: toggle.isPending }}
        accessibilityLabel={online ? 'Đang nhận đơn, chạm để tắt' : 'Đang nghỉ, chạm để bật nhận đơn'}
        className={cn(
          'min-h-[56px] flex-row items-center gap-3 rounded-2xl px-4',
          online ? 'bg-white' : 'bg-white/10 active:bg-white/20',
        )}
      >
        <View className={cn('h-3 w-3 rounded-full', online ? 'bg-leaf-500' : 'bg-white/40')} />
        <View className="flex-1">
          <AppText weight="bold" className={cn('text-base', online ? 'text-leaf-800' : 'text-white')}>
            {status.isPending ? 'Đang kiểm tra…' : online ? 'Đang nhận đơn' : 'Đang nghỉ'}
          </AppText>
          <AppText className={cn('text-xs', online ? 'text-ink-muted' : 'text-white/70')}>
            {online ? 'Chạm để tạm nghỉ' : 'Chạm để bật và xem đơn quanh bạn'}
          </AppText>
        </View>
        {toggle.isPending ? (
          <ActivityIndicator color={online ? colors.leaf700 : colors.white} />
        ) : (
          <Power size={20} color={online ? colors.leaf700 : colors.white} />
        )}
      </Pressable>
    </View>
  )

  const banner = current ? (
    <Pressable
      onPress={() => router.navigate('/shipper/delivering')}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-panel bg-amber-50 p-4 active:opacity-80"
    >
      <Truck size={20} color="#92400e" />
      <View className="flex-1">
        <AppText weight="bold" className="text-sm text-amber-900">
          Bạn đang giao đơn #{orderIdOf(current)}
        </AppText>
        <AppText className="text-xs text-amber-800">
          {current.status === 'SHIPPING' ? 'Đến nhà vườn lấy hàng' : 'Đã lấy hàng, đang giao cho khách'} · giao xong mới
          nhận được đơn mới
        </AppText>
      </View>
      <ChevronRight size={18} color="#92400e" />
    </Pressable>
  ) : null

  const gpsNote =
    online && (gps.state === 'denied' || gps.state === 'error') ? (
      <Pressable
        onPress={() => void gps.refresh()}
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-panel border border-line bg-white p-4"
      >
        <LocateOff size={18} color={colors.inkMuted} />
        <AppText className="flex-1 text-sm text-ink-muted">
          Chưa lấy được vị trí nên chưa tính được quãng đường đến nhà vườn. Chạm để thử lại.
        </AppText>
      </Pressable>
    ) : null

  let empty
  if (status.isPending || (online && ready.isPending)) {
    empty = (
      <View className="gap-3">
        <Skeleton className="h-60 rounded-panel" />
        <Skeleton className="h-60 rounded-panel" />
      </View>
    )
  } else if (status.isError || ready.isError) {
    empty = <ErrorState onRetry={refresh} />
  } else if (!online) {
    empty = (
      <View className="items-center gap-3 rounded-panel border border-line bg-white px-6 py-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <Zap size={28} color="#b45309" />
        </View>
        <AppText weight="extrabold" className="text-center text-lg">
          Bạn đang nghỉ
        </AppText>
        <AppText className="text-center text-sm leading-relaxed text-ink-muted">
          Bật nhận đơn để thấy các đơn nhà vườn đã đóng gói xong và đang chờ người giao.
        </AppText>
        <Button
          title="Bật nhận đơn"
          icon={Power}
          loading={toggle.isPending}
          onPress={() => void switchOnline()}
          className="mt-2 min-h-[48px] self-stretch"
        />
      </View>
    )
  } else {
    empty = (
      <EmptyState
        icon={<RefreshCw size={28} color={colors.leaf600} />}
        title="Chưa có đơn nào sẵn sàng"
        description="Danh sách tự làm mới mỗi 20 giây. Kéo xuống để tải lại ngay."
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-leaf-800" edges={['top']}>
      <FlatList
        className="bg-paper"
        data={online && !ready.isError ? orders : []}
        keyExtractor={(o) => String(orderIdOf(o))}
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.white}
            colors={[colors.leaf700]}
          />
        }
        ListHeaderComponent={
          <View>
            {header}
            <View className="gap-3 px-4 pt-4">
              {banner}
              {gpsNote}
              {online && ready.data && (
                <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
                  {orders.length} đơn chờ giao{gps.position ? ' · gần bạn trước' : ''}
                </AppText>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={<View className="px-4 pt-3">{empty}</View>}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item, index }) => (
          <View className={cn('px-4', index === 0 && 'pt-3')}>
            <ShipperOrderCard
              order={item}
              me={gps.position}
              footer={
                <Button
                  title={busy ? 'Giao xong đơn hiện tại để nhận thêm' : 'Nhận đơn này'}
                  icon={busy ? undefined : ChevronRight}
                  disabled={busy}
                  onPress={() => setPicked(item)}
                  className={cn('min-h-[48px]', busy && 'opacity-50')}
                />
              }
            />
          </View>
        )}
      />

      <BottomSheet
        visible={picked != null}
        onClose={() => !accept.isPending && setPicked(null)}
        title={picked ? `Nhận đơn #${orderIdOf(picked)}?` : 'Nhận đơn'}
        subtitle="Sau khi nhận, đến nhà vườn lấy hàng rồi giao cho khách"
        footer={
          <>
            <Button
              title="Để sau"
              variant="outline"
              disabled={accept.isPending}
              onPress={() => setPicked(null)}
              className="min-h-[48px] flex-1"
            />
            <Button
              title="Nhận đơn"
              loading={accept.isPending}
              onPress={confirmAccept}
              className="min-h-[48px] flex-1"
            />
          </>
        }
      >
        {picked && <AcceptSummary order={picked} me={gps.position} />}
      </BottomSheet>
    </SafeAreaView>
  )
}

function AcceptSummary({ order, me }: { order: OrderResponse; me: Parameters<typeof orderLegs>[1] }) {
  const legs = orderLegs(order, me)
  const cod = codToCollect(order)
  const rows: [string, string][] = [
    ['Lấy hàng tại', order.shopName || '—'],
    ['Giao cho', `${order.recipientName} · ${order.recipientPhone}`],
    ['Quãng đường', legs.total != null ? `~${formatKm(legs.total)} (cả 2 chặng)` : `Giao ${formatKm(legs.toBuyer)}`],
    ['Phí ship bạn nhận', money(Number(order.shippingFee ?? 0))],
    ['Thu của khách', cod > 0 ? money(cod) : 'Không (đã trả trước)'],
  ]
  return (
    <View className="gap-3">
      {rows.map(([k, v]) => (
        <View key={k} className="flex-row justify-between gap-4">
          <AppText className="text-sm text-ink-muted">{k}</AppText>
          <AppText weight="bold" className="flex-1 text-right text-sm">
            {v}
          </AppText>
        </View>
      ))}
      {cod > 0 && (
        <View className="rounded-card bg-amber-50 p-3">
          <AppText className="text-sm leading-relaxed text-amber-900">
            Đơn trả khi nhận hàng: nhớ thu đủ {money(cod)} của khách trước khi bấm giao thành công.
          </AppText>
        </View>
      )}
    </View>
  )
}
