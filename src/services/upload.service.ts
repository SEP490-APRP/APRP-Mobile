import type { ApiResponse } from '@/types'
import type { UploadFile } from '@/types/upload.types'
import type { UploadResponse } from './upload.types'
import { axiosInstance } from './api/axiosInstance'
import { ENV } from '@/utils'

export type * from './upload.types'

export const uploadService = {
  /**
   * Tải ảnh lên Cloudinary qua endpoint Backend `POST /upload/image`, trả về URL CDN ở `result.url`.
   * Bản React Native gửi { uri, name, type } từ expo-image-picker thay cho File của trình duyệt.
   */
  async uploadImage(file: UploadFile, folder: string = 'products'): Promise<ApiResponse<UploadResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300))
      return { code: 1000, message: 'Upload mock thành công', result: { url: file.uri } }
    }

    const formData = new FormData()
    formData.append('file', file as unknown as Blob)
    formData.append('folder', folder)

    const response = await axiosInstance.post<ApiResponse<UploadResponse>>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },
}
