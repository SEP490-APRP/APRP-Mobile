import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type { AdminSendNotificationRequest, NotificationItem } from './notification.types'

export type * from './notification.types'

export const notificationService = {
  async getMyNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    const res = await axiosInstance.get<ApiResponse<NotificationItem[]>>('/notifications/my')
    return res.data
  },

  async getMyNotificationsPaged(
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<NotificationItem>>> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<NotificationItem>>>(
      '/notifications/my/paged',
      { params: { page, size } },
    )
    return res.data
  },

  async getMyUnreadCount(): Promise<ApiResponse<number>> {
    const res = await axiosInstance.get<ApiResponse<number>>('/notifications/unread-count')
    return res.data
  },

  async getAllNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    const res = await axiosInstance.get<ApiResponse<NotificationItem[]>>('/notifications/all')
    return res.data
  },

  async markAsRead(id: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.put<ApiResponse<void>>(`/notifications/${id}/read`)
    return res.data
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    const res = await axiosInstance.put<ApiResponse<void>>('/notifications/read-all')
    return res.data
  },

  async deleteNotification(id: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.delete<ApiResponse<void>>(`/notifications/${id}`)
    return res.data
  },

  async adminSendToGroups(payload: AdminSendNotificationRequest): Promise<ApiResponse<void>> {
    const res = await axiosInstance.post<ApiResponse<void>>('/notifications/admin/send-to-groups', payload)
    return res.data
  },
}
