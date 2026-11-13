import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import { deviceService } from './device.service'
import { secureStorage } from '@/stores/storage'

const PUSH_TOKEN_STORAGE_KEY = 'capnong_device_push_token'
let isRegistering = false

/**
 * Cấu hình hiển thị thông báo khi ứng dụng đang chạy ở Foreground (màn hình đang mở).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
})

/**
 * Khởi tạo Notification Channels trên Android (Android 8.0+).
 */
export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return

  try {
    await Notifications.setNotificationChannelAsync('order_updates', {
      name: 'Đơn hàng & Giao vận',
      description: 'Cập nhật trạng thái đơn hàng, tài xế nhận đơn và báo giao hàng',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16a34a',
    })
  } catch (err) {
    console.warn('[PushNotification] Error setting up order_updates channel:', err)
  }

  try {
    await Notifications.setNotificationChannelAsync('chat_messages', {
      name: 'Tin nhắn trò chuyện',
      description: 'Tin nhắn trao đổi giữa Người mua, Nhà vườn và Tài xế',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 150, 150, 150],
    })
  } catch (err) {
    console.warn('[PushNotification] Error setting up chat_messages channel:', err)
  }

  try {
    await Notifications.setNotificationChannelAsync('general_promotions', {
      name: 'Khuyến mãi & Tin tức chung',
      description: 'Thông báo từ Ban quản trị và các chương trình ưu đãi',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  } catch (err) {
    console.warn('[PushNotification] Error setting up general_promotions channel:', err)
  }
}

/**
 * Xin quyền thông báo và lấy Expo Push Token gửi lên Backend.
 * Giữ nguyên một token cố định cho mỗi thiết bị vật lý để tránh sinh trùng lặp token trong DB.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null
  }

  if (isRegistering) {
    return null
  }
  isRegistering = true

  try {
    // 1. Kiểm tra xem thiết bị này đã từng lưu token trước đó chưa
    let existingToken = await secureStorage.getItem(PUSH_TOKEN_STORAGE_KEY)

    // 2. Khởi tạo Notification Channels
    await setupAndroidNotificationChannels()

    // 3. Xin quyền nhận thông báo từ người dùng
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushNotification] Permission not granted for notifications')
      return null
    }

    // 4. Lấy hoặc tạo token cố định cho thiết bị
    let token = existingToken
    if (!token) {
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
        const pushTokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        )
        token = pushTokenData.data
      } catch (tokenErr) {
        // Trong Expo Go Android (SDK 53+), Remote Push bị tắt; tạo token cố định theo Device Model
        const safeModel = Device.modelName ? Device.modelName.replace(/[^a-zA-Z0-9]/g, '_') : 'Device'
        token = `ExponentPushToken[DEV_${Platform.OS.toUpperCase()}_${safeModel}]`
        console.log('[PushNotification] Expo Go Android dev token:', token)
      }

      if (token) {
        await secureStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token)
      }
    }

    // 5. Gửi token lên Backend
    if (token) {
      await deviceService.registerToken({
        deviceToken: token,
        platform: Platform.OS.toUpperCase(),
        deviceName: Device.modelName ?? undefined,
        tokenType: 'EXPO',
      })
      console.log('[PushNotification] Synchronized device token with BE:', token)
    }

    return token
  } catch (error) {
    console.warn('[PushNotification] Error registering for push notifications:', error)
    return null
  } finally {
    isRegistering = false
  }
}

/**
 * Hiển thị thông báo ngay lập tức trên hệ thống điện thoại (Status Bar / Lock Screen).
 */
export async function showLocalNotificationAsync(
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId: string = 'order_updates',
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' ? { channelId } : {}),
      },
      trigger: null, // trigger null = phát ngay lập tức
    })
  } catch (error) {
    console.warn('[PushNotification] Failed to show local notification:', error)
  }
}

