import { Stack } from 'expo-router'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Toast } from '@/components/ui'
import { orderIdOf } from '@/features/order/utils/orderStatus'
import { useActiveOrders, useBroadcastLocation } from '@/features/shipper'

/** Khu vực Tài xế: các tab chính, bản đồ giao hàng, đổi mật khẩu. */
export default function ShipperLayout() {
  const insets = useSafeAreaInsets()
  // Đang cầm đơn thì gửi vị trí liên tục, dù tài xế đang ở tab nào.
  const current = useActiveOrders().data?.[0]
  useBroadcastLocation(current ? orderIdOf(current) : undefined, current?.status)
  return (
    <View className="flex-1 bg-paper">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {/* Nằm trên thanh tab (cao khoảng 66) */}
      <Toast bottom={insets.bottom + 78} />
    </View>
  )
}
