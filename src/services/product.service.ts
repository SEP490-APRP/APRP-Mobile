import type { ApiResponse, PageResponse } from '@/types'
import type {
  AiDescriptionSuggestionRequest,
  AiDescriptionSuggestionResponse,
  GetMyProductsParams,
  ProductCreationRequest,
  ProductImageCreationRequest,
  ProductImageResponse,
  ProductResponse,
  ProductUpdateRequest,
} from './product.types'
import { mockBuyerProducts, mockPendingProducts } from '@/mocks/product.mock'
import { axiosInstance } from './api/axiosInstance'
import { ENV } from '@/utils'

export type * from './product.types'

/** Chuẩn hóa ProductResponse từ BE để tương thích 100% với UI FE cũ và mới */
function normalizeProduct(p: any): ProductResponse {
  const id = Number(p.productId ?? p.id)
  const price = Number(p.sellingPrice ?? p.price ?? 0)
  const stock = Number(p.stockQuantity ?? p.stock ?? 0)
  const name = p.productName ?? p.name ?? 'Nông sản'
  const primaryImg = p.images?.find((img: any) => img.isPrimary)?.imageUrl
  const firstImg = p.images?.[0]?.imageUrl
  const imageUrl = primaryImg ?? firstImg ?? p.imageUrl ?? p.image ?? ''

  return {
    ...p,
    id,
    productId: id,
    name,
    productName: name,
    price,
    sellingPrice: price,
    stock,
    stockQuantity: stock,
    imageUrl,
    image: imageUrl,
    primaryImageUrl: primaryImg ?? imageUrl,
  }
}

// In-memory mock store cho farmer products khi chạy offline/mock
let localFarmerProducts: ProductResponse[] = [...mockBuyerProducts]

