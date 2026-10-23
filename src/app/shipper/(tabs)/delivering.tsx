import { router } from 'expo-router'
import { CircleCheck, CircleX, Map, Navigation, PackageCheck, Phone, Truck } from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { orderIdOf } from '@/features/order/utils/orderStatus'
import { money } from '@/features/product'
import {
  codToCollect,
  directionsUrl,
  ShipperOrderCard,
  shipperErrorMessage,
  useActiveOrders,
  useBroadcastState,
  useCurrentPosition,
  useDeliveryAction,
  type BroadcastState,
  type DeliveryAction,
} from '@/features/shipper'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { OrderResponse } from '@/types/order.types'
import { cn } from '@/utils/helpers'

const ASK: Record<DeliveryAction, { title: string; confirm: string; done: string }> = {
  pickup: { title: 'Đã lấy hàng ở nhà vườn?', confirm: 'Đã lấy hàng', done: 'Đã lấy hàng. Giao cho khách nhé!' },
  deliver: { title: 'Đã giao cho khách?', confirm: 'Giao thành công', done: 'Giao thành công. Cảm ơn bạn!' },
  fail: { title: 'Báo giao thất bại?', confirm: 'Báo thất bại', done: 'Đã báo giao thất bại. Hàng được hoàn kho.' },
}

/** Đơn đang giao, chuyển từ thẻ "Đơn đang giao" trong pages/shipper/Dashboard.tsx. */
export default function ShipperDelivering() {
  const active = useActiveOrders()
  const gps = useCurrentPosition()
  const act = useDeliveryAction()
  const sharing = useBroadcastState((s) => s.state)
  const showToast = useUiStore((s) => s.showToast)
  const [ask, setAsk] = useState<{ order: OrderResponse; action: DeliveryAction } | null>(null)

  const run = () => {
    if (!ask) return
    const { order, action } = ask
    act.mutate(
      { orderId: orderIdOf(order), action },
      {
        onSuccess: () => showToast(ASK[action].done),
        onError: (e) => showToast(shipperErrorMessage(e, 'Chưa cập nhật được đơn, thử lại nhé.')),
        onSettled: () => setAsk(null),
      },
    )
  }

  const list = active.data ?? []
  const askMessage = (() => {
    if (!ask) return undefined
    const cod = codToCollect(ask.order)
    if (ask.action === 'deliver')
      return cod > 0 ? `Xác nhận bạn đã thu đủ ${money(cod)} của khách.` : 'Khách đã trả trước, không cần thu tiền.'
    if (ask.action === 'fail') return 'Dùng khi không liên lạc được khách hoặc khách không nhận. Đơn sẽ bị huỷ giao.'
    return `Bấm khi đã nhận đủ hàng của ${ask.order.shopName || 'nhà vườn'}.`
  })()

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="border-b border-line px-4 pb-3 pt-2">
        <AppText accessibilityRole="header" weight="extrabold" className="text-2xl">
          Đang giao
        </AppText>
        <AppText className="text-xs text-ink-muted">Mỗi lần nhận một đơn, giao xong mới nhận đơn tiếp</AppText>
      </View>
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={active.isRefetching}
            onRefresh={() => void active.refetch()}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {active.isPending ? (
          <Skeleton className="h-80 rounded-panel" />
        ) : active.isError ? (
          <ErrorState onRetry={() => void active.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Truck size={30} color={colors.leaf600} />}
            title="Chưa có đơn đang giao"
            description="Bật nhận đơn ở tab Đơn mới và chọn một đơn gần bạn."
            action={<Button title="Xem đơn mới" onPress={() => router.navigate('/shipper')} className="min-h-[48px]" />}
          />
        ) : (
          list.map((o) => {
            const picked = o.status === 'PICKED_UP'
            return (
              <View key={orderIdOf(o)} className="gap-3">
                <Stage picked={picked} />
                <SharingChip state={sharing} />
                <ShipperOrderCard
                  order={o}
                  me={gps.position}
                  highlight
                  footer={
                    <View className="gap-2">
                      <View className="flex-row gap-2">
                        <SmallButton
                          label="Bản đồ"
                          icon={<Map size={15} color={colors.leaf700} />}
                          onPress={() =>
                            router.push({ pathname: '/shipper/tracking/[id]', params: { id: String(orderIdOf(o)) } })
                          }
                        />
                        <SmallButton
                          label="Chỉ đường"
                          icon={<Navigation size={15} color={colors.leaf700} />}
                          onPress={() => {
                            const url = directionsUrl(o)
                            if (url) void Linking.openURL(url)
                            else showToast('Đơn chưa có địa chỉ để chỉ đường.')
                          }}
                        />
                      </View>
                      <View className="flex-row gap-2">
                        <CallButton label="Gọi nhà vườn" phone={o.shopPhone} />
                        <CallButton label="Gọi khách" phone={o.recipientPhone} />
                      </View>
                      {picked ? (
                        <View className="flex-row gap-2">
                          <Button
                            title="Thất bại"
                            variant="outline"
                            icon={CircleX}
                            onPress={() => setAsk({ order: o, action: 'fail' })}
                            className="min-h-[48px] flex-1"
                          />
                          <Button
                            title="Giao thành công"
                            icon={CircleCheck}
                            onPress={() => setAsk({ order: o, action: 'deliver' })}
                            className="min-h-[48px] flex-[1.6]"
                          />
                        </View>
                      ) : (
                        <View className="flex-row gap-2">
                          <Button
                            title="Không lấy được"
                            variant="outline"
                            onPress={() => setAsk({ order: o, action: 'fail' })}
                            className="min-h-[48px] flex-1"
                          />
                          <Button
                            title="Đã lấy hàng"
                            icon={PackageCheck}
                            onPress={() => setAsk({ order: o, action: 'pickup' })}
                            className="min-h-[48px] flex-[1.6]"
                          />
                        </View>
                      )}
                    </View>
                  }
                />
              </View>
            )
          })
        )}
      </ScrollView>

      <ConfirmDialog
        visible={ask != null}
        title={ask ? ASK[ask.action].title : ''}
        message={askMessage}
        confirmLabel={ask ? ASK[ask.action].confirm : undefined}
        cancelLabel="Chưa"
        destructive={ask?.action === 'fail'}
        loading={act.isPending}
        onConfirm={run}
        onCancel={() => setAsk(null)}
      />
    </SafeAreaView>
  )
}

