import { axiosInstance } from './api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  BuildCombo,
  BuildComboCreationRequest,
  BuildComboUpdateRequest,
} from './combo.types'

export type * from './combo.types'

export const comboService = {
  // Lấy danh sách build combo công khai
  async getCombos(params?: {
    status?: string
    mealType?: string
    region?: string
    type?: string
    keyword?: string
    page?: number
    size?: number
  }): Promise<PageResponse<BuildCombo> & { result: PageResponse<BuildCombo> }> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<BuildCombo>>>('/combos', {
      params: {
        page: params?.page ?? 1,
        size: params?.size ?? 50,
        status: params?.status ?? 'ACTIVE',
        ...params,
      },
    })
    const page: PageResponse<BuildCombo> = res.data?.result ?? (res.data as any) ?? { content: [] }
    return {
      ...page,
      result: page,
    }
  },

  // Chi tiết 1 combo
  async getById(id: number): Promise<BuildCombo> {
    const res = await axiosInstance.get<ApiResponse<BuildCombo>>(`/combos/${id}`)
    return (res.data?.result ?? res.data) as BuildCombo
  },

  async getComboById(id: number): Promise<BuildCombo> {
    return this.getById(id)
  },

  // Lấy danh sách combo của shop đang đăng nhập
  async getMyShopCombos(params?: {
    status?: string
    mealType?: string
    page?: number
    size?: number
  }): Promise<PageResponse<BuildCombo> & { result: PageResponse<BuildCombo> }> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<BuildCombo>>>('/combos/my-shop', {
      params: {
        page: params?.page ?? 1,
        size: params?.size ?? 10,
        ...params,
      },
    })
    const page: PageResponse<BuildCombo> = res.data?.result ?? (res.data as any) ?? { content: [] }
    return {
      ...page,
      result: page,
    }
  },

  async getMyCombos(params?: {
    status?: string
    mealType?: string
    page?: number
    size?: number
  }): Promise<PageResponse<BuildCombo> & { result: PageResponse<BuildCombo> }> {
    return this.getMyShopCombos(params)
  },

  // Shop tạo combo
  async createCombo(data: BuildComboCreationRequest): Promise<BuildCombo> {
    const res = await axiosInstance.post<ApiResponse<BuildCombo>>('/combos', data)
    return (res.data?.result ?? res.data) as BuildCombo
  },

  // Shop cập nhật combo
  async updateCombo(id: number, data: BuildComboUpdateRequest): Promise<BuildCombo> {
    const res = await axiosInstance.put<ApiResponse<BuildCombo>>(`/combos/${id}`, data)
    return (res.data?.result ?? res.data) as BuildCombo
  },

  // Shop đổi trạng thái combo
  async updateStatus(id: number, status: string): Promise<BuildCombo> {
    const res = await axiosInstance.patch<ApiResponse<BuildCombo>>(`/combos/${id}/status`, null, {
      params: { status },
    })
    return (res.data?.result ?? res.data) as BuildCombo
  },

  async toggleStatus(id: number, status: string): Promise<BuildCombo> {
    return this.updateStatus(id, status)
  },

  // Shop xóa combo
  async deleteCombo(id: number): Promise<void> {
    await axiosInstance.delete(`/combos/${id}`)
  },
}
