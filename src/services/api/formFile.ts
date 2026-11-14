import { Platform } from 'react-native'
import type { UploadFile } from '@/types/upload.types'

/**
 * Gắn file ảnh vào FormData cho cả điện thoại và trình duyệt (Expo web).
 * - Điện thoại: FormData của React Native nhận thẳng `{ uri, name, type }`.
 * - Trình duyệt: FormData chỉ nhận Blob/File. Truyền object sẽ bị đổi thành chuỗi "[object Object]"
 *   và BE báo "Required part 'file' is not present", nên phải đọc `uri` (blob: / data:) ra Blob trước.
 */
export async function appendFile(form: FormData, field: string, file: UploadFile): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob()
    form.append(field, new File([blob], file.name, { type: file.type || blob.type || 'image/jpeg' }))
    return
  }
  form.append(field, file as unknown as Blob)
}

/**
 * Header cho request multipart. Trên trình duyệt để trống để trình duyệt tự thêm `boundary`;
 * ghi tay 'multipart/form-data' (thiếu boundary) thì server không tách được các phần.
 */
export const multipartHeaders = (): Record<string, string> =>
  Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' }
