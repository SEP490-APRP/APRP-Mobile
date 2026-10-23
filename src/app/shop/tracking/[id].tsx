import { router, useLocalSearchParams } from 'expo-router'
import { useOrder } from '@/features/order'
import { ShipperTrackingView } from '@/features/tracking'

/** Nhà vườn xem shipper đang tới lấy hàng (nút "Xem lộ trình Shipper" bản web, role SHOP). */
export default function ShopTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = Number(id)
  const order = useOrder(orderId).data

  return (
    <ShipperTrackingView
      orderId={orderId}
      role="SHOP"
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
        router.canGoBack()
          ? router.back()
          : router.replace({ pathname: '/shop/order/[id]', params: { id: String(orderId) } })
      }
    />
  )
}
