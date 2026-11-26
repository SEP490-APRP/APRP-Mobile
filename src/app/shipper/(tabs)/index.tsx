import { router, useLocalSearchParams } from 'expo-router'
import { ChevronRight, LocateOff, Power, RefreshCw, Truck, Zap } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, BackHandler, FlatList, Pressable, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, BottomSheet, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { CampaignEntryCard } from '@/features/campaign'
import { orderIdOf } from '@/features/order/utils/orderStatus'
import { money } from '@/features/product'
import { useMyProfile } from '@/features/profile'
import {
  codReserveCheck,
  codToCollect,
  DEFAULT_SHIPPER_COORDS,
  formatKm,
  orderLegs,
  ShipperOrderCard,
  shipperErrorCode,
  shipperErrorMessage,
  sortReadyOrders,
  useAcceptOrder,
  useActiveOrders,
  useCurrentPosition,
  useReadyOrders,
  useShipperAvailableReturns,
  useShipperAcceptReturn,
  useShipperMyReturns,
  useShipperStatus,
  useToggleOnline,
} from '@/features/shipper'
import { TopupSheet, useMyWallet } from '@/features/wallet'
import { NotificationBellButton } from '@/features/notification'
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
  const ready = useReadyOrders(online, gps.position)
  const wallet = useMyWallet()
  const [topupOpen, setTopupOpen] = useState(false)
  const active = useActiveOrders()
  const accept = useAcceptOrder()
  const showToast = useUiStore((s) => s.showToast)
  const [picked, setPicked] = useState<OrderResponse | null>(null)
  const [switching, setSwitching] = useState(false)
  const isToggling = toggle.isPending || switching

  const params = useLocalSearchParams<{ type?: string }>()
  const [orderType, setOrderType] = useState<'DELIVERY' | 'RETURNS'>(params.type === 'RETURNS' ? 'RETURNS' : 'DELIVERY')
  useEffect(() => {
    if (params.type === 'RETURNS' || params.type === 'DELIVERY') {
      setOrderType(params.type)
    }
  }, [params.type])

  const returnsQuery = useShipperAvailableReturns(online)
  const myReturnsQuery = useShipperMyReturns()
  const acceptReturn = useShipperAcceptReturn()
  const returnsList = returnsQuery.data ?? []

  const name = profile.data?.fullName || user?.name || 'Tài xế'
  const current = active.data?.[0]
  const activeReturn = (myReturnsQuery.data ?? []).find(
    (r) => r.status === 'RETURN_SHIPPING' || r.status === 'RETURN_PICKED_UP',
  )
  const busy = current != null || activeReturn != null
  const orders = useMemo(() => sortReadyOrders(ready.data?.content ?? [], gps.position), [ready.data, gps.position])
  const available = wallet.data?.availableBalance ?? wallet.data?.balance
  const reserve = picked ? codReserveCheck(picked, available) : { required: 0, missing: 0 }

  useEffect(() => {
    let lastBackPress = 0
    const onBackPress = () => {
      const now = Date.now()
      if (now - lastBackPress < 2000) {
        BackHandler.exitApp()
        return true
      }
      lastBackPress = now
      showToast('Nhấn lần nữa để thoát ứng dụng')
      return true
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => sub.remove()
  }, [showToast])

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

    setSwitching(true)
    let at = gps.position
    if (!at) {
      try {
        at = await gps.refresh()
      } catch {
        at = null
      }
    }
    setSwitching(false)

    // Nếu không lấy được GPS (máy ảo / tắt định vị / từ chối quyền), fallback sang tọa độ mặc định TP.HCM
    // để tài xế không bị kẹt và có thể nhận đơn như trên bản Web
    const targetCoords = at ?? DEFAULT_SHIPPER_COORDS
    toggle.mutate(
      { online: true, at: targetCoords },
      {
        onSuccess: () =>
          showToast(
            at
              ? 'Đã bật nhận đơn. Đơn sẵn sàng sẽ hiện ngay bên dưới.'
              : 'Đã bật nhận đơn (vị trí mặc định). Hãy bật GPS để tính quãng đường chính xác.',
          ),
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
        // Thiếu tiền ký quỹ: giữ tấm nhận đơn để tài xế bấm Nạp ví
        if (shipperErrorCode(e) !== 16013) setPicked(null)
        void wallet.refetch()
        showToast(shipperErrorMessage(e, 'Chưa nhận được đơn, thử lại nhé.'))
      },
    })
  }

  const refreshing = ready.isRefetching || active.isRefetching || status.isRefetching || returnsQuery.isRefetching
  const refresh = async () => {
    void status.refetch()
    void active.refetch()
    await gps.refresh()
    if (online) {
      void ready.refetch()
      void returnsQuery.refetch()
    }
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
        <NotificationBellButton role="shipper" variant="translucent" />
      </View>
      <Pressable
        onPress={() => void switchOnline()}
        disabled={isToggling || status.isPending}
        accessibilityRole="switch"
        accessibilityState={{ checked: online, busy: isToggling }}
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
        {isToggling ? (
          <ActivityIndicator color={online ? colors.leaf700 : colors.white} />
        ) : (
          <Power size={20} color={online ? colors.leaf700 : colors.white} />
        )}
      </Pressable>
    </View>
  )

  const activeBannerItem = current ?? activeReturn
  const banner = activeBannerItem ? (
    <Pressable
      onPress={() => router.navigate('/shipper/delivering')}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-panel bg-amber-50 p-4 active:opacity-80"
    >
      <Truck size={20} color="#92400e" />
      <View className="flex-1">
        <AppText weight="bold" className="text-sm text-amber-900">
          {current
            ? current.status === 'RETURNING_TO_SHOP'
              ? `Đang hoàn hàng đơn #${orderIdOf(current)}`
              : `Bạn đang giao đơn #${orderIdOf(current)}`
            : `Đang thực hiện đơn hoàn trả #${activeReturn!.id}`}
        </AppText>
        <AppText className="text-xs text-amber-800">
          {current
            ? current.status === 'RETURNING_TO_SHOP'
              ? 'Giao thất bại, đang mang hàng về nhà vườn · trả xong mới nhận được đơn mới'
              : current.status === 'SHIPPING'
                ? 'Đến nhà vườn lấy hàng · giao xong mới nhận được đơn mới'
                : 'Đã lấy hàng, đang giao cho khách · giao xong mới nhận được đơn mới'
            : activeReturn!.status === 'RETURN_PICKED_UP'
              ? 'Đã lấy hàng hoàn từ khách, đang giao về nhà vườn · hoàn tất mới nhận được đơn mới'
              : 'Đang đi lấy hàng hoàn từ người mua · hoàn tất mới nhận được đơn mới'}
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
  } else if (status.isError || (online && ready.isError)) {
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
          loading={isToggling}
          disabled={isToggling || status.isPending}
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
        description="Có đơn mới gần bạn, app sẽ báo ngay. Kéo xuống để tải lại."
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-leaf-800" edges={['top']}>
      <FlatList
        className="bg-paper"
        data={online ? (orderType === 'DELIVERY' ? orders : returnsList) : []}
        keyExtractor={(o: any) => String(o.orderId || o.id)}
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
              <CampaignEntryCard />
              {gpsNote}
              {online && (
                <View className="flex-row rounded-xl bg-slate-200/70 p-1">
                  <Pressable
                    onPress={() => setOrderType('DELIVERY')}
                    className={cn(
                      'flex-1 items-center rounded-lg py-2',
                      orderType === 'DELIVERY' ? 'bg-white shadow-xs' : '',
                    )}
                  >
                    <AppText
                      weight={orderType === 'DELIVERY' ? 'bold' : 'regular'}
                      className={cn('text-xs', orderType === 'DELIVERY' ? 'text-leaf-800' : 'text-ink-muted')}
                    >
                      Đơn giao ({orders.length})
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => setOrderType('RETURNS')}
                    className={cn(
                      'flex-1 items-center rounded-lg py-2',
                      orderType === 'RETURNS' ? 'bg-white shadow-xs' : '',
                    )}
                  >
                    <AppText
                      weight={orderType === 'RETURNS' ? 'bold' : 'regular'}
                      className={cn('text-xs', orderType === 'RETURNS' ? 'text-leaf-800' : 'text-ink-muted')}
                    >
                      Đơn hoàn trả ({returnsList.length})
                    </AppText>
                  </Pressable>
                </View>
              )}
              {online && orderType === 'DELIVERY' && ready.data && (
                <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
                  {orders.length} đơn chờ giao{gps.position ? ' · gần bạn trước' : ''}
                </AppText>
              )}
              {online && orderType === 'RETURNS' && (
                <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
                  {returnsList.length} yêu cầu trả hàng cần thu hồi
                </AppText>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={<View className="px-4 pt-3">{empty}</View>}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item, index }) => {
          if (orderType === 'RETURNS') {
            const ret = item as any
            return (
              <View className={cn('px-4', index === 0 && 'pt-3')}>
                <View className="gap-3 rounded-2xl border border-line bg-white p-4 shadow-2xs">
                  <Pressable
                    onPress={() => router.push({ pathname: '/shipper/return/[id]' as any, params: { id: String(ret.id) } })}
                    className="gap-3 active:opacity-80"
                  >
                    <View className="flex-row items-center justify-between border-b border-slate-100 pb-2">
                      <View className="flex-row items-center gap-1">
                        <AppText weight="bold" className="text-xs text-leaf-800">
                          Đơn hoàn trả #{ret.id}
                        </AppText>
                        <ChevronRight size={14} color={colors.leaf700} />
                      </View>
                      <AppText weight="extrabold" className="text-sm text-leaf-700">
                        Cước: {money(ret.returnShippingFee ?? 0)}
                      </AppText>
                    </View>
                    <View className="gap-1">
                      <AppText weight="bold" className="text-sm text-ink">
                        {ret.productName}
                      </AppText>
                      <AppText className="text-xs text-ink-muted">
                        Tiền hoàn khách nhận: {money(ret.refundAmount ?? 0)}
                      </AppText>
                    </View>
                    <View className="gap-1 rounded-xl bg-slate-50 p-2.5">
                      <AppText className="text-xs text-ink leading-relaxed">
                        📍 <AppText weight="semibold">Lấy hàng tại:</AppText> {ret.buyerAddress || 'Địa chỉ người mua'} ({ret.buyerName})
                      </AppText>
                      <AppText className="text-xs text-ink leading-relaxed">
                        🏠 <AppText weight="semibold">Trả về cho:</AppText> {ret.shopAddress || 'Địa chỉ nhà vườn'} ({ret.shopName})
                      </AppText>
                    </View>
                  </Pressable>
                  <Button
                    title={busy ? 'Hoàn tất đơn hiện tại để nhận thêm' : 'Nhận đơn hoàn này'}
                    icon={ChevronRight}
                    disabled={busy}
                    loading={acceptReturn.isPending}
                    onPress={() => {
                      acceptReturn.mutate(ret.id, {
                        onSuccess: () => {
                          showToast(`Đã nhận đơn hoàn #${ret.id}. Hãy liên hệ người mua để lấy hàng!`)
                          router.navigate('/shipper/delivering')
                        },
                        onError: (e) => showToast(shipperErrorMessage(e, 'Chưa nhận được đơn hoàn.')),
                      })
                    }}
                    className="min-h-[44px]"
                  />
                </View>
              </View>
            )
          }

          return (
            <View className={cn('px-4', index === 0 && 'pt-3')}>
              <ShipperOrderCard
                order={item as OrderResponse}
                me={gps.position}
                footer={
                  <Button
                    title={busy ? 'Giao xong đơn hiện tại để nhận thêm' : 'Nhận đơn này'}
                    icon={busy ? undefined : ChevronRight}
                    disabled={busy}
                    onPress={() => setPicked(item as OrderResponse)}
                    className={cn('min-h-[48px]', busy && 'opacity-50')}
                  />
                }
              />
            </View>
          )
        }}
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
            {reserve.missing > 0 ? (
              <Button title="Nạp ví" variant="primary" onPress={() => setTopupOpen(true)} className="min-h-[48px] flex-1" />
            ) : (
              <Button
                title={reserve.required > 0 ? 'Ký quỹ và nhận' : 'Nhận đơn'}
                loading={accept.isPending}
                disabled={wallet.isPending && reserve.required > 0}
                onPress={confirmAccept}
                className="min-h-[48px] flex-1"
              />
            )}
          </>
        }
      >
        {picked && (
          <AcceptSummary order={picked} me={gps.position} available={available} missing={reserve.missing} />
        )}
      </BottomSheet>
      <TopupSheet
        visible={topupOpen}
        missing={reserve.missing}
        onClose={() => setTopupOpen(false)}
        onPaid={() => void wallet.refetch()}
      />
    </SafeAreaView>
  )
}

