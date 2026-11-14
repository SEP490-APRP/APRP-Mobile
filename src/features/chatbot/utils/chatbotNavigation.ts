import type { Href } from 'expo-router'
import type { AiItemOption } from '@/services/chatbot.types'

export type ChatbotRole = 'buyer' | 'shop' | 'shipper'

const TAB_ROUTES = new Set<string>([
  '/buyer',
  '/buyer/fresh',
  '/buyer/cart',
  '/buyer/orders',
  '/buyer/account',
  '/shop',
  '/shop/orders',
  '/shop/products',
  '/shop/account',
  '/shipper',
  '/shipper/delivering',
  '/shipper/earnings',
  '/shipper/account',
])

/** Tab nằm dưới màn chat trong stack nên phải quay về, không mở thêm một bộ tab mới. */
export const isTabRoute = (href: Href): boolean => typeof href === 'string' && TAB_ROUTES.has(href)

export const chatbotRoute: Record<ChatbotRole, Href> = {
  buyer: '/buyer/chatbot' as Href,
  shop: '/shop/chatbot' as Href,
  shipper: '/shipper/chatbot' as Href,
}

export const homeRoute: Record<ChatbotRole, Href> = {
  buyer: '/buyer',
  shop: '/shop',
  shipper: '/shipper',
}

export const messagesRoute: Record<ChatbotRole, Href> = {
  buyer: '/buyer/messages' as Href,
  shop: '/shop/messages' as Href,
  shipper: '/shipper/messages' as Href,
}

function parseUrl(url: string): { path: string; query: Record<string, string> } {
  const [rawPath, rawQuery = ''] = url.trim().split('?')
  const query: Record<string, string> = {}
  for (const pair of rawQuery.split('&')) {
    const [key, value] = pair.split('=')
    if (key) query[key] = decodeURIComponent(value ?? '')
  }
  return { path: rawPath.replace(/\/+$/, '') || '/', query }
}

const orderRoute = (id: string): Href => ({ pathname: '/buyer/order/[id]', params: { id } })

const hasId = (id?: string): id is string => Number(id) > 0

function buyerRoute(first: string | undefined, second: string | undefined, query: Record<string, string>): Href | null {
  switch (first) {
    case 'cart':
    case 'gio-hang':
      return '/buyer/cart'
    case 'checkout':
    case 'thanh-toan':
      return '/buyer/checkout'
    case 'orders':
    case 'my-orders':
    case 'don-hang':
      return hasId(query.orderId) ? orderRoute(query.orderId) : '/buyer/orders'
    case 'profile':
    case 'tai-khoan':
      if (query.tab === 'orders') return hasId(query.orderId) ? orderRoute(query.orderId) : '/buyer/orders'
      if (query.tab === 'address' || query.tab === 'addresses') return '/buyer/addresses'
      return '/buyer/account'
    case 'san-pham':
      return hasId(second) ? { pathname: '/buyer/product/[id]', params: { id: second } } : '/buyer/fresh'
    case 'nong-san-tuoi':
      return '/buyer/fresh'
    case 'combo-tui-mu':
      return '/buyer/combos'
    case 'my-vouchers':
    case 'kho-voucher':
    case 'voucher-cua-toi':
      return '/buyer/vouchers'
    case 'cua-hang':
      return hasId(second) ? { pathname: '/buyer/shop/[id]', params: { id: second } } : null
    case 'cau-chuyen-nong-dan':
    case 'stories':
      return '/buyer/stories'
    default:
      return null
  }
}

function shopRoute(first: string | undefined, query: Record<string, string>): Href | null {
  if (first === 'tai-khoan' || first === 'profile') return '/shop/account'
  if (first !== 'shop') return null
  switch (query.tab) {
    case undefined:
    case 'overview':
      return '/shop'
    case 'products':
      if (query.action === 'add') return '/shop/product/new'
      if (query.action === 'blindbox') return { pathname: '/shop/bundle', params: { kind: 'MYSTERY_BOX' } }
      if (query.action === 'combo') return { pathname: '/shop/bundle', params: { kind: 'COMBO' } }
      return '/shop/products'
    case 'orders':
      return '/shop/orders'
    case 'vouchers':
      return '/shop/vouchers'
    case 'blogs':
      return '/shop/blogs'
    case 'profile':
      return '/shop/profile-edit'
    case 'messages':
      return '/shop/messages' as Href
    default:
      return null
  }
}

function shipperRoute(first: string | undefined, query: Record<string, string>): Href | null {
  if (first === 'tai-khoan' || first === 'profile') return '/shipper/account'
  if (first !== 'shipper') return null
  switch (query.tab) {
    case undefined:
    case 'new':
      return '/shipper'
    case 'delivering':
      return '/shipper/delivering'
    case 'profile':
      return '/shipper/account'
    default:
      return null
  }
}

/**
 * BE trả URL của web (/cart, /shop?tab=products...), đổi sang route của vai trò đang đăng nhập.
 * Trả null khi app chưa có màn tương ứng hoặc URL dành cho vai trò khác.
 */
export function resolveChatbotRoute(url: string | null | undefined, role: ChatbotRole): Href | null {
  if (!url || !url.startsWith('/')) return null
  const { path, query } = parseUrl(url)
  const [, first, second] = path.split('/')
  if (first === 'tin-nhan') return messagesRoute[role]
  if (role === 'shop') return shopRoute(first, query)
  if (role === 'shipper') return shipperRoute(first, query)
  return buyerRoute(first, second, query)
}

/** Màn chi tiết của một món. Khác bản web: mobile có sẵn màn chi tiết combo và túi mù. */
export function itemDetailRoute(item: Pick<AiItemOption, 'itemType' | 'itemId'>): Href {
  const id = String(item.itemId)
  if (item.itemType === 'PRODUCT') return { pathname: '/buyer/product/[id]', params: { id } }
  return {
    pathname: '/buyer/combo/[id]',
    params: { id, kind: item.itemType === 'MYSTERY_BOX' ? 'MYSTERY_BOX' : 'BUILD_COMBO' },
  }
}

/** Nút chính của thẻ theo dõi đơn: đơn đang giao mở bản đồ, còn lại mở chi tiết đơn. */
export function orderTrackingAction(orderId: number, status?: string): { label: string; href: Href } {
  const id = String(orderId)
  const detail: Href = { pathname: '/buyer/order/[id]', params: { id } }
  switch (status) {
    case 'SHIPPING':
    case 'PICKED_UP':
      return { label: 'Theo dõi hành trình Shipper', href: { pathname: '/buyer/tracking/[id]', params: { id } } }
    case 'PENDING':
      return { label: 'Xem đơn hàng chờ xác nhận', href: detail }
    case 'CONFIRMED':
    case 'READY':
      return { label: 'Xem đơn hàng đang đóng gói', href: detail }
    case 'AWAITING_PAYMENT':
      return { label: 'Thanh toán đơn hàng ngay', href: detail }
    case 'COMPLETED':
    case 'DELIVERED':
      return { label: 'Xem chi tiết đơn đã giao', href: detail }
    case 'CANCELLED':
      return { label: 'Xem chi tiết đơn đã hủy', href: detail }
    default:
      return { label: 'Xem chi tiết đơn hàng', href: detail }
  }
}
