import '../../global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CapNongLoading } from '@/components/ui'
import { queryClient, setupReactQueryForMobile } from '@/lib/queryClient'
import { useAuth } from '@/stores'
import { appFonts } from '@/theme/fonts'
import {
  registerForPushNotificationsAsync,
  handleNotificationDeepLink,
} from '@/services/pushNotification'
import { useNotificationListener } from '@/services/useNotificationListener'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts)
  const { hasHydrated, isAuthenticated, user } = useAuth()
  const fontsReady = fontsLoaded || !!fontError

  // Lắng nghe WebSocket thông báo thời gian thực để kích hoạt banner native
  useNotificationListener()

  useEffect(() => setupReactQueryForMobile(), [])

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {})
  }, [fontsReady])

  // Tự động đăng ký Push Token với Backend khi người dùng đã có phiên đăng nhập hợp lệ
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync().catch((err) => {
        console.warn('[RootLayout] Auto push token registration failed:', err)
      })
    }
  }, [isAuthenticated])

  // Kiểm tra Cold-start: Người dùng bấm vào thông báo khi app đang tắt hoàn toàn hoặc chạy ngầm bị kill
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          const data = response.notification.request.content.data
          console.log('[RootLayout] Cold-start notification tap detected:', data)
          handleNotificationDeepLink(data, user?.role)
        }
      })
      .catch((err) => {
        console.warn('[RootLayout] Error reading cold-start notification response:', err)
      })
  }, [hasHydrated, isAuthenticated, user?.role])

  // Lắng nghe sự kiện thông báo (khi mở app & khi bấm vào banner ngoài màn hình khóa/khay thông báo)
  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      // Cập nhật lại cache danh sách và badge số lượng chưa đọc khi có thông báo mới
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    })

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data
      console.log('[RootLayout] Warm/Foreground notification tap detected:', data)
      handleNotificationDeepLink(data, user?.role)
    })

    return () => {
      receivedSubscription.remove()
      responseSubscription.remove()
    }
  }, [user?.role])

  // Giữ splash tới khi có font; sau đó hiện CapNongLoading (như PageLoading bản web)
  // cho tới khi đọc xong phiên từ SecureStore, tránh nháy màn đăng nhập.
  if (!fontsReady) return null
  if (!hasHydrated) return <CapNongLoading message="Đang tải nông sản tươi ngon..." />

  const role = isAuthenticated ? user?.role : undefined

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Màn hình Deep Link tiếp thị mở cho cả khách vãng lai và người dùng đã đăng nhập */}
          <Stack.Screen name="ref/[code]" />

          {/* Thay cho RequireRole.tsx: mỗi khu vực chỉ mở khi đúng vai trò; sai thì Expo Router đưa về index. */}
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={role === 'buyer'}>
            <Stack.Screen name="buyer" />
          </Stack.Protected>
          <Stack.Protected guard={role === 'shop'}>
            <Stack.Screen name="shop" />
          </Stack.Protected>
          <Stack.Protected guard={role === 'shipper'}>
            <Stack.Screen name="shipper" />
          </Stack.Protected>
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
