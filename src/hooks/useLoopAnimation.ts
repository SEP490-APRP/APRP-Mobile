import { useEffect, useState } from 'react'
import { Animated, Easing, type EasingFunction } from 'react-native'
import { useReducedMotion } from './useReducedMotion'

/**
 * Giá trị chạy 0 → 1 lặp vô hạn, dùng cho các @keyframes của bản web.
 * Tắt hẳn (đứng ở 0) khi máy bật "Giảm chuyển động".
 */
export function useLoopAnimation(
  duration: number,
  { easing = Easing.linear, delay = 0 }: { easing?: EasingFunction; delay?: number } = {},
) {
  const [value] = useState(() => new Animated.Value(0))
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      value.setValue(0)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [value, duration, easing, delay, reduced])

  return value
}
