import { useState } from 'react'
import { Animated, Easing, Image, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useLoopAnimation } from '@/hooks'
import { cn } from '@/utils/helpers'
import { AppText } from './AppText'

const logoIcon = require('../../../assets/images/logo-icon.png')

export type CapNongLoadingProps = {
  /** Thông điệp hiển thị dưới vòng quay */
  message?: string
  /** Thông điệp phụ (slogan / ghi chú) */
  subMessage?: string
  size?: 'sm' | 'md' | 'lg'
  /** Phủ toàn màn hình, chặn thao tác bên dưới (VD: đang gửi đơn) */
  fullScreen?: boolean
  /** light: nền kem ấm, dark: xanh rừng đêm, transparent: không nền */
  variant?: 'light' | 'dark' | 'transparent'
  className?: string
}

// Kích thước giữ đúng tỉ lệ bản web (w-24 / w-36 / w-48).
const SIZE_CONFIG = {
  sm: {
    box: 96,
    viewBox: 120,
    rOuter: 52,
    rInner: 40,
    dashOuter: '100 240',
    dashInner: '60 200',
    icon: 32,
    glow: 40,
    title: 'text-xs',
    text: 'text-xs',
  },
  md: {
    box: 144,
    viewBox: 160,
    rOuter: 70,
    rInner: 54,
    dashOuter: '140 320',
    dashInner: '80 260',
    icon: 56,
    glow: 64,
    title: 'text-sm',
    text: 'text-xs',
  },
  lg: {
    box: 192,
    viewBox: 200,
    rOuter: 88,
    rInner: 68,
    dashOuter: '180 400',
    dashInner: '110 330',
    icon: 80,
    glow: 96,
    title: 'text-base',
    text: 'text-sm',
  },
} as const

const BG_BY_VARIANT = {
  light: 'bg-[#fcf9f1]',
  dark: 'bg-[#0b140b]',
  transparent: 'bg-transparent',
} as const

const easeInOut = Easing.inOut(Easing.ease)
const SHIMMER_WIDTH = 112

