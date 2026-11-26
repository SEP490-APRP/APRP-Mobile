import { CircleCheck, CircleX, PackageCheck } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui'
import type { ReturnRequestResponse } from '@/services/return.types'
import { useUiStore } from '@/stores'
import {
  useShipperDeliverReturn,
  useShipperFailReturn,
  useShipperPickupReturn,
} from '../hooks/useShipperReturns'
import { shipperErrorMessage } from '../utils/shipperOrders'
import { ReturnActionSheet, type ReturnActionKind } from './ReturnActionSheet'

export interface ShipperReturnActionsProps {
  returnItem: ReturnRequestResponse
  onSuccess?: (action: ReturnActionKind) => void
}

/**
 * Bộ nút thao tác cho Shipper ở đơn hoàn trả (Đã lấy từ khách / Đã giao về Shop / Báo thất bại),
 * dùng chung giữa màn Chi tiết đơn hoàn trả và Bản đồ realtime.
 */
export function ShipperReturnActions({ returnItem, onSuccess }: ShipperReturnActionsProps) {
  const showToast = useUiStore((s) => s.showToast)
  const pickupReturn = useShipperPickupReturn()
  const deliverReturn = useShipperDeliverReturn()
  const failReturn = useShipperFailReturn()
  const [ask, setAsk] = useState<ReturnActionKind | null>(null)

  const isShipping = returnItem.status === 'RETURN_SHIPPING'
  const isPickedUp = returnItem.status === 'RETURN_PICKED_UP'
  if ((!isShipping && !isPickedUp) || !returnItem.shipperId) return null

  const loading = pickupReturn.isPending || deliverReturn.isPending || failReturn.isPending

  const handleSubmit = (payload: { note?: string; proofImageUrl?: string }) => {
    if (!ask) return
    const action = ask
    const id = returnItem.id

    const onDone = (msg: string) => {
      setAsk(null)
      showToast(msg)
      onSuccess?.(action)
    }
    const onErr = (err: unknown) => {
      showToast(shipperErrorMessage(err, 'Không thể cập nhật đơn hoàn trả, thử lại nhé.'))
    }

    if (action === 'pickup') {
      pickupReturn.mutate(
        { id, data: payload },
        {
          onSuccess: () => onDone(`Đã lấy hàng hoàn #${id} từ khách. Giao về nhà vườn nhé!`),
          onError: onErr,
        },
      )
    } else if (action === 'deliver') {
      deliverReturn.mutate(
        { id, data: payload },
        {
          onSuccess: () => onDone(`Đã giao hàng hoàn #${id} về nhà vườn thành công!`),
          onError: onErr,
        },
      )
    } else {
      failReturn.mutate(
        { id, data: payload },
        {
          onSuccess: () =>
            onDone(isPickedUp ? `Đã báo giao về Shop thất bại đơn hoàn #${id}.` : `Đã báo không lấy được hàng hoàn #${id}.`),
          onError: onErr,
        },
      )
    }
  }

  return (
    <>
      <View className="flex-row gap-2">
        <Button
          title={isPickedUp ? 'Báo thất bại' : 'Không lấy được'}
          variant="outline"
          icon={CircleX}
          onPress={() => setAsk('fail')}
          className="min-h-[48px] flex-1"
        />
        {isPickedUp ? (
          <Button
            title="Đã giao về Shop"
            icon={CircleCheck}
            onPress={() => setAsk('deliver')}
            className="min-h-[48px] flex-[1.5]"
          />
        ) : (
          <Button
            title="Đã lấy từ khách"
            icon={PackageCheck}
            onPress={() => setAsk('pickup')}
            className="min-h-[48px] flex-[1.5]"
          />
        )}
      </View>

      <ReturnActionSheet
        visible={ask !== null}
        returnId={returnItem.id}
        action={ask}
        isPickedUp={isPickedUp}
        loading={loading}
        onSubmit={handleSubmit}
        onClose={() => setAsk(null)}
      />
    </>
  )
}

