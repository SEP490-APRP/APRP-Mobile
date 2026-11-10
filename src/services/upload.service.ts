import type { ApiResponse } from '@/types'
import type { UploadFile } from '@/types/upload.types'
import type { UploadResponse } from './upload.types'
import { axiosInstance } from './api/axiosInstance'
import { appendFile, multipartHeaders } from './api/formFile'
import { ENV } from '@/utils'

export type * from './upload.types'

export const uploadService = {
  /**
   * Tải ảnh lên Cloudinary qua endpoint Backend `POST /upload/image`, trả về URL CDN ở `result.url`.
   * Nhận { uri, name, type } từ expo-image-picker; `appendFile` lo phần khác nhau giữa điện thoại và trình duyệt.
   */
  async uploadImage(file: UploadFile, folder: string = 'products'): Promise<ApiResponse<UploadResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300))
      return { code: 1000, message: 'Upload mock thành công', result: { url: file.uri } }
    }

    const formData = new FormData()
    await appendFile(formData, 'file', file)
    formData.append('folder', folder)

    const response = await axiosInstance.post<ApiResponse<UploadResponse>>('/upload/image', formData, {
      headers: multipartHeaders(),
    })

    return response.data
  },
}
