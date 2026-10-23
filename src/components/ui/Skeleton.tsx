import { useState } from 'react'
import { Animated, StyleSheet, View, type ViewProps } from 'react-native'
import { useLoopAnimation } from '@/hooks'
import { cn } from '@/utils/helpers'
import { ShimmerBand } from './CapNongLoading'

/**
 * Khối placeholder có hiệu ứng shimmer, đặt kích thước bằng className như bản web
 * (VD: "h-4 w-2/3"). Tự đứng yên khi máy bật "Giảm chuyển động".
 */
export function Skeleton({ className, style, ...rest }: ViewProps & { className?: string }) {
  const [width, setWidth] = useState(0)
  const progress = useLoopAnimation(1400)
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-width, width] })

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className={cn('overflow-hidden rounded-lg bg-leaf-100/70', className)}
      style={style}
      {...rest}
    >
      {width > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <ShimmerBand width={width} height={400} color="#ffffff" peakOpacity={0.6} />
        </Animated.View>
      )}
    </View>
  )
}

/** Các dòng chữ giả, dòng cuối ngắn hơn cho tự nhiên. */
export function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <View className={cn('gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </View>
  )
}
