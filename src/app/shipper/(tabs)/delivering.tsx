import { router } from 'expo-router'
import { CircleCheck, CircleX, Map, Navigation, PackageCheck, Phone, Truck } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Linking, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { NotificationBellButton } from '@/features/notification'
import { orderIdOf, pickupCode } from '@/features/order/utils/orderStatus'
import { PickupCodeTag } from '@/features/order/components/PickupCodeTag'
import { money } from '@/features/product'
import {
  codToCollect,
  DeliveryResultSheet,
  directionsUrl,
  ShipperOrderCard,
  ShipperReturnActions,
  ShipperReturnCard,
  shipperErrorCode,
  shipperErrorMessage,
  useActiveOrders,
  useBroadcastState,
  useCurrentPosition,
  useDeliveryAction,
  useShipperMyReturns,
  useShipperPickupReturn,
  useShipperDeliverReturn,
  useShipperFailReturn,
  type BroadcastState,
  type DeliveryAction,
  type DeliveryProof,
} from '@/features/shipper'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { OrderResponse } from '@/types/order.types'
import type { ReturnRequestResponse } from '@/services/return.types'
import { cn } from '@/utils/helpers'

const ASK: Record<DeliveryAction, { title: string; confirm: string; done: string }> = {
  pickup: { title: 'Đối soát mã đơn', confirm: 'Mã trùng, đã lấy hàng', done: 'Đã lấy hàng. Giao cho khách nhé!' },
  deliver: {
    title: 'Đã giao cho khách?',
    confirm: 'Giao thành công',
    done: 'Giao thành công! Cước giao đã được cộng thẳng vào số dư khả dụng của bạn.',
  },
  fail: {
    title: 'Báo giao thất bại?',
    confirm: 'Báo thất bại',
    done: 'Đã báo giao thất bại.',
  },
  return_shop: {
    title: 'Trả hàng về Shop',
    confirm: 'Đã trả hàng',
    done: 'Đã bàn giao hàng hoàn về nhà vườn thành công!',
  },
}