export const productService = {
  async getAll(params?: {
    categoryId?: number
    keyword?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<ProductResponse[]>> {
    // Trang của /products đánh số từ 1 (khác các API phân trang khác).
    const res = await axiosInstance.get<ApiResponse<PageResponse<any>>>('/products', {
      params: { status: 'ACTIVE', page: params?.page ?? 1, size: params?.size ?? 50, ...params },
    })
    return { code: 1000, result: (res.data.result?.content ?? []).map(normalizeProduct) }
  },

  async getAllProducts(): Promise<ApiResponse<ProductResponse[]>> {
    return this.getAll()
  },

  async getForBuyer(): Promise<ApiResponse<ProductResponse[]>> {
    return this.getAll()
  },

  async getById(id: number): Promise<ApiResponse<ProductResponse | null>> {
    const res = await axiosInstance.get<ApiResponse<any>>(`/products/${id}`)
    return { code: 1000, result: res.data.result ? normalizeProduct(res.data.result) : null }
  },

  /** Lấy danh sách sản phẩm của nông dân/gian hàng hiện tại (hỗ trợ lọc status, phân trang) */
  async getMyProducts(params: GetMyProductsParams = {}): Promise<ApiResponse<PageResponse<ProductResponse>>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150))
      let filtered = [...localFarmerProducts]
      if (params.status && params.status !== 'ALL') {
        filtered = filtered.filter((p) => p.status === params.status)
      }
      const page = params.page ?? 1
      const size = params.size ?? 20
      const start = (page - 1) * size
      const paged = filtered.slice(start, start + size)

      return {
        code: 1000,
        result: {
          page,
          size,
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / size) || 1,
          first: page === 1,
          last: start + size >= filtered.length,
          content: paged.map(normalizeProduct),
        },
      }
    }

    const res = await axiosInstance.get<ApiResponse<PageResponse<any>>>('/products/my-shop', {
      params: {
        status: params.status && params.status !== 'ALL' ? params.status : undefined,
        categoryId: params.categoryId && params.categoryId > 0 ? params.categoryId : undefined,
        keyword: params.keyword && params.keyword.trim() !== '' ? params.keyword.trim() : undefined,
        page: params.page ?? 1,
        size: params.size ?? 20,
      },
    })

    const rawPage = res.data.result
    return {
      code: res.data.code ?? 1000,
      message: res.data.message,
      result: {
        page: rawPage?.page ?? 1,
        size: rawPage?.size ?? 20,
        totalElements: rawPage?.totalElements ?? 0,
        totalPages: rawPage?.totalPages ?? 1,
        first: rawPage?.first ?? true,
        last: rawPage?.last ?? true,
        content: (rawPage?.content ?? []).map(normalizeProduct),
      },
    }
  },

  /** Nông dân tạo mới nông sản */
  async createProduct(request: ProductCreationRequest): Promise<ApiResponse<ProductResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200))
      const newId = Date.now()
      const newProd: ProductResponse = {
        id: newId,
        productId: newId,
        productName: request.productName,
        name: request.productName,
        price: request.sellingPrice,
        sellingPrice: request.sellingPrice,
        stock: request.stockQuantity,
        stockQuantity: request.stockQuantity,
        unit: request.unit,
        description: request.description,
        status: 'PENDING',
        expiryDate: request.expiryDate,
        createdAt: new Date().toISOString(),
      }
      localFarmerProducts.unshift(newProd)
      return { code: 1000, result: newProd }
    }

    const res = await axiosInstance.post<ApiResponse<any>>('/products', request)
    return {
      code: res.data.code ?? 1000,
      message: res.data.message,
      result: normalizeProduct(res.data.result),
    }
  },

  /** Nông dân cập nhật nông sản */
  async updateProduct(id: number, request: ProductUpdateRequest): Promise<ApiResponse<ProductResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200))
      const idx = localFarmerProducts.findIndex((p) => p.id === id)
      if (idx !== -1) {
        localFarmerProducts[idx] = {
          ...localFarmerProducts[idx],
          productName: request.productName,
          name: request.productName,
          price: request.sellingPrice,
          sellingPrice: request.sellingPrice,
          stock: request.stockQuantity,
          stockQuantity: request.stockQuantity,
          unit: request.unit,
          description: request.description,
          expiryDate: request.expiryDate,
          status: (request.status as any) || 'PENDING',
        }
        return { code: 1000, result: localFarmerProducts[idx] }
      }
    }

    const res = await axiosInstance.put<ApiResponse<any>>(`/products/${id}`, request)
    return {
      code: res.data.code ?? 1000,
      message: res.data.message,
      result: normalizeProduct(res.data.result),
    }
  },

  /** Nông dân xóa/tạm ngưng nông sản */
  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150))
      localFarmerProducts = localFarmerProducts.filter((p) => p.id !== id)
      return { code: 1000, message: 'Đã xóa sản phẩm' }
    }

    const res = await axiosInstance.delete<ApiResponse<void>>(`/products/${id}`)
    return res.data
  },

  /** Lấy danh sách ảnh trong gallery của sản phẩm */
  async getImages(productId: number): Promise<ApiResponse<ProductImageResponse[]>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 100))
      const found = localFarmerProducts.find((p) => p.id === productId)
      if (found?.images && found.images.length > 0) {
        return { code: 1000, result: found.images }
      }
      return {
        code: 1000,
        result: [
          {
            id: 1,
            imageUrl:
              found?.imageUrl ||
              'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80',
            isPrimary: true,
            displayOrder: 1,
          },
        ],
      }
    }

    const res = await axiosInstance.get<ApiResponse<ProductImageResponse[]>>(`/products/${productId}/images`)
    return res.data
  },

  /** Thêm ảnh vào sản phẩm (kích hoạt AI Google Cloud Vision ngầm tại backend) */
  async addImage(productId: number, request: ProductImageCreationRequest): Promise<ApiResponse<ProductImageResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200))
      const newImg: ProductImageResponse = {
        id: Date.now(),
        imageUrl: request.imageUrl,
        isPrimary: request.isPrimary ?? false,
        displayOrder: request.displayOrder ?? 0,
      }
      const prod = localFarmerProducts.find((p) => p.id === productId)
      if (prod) {
        if (!prod.images) prod.images = []
        if (newImg.isPrimary) {
          prod.images.forEach((img) => (img.isPrimary = false))
        }
        prod.images.push(newImg)
      }
      return { code: 1000, result: newImg }
    }

    const res = await axiosInstance.post<ApiResponse<ProductImageResponse>>(`/products/${productId}/images`, request)
    return res.data
  },

  /** Đặt ảnh làm ảnh đại diện chính */
  async setPrimaryImage(productId: number, imageId: number): Promise<ApiResponse<ProductImageResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150))
      const prod = localFarmerProducts.find((p) => p.id === productId)
      let targetImg: ProductImageResponse | undefined
      if (prod?.images) {
        prod.images.forEach((img) => {
          if (img.id === imageId) {
            img.isPrimary = true
            targetImg = img
          } else {
            img.isPrimary = false
          }
        })
      }
      return { code: 1000, result: targetImg }
    }

    const res = await axiosInstance.patch<ApiResponse<ProductImageResponse>>(
      `/products/${productId}/images/${imageId}/primary`,
    )
    return res.data
  },

  /** Xóa ảnh khỏi gallery sản phẩm */
  async deleteImage(productId: number, imageId: number): Promise<ApiResponse<void>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150))
      const prod = localFarmerProducts.find((p) => p.id === productId)
      if (prod?.images) {
        prod.images = prod.images.filter((img) => img.id !== imageId)
      }
      return { code: 1000, message: 'Đã xóa ảnh' }
    }

    const res = await axiosInstance.delete<ApiResponse<void>>(`/products/${productId}/images/${imageId}`)
    return res.data
  },

  async getPendingProducts(): Promise<ApiResponse<ProductResponse[]>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150))
      return { code: 1000, result: mockPendingProducts.filter((p) => p.status === 'PENDING') }
    }
    const res = await axiosInstance.get<ApiResponse<PageResponse<any>>>('/products', {
      params: { status: 'PENDING', page: 1, size: 50 },
    })
    return {
      code: 1000,
      result: (res.data.result?.content ?? []).map(normalizeProduct),
    }
  },

  async approveProduct(productId: number): Promise<ApiResponse<ProductResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200))
      const p = mockPendingProducts.find((item) => item.id === productId)
      if (p) p.status = 'APPROVED'
      return { code: 1000, result: p as any, message: 'Duyệt sản phẩm thành công' }
    }
    const res = await axiosInstance.patch<ApiResponse<any>>(`/products/${productId}/approve`)
    return {
      code: 1000,
      result: normalizeProduct(res.data.result),
      message: 'Duyệt sản phẩm thành công',
    }
  },

  async rejectProduct(productId: number, reason: string): Promise<ApiResponse<ProductResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200))
      const p = mockPendingProducts.find((item) => item.id === productId)
      if (p) {
        p.status = 'REJECTED'
        p.defectReason = reason
      }
      return { code: 1000, result: p as any, message: 'Đã từ chối duyệt sản phẩm' }
    }
    const res = await axiosInstance.patch<ApiResponse<any>>(`/products/${productId}/reject`, {
      reason,
    })
    return {
      code: 1000,
      result: normalizeProduct(res.data.result),
      message: 'Đã từ chối duyệt sản phẩm',
    }
  },

  /** Admin phê duyệt riêng lẻ 1 ảnh phụ bị gắn cờ */
  async approveImage(productId: number, imageId: number): Promise<ApiResponse<ProductImageResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150))
      return {
        code: 1000,
        result: {
          id: imageId,
          imageUrl: '',
          isApproved: true,
          isFlagged: false,
        },
        message: 'Đã phê duyệt ảnh sản phẩm',
      }
    }

    const res = await axiosInstance.patch<ApiResponse<ProductImageResponse>>(
      `/products/${productId}/images/${imageId}/approve`,
    )
    return res.data
  },

  /** Trợ lý AI gợi ý mô tả nông sản (Google Gemini 1.5 Flash) */
  async suggestDescription(
    request: AiDescriptionSuggestionRequest,
  ): Promise<ApiResponse<AiDescriptionSuggestionResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800))
      return {
        code: 1000,
        result: {
          suggestedDescription: `Nông sản tươi ngon ${request.productName} được thu hoạch trực tiếp từ vùng trồng ${request.origin || 'Đà Lạt'}. Tuy hình dáng có chút tự nhiên méo mó mộc mạc của nông sản giải cứu nhưng giữ trọn vị ngọt thanh mát, độ tươi giòn và giàu dưỡng chất tự nhiên.`,
          keyHighlights: [
            'Thu hoạch tươi ngon trực tiếp tại vườn',
            'Canh tác an toàn, đảm bảo chất lượng',
            'Chung tay giải cứu nông sản địa phương',
          ],
          generatedSource: 'MOCK_GEMINI',
        },
      }
    }

    const res = await axiosInstance.post<ApiResponse<AiDescriptionSuggestionResponse>>(
      '/products/ai-suggest-description',
      request,
    )
    return res.data
  },
}
