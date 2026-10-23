import type { ApiResponse } from '@/types'
import type { NotificationItem } from './notification.types'
import { mockNotifications } from '@/mocks/notification.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './notification.types'

export const notificationService = freshResponses({
  async getAllNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    await new Promise((r) => setTimeout(r, 150))
    return { code: 200, result: [...mockNotifications] }
  },

  async getMyNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    await new Promise((r) => setTimeout(r, 150))
    return { code: 200, result: [...mockNotifications] }
  },

  async adminSendToGroups(payload: {
    title: string
    message: string
    receiverTypes: string[]
  }): Promise<ApiResponse<NotificationItem>> {
    await new Promise((r) => setTimeout(r, 300))
    const newNotif: NotificationItem = {
      id: Date.now(),
      title: payload.title,
      message: payload.message,
      receiverTypes: payload.receiverTypes,
      receiverType: payload.receiverTypes.join(', '),
      createdAt: new Date().toISOString(),
      createAt: new Date().toISOString(),
    }
    mockNotifications.unshift(newNotif)
    return { code: 200, result: newNotif }
  },
})
