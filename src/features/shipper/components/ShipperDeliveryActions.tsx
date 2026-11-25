import { router } from 'expo-router'
import { CircleCheck, CircleX, Navigation, PackageCheck, Phone } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Linking, View } from 'react-native'
import { AppText, Button, ConfirmDialog } from '@/components/ui'
import { PickupCodeTag } from '@/features/order/components/PickupCodeTag'
import { orderIdOf, pickupCode } from '@/features/order/utils/orderStatus'
import { money } from '@/features/product'
import { useUiStore } from '@/stores'
import type { OrderResponse } from '@/types/order.types'
import { useBroadcastState } from '../hooks/useBroadcastLocation'
import { useCurrentPosition } from '../hooks/useCurrentPosition'
import { type DeliveryAction, type DeliveryProof, useDeliveryAction } from '../hooks/useShipperQueries'
import { codToCollect, directionsUrl, shipperErrorCode, shipperErrorMessage } from '../utils/shipperOrders'
import { DeliveryResultSheet } from './DeliveryResultSheet'

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
    done: 'Đã báo giao thất bại. Hàng được hoàn kho, tiền ký quỹ COD đã trả lại ví.',
  },
}

export interface ShipperDeliveryActionsProps {
  order: OrderResponse
  /** Khi đang ở sẵn màn hình Bản đồ thì ẩn nút "Mở bản đồ" trong cảnh báo GPS/Geofence */
  inMap?: boolean
  /** Hiện nút gọi & chỉ đường phía trên các nút xác nhận */
  showQuickContact?: boolean
  onSuccess?: (action: DeliveryAction) => void
}

/**
 * Bộ nút thao tác giao nhận cho Shipper ("Đã lấy hàng", "Giao thành công", "Thất bại", "Gọi", "Chỉ đường")
 * dùng chung trên Bản đồ realtime và Chi tiết đơn hàng.
 */
