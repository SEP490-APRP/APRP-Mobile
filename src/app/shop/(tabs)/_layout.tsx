import { ClipboardList, LayoutDashboard, Package, Store } from 'lucide-react-native'
import { useShopOrders, shopOrderStats } from '@/features/shop'
import { Tabs } from 'expo-router/js-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'

/** Thanh tab dưới của Nhà Vườn, thay cho thanh bên (sidebar) của kênh người bán bản web. */
export default function ShopTabsLayout() {
  const insets = useSafeAreaInsets()
  // Số đơn chờ xác nhận hiện thành chấm đỏ trên tab Đơn hàng.
  const needsConfirm = shopOrderStats(useShopOrders().data?.content).needsConfirm
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
        options={{ title: 'Tổng quan', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
          tabBarBadge: needsConfirm > 0 ? needsConfirm : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.sale, fontSize: 12, lineHeight: 16 },
        }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Sản phẩm', tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Gian hàng', tabBarIcon: ({ color, size }) => <Store color={color} size={size} /> }}
      />
    </Tabs>
  )
}
