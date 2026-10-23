/** Dạng response chuẩn của backend. */
export interface ApiResponse<T> {
  code?: number
  message?: string
  result?: T
}

export interface PageResponse<T> {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  content: T[]
}

/** Tên theo README; cùng kiểu với PageResponse. */
export type PaginatedResponse<T> = PageResponse<T>

/**
 * Lỗi đã chuẩn hóa mà axiosInstance reject ra.
 * Giữ `data` từ body API để getErrorMessage() đọc được `data.message`.
 */
export interface ApiError {
  /** HTTP status; 0 khi không nhận được response (mất mạng, timeout). */
  status: number
  message: string
  data?: ApiResponse<unknown>
}
