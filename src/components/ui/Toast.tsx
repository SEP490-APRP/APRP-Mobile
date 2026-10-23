import { useEffect, useState } from 'react'
import { Animated, Pressable } from 'react-native'
import { useUiStore } from '@/stores'
import { AppText } from './AppText'

/**
 * Hiện thông báo ngắn của useUiStore (VD "Đã thêm vào giỏ hàng!"), chạm để đóng.
 * `bottom` để đẩy toast lên trên thanh tab.
 */
export function Toast({ bottom = 24 }: { bottom?: number }) {
  const message = useUiStore((s) => s.toast)
  const hideToast = useUiStore((s) => s.hideToast)
  const [opacity] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: message ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [message, opacity])

  if (!message) return null
  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 16, right: 16, bottom, opacity }}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        onPress={hideToast}
        className="rounded-card bg-ink px-4 py-3 shadow-lg"
      >
        <AppText weight="semibold" className="text-center text-sm text-white">
          {message}
        </AppText>
      </Pressable>
    </Animated.View>
  )
}
