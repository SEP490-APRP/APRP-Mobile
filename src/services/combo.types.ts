export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

export interface ProductComboItemRequest {
  productId: number
  productQuantity: number
}

export interface ProductComboItem {
  comboItemId?: number
  productId: number
  productName?: string
  price?: number
  quantity?: number
  productQuantity?: number
  unit?: string
}

export type ProductComboResponse = ProductComboItem

export interface BuildCombo {
  comboId: number
  id?: number
  comboName: string
  name?: string
  price: number
  description?: string
  type?: string
  mealType?: MealType | string
  region?: string
  totalQuantity?: number
  soldQuantity?: number
  status?: string
  imageUrl?: string
  shop?: {
    id: number
    shopName?: string
    avatar?: string
  }
  items?: ProductComboItem[]
}

export type BuildComboResponse = BuildCombo

export interface BuildComboCreationRequest {
  comboName: string
  price: number
  description?: string
  type?: string
  mealType?: MealType | string
  region?: string
  totalQuantity: number
  imageUrl?: string
  items: ProductComboItemRequest[] | { productId: number; quantity: number }[]
}

export interface BuildComboUpdateRequest {
  comboName?: string
  price?: number
  description?: string
  type?: string
  mealType?: MealType | string
  region?: string
  totalQuantity?: number
  imageUrl?: string
  status?: string
  items?: ProductComboItemRequest[] | { productId: number; quantity: number }[]
}
