import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type { AdminUserReport, UserResponse } from './user.types'
import { mockReportData } from '@/mocks/user.mock'

export type * from './user.types'

export const userService = {
  async getAllUsers(): Promise<ApiResponse<UserResponse[]>> {
    const res = await axiosInstance.get('/users')
    return res.data
  },

  async getUserById(id: number): Promise<ApiResponse<UserResponse>> {
    const res = await axiosInstance.get(`/users/${id}`)
    return res.data
  },

  async getUsersByRolePaged(
    roles: string[],
    status: string | null = null,
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageResponse<UserResponse>>> {
    const params = new URLSearchParams()
    if (roles && roles.length > 0) {
      roles.forEach((r) => params.append('roles', r))
    }
    if (status) params.append('status', status)
    params.append('page', page.toString())
    params.append('size', size.toString())

    const res = await axiosInstance.get(`/users/paged?${params.toString()}`)
    return res.data
  },

  async approveShopOwner(userId: number): Promise<ApiResponse<UserResponse>> {
    const res = await axiosInstance.patch(`/users/${userId}/approve-shop-owner`)
    return res.data
  },

  async approveShipper(userId: number): Promise<ApiResponse<UserResponse>> {
    const res = await axiosInstance.patch(`/users/${userId}/approve-shipper`)
    return res.data
  },

  async deactivateUser(userId: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.patch(`/users/${userId}/deactivate`)
    return res.data
  },

  async activateUser(userId: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.patch(`/users/${userId}/activate`)
    return res.data
  },

  async getAdminUserReport(
    _type?: unknown,
    _from?: string,
    _to?: string,
  ): Promise<ApiResponse<AdminUserReport>> {
    // TBD: Replace with real BE endpoint once available
    await new Promise((r) => setTimeout(r, 300))
    return {
      code: 200,
      result: mockReportData,
    }
  },

  async generateAdminUserReport(
    _param?: unknown,
    _from?: string,
    _to?: string,
  ): Promise<ApiResponse<AdminUserReport>> {
    // TBD: Replace with real BE endpoint once available
    await new Promise((r) => setTimeout(r, 300))
    return {
      code: 200,
      result: mockReportData,
    }
  },
}
