import type { ApiResponse } from '@/types'
import type { CategoryResponse } from './category.types'
import { axiosInstance } from './api/axiosInstance'

export type * from './category.types'

const MOCK_CATEGORIES: CategoryResponse[] = [
  { categoryId: 1, name: 'Rau ăn lá', description: 'Các loại rau xanh thu hoạch tươi sáng sớm' },
  { categoryId: 2, name: 'Củ quả vườn', description: 'Củ và quả sạch tự nhiên giải cứu từ nhà vườn' },
  { categoryId: 3, name: 'Trái cây theo mùa', description: 'Hoa quả đặc sản các vùng miền vào vụ thu hoạch' },
  { categoryId: 4, name: 'Nông sản hữu cơ', description: 'Nông sản canh tác chuẩn VietGAP & Organic' },
  { categoryId: 5, name: 'Nấm & Thực vật', description: 'Các loại nấm tươi sạch giàu dinh dưỡng' },
  { categoryId: 6, name: 'Đặc sản Đà Lạt', description: 'Rau củ ôn đới chuyển trực tiếp từ Đà Lạt' },
]

export const categoryService = {
  async getAll(): Promise<ApiResponse<CategoryResponse[]>> {
    try {
      const response = await axiosInstance.get<ApiResponse<CategoryResponse[]>>('/categories')
      const result = response.data.result
      if (Array.isArray(result) && result.length > 0) {
        return response.data
      }
    } catch {
      // Graceful fallback nếu server đang tắt hoặc DB chưa có category
    }
    return { code: 1000, result: [...MOCK_CATEGORIES] }
  },

  async getById(id: number): Promise<ApiResponse<CategoryResponse | null>> {
    try {
      const response = await axiosInstance.get<ApiResponse<CategoryResponse>>(`/categories/${id}`)
      if (response.data.result) {
        return response.data
      }
    } catch {
      // fallback
    }
    const found = MOCK_CATEGORIES.find((c) => c.categoryId === id) ?? null
    return { code: 1000, result: found }
  },
}
