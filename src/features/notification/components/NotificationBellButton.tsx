import { router } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { useNotificationUnreadCount } from '@/features/notification/hooks/useNotifications'
import { useAuthStore } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

export interface NotificationBellButtonProps {
  role?: 'buyer' | 'shop' | 'shipper'
  variant?: 'default' | 'translucent' | 'ghost'
  size?: number
  className?: string
  iconColor?: string
  onPress?: () => void
}

/**
 * Nút chuông thông báo có badge số lượng chưa đọc thời gian thực.
 * Tự động điều hướng đến màn hình thông báo tương ứng với role.
 */
export function NotificationBellButton({
  role,
  variant = 'default',
  size = 20,
  className,
  iconColor,
  onPress,
}: NotificationBellButtonProps) {
  const user = useAuthStore((s) => s.user)
  const currentRole = role || (user?.role as 'buyer' | 'shop' | 'shipper') || 'buyer'

  const { data: unreadCount = 0 } = useNotificationUnreadCount()

  const handlePress = () => {
    if (onPress) {
      onPress()
      return
    }

    if (currentRole === 'shop') {
      router.push('/shop/notifications' as any)
    } else if (currentRole === 'shipper') {
      router.push('/shipper/notifications' as any)
    } else {
      router.push('/buyer/notifications' as any)
    }
  }

  // Xác định màu icon
  const resolvedColor =
    iconColor || (variant === 'translucent' ? colors.white : colors.ink)

  // Style container
  const containerStyle = cn(
    'relative items-center justify-center',
    variant === 'default' &&
      'h-10 w-10 rounded-xl border border-line bg-white active:bg-leaf-50',
    variant === 'translucent' &&
      'h-10 w-10 rounded-full bg-white/15 active:bg-white/25',
    variant === 'ghost' && 'h-10 w-10 rounded-full active:bg-black/5',
    className,
  )

  const label =
    unreadCount > 0
      ? `Thông báo, có ${unreadCount} thông báo chưa đọc`
      : 'Thông báo'

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className={containerStyle}
    >
      <Bell size={size} color={resolvedColor} />

      {unreadCount > 0 && (
        <View
          className={cn(
            'absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-sale px-1',
            variant === 'translucent' && 'border border-leaf-900',
          )}
        >
          <AppText weight="extrabold" className="text-[9px] text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </AppText>
        </View>
      )}
    </Pressable>
  )
}

