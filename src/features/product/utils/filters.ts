import type { Product } from './storefrontProduct'

export const CATEGORIES = [
  { id: 'Tất cả', label: 'Tất cả nông sản' },
  { id: 'Rau ăn lá', label: 'Rau ăn lá' },
  { id: 'Củ quả', label: 'Củ quả vườn' },
  { id: 'Trái cây', label: 'Trái cây' },
  { id: 'Hữu cơ', label: 'Hữu cơ' },
  { id: 'Đà Lạt', label: 'Đặc sản Đà Lạt' },
] as const

export const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả mức giá' },
  { id: 'under20', label: 'Dưới 20.000đ', max: 19_999 },
  { id: '20to30', label: '20.000đ – 30.000đ', min: 20_000, max: 30_000 },
  { id: 'over30', label: 'Trên 30.000đ', min: 30_001 },
] as const satisfies readonly { id: string; label: string; min?: number; max?: number }[]
export type PriceRangeId = (typeof PRICE_RANGES)[number]['id']

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'price-asc', label: 'Giá tăng dần' },
  { id: 'price-desc', label: 'Giá giảm dần' },
  { id: 'name-asc', label: 'Tên A-Z' },
] as const
export type SortId = (typeof SORT_OPTIONS)[number]['id']

/**
 * Bộ lọc của trang Nông sản tươi. Bản web có thêm Vùng trồng và Điểm AI nhưng chỉ áp dụng
 * cho dữ liệu mẫu (API chưa trả hai trường này), nên mobile chưa đưa vào.
 * Danh mục là chuỗi vì danh sách thật lấy từ API /categories.
 */
export type Filters = { category: string; price: PriceRangeId }

export const ALL_CATEGORIES = 'Tất cả'
export const DEFAULT_FILTERS: Filters = { category: ALL_CATEGORIES, price: 'all' }

export function countActiveFilters(f: Filters): number {
  return (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter(
    (k) => f[k] !== DEFAULT_FILTERS[k],
  ).length
}

/** Tìm, lọc và sắp xếp phía máy như bản web (API chưa hỗ trợ lọc theo giá). */
export function applyFilters(
  items: readonly Product[],
  query: string,
  filters: Filters,
  sort: SortId,
): Product[] {
  const range = PRICE_RANGES.find((r) => r.id === filters.price)
  const min = range && 'min' in range ? range.min : 0
  const max = range && 'max' in range ? range.max : Number.POSITIVE_INFINITY
  const q = query.trim().toLowerCase()
  const cat = filters.category.toLowerCase()

  const result = items.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.farm.toLowerCase().includes(q)) &&
      (filters.category === ALL_CATEGORIES ||
        p.category.toLowerCase().includes(cat) ||
        cat.includes(p.category.toLowerCase())) &&
      p.price >= min &&
      p.price <= max,
  )

  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
  else if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  return result
}
