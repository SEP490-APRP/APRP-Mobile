import axiosInstance from '@/services/api/axiosInstance'
import type {
  CartAddRequest,
  CartRemoveRequest,
  CartResponse,
  CartUpdateRequest,
} from '@/types/cart.types'

interface ApiResponse<T> {
  code: number
  message?: string
  result: T
}

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if ('data' in res && (res as { data: unknown }).data && typeof (res as { data: unknown }).data === 'object' && 'result' in (res as { data: { result: unknown } }).data) {
      return ((res as { data: ApiResponse<T> }).data).result
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result
    }
  }
  return res as T
}

export async function getMyCart(): Promise<CartResponse> {
  const res = await axiosInstance.get('/cart')
  const data = unwrap<CartResponse>(res)
  if (data?.shopCarts) {
    data.shopCarts.forEach((sc) => {
      sc.items?.forEach((item) => {
        item.itemName = item.itemName || item.name || ''
        if (item.itemType === 'PRODUCT' || !item.itemType) {
          item.productId = item.productId || item.itemId
        } else if (item.itemType === 'MYSTERY_BOX') {
          item.mysteryBoxId = item.mysteryBoxId || item.itemId
        } else if (item.itemType === 'BUILD_COMBO') {
          item.buildComboId = item.buildComboId || item.itemId
        }
        item.subtotal = item.subtotal ?? item.unitPrice * item.quantity
        if (item.isAvailable !== undefined && item.available === undefined) {
          item.available = item.isAvailable
        } else if (item.available === undefined) {
          item.available = true
        }
      })
    })
  }
  return data
}

export async function addToCart(data: CartAddRequest): Promise<void> {
  const itemType =
    data.itemType ||
    (data.mysteryBoxId ? 'MYSTERY_BOX' : data.buildComboId ? 'BUILD_COMBO' : 'PRODUCT')

  const itemId =
    data.itemId ?? data.productId ?? data.mysteryBoxId ?? data.buildComboId ?? 0

  const payload = {
    itemType,
    itemId,
    quantity: data.quantity ?? 1,
    productId: data.productId,
    mysteryBoxId: data.mysteryBoxId,
    buildComboId: data.buildComboId,
  }

  const res = await axiosInstance.post('/cart/add', payload)
  return unwrap<void>(res)
}

export async function updateCartItem(data: CartUpdateRequest): Promise<void> {
  const res = await axiosInstance.put('/cart/update', data)
  return unwrap<void>(res)
}

export async function removeCartItems(data: CartRemoveRequest): Promise<void> {
  const res = await axiosInstance.delete('/cart/remove', { data })
  return unwrap<void>(res)
}

export const cartService = {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItems,
}
