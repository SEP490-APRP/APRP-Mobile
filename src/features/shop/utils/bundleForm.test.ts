import type { ProductResponse } from '@/services/product.types'
import {
  bundleItemsFrom,
  bundleSaving,
  checkStock,
  comboToBundleForm,
  emptyBundleForm,
  heldByPrevious,
  marketValue,
  productToBundleItem,
  toBoxRequest,
  toComboRequest,
  validateBundle,
  type BundleItem,
} from './bundleForm'

const carrot = {
  id: 701,
  productName: 'Cà rốt',
  unit: 'kg',
  price: 0,
  sellingPrice: 18000,
  stock: 0,
  stockQuantity: 30,
  status: 'ACTIVE',
} as ProductResponse
const cabbage = {
  id: 702,
  productName: 'Bắp cải',
  unit: 'kg',
  price: 22000,
  stock: 10,
  status: 'ACTIVE',
} as ProductResponse
const items: BundleItem[] = [productToBundleItem(carrot, 2), productToBundleItem(cabbage, 1)]

describe('bundleForm', () => {
  it('mặc định như web', () => {
    expect(emptyBundleForm('COMBO')).toMatchObject({ price: '149000', totalQuantity: '20', mealType: 'DINNER' })
    expect(emptyBundleForm('MYSTERY_BOX')).toMatchObject({ price: '79000', totalQuantity: '10' })
  })

  it('tính giá trị mua lẻ và % khách lợi', () => {
    expect(marketValue(items)).toBe(58000)
    expect(bundleSaving(45000, 58000)).toEqual({ percent: 22, overpriced: false })
    expect(bundleSaving(60000, 58000)).toEqual({ percent: 0, overpriced: true })
    expect(bundleSaving(45000, 0)).toEqual({ percent: 0, overpriced: false })
  })

  it('kiểm tra tồn kho theo số gói phát hành', () => {
    const v = { ...emptyBundleForm('COMBO'), name: 'Combo canh chua', totalQuantity: '12' }
    expect(checkStock(items, 12).map((c) => c.short)).toEqual([false, true])
    expect(validateBundle('COMBO', v, items).items).toMatch(/Bắp cải.*cần 12 kg, kho còn 10 kg/)
    // Khi sửa, phần gói cũ đang giữ được cộng lại.
    const prev = { totalQuantity: 10, soldQuantity: 6, items: [{ productId: 702, productQuantity: 1 }] }
    expect(heldByPrevious(prev, 702)).toBe(4)
    expect(validateBundle('COMBO', v, items, prev).items).toBeUndefined()
  })

  it('bắt lỗi tên, giá, chưa chọn món', () => {
    const e = validateBundle('MYSTERY_BOX', { ...emptyBundleForm('MYSTERY_BOX'), name: 'x'.repeat(51), price: '0' }, [])
    expect(Object.keys(e).sort()).toEqual(['items', 'name', 'price'])
  })

  it('đổi sang request đúng của BE', () => {
    const v = { ...emptyBundleForm('COMBO'), name: ' Combo lẩu ', type: ' Món lẩu ', description: '' }
    expect(toComboRequest(v, items, 'u')).toEqual({
      comboName: 'Combo lẩu',
      price: 149000,
      totalQuantity: 20,
      mealType: 'DINNER',
      type: 'Món lẩu',
      region: 'Đà Lạt & Lâm Đồng',
      description: undefined,
      imageUrl: 'u',
      items: [
        { productId: 701, productQuantity: 2 },
        { productId: 702, productQuantity: 1 },
      ],
    })
    expect(toBoxRequest({ ...emptyBundleForm('MYSTERY_BOX'), name: 'Túi mù rau' }, items)).toMatchObject({
      boxType: 'Túi mù rau',
      note: 'Khoảng 5kg, rau củ quả tươi thu hoạch trong ngày',
      imageUrl: undefined,
    })
  })

  it('đọc lại gói đã có', () => {
    expect(comboToBundleForm({ comboId: 7, comboName: 'Combo', price: 99000, totalQuantity: 5 })).toMatchObject({
      name: 'Combo',
      price: '99000',
      totalQuantity: '5',
      mealType: 'DINNER',
    })
    expect(
      bundleItemsFrom(
        [
          { productId: 701, productQuantity: 3 },
          { productId: 999, quantity: 1 },
        ],
        [carrot],
      ),
    ).toEqual([
      { productId: 701, productName: 'Cà rốt', unit: 'kg', stockAvailable: 30, price: 18000, quantity: 3 },
      { productId: 999, productName: 'Nông sản #999', unit: 'kg', stockAvailable: 0, price: 0, quantity: 1 },
    ])
  })
})
