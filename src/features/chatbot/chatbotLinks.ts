import * as Clipboard from 'expo-clipboard'
import { router, type Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import type { AiItemOption } from '@/services/chatbot.types'
import { useAuthStore, useUiStore } from '@/stores'
import { isTabRoute, itemDetailRoute, messagesRoute, resolveChatbotRoute, type ChatbotRole } from './utils/chatbotNavigation'

const toast = (message: string) => useUiStore.getState().showToast(message)

export const currentChatbotRole = (): ChatbotRole => {
  const role = useAuthStore.getState().user?.role
  return role === 'shop' || role === 'shipper' ? role : 'buyer'
}

/**
 * Đóng chat rồi mở màn đích, giống app cũ: bấm back ở màn đích về màn trước khi mở chat.
 * Hội thoại vẫn nằm trong store nên mở lại chat không mất tin nhắn.
 */
export function leaveChatTo(href: Href) {
  if (isTabRoute(href)) router.dismissTo(href)
  else router.replace(href)
}

/** Mở URL do BE trả. App chưa có màn tương ứng thì báo thay vì đưa tới màn "không tìm thấy". */
export function openChatbotUrl(url?: string | null) {
  const href = resolveChatbotRoute(url, currentChatbotRole())
  if (href) leaveChatTo(href)
  else toast('Tính năng này hiện có trên bản web.')
}

export function openChatbotItem(item: Pick<AiItemOption, 'itemType' | 'itemId'>) {
  if (currentChatbotRole() === 'buyer') leaveChatTo(itemDetailRoute(item))
  else toast('Chi tiết sản phẩm dành cho tài khoản Khách mua.')
}

export const openOrderDetail = (orderId: number) => openChatbotUrl(`/orders?orderId=${orderId}`)

export const openMessages = () => leaveChatTo(messagesRoute[currentChatbotRole()])

export const callPhone = (phone: string) => {
  Linking.openURL(`tel:${phone}`).catch(() => toast('Không thể mở ứng dụng gọi điện.'))
}

export const openExternalLink = (url: string) => {
  Linking.openURL(url).catch(() => toast('Không thể mở liên kết này.'))
}

export const openPaymentLink = (url: string) => {
  WebBrowser.openBrowserAsync(url).catch(() => toast('Không thể mở trang thanh toán.'))
}

export const copyText = (text: string, successMessage: string) => {
  Clipboard.setStringAsync(text)
    .then(() => toast(successMessage))
    .catch(() => toast('Không thể sao chép. Vui lòng thử lại.'))
}
