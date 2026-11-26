import { router, useLocalSearchParams } from 'expo-router'
import { useOrder } from '@/features/order'
import { ShipperDeliveryActions } from '@/features/shipper'
import { ShipperTrackingView } from '@/features/tracking'

/** Bản đồ của tài xế cho đơn đang giao (role SHIPPER), tích hợp đầy đủ thao tác lấy/giao hàng ngay trên Map. */
export default function ShipperTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = Number(id)
  const orderQuery = useOrder(orderId)
  const order = orderQuery.data

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
        order ? (
          <ShipperDeliveryActions
            order={order}
            inMap
            showQuickContact={false}
            onSuccess={(action) => {
              void orderQuery.refetch()
              if (
                action === 'deliver' ||
                action === 'return_shop' ||
                (action === 'fail' && order.status === 'SHIPPING')
              ) {
                router.replace('/shipper/delivering' as any)
              }
            }}
          />
        ) : undefined
      }
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/shipper/delivering'))}
    />
  )
}