/** Đơn đang giao (cả đơn thường và đơn hoàn trả), chuyển từ tab Đang giao. */
export default function ShipperDelivering() {
  const active = useActiveOrders()
  const returns = useShipperMyReturns()
  const gps = useCurrentPosition()
  const act = useDeliveryAction()
  const pickupRet = useShipperPickupReturn()
  const deliverRet = useShipperDeliverReturn()
  const failRet = useShipperFailReturn()

  const sharing = useBroadcastState((s) => s.state)
  const showToast = useUiStore((s) => s.showToast)
  const [ask, setAsk] = useState<{ order: OrderResponse; action: DeliveryAction } | null>(null)
  const [askReturn, setAskReturn] = useState<{ item: ReturnRequestResponse; action: 'pickup' | 'deliver' | 'fail' } | null>(null)

  const run = (proof?: DeliveryProof) => {
    if (!ask) return
    const { order, action } = ask
    const { fakeGpsActive, fakeCoords } = useBroadcastState.getState()
    const actionCoords = fakeGpsActive && fakeCoords ? fakeCoords : gps.position
    act.mutate(
      {
        orderId: orderIdOf(order),
        action,
        proof,
        coords: action === 'deliver' || action === 'return_shop' ? actionCoords : undefined,
      },
      {
        onSuccess: () => showToast(ASK[action].done),
        onError: (e) => {
          const code = shipperErrorCode(e)
          const msg = shipperErrorMessage(e, 'Chưa cập nhật được đơn, thử lại nhé.')
          if (code === 7011) {
            if (Platform.OS === 'web') {
              showToast(msg)
            } else {
              Alert.alert(
                'Ngoài bán kính cho phép (>500m)',
                msg,
                [
                  {
                    text: 'Mở bản đồ điều hướng',
                    onPress: () => router.push(`/shipper/tracking/${orderIdOf(order)}` as any),
                  },
                  { text: 'Đã hiểu', style: 'cancel' },
                ],
              )
            }
          } else if (code === 7012) {
            const gpsMsg = 'Vui lòng bật GPS trên điện thoại, hoặc mở Bản đồ dùng Demo Fake GPS để đối soát.'
            if (Platform.OS === 'web') {
              showToast(gpsMsg)
            } else {
              Alert.alert(
                'Không xác định được vị trí GPS',
                gpsMsg,
                [
                  {
                    text: 'Mở bản đồ',
                    onPress: () => router.push(`/shipper/tracking/${orderIdOf(order)}` as any),
                  },
                  { text: 'Đã hiểu', style: 'cancel' },
                ],
              )
            }
          } else {
            showToast(msg)
          }
        },
        onSettled: () => setAsk(null),
      },
    )
  }

  const runReturn = (proof?: DeliveryProof) => {
    if (!askReturn) return
    const { item, action } = askReturn
    const proofUrl = proof?.photos?.[0]?.uri
    if (action === 'pickup') {
      pickupRet.mutate(
        { id: item.id, data: { note: 'Shipper đã lấy hàng từ người mua', proofImageUrl: proofUrl } },
        {
          onSuccess: () => showToast(`Đã nhận hàng hoàn #${item.id} từ khách. Đang chuyển về nhà vườn!`),
          onError: (e) => showToast(shipperErrorMessage(e, 'Chưa cập nhật được đơn hoàn.')),
          onSettled: () => setAskReturn(null),
        },
      )
    } else if (action === 'deliver') {
      deliverRet.mutate(
        { id: item.id, data: { note: 'Shipper đã bàn giao hàng về cho nhà vườn', proofImageUrl: proofUrl } },
        {
          onSuccess: () => showToast(`Đã bàn giao hàng hoàn #${item.id} về nhà vườn thành công!`),
          onError: (e) => showToast(shipperErrorMessage(e, 'Chưa cập nhật được đơn hoàn.')),
          onSettled: () => setAskReturn(null),
        },
      )
    } else if (action === 'fail') {
      failRet.mutate(
        { id: item.id, data: { note: proof?.note || 'Không hoàn tất giao hoàn', proofImageUrl: proofUrl } },
        {
          onSuccess: () => showToast(`Đã báo thất bại đơn hoàn #${item.id}.`),
          onError: (e) => showToast(shipperErrorMessage(e, 'Chưa cập nhật được đơn hoàn.')),
          onSettled: () => setAskReturn(null),
        },
      )
    }
  }

  const list = active.data ?? []
  const returnList = (returns.data ?? []).filter(
    (r) => r.status === 'RETURN_SHIPPING' || r.status === 'RETURN_PICKED_UP',
  )
  const isPending = active.isPending || returns.isPending
  const isError = active.isError && returns.isError
  const isEmpty = list.length === 0 && returnList.length === 0

  const askMessage = (() => {
    if (!ask) return undefined
    const cod = codToCollect(ask.order)
    if (ask.action === 'deliver')
      return cod > 0 ? `Xác nhận bạn đã thu đủ ${money(cod)} của khách.` : 'Khách đã trả trước, không cần thu tiền.'
    if (ask.action === 'fail') return 'Dùng khi không liên lạc được khách hoặc khách không nhận. Đơn sẽ bị huỷ giao.'
    const code = pickupCode(orderIdOf(ask.order))
    return `Kiểm tra mã trên túi hàng trùng ${code}, rồi bấm khi đã nhận đủ hàng của ${ask.order.shopName || 'nhà vườn'}.`
  })()

  const refreshAll = () => {
    void active.refetch()
    void returns.refetch()
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-line px-4 pb-3 pt-2">
        <View className="flex-1">
          <AppText accessibilityRole="header" weight="extrabold" className="text-2xl">
            Đang giao
          </AppText>
          <AppText className="text-xs text-ink-muted">Mỗi lần nhận một nhiệm vụ, giao xong mới nhận tiếp</AppText>
        </View>
        <NotificationBellButton role="shipper" variant="default" size={18} />
      </View>
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={active.isRefetching || returns.isRefetching}
            onRefresh={refreshAll}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {isPending ? (
          <Skeleton className="h-80 rounded-panel" />
        ) : isError ? (
          <ErrorState onRetry={refreshAll} />
        ) : isEmpty ? (
          <EmptyState
            icon={<Truck size={30} color={colors.leaf600} />}
            title="Chưa có đơn đang giao"
            description="Bật nhận đơn ở tab Đơn mới và chọn một đơn gần bạn."
            action={<Button title="Xem đơn mới" onPress={() => router.navigate('/shipper')} className="min-h-[48px]" />}
          />
        ) : (
          <>
            {/* Đơn giao hàng thường */}
            {list.map((o) => {
              const picked = o.status === 'PICKED_UP'
              const returning = o.status === 'RETURNING_TO_SHOP'
              return (
                <View key={`order-${orderIdOf(o)}`} className="gap-3">
                  {returning ? (
                    <View className="rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2.5">
                      <AppText weight="bold" className="text-xs text-amber-900">
                        Đơn giao thất bại · Mang hàng hoàn về Nhà vườn
                      </AppText>
                    </View>
                  ) : (
                    <Stage picked={picked} />
                  )}
                  {!picked && !returning && <PickupCodeTag orderId={orderIdOf(o)} variant="shipper" />}
                  <SharingChip state={sharing} />
                  <ShipperOrderCard
                    order={o}
                    me={gps.position}
                    highlight
                    footer={
                      <View className="gap-2">
                        {/* Hàng 1: Bản đồ & Chỉ đường (50% - 50%) */}
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

                        {/* Hàng 2: Gọi nhà vườn & Gọi khách (50% - 50%) */}
                        <View className="flex-row gap-2">
                          <CallButton label="Gọi nhà vườn" phone={o.shopPhone} />
                          <CallButton label="Gọi khách" phone={o.recipientPhone} />
                        </View>

                        {/* Hàng 3: Thao tác giao hàng (50% - 50% đều 3 hàng) */}
                        {returning ? (
                          <Button
                            title="Đã trả hàng về Shop"
                            icon={PackageCheck}
                            onPress={() => setAsk({ order: o, action: 'return_shop' })}
                            className="min-h-[48px] w-full"
                          />
                        ) : picked ? (
                          <View className="flex-row gap-2">
                            <Button
                              title="Thất bại"
                              variant="outline"
                              icon={CircleX}
                              onPress={() => setAsk({ order: o, action: 'fail' })}
                              className="min-h-[48px] flex-1 px-2.5"
                              textClassName="text-sm"
                            />
                            <Button
                              title="Giao thành công"
                              icon={CircleCheck}
                              onPress={() => setAsk({ order: o, action: 'deliver' })}
                              className="min-h-[48px] flex-1 px-2.5"
                              textClassName="text-sm"
                            />
                          </View>
                        ) : (
                          <View className="flex-row gap-2">
                            <Button
                              title="Không lấy được"
                              variant="outline"
                              onPress={() => setAsk({ order: o, action: 'fail' })}
                              className="min-h-[48px] flex-1 px-2.5"
                              textClassName="text-sm"
                            />
                            <Button
                              title="Đã lấy hàng"
                              icon={PackageCheck}
                              onPress={() => setAsk({ order: o, action: 'pickup' })}
                              className="min-h-[48px] flex-1 px-2.5"
                              textClassName="text-sm"
                            />
                          </View>
                        )}
                      </View>
                    }
                  />
                </View>
              )
            })}

            {/* Đơn hoàn trả (Returns) */}
            {returnList.map((ret) => {
              const isPickedUp = ret.status === 'RETURN_PICKED_UP'
              return (
                <View key={`return-${ret.id}`} className="gap-3">
                  <ReturnStage pickedUp={isPickedUp} />
                  <ShipperReturnCard
                    returnItem={ret}
                    onOpen={() => router.push({ pathname: '/shipper/return/[id]' as any, params: { id: String(ret.id) } })}
                    onTrack={() =>
                      router.push({ pathname: '/shipper/return-tracking/[id]' as any, params: { id: String(ret.id) } })
                    }
                    footer={<ShipperReturnActions returnItem={ret} />}
                  />
                </View>
              )
            })}
          </>
        )}
      </ScrollView>

      {/* Giao thành công / thất bại đơn thường: cần ảnh bằng chứng */}
      <DeliveryResultSheet
        visible={ask != null && ask.action !== 'pickup'}
        orderId={ask ? orderIdOf(ask.order) : 0}
        failed={ask?.action === 'fail'}
        codAmount={ask ? codToCollect(ask.order) : 0}
        paymentMethod={ask?.order.paymentMethod}
        stage={ask?.action === 'return_shop' ? 'return_shop' : ask?.order.status === 'PICKED_UP' ? 'delivery' : 'pickup'}
        loading={act.isPending}
        onSubmit={(proof) => run(proof)}
        onClose={() => setAsk(null)}
      />

      <ConfirmDialog
        visible={ask?.action === 'pickup'}
        title={ask ? ASK[ask.action].title : ''}
        message={askMessage}
        confirmLabel={ask ? ASK[ask.action].confirm : undefined}
        cancelLabel="Chưa"
        destructive={ask?.action === 'fail'}
        loading={act.isPending}
        onConfirm={() => run()}
        onCancel={() => setAsk(null)}
      />

      {/* Xác nhận đơn hoàn trả */}
      <ConfirmDialog
        visible={askReturn != null && askReturn.action !== 'fail'}
        title={
          askReturn?.action === 'pickup'
            ? `Xác nhận lấy hàng hoàn #${askReturn.item.id}?`
            : `Đã giao về cho nhà vườn #${askReturn?.item.id}?`
        }
        message={
          askReturn?.action === 'pickup'
            ? `Kiểm tra đúng sản phẩm "${askReturn.item.productName}" từ người mua ${askReturn.item.buyerName || 'khách hàng'} trước khi nhận.`
            : `Xác nhận bạn đã bàn giao nguyên vẹn kiện hàng hoàn cho nhà vườn ${askReturn?.item.shopName || 'nhà vườn'}.`
        }
        confirmLabel={askReturn?.action === 'pickup' ? 'Đã nhận đủ' : 'Đã bàn giao'}
        cancelLabel="Chưa"
        loading={pickupRet.isPending || deliverRet.isPending}
        onConfirm={() => runReturn()}
        onCancel={() => setAskReturn(null)}
      />

      {/* Báo thất bại đơn hoàn trả */}
      <DeliveryResultSheet
        visible={askReturn != null && askReturn.action === 'fail'}
        orderId={askReturn ? askReturn.item.id : 0}
        failed={true}
        codAmount={0}
        stage={askReturn?.item.status === 'RETURN_PICKED_UP' ? 'delivery' : 'pickup'}
        loading={failRet.isPending}
        onSubmit={(proof) => runReturn(proof)}
        onClose={() => setAskReturn(null)}
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

function ReturnStage({ pickedUp }: { pickedUp: boolean }) {
  return (
    <View className="flex-row gap-2">
      {['1. Lấy hàng từ người mua', '2. Trả về cho nhà vườn'].map((label, i) => {
        const on = pickedUp ? i === 1 : i === 0
        const done = pickedUp && i === 0
        return (
          <View
            key={label}
            className={cn(
              'flex-1 rounded-full px-3 py-2',
              on ? 'bg-amber-600' : done ? 'bg-amber-100' : 'bg-white border border-line',
            )}
          >
            <AppText
              weight="bold"
              numberOfLines={1}
              className={cn('text-center text-xs', on ? 'text-white' : done ? 'text-amber-900' : 'text-ink-muted')}
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
