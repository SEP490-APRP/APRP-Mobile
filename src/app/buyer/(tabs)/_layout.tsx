import { ClipboardList, House, Leaf, ShoppingCart, UserRound } from 'lucide-react-native'
import { Tabs } from 'expo-router/js-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCartCount } from '@/features/cart'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'

/** Thanh tab dưới của Khách Mua, thay cho Header/menu của bản web. */
export default function BuyerTabsLayout() {
  const cartCount = useCartCount()
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.leaf700,
        tabBarInactiveTintColor: colors.inkSubtle,
        tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
        // Cao hơn mặc định một chút để chữ Be Vietnam Pro không bị cắt chân.
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
        options={{ title: 'Trang chủ', tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="fresh"
        options={{ title: 'Nông sản', tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Giỏ hàng',
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
          tabBarBadge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.sale, fontSize: 12, lineHeight: 16 },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Đơn hàng', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Tài khoản', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }}
      />
    </Tabs>
  )
}
