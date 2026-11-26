import type { ProductResponse } from '@/services'
import { money } from '@/utils/helpers'

export { money }

export type Product = {
  id: string
  name: string
  price: number
  original: number
  image: string
  category: string
  farm: string
  region: string
  flaw: string
  score: number
  stock: number
  rescued: number
  unit: string
}

/**
 * Đổi ProductResponse của API sang Product mà ProductCard hiển thị.
 */
export function toStorefrontProduct(p: ProductResponse): Product {
  const price = p.sellingPrice ?? p.price ?? 0
  const original = p.discountPercent ? Math.round(price / (1 - p.discountPercent / 100)) : price
  const category =
    typeof p.category === 'object' && p.category
      ? p.category.name
      : typeof p.category === 'string'
        ? p.category
        : ''
  const rawAddress = p.shop?.address || ''
  const region = rawAddress ? rawAddress.split(',').pop()?.trim() || rawAddress : ''
  return {
    id: String(p.productId || p.id),
    name: p.productName || p.name || '',
    price,
    original,
    image: p.primaryImageUrl || p.imageUrl || p.image || '',
    category,
    farm: p.shop?.shopName || p.shopName || '',
    region,
    flaw: p.defectReason || '',
    score: 0,
    stock: p.stockQuantity ?? p.stock ?? 0,
    rescued: 0,
    unit: p.unit || 'kg',
  }
}

export const discountPercent = ({ price, original }: Pick<Product, 'price' | 'original'>) =>
  original > price ? Math.round((1 - price / original) * 100) : 0
