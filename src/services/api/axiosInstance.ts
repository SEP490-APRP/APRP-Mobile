import { create, type AxiosError } from 'axios'
import { authEvents } from '@/lib/authEvents'
import type { ApiError, ApiResponse } from '@/types'
import { ENV } from '@/utils/env'
import { isTokenValid } from '@/utils/jwt'
import { normalizeJacksonDates } from './jacksonDates'

/**
 * Token được giữ trong useAuthStore (nạp từ SecureStore khi mở app). Store đăng ký
 * hàm đọc ở đây thay vì interceptor import store, để tránh vòng import services <-> stores.
 */
let tokenGetter: () => string | null = () => null

export function setTokenGetter(getter: () => string | null): void {
  tokenGetter = getter
}

function readToken(): string | null {
  const token = tokenGetter()
  if (!token) return null
  if (!isTokenValid(token)) {
    authEvents.emit('unauthorized')
    return null
  }
  return token
}

// Không đặt Content-Type mặc định: axios tự chọn JSON cho object và multipart cho FormData.
export const axiosInstance = create({
  baseURL: ENV.API_URL,
  timeout: 15_000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = readToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (response) => {
    normalizeJacksonDates(response.data)
    return response
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status ?? 0
    const data = error.response?.data

    if (status === 401) authEvents.emit('unauthorized')

    const apiError: ApiError = { status, data, message: data?.message || error.message }
    return Promise.reject(apiError)
  },
)

export default axiosInstance
