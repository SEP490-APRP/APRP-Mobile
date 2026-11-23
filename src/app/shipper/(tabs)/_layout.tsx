import { Tabs } from 'expo-router/js-tabs'
import { Truck, UserRound, Wallet, Zap } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useActiveOrders, useShipperMyReturns } from '@/features/shipper'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'

/** Thanh tab dưới của Shipper, thay cho ba thẻ ngang trên trang Dashboard bản web. */
export default function ShipperTabsLayout() {
  const insets = useSafeAreaInsets()
  const activeOrders = useActiveOrders().data?.length ?? 0
  const activeReturns =
    useShipperMyReturns().data?.filter(
      (r) => r.status === 'RETURN_SHIPPING' || r.status === 'RETURN_PICKED_UP',
    ).length ?? 0
  const active = activeOrders + activeReturns
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.leaf700,
        tabBarInactiveTintColor: colors.inkSubtle,
        tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
        tabBarStyle: {
          borderTopColor: colors.line,
          height: 66 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Đơn mới', tabBarIcon: ({ color, size }) => <Zap color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="delivering"
        options={{
          title: 'Đang giao',
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
          tabBarBadge: active > 0 ? active : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.sale, fontSize: 12, lineHeight: 16 },
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Thu nhập', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Tài khoản', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }}
      />
    </Tabs>
  )
}
