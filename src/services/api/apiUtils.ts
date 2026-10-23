import type { AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

export function unwrap<T>(res: AxiosResponse<ApiResponse<T> | T>): T {
  if (res && res.data && typeof res.data === 'object' && 'result' in res.data) {
    return (res.data as ApiResponse<T>).result as T
  }
  return res.data as T
}
