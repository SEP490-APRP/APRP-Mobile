import { axiosInstance } from './api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  MysteryBox,
  MysteryBoxCreationRequest,
  MysteryBoxUpdateRequest,
} from './mysteryBox.types'

export type * from './mysteryBox.types'

export const mysteryBoxService = {
  // Lấy danh sách mystery box công khai cho buyer
  async getForBuyer(params?: {
    shopId?: number
    boxType?: string
    isActive?: boolean
    page?: number
    size?: number
  }): Promise<PageResponse<MysteryBox> & { result: PageResponse<MysteryBox> }> {
    // Không trả dữ liệu giả khi lỗi: túi mù giả không thêm vào giỏ được, để màn hình báo lỗi thật.
    const res = await axiosInstance.get<ApiResponse<PageResponse<MysteryBox>>>('/mystery-boxes', {
      params: {
        page: params?.page ?? 1,
        size: params?.size ?? 50,
        isActive: params?.isActive ?? true,
        ...params,
      },
    })
    const page: PageResponse<MysteryBox> = res.data?.result ?? (res.data as any) ?? { content: [] }
    return {
      ...page,
      result: page,
    }
  },

  // Chi tiết 1 mystery box
  async getById(id: number): Promise<MysteryBox> {
    const res = await axiosInstance.get<ApiResponse<MysteryBox>>(`/mystery-boxes/${id}`)
    return (res.data?.result ?? res.data) as MysteryBox
  },

  // Lấy danh sách mystery box của shop đang đăng nhập
  async getMyShopBoxes(page = 1, size = 10): Promise<PageResponse<MysteryBox> & { result: PageResponse<MysteryBox> }> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<MysteryBox>>>('/mystery-boxes/my-shop', {
      params: { page, size },
    })
    const pageData: PageResponse<MysteryBox> = res.data?.result ?? (res.data as any) ?? { content: [] }
    return {
      ...pageData,
      result: pageData,
    }
  },

  async getMyMysteryBoxes(page = 1, size = 10): Promise<PageResponse<MysteryBox> & { result: PageResponse<MysteryBox> }> {
    return this.getMyShopBoxes(page, size)
  },

  // Shop tạo mới mystery box
  async createMysteryBox(data: MysteryBoxCreationRequest): Promise<MysteryBox> {
    const res = await axiosInstance.post<ApiResponse<MysteryBox>>('/mystery-boxes', data)
    return (res.data?.result ?? res.data) as MysteryBox
  },

  // Shop cập nhật mystery box
  async updateMysteryBox(id: number, data: MysteryBoxUpdateRequest): Promise<MysteryBox> {
    const res = await axiosInstance.put<ApiResponse<MysteryBox>>(`/mystery-boxes/${id}`, data)
    return (res.data?.result ?? res.data) as MysteryBox
  },

  // Shop bật / tắt trạng thái
  async toggleStatus(id: number, isActive: boolean): Promise<MysteryBox> {
    const res = await axiosInstance.patch<ApiResponse<MysteryBox>>(
      `/mystery-boxes/${id}/status`,
      null,
      { params: { isActive } },
    )
    return (res.data?.result ?? res.data) as MysteryBox
  },

  // Shop xóa mystery box
  async deleteMysteryBox(id: number): Promise<void> {
    await axiosInstance.delete(`/mystery-boxes/${id}`)
  },
}