function Stage({ picked }: { picked: boolean }) {
  return (
    <View className="flex-row gap-2">
      {['1. Đến vườn lấy hàng', '2. Giao cho khách'].map((label, i) => {
        const on = picked ? i === 1 : i === 0
        const done = picked && i === 0
        return (
          <View
            key={label}
            className={cn(
              'flex-1 rounded-full px-3 py-2',
              on ? 'bg-leaf-700' : done ? 'bg-leaf-100' : 'bg-white border border-line',
            )}
          >
            <AppText
              weight="bold"
              numberOfLines={1}
              className={cn('text-center text-xs', on ? 'text-white' : done ? 'text-leaf-800' : 'text-ink-muted')}
            >
              {done ? '✓ ' : ''}
              {label}
            </AppText>
          </View>
        )
      })}
    </View>
  )
}

function CallButton({ label, phone }: { label: string; phone?: string }) {
  return (
    <Pressable
      onPress={() => phone && void Linking.openURL(`tel:${phone}`)}
      disabled={!phone}
      accessibilityRole="button"
      accessibilityLabel={phone ? `${label} ${phone}` : `${label} (chưa có số)`}
      className={cn(
        'h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-leaf-50 active:bg-leaf-100',
        !phone && 'opacity-40',
      )}
    >
      <Phone size={15} color={colors.leaf700} />
      <AppText weight="bold" className="text-sm text-leaf-700">
        {label}
      </AppText>
    </Pressable>
  )
}

function SmallButton({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-leaf-200 bg-white active:bg-leaf-50"
    >
      {icon}
      <AppText weight="bold" className="text-sm text-leaf-700">
        {label}
      </AppText>
    </Pressable>
  )
}

const SHARING: Record<BroadcastState, { text: string; dot: string; box: string; tone: string }> = {
  live: {
    text: 'Đang chia sẻ vị trí cho nhà vườn và khách',
    dot: 'bg-emerald-500',
    box: 'bg-emerald-50',
    tone: 'text-emerald-800',
  },
  connecting: {
    text: 'Đang kết nối để chia sẻ vị trí…',
    dot: 'bg-amber-500',
    box: 'bg-amber-50',
    tone: 'text-amber-800',
  },
  'no-permission': {
    text: 'Chưa có quyền vị trí: khách không thấy xe trên bản đồ',
    dot: 'bg-rose-500',
    box: 'bg-rose-50',
    tone: 'text-rose-800',
  },
  error: {
    text: 'Mất kết nối chia sẻ vị trí, đang thử lại',
    dot: 'bg-rose-500',
    box: 'bg-rose-50',
    tone: 'text-rose-800',
  },
  off: { text: 'Chưa chia sẻ vị trí', dot: 'bg-gray-400', box: 'bg-white', tone: 'text-ink-muted' },
}

function SharingChip({ state }: { state: BroadcastState }) {
  const s = SHARING[state]
  return (
    <View className={cn('flex-row items-center gap-2 rounded-xl px-3 py-2', s.box)}>
      <View className={cn('h-2 w-2 rounded-full', s.dot)} />
      <AppText weight="semibold" className={cn('flex-1 text-xs', s.tone)}>
        {s.text}
      </AppText>
    </View>
  )
}