function AcceptSummary({
  order,
  me,
  available,
  missing,
}: {
  order: OrderResponse
  me: Parameters<typeof orderLegs>[1]
  available?: number | null
  missing: number
}) {
  const legs = orderLegs(order, me)
  const cod = codToCollect(order)
  const rows: [string, string][] = [
    ['Lấy hàng tại', order.shopName || '—'],
    ['Giao cho', `${order.recipientName} · ${order.recipientPhone}`],
    [
      'Quãng đường',
      order.distanceToShopKm != null
        ? `~${formatKm(order.distanceToShopKm + (legs.toBuyer ?? 0))} (cả 2 chặng)`
        : legs.total != null
          ? `~${formatKm(legs.total)} (cả 2 chặng)`
          : `Giao ${formatKm(legs.toBuyer)}`,
    ],
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
        <View className={missing > 0 ? 'gap-1 rounded-card bg-sale-soft p-3' : 'gap-1 rounded-card bg-sun-300/40 p-3'}>
          <AppText weight="bold" className={missing > 0 ? 'text-sm text-sale' : 'text-sm text-leaf-900'}>
            Đơn COD: ký quỹ {money(cod)} · ví khả dụng {money(Math.max(0, Number(available ?? 0)))}
          </AppText>
          <AppText className={missing > 0 ? 'text-sm leading-relaxed text-sale' : 'text-sm leading-relaxed text-leaf-900'}>
            {missing > 0
              ? `Ví còn thiếu ${money(missing)}. Nạp thêm để nhận đơn này.`
              : 'Tiền được giữ chỗ trong ví khi nhận đơn. Giao xong, tiền mặt bạn thu chính là tiền ký quỹ; giao thất bại thì trả lại ví.'}
          </AppText>
        </View>
      )}
    </View>
  )
}
