import type { ProductResponse } from '@/services'
import type { Product } from '@/mocks/catalog'

export { money, type Product } from '@/mocks/catalog'

/**
 * Đổi ProductResponse của API sang Product mà ProductCard hiển thị.
 * Bản web lặp đoạn này ở TodayRescue và Fresh; các giá trị region/flaw/score/rescued
 * vẫn là giá trị mặc định như web vì backend chưa trả về.
 */
export function toStorefrontProduct(p: ProductResponse): Product {
  const price = p.sellingPrice ?? p.price ?? 0
  const original = p.discountPercent ? Math.round(price / (1 - p.discountPercent / 100)) : price
  const category =
    typeof p.category === 'object' && p.category
      ? p.category.name
      : typeof p.category === 'string'
        ? p.category
        : 'Rau củ'
  return {
    id: String(p.productId || p.id),
    name: p.productName || p.name || 'Nông sản',
    price,
    original,
    image: p.primaryImageUrl || p.imageUrl || p.image || '',
    category,
    farm: p.shop?.shopName || 'Nhà vườn CapNong',
    region: 'Đà Lạt',
    flaw: 'Ngoại hình tự nhiên',
    score: 96,
    stock: p.stockQuantity ?? p.stock ?? 100,
    rescued: 50,
    unit: p.unit || 'kg',
  }
}

export const discountPercent = ({ price, original }: Pick<Product, 'price' | 'original'>) =>
  original > price ? Math.round((1 - price / original) * 100) : 0
