export interface CartItemResponse {
  cartItemId: number
  itemId: number
  itemType: 'PRODUCT' | 'MYSTERY_BOX' | 'BUILD_COMBO' | string
  name?: string
  itemName?: string
  productId?: number
  mysteryBoxId?: number
  buildComboId?: number
  imageUrl?: string
  unitPrice: number
  quantity: number
  stockQuantity?: number
  stockAvailable?: number
  subtotal?: number
  errorNote?: string | null
  available?: boolean
  isAvailable?: boolean
}

export interface ShopCartResponse {
  shopId: number
  shopName: string
  shopAvatar?: string
  items: CartItemResponse[]
}

export interface CartResponse {
  cartId: number
  shopCarts: ShopCartResponse[]
  cartTotal: number
}

export interface CartAddRequest {
  itemType?: 'PRODUCT' | 'MYSTERY_BOX' | 'BUILD_COMBO' | string
  itemId?: number
  productId?: number
  mysteryBoxId?: number
  buildComboId?: number
  quantity: number
}

export interface CartUpdateRequest {
  cartItemId: number
  quantity: number
}

export interface CartRemoveRequest {
  cartItemIds: number[]
}
