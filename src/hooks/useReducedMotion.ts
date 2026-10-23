import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/** true khi người dùng bật "Giảm chuyển động" trong cài đặt máy (thay cho motion-reduce của Tailwind web). */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => {})
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => sub.remove()
  }, [])
  return reduced
}
