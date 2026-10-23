import { applyFilters, countActiveFilters, DEFAULT_FILTERS } from './filters'
import type { Product } from './storefrontProduct'

const make = (id: string, name: string, price: number, category = 'Rau ăn lá'): Product => ({
  id,
  name,
  price,
  original: price,
  image: '',
  category,
  farm: 'Nhà vườn A',
  region: 'Đà Lạt',
  flaw: '',
  score: 96,
  stock: 10,
  rescued: 50,
  unit: 'kg',
})

const items = [make('1', 'Cải bó xôi', 25_000), make('2', 'Cà rốt', 15_000, 'Củ quả'), make('3', 'Bưởi', 45_000, 'Trái cây')]

describe('applyFilters', () => {
  it('tìm theo tên, không phân biệt hoa thường', () => {
    expect(applyFilters(items, 'CÀ', DEFAULT_FILTERS, 'featured').map((p) => p.id)).toEqual(['2'])
  })

  it('lọc theo danh mục và khoảng giá', () => {
    expect(applyFilters(items, '', { category: 'Củ quả', price: 'all' }, 'featured').map((p) => p.id)).toEqual(['2'])
    expect(applyFilters(items, '', { category: 'Tất cả', price: 'over30' }, 'featured').map((p) => p.id)).toEqual(['3'])
  })

  it('sắp xếp theo giá và không đổi mảng gốc', () => {
    expect(applyFilters(items, '', DEFAULT_FILTERS, 'price-desc').map((p) => p.id)).toEqual(['3', '1', '2'])
    expect(items.map((p) => p.id)).toEqual(['1', '2', '3'])
  })

  it('đếm số bộ lọc đang bật', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0)
    expect(countActiveFilters({ category: 'Trái cây', price: 'under20' })).toBe(2)
  })
})
