import { changeQuantity, filterProducts, allProducts } from './catalog'
describe('Product discovery', () => {
  it('finds Vietnamese names without accents', () =>
    expect(filterProducts('ca rot', 'Tất cả', 'featured').map((p) => p.id)).toEqual(['carrot']))
  it('combines region and keyword filtering', () =>
    expect(filterProducts('ca rot', 'Đà Lạt', 'featured')).toHaveLength(1))
  it('does not invent matches for empty categories', () =>
    expect(filterProducts('', 'Thịt cá', 'featured')).toEqual([]))
  it('sorts by actual numeric price', () =>
    expect(filterProducts('', 'Tất cả', 'price-asc').map((p) => p.price)).toEqual([
      15000, 16000, 18000, 19000, 22000, 24000, 26000, 38000,
    ]))
  it('provides source imagery for every item', () =>
    expect(allProducts.every((p) => p.image.startsWith('https://'))).toBe(true))
})
describe('Cart quantities', () => {
  it('adds and increments independently', () =>
    expect(changeQuantity({ tomato: 2 }, 'carrot', 1)).toEqual({ tomato: 2, carrot: 1 }))
  it('removes zero quantities', () =>
    expect(changeQuantity({ carrot: 1 }, 'carrot', -1)).toEqual({}))
  it('limits quantities to stock', () =>
    expect(changeQuantity({ carrot: 85 }, 'carrot', 1)).toEqual({ carrot: 85 }))
  it('ignores unknown items', () => expect(changeQuantity({}, 'unknown', 1)).toEqual({}))
  it('does not mutate previous state', () => {
    const before = { carrot: 1 }
    changeQuantity(before, 'carrot', 1)
    expect(before.carrot).toBe(1)
  })
})
