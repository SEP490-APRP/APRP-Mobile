import type { CartItemResponse, CartResponse } from '@/types/cart.types'

/** BE trả `available` hoặc `isAvailable` tuỳ endpoint; thiếu cả hai coi như còn bán. */
export const isItemAvailable = (item: CartItemResponse) => item.available !== false && item.isAvailable !== false

export const cartItemName = (item: CartItemResponse) => item.itemName || item.name || 'Sản phẩm'

export function availableItemIds(cart: CartResponse | undefined): number[] {
  return (cart?.shopCarts ?? []).flatMap((shop) => shop.items.filter(isItemAvailable).map((i) => i.cartItemId))
}

export const isCartEmpty = (cart: CartResponse | undefined) =>
  !cart?.shopCarts?.some((shop) => shop.items.length > 0)

/**
 * Giữ lựa chọn của người dùng khi giỏ thay đổi: lần đầu chọn hết món còn bán,
 * về sau chỉ bỏ những món đã bị xoá hoặc hết hàng (như useCartOperations bản web).
 */
export function reconcileSelection(prev: ReadonlySet<number> | null, cart: CartResponse): Set<number> {
  const available = new Set(availableItemIds(cart))
  if (prev === null) return available
  return new Set([...prev].filter((id) => available.has(id)))
}

/** Bật/tắt cả nhóm: nếu mọi món còn bán trong nhóm đã chọn thì bỏ chọn, ngược lại chọn hết. */
export function toggleGroup(selected: ReadonlySet<number>, items: readonly CartItemResponse[]): Set<number> {
  const ids = items.filter(isItemAvailable).map((i) => i.cartItemId)
  const allOn = ids.length > 0 && ids.every((id) => selected.has(id))
  const next = new Set(selected)
  ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)))
  return next
}

export const isGroupSelected = (selected: ReadonlySet<number>, items: readonly CartItemResponse[]) => {
  const ids = items.filter(isItemAvailable).map((i) => i.cartItemId)
  return ids.length > 0 && ids.every((id) => selected.has(id))
}

export type CartSummary = {
  /** Tiền hàng các món đã chọn */
  amount: number
  /** Tổng số lượng các món đã chọn */
  selectedQuantity: number
  /** Tổng số lượng cả giỏ */
  totalQuantity: number
}

export function summarizeCart(cart: CartResponse | undefined, selected: ReadonlySet<number>): CartSummary {
  let amount = 0
  let selectedQuantity = 0
  let totalQuantity = 0
  cart?.shopCarts?.forEach((shop) =>
    shop.items.forEach((item) => {
      totalQuantity += item.quantity
      if (selected.has(item.cartItemId)) {
        amount += item.unitPrice * item.quantity
        selectedQuantity += item.quantity
      }
    }),
  )
  return { amount, selectedQuantity, totalQuantity }
}

export const shopSubtotal = (items: readonly CartItemResponse[], selected: ReadonlySet<number>) =>
  items.reduce((sum, i) => (selected.has(i.cartItemId) ? sum + i.unitPrice * i.quantity : sum), 0)