export function ShipperDeliveryActions({
  order,
  inMap = false,
  showQuickContact = true,
  onSuccess,
}: ShipperDeliveryActionsProps) {
  const act = useDeliveryAction()
  const gps = useCurrentPosition()
  const showToast = useUiStore((s) => s.showToast)
  const [ask, setAsk] = useState<DeliveryAction | null>(null)

  const id = orderIdOf(order)
  const picked = order.status === 'PICKED_UP'
  const isActive = order.status === 'SHIPPING' || picked
  if (!isActive) return null

  const dirUrl = directionsUrl(order)
  const contactPhone = picked ? order.recipientPhone : order.shopPhone
  const contactLabel = picked ? 'Gọi khách' : 'Gọi vườn'

  const run = (proof?: DeliveryProof) => {
    if (!ask) return
    const action = ask
    const { fakeGpsActive, fakeCoords } = useBroadcastState.getState()
    const deliveryCoords = fakeGpsActive && fakeCoords ? fakeCoords : gps.position
    act.mutate(
      {
        orderId: id,
        action,
        proof,
        coords: action === 'deliver' ? deliveryCoords : undefined,
      },
      {
        onSuccess: () => {
          showToast(ASK[action].done)
          onSuccess?.(action)
        },
        onError: (e) => {
          const code = shipperErrorCode(e)
          const msg = shipperErrorMessage(e, 'Chưa cập nhật được đơn, thử lại nhé.')
          if (code === 7011) {
            Alert.alert(
              'Ngoài bán kính giao hàng (>500m)',
              msg,
              inMap
                ? [{ text: 'Đã hiểu', style: 'cancel' }]
                : [
                    { text: 'Mở bản đồ điều hướng', onPress: () => router.push(`/shipper/tracking/${id}` as any) },
                    { text: 'Đã hiểu', style: 'cancel' },
                  ],
            )
          } else if (code === 7012) {
            Alert.alert(
              'Không xác định được vị trí GPS',
              inMap
                ? 'Hãy bật GPS trên điện thoại hoặc dùng "Đến ngay Khách (<500m)" trong Demo Fake GPS phía trên.'
                : 'Vui lòng bật quyền truy cập vị trí trên điện thoại, hoặc mở Bản đồ để dùng Demo Fake GPS.',
              inMap
                ? [{ text: 'Đã hiểu', style: 'cancel' }]
                : [
                    { text: 'Mở bản đồ', onPress: () => router.push(`/shipper/tracking/${id}` as any) },
                    { text: 'Đã hiểu', style: 'cancel' },
                  ],
            )
          } else {
            showToast(msg)
          }
        },
        onSettled: () => setAsk(null),
      },
    )
  }

  const cod = codToCollect(order)
  const askMessage = (() => {
    if (ask === 'pickup') {
      return `Kiểm tra mã trên túi hàng trùng ${pickupCode(id)}, rồi bấm khi đã nhận đủ hàng của ${order.shopName || 'nhà vườn'}.`
    }
    return undefined
  })()

  return (
    <View className="gap-2.5">
      {!picked && <PickupCodeTag orderId={id} variant="shipper" />}

      {showQuickContact && (Boolean(contactPhone) || Boolean(dirUrl)) && (
        <View className="flex-row gap-2">
          {Boolean(contactPhone) && (
            <Button
              title={contactLabel}
              icon={Phone}
              variant="outline"
              onPress={() => void Linking.openURL(`tel:${contactPhone}`)}
              className="min-h-[42px] flex-1"
            />
          )}
          {Boolean(dirUrl) && (
            <Button
              title={picked ? 'Chỉ đường tới khách' : 'Chỉ đường tới vườn'}
              icon={Navigation}
              variant="outline"
              onPress={() => void Linking.openURL(dirUrl!)}
              className="min-h-[42px] flex-1"
            />
          )}
        </View>
      )}

      {picked ? (
        <View className="gap-2">
          {cod > 0 && (
            <View className="rounded-xl bg-amber-50 px-3 py-1.5">
              <ConfirmCodNote cod={cod} />
            </View>
          )}
          <View className="flex-row gap-2">
            <Button
              title="Thất bại"
              variant="outline"
              icon={CircleX}
              onPress={() => setAsk('fail')}
              className="min-h-[48px] flex-1 px-2.5"
              textClassName="text-sm"
            />
            <Button
              title="Giao thành công"
              icon={CircleCheck}
              onPress={() => setAsk('deliver')}
              className="min-h-[48px] flex-1 px-2.5"
              textClassName="text-sm"
            />
          </View>
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Button
            title="Không lấy được"
            variant="outline"
            onPress={() => setAsk('fail')}
            className="min-h-[48px] flex-1"
          />
          <Button
            title="Đã lấy hàng"
            icon={PackageCheck}
            onPress={() => setAsk('pickup')}
            className="min-h-[48px] flex-1"
          />
        </View>
      )}

      <DeliveryResultSheet
        visible={ask != null && ask !== 'pickup'}
        orderId={id}
        failed={ask === 'fail'}
        codAmount={cod}
        paymentMethod={order.paymentMethod}
        stage={picked ? 'delivery' : 'pickup'}
        loading={act.isPending}
        onSubmit={(proof) => run(proof)}
        onClose={() => setAsk(null)}
      />

      <ConfirmDialog
        visible={ask === 'pickup'}
        title={ASK.pickup.title}
        message={askMessage}
        confirmLabel={ASK.pickup.confirm}
        cancelLabel="Chưa"
        loading={act.isPending}
        onConfirm={() => run()}
        onCancel={() => setAsk(null)}
      />
    </View>
  )
}

function ConfirmCodNote({ cod }: { cod: number }) {
  return (
    <AppText weight="bold" className="text-center text-xs text-amber-800">
      Thu hộ tiền mặt từ khách: {money(cod)}
    </AppText>
  )
}
