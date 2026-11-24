import * as ImagePicker from 'expo-image-picker'
import { useUiStore } from '@/stores'
import type { UploadFile } from '@/types/upload.types'
import { imageProblem, MAX_PRODUCT_IMAGES } from '../utils/productForm'

export type ImageSource = 'camera' | 'library'

async function ensurePermission(
  source: ImageSource,
  showToast: (message: string) => void,
): Promise<boolean> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (perm.granted) return true
  showToast(
    source === 'camera'
      ? 'Cần quyền dùng camera để chụp ảnh. Bật trong Cài đặt của máy nhé.'
      : 'Cần quyền truy cập ảnh. Bật trong Cài đặt của máy nhé.',
  )
  return false
}

function toUploadFile(asset: ImagePicker.ImagePickerAsset, index: number, stamp: number): UploadFile {
  const rawMime = asset.mimeType?.toLowerCase()
  const type = rawMime === 'image/jpg' ? 'image/jpeg' : (asset.mimeType ?? 'image/jpeg')
  return {
    uri: asset.uri,
    name: asset.fileName ?? `nong-san-${stamp}-${index}.jpg`,
    type,
  }
}

/** Chụp hoặc chọn 1 ảnh nông sản (4:3, nén nhẹ), kiểm tra định dạng và dung lượng như bản web. */
export function usePickProductImage() {
  const showToast = useUiStore((s) => s.showToast)
  return async (source: ImageSource, aspect: [number, number] = [4, 3]): Promise<UploadFile | undefined> => {
    if (!(await ensurePermission(source, showToast))) return undefined
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
    return toUploadFile(asset, 0, Date.now())
  }
}

/** Chụp 1 ảnh hoặc chọn nhiều ảnh từ thư viện cho sản phẩm (tối đa `maxCount` ảnh). */
export function usePickProductImages() {
  const showToast = useUiStore((s) => s.showToast)
  return async (
    source: ImageSource,
    maxCount = MAX_PRODUCT_IMAGES,
    aspect: [number, number] = [4, 3],
  ): Promise<UploadFile[]> => {
    if (maxCount <= 0) {
      showToast(`Mỗi sản phẩm chỉ có tối đa ${MAX_PRODUCT_IMAGES} ảnh.`)
      return []
    }
    if (!(await ensurePermission(source, showToast))) return []

    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: maxCount,
            orderedSelection: true,
            quality: 0.8,
          })

    if (res.canceled || !res.assets?.length) return []

    const stamp = Date.now()
    const accepted: UploadFile[] = []
    let firstProblem: string | undefined
    let skippedInvalid = 0
    let truncated = false

    for (const asset of res.assets) {
      if (accepted.length >= maxCount) {
        truncated = true
        break
      }
      const problem = imageProblem(asset)
      if (problem) {
        firstProblem ??= problem
        skippedInvalid += 1
        continue
      }
      accepted.push(toUploadFile(asset, accepted.length, stamp))
    }

    if (skippedInvalid > 0 && accepted.length === 0) {
      showToast(firstProblem ?? 'Ảnh không hợp lệ.')
    } else if (skippedInvalid > 0 || truncated) {
      const reasons: string[] = []
      if (skippedInvalid > 0) reasons.push(`${skippedInvalid} ảnh bị bỏ qua (${firstProblem})`)
      if (truncated) reasons.push(`tối đa ${MAX_PRODUCT_IMAGES} ảnh`)
      showToast(`Đã chọn ${accepted.length} ảnh; ${reasons.join(', ')}.`)
    }

    return accepted
  }
}
