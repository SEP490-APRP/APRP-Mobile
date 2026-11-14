import axiosInstance from './api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type { NotificationItem } from './notification.types'

export type * from './notification.types'

export const notificationService = {
  /** Lấy danh sách thông báo của người dùng */
  async getMyNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    const res = await axiosInstance.get<ApiResponse<NotificationItem[]>>('/notifications/my')
    return res.data
  },

  /** Lấy danh sách thông báo phân trang */
  async getMyNotificationsPaged(
    page = 0,
    size = 15,
  ): Promise<ApiResponse<PageResponse<NotificationItem>>> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<NotificationItem>>>(
      '/notifications/my/paged',
      { params: { page, size } },
    )
    return res.data
  },

  /** Đếm số lượng thông báo chưa đọc */
  async getMyUnreadCount(): Promise<ApiResponse<number>> {
    const res = await axiosInstance.get<ApiResponse<number>>('/notifications/unread-count')
    return res.data
  },

  /** Đánh dấu 1 thông báo là đã đọc */
  async markAsRead(id: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.put<ApiResponse<void>>(`/notifications/${id}/read`)
    return res.data
  },

  /** Đánh dấu tất cả thông báo là đã đọc */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    const res = await axiosInstance.put<ApiResponse<void>>('/notifications/read-all')
    return res.data
  },

  /** Xóa mềm thông báo */
  async deleteNotification(id: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.delete<ApiResponse<void>>(`/notifications/${id}`)
    return res.data
  },
}
