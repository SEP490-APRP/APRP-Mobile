import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse } from '@/types'

export interface DeviceTokenPayload {
  deviceToken: string
  platform?: string
  deviceName?: string
  tokenType?: string
}

export const deviceService = {
  async registerToken(payload: DeviceTokenPayload): Promise<ApiResponse<void>> {
    const res = await axiosInstance.post('/devices/token', payload)
    return res.data
  },

  async unregisterToken(deviceToken: string): Promise<ApiResponse<void>> {
    const res = await axiosInstance.delete('/devices/token', {
      data: { deviceToken },
    })
    return res.data
  },
}