/** Bản mobile của CapNongLoading (web): vòng quỹ đạo quay quanh logo, chấm nhảy và thanh shimmer. */
export function CapNongLoading({
  message = 'Đang tải nông sản tươi ngon...',
  subMessage = 'CapNong · Nông sản xấu mã – ngon thật',
  size = 'md',
  fullScreen = false,
  variant = 'light',
  className,
}: CapNongLoadingProps) {
  const cfg = SIZE_CONFIG[size]
  const center = cfg.viewBox / 2
  const isDark = variant === 'dark'

  const spin = useLoopAnimation(2200)
  const spinReverse = useLoopAnimation(3000)
  const breathe = useLoopAnimation(2400, { easing: easeInOut })
  const bounce = useLoopAnimation(1000)
  const shimmer = useLoopAnimation(1800, { easing: easeInOut })

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const rotateReverse = spinReverse.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] })
  const floatY = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 0] })
  const floatScale = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1] })
  const glowOpacity = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 0.65, 0.25] })
  const glowScale = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.2, 0.9] })
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-SHIMMER_WIDTH, SHIMMER_WIDTH] })

  const ringBox = { width: cfg.box, height: cfg.box }
  const svgProps = { width: cfg.box, height: cfg.box, viewBox: `0 0 ${cfg.viewBox} ${cfg.viewBox}` }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      className={cn(
        'items-center justify-center p-6',
        BG_BY_VARIANT[variant],
        fullScreen ? 'absolute inset-0 z-50' : 'w-full flex-1 py-12',
        // Nền overlay hơi trong để còn thấy màn hình phía sau, như backdrop-blur bản web.
        fullScreen && variant === 'light' && 'bg-[#fcf9f1]/90',
        fullScreen && isDark && 'bg-[#0b140b]/95',
        className,
      )}
    >
      <View style={ringBox} className="items-center justify-center">
        {/* Quầng sáng thở */}
        <Animated.View
          style={{
            position: 'absolute',
            width: cfg.glow * 1.6,
            height: cfg.glow * 1.6,
            borderRadius: cfg.glow,
            backgroundColor: isDark ? 'rgba(52,211,153,0.25)' : 'rgba(16,185,129,0.2)',
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          }}
        />

        {/* Hai vòng tĩnh mờ */}
        <Svg {...svgProps} style={StyleSheet.absoluteFill}>
          <Circle
            cx={center}
            cy={center}
            r={cfg.rOuter}
            fill="none"
            stroke={isDark ? '#22c55e' : '#326318'}
            strokeWidth={1.2}
            strokeOpacity={isDark ? 0.15 : 0.12}
          />
          <Circle
            cx={center}
            cy={center}
            r={cfg.rInner}
            fill="none"
            stroke={isDark ? '#84cc16' : '#22c55e'}
            strokeWidth={1}
            strokeOpacity={isDark ? 0.2 : 0.15}
            strokeDasharray="3 4"
          />
        </Svg>

        {/* Quỹ đạo ngoài, quay thuận chiều kim đồng hồ */}
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          <Svg {...svgProps}>
            <Defs>
              <LinearGradient id="capnong-spin-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#86efac" stopOpacity={0} />
                <Stop offset="50%" stopColor="#22c55e" stopOpacity={0.85} />
                <Stop offset="100%" stopColor="#15803d" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={center}
              cy={center}
              r={cfg.rOuter}
              fill="none"
              stroke="url(#capnong-spin-grad-1)"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeDasharray={cfg.dashOuter}
            />
            <Circle cx={center + cfg.rOuter} cy={center} r={2.5} fill="#86efac" />
          </Svg>
        </Animated.View>

        {/* Quỹ đạo trong, quay ngược chiều */}
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateReverse }] }]}>
          <Svg {...svgProps}>
            <Defs>
              <LinearGradient id="capnong-spin-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#ca8a04" stopOpacity={0} />
                <Stop offset="60%" stopColor="#84cc16" stopOpacity={0.8} />
                <Stop offset="100%" stopColor="#22c55e" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={center}
              cy={center}
              r={cfg.rInner}
              fill="none"
              stroke="url(#capnong-spin-grad-2)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={cfg.dashInner}
            />
          </Svg>
        </Animated.View>

        {/* Logo ở tâm, nhịp thở nhẹ */}
        <Animated.View style={{ transform: [{ translateY: floatY }, { scale: floatScale }] }}>
          <Image
            source={logoIcon}
            accessibilityIgnoresInvertColors
            style={{ width: cfg.icon, height: cfg.icon }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <View className="mt-5 items-center px-4">
        <AppText
          weight="extrabold"
          className={cn('uppercase tracking-wider', cfg.title)}
          style={{ color: isDark ? '#34d399' : '#2b591b' }}
        >
          CapNong
        </AppText>

        <View className="mt-1 flex-row items-center gap-1.5">
          <AppText weight="semibold" className={cfg.text} style={{ color: isDark ? '#d1d5db' : '#55624d' }}>
            {message}
          </AppText>
          <View className="flex-row items-center gap-1">
            {[0, 0.15, 0.3].map((offset) => (
              <BounceDot key={offset} progress={bounce} offset={offset} />
            ))}
          </View>
        </View>

        {!!subMessage && (
          <AppText
            weight="medium"
            // Cỡ chữ và màu đặt bằng style: cn không gộp class nên text-[...] có thể thua text-base text-ink mặc định của AppText.
            style={{ fontSize: 12, lineHeight: 16, color: isDark ? '#9ca3af' : '#7a8572' }}
            className="mt-1 opacity-70"
          >
            {subMessage}
          </AppText>
        )}

        {/* Thanh shimmer */}
        <View
          style={{ width: SHIMMER_WIDTH }}
          className={cn('mt-3.5 h-1 overflow-hidden rounded-full', isDark ? 'bg-white/10' : 'bg-emerald-950/10')}
        >
          <Animated.View style={{ width: SHIMMER_WIDTH, height: 4, transform: [{ translateX: shimmerX }] }}>
            <ShimmerBand width={SHIMMER_WIDTH} height={4} color="#10b981" />
          </Animated.View>
        </View>
      </View>
    </View>
  )
}

/** Chấm nhảy kiểu animate-bounce, lệch pha theo offset (giây / 1). */
function BounceDot({ progress, offset }: { progress: Animated.Value; offset: number }) {
  const translateY = progress.interpolate({
    inputRange: [0, offset, offset + 0.25, offset + 0.5, 1],
    outputRange: [0, 0, -3, 0, 0],
  })
  return (
    <Animated.View
      style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#10b981', transform: [{ translateY }] }}
    />
  )
}

/** Dải gradient trong suốt → màu → trong suốt, dùng chung cho shimmer của Loading và Skeleton. */
export function ShimmerBand({
  width,
  height,
  color,
  peakOpacity = 1,
}: {
  width: number
  height: number
  color: string
  peakOpacity?: number
}) {
  // id riêng cho từng kích thước để nhiều dải trên cùng màn không đè gradient của nhau.
  const [id] = useState(() => `shimmer-${Math.random().toString(36).slice(2)}`)
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={color} stopOpacity={0} />
          <Stop offset="50%" stopColor={color} stopOpacity={peakOpacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  )
}
