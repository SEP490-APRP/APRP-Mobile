import { Stack } from 'expo-router'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Toast } from '@/components/ui'
import { ChatbotFab, useChatbotSession } from '@/features/chatbot'

/** Khu vực Nhà Vườn: các tab chính, cộng các màn mở chồng lên (chi tiết đơn, thêm sản phẩm...). */
export default function ShopLayout() {
  const insets = useSafeAreaInsets()
  useChatbotSession()
  return (
    <View className="flex-1 bg-paper">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <ChatbotFab role="shop" />
      {/* Nằm trên thanh tab (cao khoảng 66) */}
      <Toast bottom={insets.bottom + 78} />
    </View>
  )
}
