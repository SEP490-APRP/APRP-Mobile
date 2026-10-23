import type { CartResponse } from '@/types/cart.types'
import { availableItemIds, isCartEmpty, isGroupSelected, reconcileSelection, summarizeCart, toggleGroup } from './cartSelection'

const item = (cartItemId: number, unitPrice: number, quantity: number, available = true) => ({
  cartItemId,
  itemId: cartItemId,
  itemType: 'PRODUCT',
  unitPrice,
  quantity,
  available,
})

const cart: CartResponse = {
  cartId: 1,
  cartTotal: 0,
  shopCarts: [
    { shopId: 1, shopName: 'A', items: [item(1, 10000, 2), item(2, 5000, 1, false)] },
    { shopId: 2, shopName: 'B', items: [item(3, 20000, 3)] },
  ],
}

describe('cartSelection', () => {
  it('chọn sẵn mọi món còn bán ở lần đầu', () => {
    expect([...reconcileSelection(null, cart)]).toEqual([1, 3])
    expect(availableItemIds(cart)).toEqual([1, 3])
  })

  it('giữ lựa chọn thủ công, bỏ món không còn trong giỏ', () => {
    const next = reconcileSelection(new Set([3, 99]), cart)
    expect([...next]).toEqual([3])
  })

  it('bật tắt cả nhóm theo shop, bỏ qua món hết hàng', () => {
    const shopA = cart.shopCarts[0].items
    const on = toggleGroup(new Set(), shopA)
    expect([...on]).toEqual([1])
    expect(isGroupSelected(on, shopA)).toBe(true)
    expect([...toggleGroup(on, shopA)]).toEqual([])
  })

  it('tính tiền chỉ trên món đã chọn', () => {
    expect(summarizeCart(cart, new Set([1, 3]))).toEqual({ amount: 80000, selectedQuantity: 5, totalQuantity: 6 })
  })

  it('nhận ra giỏ trống', () => {
    expect(isCartEmpty(undefined)).toBe(true)
    expect(isCartEmpty({ ...cart, shopCarts: [{ shopId: 1, shopName: 'A', items: [] }] })).toBe(true)
    expect(isCartEmpty(cart)).toBe(false)
  })
})
