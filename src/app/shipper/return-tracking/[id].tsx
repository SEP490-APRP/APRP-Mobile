import { router, useLocalSearchParams } from 'expo-router'
import { ShipperReturnActions, useShipperReturnDetail } from '@/features/shipper'
import { ShipperTrackingView } from '@/features/tracking'

/** Bản đồ dẫn đường đơn hoàn trả (Khách ➔ Nhà vườn), đồng bộ thao tác & Fake GPS như đơn giao. */
export default function ShipperReturnTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const returnId = Number(id)
  const detail = useShipperReturnDetail(returnId)
  const r = detail.data

  const mappedStatus =
    r?.status === 'RETURN_PICKED_UP'
      ? 'PICKED_UP'
      : r?.status === 'RETURN_SHIPPING'
        ? 'SHIPPING'
        : r?.status

  return (
    <ShipperTrackingView
      orderId={r?.orderId ?? returnId}
      role="SHIPPER"
      mode="RETURN"
      overrideOrderStatus={mappedStatus}
      initial={{
        shop: { lat: r?.buyerLatitude, lng: r?.buyerLongitude },
        dest: { lat: r?.shopLatitude, lng: r?.shopLongitude },
      }}
      fallback={{
        shopName: r?.buyerName ? `Lấy từ: ${r.buyerName}` : 'Điểm lấy hàng hoàn (Khách)',
        shopAddress: r?.buyerAddress,
        recipientName: r?.shopName ? `Trả về: ${r.shopName}` : 'Điểm trả hàng (Nhà vườn)',
        destinationAddress: r?.shopAddress,
      }}
      actions={
        r ? (
          <ShipperReturnActions
            returnItem={r}
            onSuccess={(action) => {
              void detail.refetch()
              if (action === 'deliver' || action === 'fail') {
                router.replace('/shipper/delivering' as any)
              }
            }}
          />
        ) : undefined
      }
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/shipper/delivering' as any))}
    />
  )
}