/**
 * Huỷ token trên Backend khi người dùng đăng xuất để bảo mật thông tin riêng tư.
 */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  try {
    const storedToken = await secureStorage.getItem(PUSH_TOKEN_STORAGE_KEY)
    if (storedToken) {
      await deviceService.unregisterToken(storedToken)
      await secureStorage.removeItem(PUSH_TOKEN_STORAGE_KEY)
      console.log('[PushNotification] Successfully unregistered device push token from BE')
    }
  } catch (error) {
    console.warn('[PushNotification] Error unregistering push token:', error)
  }
}

/**
 * Xử lý điều hướng Deep Linking khi người dùng chạm vào banner thông báo đẩy.
 * Hỗ trợ cả Foreground, Background và Cold-Start (khi app bị tắt hoàn toàn).
 */
export function handleNotificationDeepLink(
  data: Record<string, any> | undefined,
  currentRole?: string,
): void {
  if (!data) return

  // Chuẩn hóa dữ liệu từ push notification payload
  const rawData = typeof data === 'string' ? safeParseJson(data) : data
  const type = (rawData?.type as string | undefined)?.toUpperCase()
  const orderId = rawData?.orderId ?? rawData?.referenceId ?? rawData?.id
  const conversationId = rawData?.conversationId

  // Lấy role từ tham số hoặc trực tiếp từ Auth Store
  let role = currentRole?.toLowerCase()
  if (!role) {
    try {
      const { useAuth } = require('@/stores/useAuthStore')
      role = useAuth.getState().user?.role?.toLowerCase()
    } catch {
      // ignore
    }
  }

  console.log('[PushNotification] Deep Linking triggered:', { type, orderId, conversationId, role })

  // Trì hoãn 100-200ms để đảm bảo Navigation Stack của Expo Router đã render hoàn tất
  setTimeout(() => {
    try {
      const isOrderRelated =
        type === 'ORDER_STATUS' ||
        type === 'NEW_ORDER' ||
        type?.startsWith('ORDER_') ||
        type?.startsWith('DISPATCH_') ||
        type?.startsWith('REFUND_') ||
        type?.startsWith('RETURN_')

      if (isOrderRelated && orderId) {
        if (role === 'buyer') {
          router.push(`/buyer/order/${orderId}` as any)
        } else if (role === 'shop') {
          router.push(`/shop/order/${orderId}` as any)
        } else if (role === 'shipper') {
          router.push(`/shipper/tracking/${orderId}` as any)
        } else {
          fallbackNotificationScreen(role)
        }
      } else if (type === 'SHIPPER_OFFER') {
        if (role === 'shipper') {
          router.push('/shipper/(tabs)/' as any)
        } else {
          fallbackNotificationScreen(role)
        }
      } else if (type === 'CHAT_MESSAGE') {
        if (role === 'buyer') {
          if (conversationId) {
            router.push(`/buyer/messages/${conversationId}` as any)
          } else {
            router.push('/buyer/messages' as any)
          }
        } else if (role === 'shop') {
          if (conversationId) {
            router.push(`/shop/messages/${conversationId}` as any)
          } else {
            router.push('/shop/messages' as any)
          }
        } else if (role === 'shipper') {
          router.push('/shipper/messages' as any)
        } else {
          fallbackNotificationScreen(role)
        }
      } else if (type === 'WALLET_UPDATE') {
        if (role === 'shipper') {
          router.push('/shipper/wallet' as any)
        } else if (role === 'buyer') {
          router.push('/buyer/wallet' as any)
        } else {
          fallbackNotificationScreen(role)
        }
      } else {
        // Thông báo hệ thống, khuyến mãi chung -> mở thẳng Trung tâm thông báo
        fallbackNotificationScreen(role)
      }
    } catch (error) {
      console.warn('[PushNotification] Navigation error on notification tap:', error)
    }
  }, 150)
}

function fallbackNotificationScreen(role?: string) {
  if (role === 'buyer') {
    router.push('/buyer/notifications' as any)
  } else if (role === 'shop') {
    router.push('/shop/notifications' as any)
  } else if (role === 'shipper') {
    router.push('/shipper/notifications' as any)
  }
}

function safeParseJson(value: any) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
