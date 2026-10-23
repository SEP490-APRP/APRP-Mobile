import {
  buildComboCards,
  comboToCard,
  discountLabel,
  filterCombos,
  isMeaningfulComboName,
  mysteryToCard,
  soldPercent,
} from './comboCards'

const mystery = {
  mysteryId: 3,
  boxType: 'Túi mù Đà Lạt',
  price: 79000,
  totalQuantity: 40,
  soldQuantity: 12,
  shopId: 5,
  shopName: 'Vườn cô Ba',
}
const combo = {
  comboId: 7,
  comboName: 'Combo lẩu nấm',
  price: 149000,
  mealType: 'DINNER',
  region: 'Lâm Đồng',
  totalQuantity: 20,
  soldQuantity: 30,
  shop: { id: 6, shopName: 'HTX Lâm Hà' },
}

describe('comboCards', () => {
  it('bỏ tên chung chung', () => {
    expect(isMeaningfulComboName('Combo')).toBe(false)
    expect(isMeaningfulComboName(' túi mù ')).toBe(false)
    expect(isMeaningfulComboName('')).toBe(false)
    expect(isMeaningfulComboName('Combo lẩu nấm')).toBe(true)
  })

  it('đổi túi mù và combo sang thẻ', () => {
    const m = mysteryToCard(mystery)
    expect(m).toMatchObject({ key: 'mystery-3', id: 3, kind: 'MYSTERY_BOX', stock: 28, original: 118500, shopId: 5 })
    const c = comboToCard(combo)
    expect(c).toMatchObject({
      key: 'combo-7',
      kind: 'BUILD_COMBO',
      portion: 'Bữa tối',
      tag: 'Lâm Đồng',
      stock: 0,
      shopName: 'HTX Lâm Hà',
    })
  })

  it('gộp và bỏ bản ghi thiếu id hoặc tên chung', () => {
    const cards = buildComboCards(
      [mystery, { boxType: 'Túi mù', price: 1 }],
      [combo, { comboId: 0, comboName: 'X', price: 1 }],
    )
    expect(cards.map((c) => c.key)).toEqual(['mystery-3', 'combo-7'])
  })

  it('lọc theo loại, giá và sắp xếp', () => {
    const cards = buildComboCards(
      [mystery],
      [combo, { comboId: 8, comboName: 'Thùng bếp 10kg', price: 219000, soldQuantity: 5 }],
    )
    expect(filterCombos(cards, { kind: 'MYSTERY_BOX', price: 'all', sort: 'featured' }).map((c) => c.id)).toEqual([3])
    expect(filterCombos(cards, { kind: 'ALL', price: 'over200', sort: 'featured' }).map((c) => c.id)).toEqual([8])
    expect(filterCombos(cards, { kind: 'ALL', price: 'all', sort: 'price-desc' }).map((c) => c.id)).toEqual([8, 7, 3])
    expect(filterCombos(cards, { kind: 'ALL', price: 'all', sort: 'best-selling' }).map((c) => c.id)).toEqual([7, 3, 8])
  })

  it('tính phần trăm đã bán và nhãn giảm giá', () => {
    expect(soldPercent({ sold: 12, stock: 28 })).toBe(30)
    expect(soldPercent({ sold: 0, stock: 0 })).toBe(0)
    expect(discountLabel({ price: 70, original: 100 })).toBe('-30%')
    expect(discountLabel({ price: 100, original: 100 })).toBeUndefined()
  })
})
