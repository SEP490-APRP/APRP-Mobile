import { Client } from '@stomp/stompjs'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { stompBrokerUrl } from '@/features/tracking/utils/trackingRules'
import { useAuthStore, useUiStore } from '@/stores'
import { ENV } from '@/utils/env'
import { shipperKeys } from './useShipperQueries'

/** Tin nhắn điều phối gửi riêng cho shipper qua /user/queue/shipper-offers */
interface ShipperOfferMessage {
  type: 'NEW_ORDER' | 'ORDER_TAKEN'
  orderId: number
  shopName?: string
  distanceToShopKm?: number | null
}

/**
 * Bước 1 (điều phối): BE quét shipper đang nhận đơn quanh nhà vườn và mời qua STOMP.
 * NEW_ORDER: báo toast và tải lại danh sách đơn mới. ORDER_TAKEN: đơn đã có người nhận, tải lại để gỡ khỏi danh sách.
 * Chỉ chạy khi app đang mở (chưa có push khi app tắt).
 */
export function useShipperOffers() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const showToast = useUiStore((s) => s.showToast)

  useEffect(() => {
    if (!token) return
    const client = new Client({
      brokerURL: stompBrokerUrl(ENV.API_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      // React Native cắt ký tự NULL cuối frame STOMP; hai cờ này bù lại.
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect: () => {
        client.subscribe('/user/queue/shipper-offers', (frame) => {
          let offer: ShipperOfferMessage | null = null
          try {
            offer = JSON.parse(frame.body) as ShipperOfferMessage
          } catch {
            return
          }
          if (!offer?.orderId) return
          if (offer.type === 'NEW_ORDER') {
            const where = offer.distanceToShopKm != null ? ` cách bạn ${offer.distanceToShopKm} km` : ''
            showToast(`Có đơn mới #${offer.orderId}${offer.shopName ? ` tại ${offer.shopName}` : ''}${where}`)
          }
          void queryClient.invalidateQueries({ queryKey: shipperKeys.ready() })
        })
      },
    })
    client.activate()
    return () => void client.deactivate()
  }, [token, queryClient, showToast])
}
