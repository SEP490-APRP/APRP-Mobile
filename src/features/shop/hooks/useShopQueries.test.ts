import { createProductWithImages } from './useShopQueries'
import type { ProductCreationRequest } from '@/services/product.types'
import type { UploadFile } from '@/types/upload.types'

const REQUEST: ProductCreationRequest = {
  productName: 'Cà chua bi',
  categoryId: 1,
  unit: 'kg',
  sellingPrice: 35000,
  stockQuantity: 20,
  expiryDate: '2026-12-01',
}

const IMAGES: UploadFile[] = [
  { uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' },
  { uri: 'file:///b.jpg', name: 'b.jpg', type: 'image/jpeg' },
  { uri: 'file:///c.jpg', name: 'c.jpg', type: 'image/jpeg' },
]

describe('createProductWithImages', () => {
  it('đưa ảnh đại diện lên đầu và gắn toàn bộ ảnh khi đều qua kiểm duyệt', async () => {
    const attached: { name: string; isPrimary: boolean; order: number }[] = []
    const deleteProduct = jest.fn()

    const res = await createProductWithImages(
      { request: REQUEST, images: IMAGES, primaryIndex: 1 },
      {
        createProduct: async () => ({ code: 1000, result: { id: 99, productId: 99 } as any }),
        deleteProduct,
        uploadAndAttach: async (_pid, file, isPrimary, displayOrder) => {
          attached.push({ name: file.name, isPrimary, order: displayOrder })
        },
      },
    )

    expect(res).toEqual({ productId: 99, uploadedCount: 3, failedImages: [] })
    expect(deleteProduct).not.toHaveBeenCalled()
    expect(attached).toEqual([
      { name: 'b.jpg', isPrimary: true, order: 0 },
      { name: 'a.jpg', isPrimary: false, order: 1 },
      { name: 'c.jpg', isPrimary: false, order: 2 },
    ])
  })

  it('tự động xoá sản phẩm vừa tạo (rollback) nếu ảnh chính rớt kiểm duyệt AI bước đầu', async () => {
    const deleteProduct = jest.fn(async () => ({ code: 1000 }))
    const uploadAndAttach = jest.fn(async () => {
      throw { data: { code: 3022, message: 'Ảnh không phải nông sản' }, message: 'Ảnh không phải nông sản' }
    })

    await expect(
      createProductWithImages(
        { request: REQUEST, images: IMAGES, primaryIndex: 0 },
        {
          createProduct: async () => ({ code: 1000, result: { id: 77, productId: 77 } as any }),
          deleteProduct,
          uploadAndAttach,
        },
      ),
    ).rejects.toThrow(/Sản phẩm chưa được gửi duyệt/)

    expect(uploadAndAttach).toHaveBeenCalledTimes(1)
    expect(deleteProduct).toHaveBeenCalledWith(77)
  })

  it('vẫn giữ sản phẩm và báo danh sách ảnh phụ lỗi nếu ảnh chính đạt nhưng ảnh phụ bị AI từ chối', async () => {
    const deleteProduct = jest.fn()
    const uploadAndAttach = jest.fn(async (_pid, file) => {
      if (file.name === 'b.jpg') {
        throw { data: { code: 3022, message: 'Not agricultural' }, message: 'Not agricultural' }
      }
    })

    const res = await createProductWithImages(
      { request: REQUEST, images: IMAGES, primaryIndex: 0 },
      {
        createProduct: async () => ({ code: 1000, result: { id: 88, productId: 88 } as any }),
        deleteProduct,
        uploadAndAttach,
      },
    )

    expect(deleteProduct).not.toHaveBeenCalled()
    expect(res.productId).toBe(88)
    expect(res.uploadedCount).toBe(2)
    expect(res.failedImages).toHaveLength(1)
    expect(res.failedImages[0].name).toBe('b.jpg')
  })
})
