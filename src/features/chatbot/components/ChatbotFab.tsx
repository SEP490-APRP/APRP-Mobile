import { usePathname, router } from 'expo-router'
import { Image } from 'expo-image'
import { useEffect, useRef, useState } from 'react'
import { Animated, PanResponder, Pressable, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText } from '@/components/ui'
import { useChatbotStore } from '../stores/useChatbotStore'
import { chatbotRoute, type ChatbotRole } from '../utils/chatbotNavigation'

const logo = require('../../../../assets/images/logo-icon.png')

const FAB_SIZE = 56
const DRAG_THRESHOLD = 4
const EDGE_GAP = 16
/** Chừa chỗ cho thanh tab (cao khoảng 66). */
const TAB_BAR_HEIGHT = 66

/** Các màn không nên bị che hoặc thoát giữa chừng, giống hideFAB của app cũ. */
const HIDDEN_PATTERN = /^\/(?:buyer|shop|shipper)\/(?:chatbot|checkout|payment|messages\/)/

/** Nút mở chat kéo được. Chuyển từ ChatBotFAB của app cũ, giao diện theo APRP-Mobile. */
export function ChatbotFab({ role }: { role: ChatbotRole }) {
  const pathname = usePathname()
  const unreadCount = useChatbotStore((s) => s.unreadCount)
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const bounds = {
    maxX: width - FAB_SIZE,
    minY: insets.top + EDGE_GAP,
    maxY: height - FAB_SIZE - TAB_BAR_HEIGHT - insets.bottom - EDGE_GAP,
  }
  const [start] = useState(() => ({ x: bounds.maxX - EDGE_GAP, y: bounds.maxY }))
  const [position] = useState(() => new Animated.ValueXY(start))
  const current = useRef(start)
  const limits = useRef(bounds)

  // Xoay màn hình hoặc đổi cỡ cửa sổ: đưa nút về trong vùng nhìn thấy.
  useEffect(() => {
    limits.current = bounds
    const next = {
      x: Math.min(current.current.x, bounds.maxX),
      y: Math.max(bounds.minY, Math.min(current.current.y, bounds.maxY)),
    }
    current.current = next
    position.setValue(next)
  }, [bounds.maxX, bounds.minY, bounds.maxY]) // eslint-disable-line react-hooks/exhaustive-deps

  const [panResponder] = useState(() => {
    const settle = (dx: number, dy: number) => {
      position.flattenOffset()
      const { maxX, minY, maxY } = limits.current
      const next = {
        x: Math.max(0, Math.min(maxX, current.current.x + dx)),
        y: Math.max(minY, Math.min(maxY, current.current.y + dy)),
      }
      current.current = next
      Animated.spring(position, { toValue: next, useNativeDriver: false, tension: 80, friction: 8 }).start()
    }
    return PanResponder.create({
      // Chỉ nhận khi kéo thật, để chạm nhẹ vẫn tới được nút bên trong.
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: () => {
        position.setOffset(current.current)
        position.setValue({ x: 0, y: 0 })
      },
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => settle(g.dx, g.dy),
      onPanResponderTerminate: (_, g) => settle(g.dx, g.dy),
    })
  })

  if (HIDDEN_PATTERN.test(pathname)) return null

  return (
    <Animated.View
      style={{ position: 'absolute', left: 0, top: 0, transform: position.getTranslateTransform() }}
      {...panResponder.panHandlers}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unreadCount > 0 ? `Mở trợ lý CapNong, ${unreadCount} tin mới` : 'Mở trợ lý CapNong'}
        onPress={() => router.push(chatbotRoute[role])}
        style={{ width: FAB_SIZE, height: FAB_SIZE }}
        className="items-center justify-center rounded-full border-2 border-leaf-700 bg-white p-1.5 shadow-lg active:opacity-80"
      >
        <Image source={logo} contentFit="contain" style={{ width: '100%', height: '100%' }} />
        {unreadCount > 0 && (
          <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-sale px-1">
            <AppText weight="bold" className="text-caption text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </AppText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  )
}
