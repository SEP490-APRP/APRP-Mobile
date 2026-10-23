import * as ImagePicker from 'expo-image-picker'
import { useUiStore } from '@/stores'
import type { UploadFile } from '@/types/upload.types'
import { imageProblem } from '../utils/productForm'

export type ImageSource = 'camera' | 'library'

/** Chụp hoặc chọn ảnh nông sản (4:3, nén nhẹ), kiểm tra định dạng và dung lượng như bản web. */
export function usePickProductImage() {
  const showToast = useUiStore((s) => s.showToast)
  return async (source: ImageSource, aspect: [number, number] = [4, 3]): Promise<UploadFile | undefined> => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showToast(
        source === 'camera'
          ? 'Cần quyền dùng camera để chụp ảnh. Bật trong Cài đặt của máy nhé.'
          : 'Cần quyền truy cập ảnh. Bật trong Cài đặt của máy nhé.',
      )
      return undefined
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 0.8,
    }
    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options)
    const asset = res.canceled ? undefined : res.assets[0]
    if (!asset) return undefined
    const problem = imageProblem(asset)
    if (problem) {
      showToast(problem)
      return undefined
    }
    return {
      uri: asset.uri,
      name: asset.fileName ?? `nong-san-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    }
  }
}
