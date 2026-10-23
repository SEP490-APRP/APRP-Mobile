export interface ProductMysteryItemRequest {
  productId: number
  productQuantity?: number
  quantity?: number
}

export interface ProductMysteryItem {
  mysteryItemId?: number
  productId: number
  productName?: string
  productQuantity?: number
  quantity?: number
  unit?: string
  price?: number
  sellingPrice?: number
}

export type ProductMysteryResponse = ProductMysteryItem

export interface MysteryBoxCreationRequest {
  boxType: string
  imageUrl?: string
  price: number
  description?: string
  note?: string
  totalQuantity: number
  items: ProductMysteryItemRequest[] | { productId: number; quantity: number }[]
}

export interface MysteryBoxUpdateRequest {
  boxType?: string
  imageUrl?: string
  price?: number
  description?: string
  note?: string
  totalQuantity?: number
  items?: ProductMysteryItemRequest[] | { productId: number; quantity: number }[]
}

export interface MysteryBox {
  id?: number
  mysteryId?: number
  boxType: string
  price: number
  description?: string
  imageUrl?: string
  note?: string
  isActive?: boolean
  totalQuantity?: number
  soldQuantity?: number
  shopId?: number
  shopOwnerId?: number
  shopName?: string
  status?: string
  items?: ProductMysteryItem[]
}
