import '../../global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CapNongLoading } from '@/components/ui'
import { queryClient, setupReactQueryForMobile } from '@/lib/queryClient'
import { useAuth } from '@/stores'
import { appFonts } from '@/theme/fonts'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts)
  const { hasHydrated, isAuthenticated, user } = useAuth()
  const fontsReady = fontsLoaded || !!fontError

  useEffect(() => setupReactQueryForMobile(), [])

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {})
  }, [fontsReady])

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
