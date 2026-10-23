import { Stack } from 'expo-router'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Toast } from '@/components/ui'

/** Khu vực Khách Mua: các tab chính, cộng các màn mở chồng lên (chi tiết sản phẩm...). */
export default function BuyerLayout() {
  const insets = useSafeAreaInsets()
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
