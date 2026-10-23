import { router, useLocalSearchParams } from 'expo-router'
import { Navigation } from 'lucide-react-native'
import { Linking } from 'react-native'
import { Button } from '@/components/ui'
import { useOrder } from '@/features/order'
import { directionsUrl } from '@/features/shipper'
import { ShipperTrackingView } from '@/features/tracking'

/** Bản đồ của tài xế cho đơn đang giao (nút "Xem Bản Đồ Map" bản web, role SHIPPER). */
export default function ShipperTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = Number(id)
  const order = useOrder(orderId).data
  const url = order ? directionsUrl(order) : null

  return (
    <ShipperTrackingView
      orderId={orderId}
      role="SHIPPER"
      initial={{
        shop: { lat: order?.shopLatitude, lng: order?.shopLongitude },
        dest: { lat: order?.shippingLatitude, lng: order?.shippingLongitude },
      }}
      fallback={{
        shopName: order?.shopName,
        shopAddress: order?.shopAddress,
        recipientName: order?.recipientName,
        destinationAddress: order?.shippingAddress,
      }}
      actions={
        url ? (
          <Button
            title={order?.status === 'PICKED_UP' ? 'Chỉ đường tới khách' : 'Chỉ đường tới nhà vườn'}
            icon={Navigation}
            onPress={() => void Linking.openURL(url)}
            className="min-h-[48px]"
          />
        ) : undefined
      }
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/shipper/delivering'))}
    />
  )
}
