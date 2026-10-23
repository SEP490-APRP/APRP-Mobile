import { router, useLocalSearchParams } from 'expo-router'
import { useOrder } from '@/features/order'
import { ShipperTrackingView } from '@/features/tracking'

/** Buyer theo dõi shipper của một đơn đang giao (nút "Theo dõi lộ trình" bản web). */
export default function BuyerTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = Number(id)
  const order = useOrder(orderId).data

  return (
    <ShipperTrackingView
      orderId={orderId}
      role="BUYER"
      initial={{
        shop: { lat: order?.shopLatitude, lng: order?.shopLongitude },
        dest: { lat: order?.shippingLatitude, lng: order?.shippingLongitude },
      }}
      fallback={{
        shopName: order?.shopName,
        recipientName: order?.recipientName,
        destinationAddress: order?.shippingAddress,
      }}
      onBack={() =>
        router.canGoBack() ? router.back() : router.replace({ pathname: '/buyer/order/[id]', params: { id: String(orderId) } })
      }
    />
  )
}
