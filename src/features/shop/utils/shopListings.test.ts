import type { BuildCombo } from '@/services/combo.types'
import type { MysteryBox } from '@/services/mysteryBox.types'
import type { ProductResponse } from '@/services/product.types'
import { buildShopListings, countByStatus, daysUntil, filterListings, statusKeyOf } from './shopListings'

const products = [
  {
    id: 1,
    productName: 'Cà rốt Đà Lạt',
    unit: 'kg',
    price: 0,
    sellingPrice: 18000,
    stock: 0,
    stockQuantity: 30,
    status: 'ACTIVE',
    category: { categoryId: 1, name: 'Rau củ' },
  },
  {
    id: 2,
    productName: 'Bơ sáp',
    unit: 'kg',
    price: 50000,
    stock: 5,
    status: 'REJECTED',
    rejectReason: 'Ảnh mờ',
    category: 'Trái cây',
  },
  { id: 3, productName: 'Dâu tây', unit: 'hộp', price: 90000, stock: 8, status: 'PENDING' },
] as ProductResponse[]
const combos = [
  { comboId: 9, comboName: 'Combo canh chua', price: 79000, totalQuantity: 10, soldQuantity: 4, status: 'ACTIVE' },
] as BuildCombo[]
const boxes = [{ mysteryId: 4, boxType: 'Túi mù rau', price: 49000, isActive: false, totalQuantity: 5 }] as MysteryBox[]

describe('shopListings', () => {
  const list = buildShopListings(products, combos, boxes)

  it('gộp ba loại tin đăng', () => {
    expect(list.map((l) => l.key)).toEqual(['p1', 'p2', 'p3', 'combo-9', 'mystery-4'])
    expect(list[0]).toMatchObject({ kind: 'SINGLE', price: 18000, stock: 30, category: 'Rau củ' })
    expect(list[1]).toMatchObject({ category: 'Trái cây', rejectReason: 'Ảnh mờ', statusKey: 'REJECTED' })
    expect(list[3]).toMatchObject({ kind: 'COMBO', stock: 6, sold: 4 })
    expect(list[4]).toMatchObject({ kind: 'MYSTERY_BOX', statusKey: 'INACTIVE' })
  })

  it('lọc theo trạng thái, loại và từ khoá không dấu', () => {
    expect(filterListings(list, { status: 'PENDING' }).map((l) => l.id)).toEqual([3])
    expect(filterListings(list, { kind: 'COMBO' }).map((l) => l.id)).toEqual([9])
    expect(filterListings(list, { query: 'ca rot' }).map((l) => l.id)).toEqual([1])
    expect(filterListings(list, { query: '#2' }).map((l) => l.id)).toEqual([2])
    expect(countByStatus(list)).toEqual({ ALL: 5, ACTIVE: 2, PENDING: 1, REJECTED: 1, INACTIVE: 1 })
  })

  it('quy trạng thái và đếm ngày hết hạn', () => {
    expect(statusKeyOf('APPROVED')).toBe('ACTIVE')
    expect(statusKeyOf('OUT_OF_STOCK')).toBe('INACTIVE')
    expect(statusKeyOf(undefined, true)).toBe('ACTIVE')
    const now = new Date(2026, 9, 23, 15)
    expect(daysUntil('2026-10-26', now)).toBe(3)
    expect(daysUntil('2026-10-20', now)).toBe(-3)
    expect(daysUntil(undefined, now)).toBeUndefined()
  })
})
