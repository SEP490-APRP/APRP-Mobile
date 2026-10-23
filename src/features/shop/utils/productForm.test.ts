import type { ProductResponse } from '@/services/product.types'
import {
  addDays,
  digitsOnly,
  discountedPrice,
  emptyProductForm,
  imageProblem,
  imageUploadMessage,
  productToForm,
  toProductRequest,
  validateProductForm,
} from './productForm'

const NOW = new Date(2026, 9, 23)
const valid = { ...emptyProductForm(NOW), name: 'Cà chua bi Đà Lạt', categoryId: 2, price: '35000', stock: '40' }

describe('productForm', () => {
  it('mặc định hạn dùng 10 ngày, đơn vị kg', () => {
    const f = emptyProductForm(NOW)
    expect(f.expiryDate).toBe('2026-11-02')
    expect(f.unit).toBe('kg')
    expect(addDays(3, NOW)).toBe('2026-10-26')
  })

  it('bắt lỗi giống schema web', () => {
    expect(validateProductForm(valid, '2026-10-23')).toEqual({})
    const e = validateProductForm(
      {
        ...valid,
        name: 'Cà',
        categoryId: undefined,
        price: '0',
        stock: '1.5',
        expiryDate: '2026-10-01',
        discountPercent: '120',
      },
      '2026-10-23',
    )
    expect(Object.keys(e).sort()).toEqual(['categoryId', 'discountPercent', 'expiryDate', 'name', 'price', 'stock'])
    expect(validateProductForm({ ...valid, expiryDate: '23/10/2026' }, '2026-10-23').expiryDate).toMatch(/NNNN/)
  })

  it('đổi form thành request và ngược lại', () => {
    const req = toProductRequest({ ...valid, description: '  ngọt  ', discountPercent: '15' })
    expect(req).toEqual({
      productName: 'Cà chua bi Đà Lạt',
      categoryId: 2,
      unit: 'kg',
      sellingPrice: 35000,
      stockQuantity: 40,
      expiryDate: '2026-11-02',
      discountPercent: 15,
      description: 'ngọt',
    })
    const back = productToForm({
      id: 7,
      productName: 'Bơ 034',
      unit: 'kg',
      price: 0,
      sellingPrice: 60000,
      stock: 0,
      stockQuantity: 12,
      status: 'ACTIVE',
      category: { categoryId: 5, name: 'Trái cây' },
      expiryDate: '2026-11-01T00:00:00',
    } as ProductResponse)
    expect(back).toMatchObject({ name: 'Bơ 034', categoryId: 5, price: '60000', stock: '12', expiryDate: '2026-11-01' })
  })

  it('tiện ích nhỏ', () => {
    expect(digitsOnly('35.000đ')).toBe('35000')
    expect(discountedPrice(40000, 25)).toBe(30000)
    expect(imageProblem({ mimeType: 'image/gif' })).toMatch(/JPEG/)
    expect(imageProblem({ mimeType: 'image/jpeg', fileSize: 6 * 1024 * 1024 })).toMatch(/5MB/)
    expect(imageProblem({ mimeType: 'image/png', fileSize: 1000 })).toBeUndefined()
  })

  it('báo lỗi ảnh theo mã BE', () => {
    expect(imageUploadMessage({ data: { code: 3022 } }, 'Image rejected')).toMatch(/AI/)
    expect(imageUploadMessage({}, 'Sản phẩm chỉ được tối đa 8 ảnh')).toMatch(/tối đa 8/)
    expect(imageUploadMessage({}, 'Network down')).toBe('Network down')
  })
})
