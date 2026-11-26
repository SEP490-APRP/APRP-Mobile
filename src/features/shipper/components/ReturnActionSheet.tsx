import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Camera, ImagePlus, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button, ChoiceChips, TextField } from '@/components/ui'
import { uploadService } from '@/services/upload.service'
import { useUiStore } from '@/stores'
import type { UploadFile } from '@/types/upload.types'
import { cn } from '@/utils/helpers'

export type ReturnActionKind = 'pickup' | 'deliver' | 'fail'

const FAIL_PICKUP_CHIPS = [
  { value: 'Không liên lạc được với khách', label: 'Không liên lạc được' },
  { value: 'Khách từ chối trả hàng', label: 'Khách đổi ý / từ chối' },
  { value: 'Sai địa chỉ khách hàng', label: 'Sai địa chỉ' },
  { value: 'Lý do khác', label: 'Lý do khác' },
]

const FAIL_DELIVER_CHIPS = [
  { value: 'Shop đóng cửa / Không có người nhận', label: 'Shop đóng cửa' },
  { value: 'Shop từ chối nhận lại hàng', label: 'Shop từ chối nhận' },
  { value: 'Không liên lạc được với Shop', label: 'Không gọi được Shop' },
  { value: 'Lý do khác', label: 'Lý do khác' },
]

export function ReturnActionSheet({
  visible,
  returnId,
  action,
  isPickedUp,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean
  returnId: number
  action: ReturnActionKind | null
  isPickedUp: boolean
  loading?: boolean
  onSubmit: (payload: { note?: string; proofImageUrl?: string }) => void
  onClose: () => void
}) {
  const showToast = useUiStore((s) => s.showToast)
  const [photo, setPhoto] = useState<UploadFile | null>(null)
  const [reasonChip, setReasonChip] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setPhoto(null)
    setReasonChip(null)
    setNote('')
    setTouched(false)
    setUploadError(null)
  }, [visible, returnId, action])

  if (!action) return null

  const isFail = action === 'fail'
  const title =
    action === 'pickup'
      ? `Đã lấy hàng hoàn #${returnId}`
      : action === 'deliver'
        ? `Đã giao hàng hoàn về Shop #${returnId}`
        : isPickedUp
          ? `Báo giao về Shop thất bại #${returnId}`
          : `Không lấy được hàng hoàn #${returnId}`

  const subtitle =
    action === 'pickup'
      ? 'Chụp ảnh gói hàng hoàn nhận từ người mua để đối soát với Shop.'
      : action === 'deliver'
        ? 'Chụp ảnh bàn giao hàng hoàn tại nhà vườn để hoàn tất & nhận cước.'
        : isPickedUp
          ? 'Yêu cầu sẽ chuyển lên Admin kiểm tra xử lý.'
          : 'Đơn hoàn sẽ đóng lại và hoàn cước ship hoàn (nếu có) cho Shop.'

  const chips = isPickedUp ? FAIL_DELIVER_CHIPS : FAIL_PICKUP_CHIPS

  const trimmedNote = note.trim()
  const combinedNote = isFail ? [reasonChip, trimmedNote].filter(Boolean).join(' · ') : trimmedNote
  const reasonError = touched && isFail && !combinedNote ? 'Vui lòng chọn lý do hoặc nhập ghi chú thất bại.' : undefined
  const photoError =
    uploadError ?? (touched && !photo ? 'Vui lòng chụp hoặc chọn ít nhất 1 ảnh bằng chứng.' : undefined)

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showToast(fromCamera ? 'Cần quyền máy ảnh để chụp ảnh.' : 'Cần quyền thư viện ảnh để chọn ảnh.')
      return
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ['images'] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] })
    if (res.canceled || !res.assets?.length) return
    const asset = res.assets[0]
    setUploadError(null)
    setPhoto({
      uri: asset.uri,
      name: asset.fileName || `return-${returnId}-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    })
  }

  const handleConfirm = async () => {
    setTouched(true)
    setUploadError(null)

    if (isFail && !combinedNote) {
      showToast('Vui lòng chọn lý do hoặc nhập ghi chú thất bại.')
      return
    }
    if (!photo) {
      showToast('Vui lòng chụp hoặc chọn 1 ảnh bằng chứng.')
      return
    }

    try {
      setUploading(true)
      const uploaded = await uploadService.uploadImage(photo, 'delivery-proofs')
      const url = uploaded.result?.url
      if (!url) {
        setUploadError('Tải ảnh lên thất bại, vui lòng thử lại.')
        showToast('Tải ảnh lên thất bại, thử lại nhé.')
        return
      }
      onSubmit({ note: combinedNote || undefined, proofImageUrl: url })
    } catch {
      setUploadError('Không tải được ảnh bằng chứng, vui lòng thử lại.')
      showToast('Không tải được ảnh bằng chứng, thử lại nhé.')
    } finally {
      setUploading(false)
    }
  }

  const busy = Boolean(loading || uploading)

  return (
    <BottomSheet
      visible={visible}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <View className="flex-row gap-2">
          <Button title="Huỷ" variant="outline" disabled={busy} onPress={onClose} className="min-h-[48px] flex-1" />
          <Button
            title={isFail ? 'Xác nhận thất bại' : 'Xác nhận hoàn tất'}
            variant={isFail ? 'danger' : 'primary'}
            loading={busy}
            onPress={() => void handleConfirm()}
            className="min-h-[48px] flex-[1.5]"
          />
        </View>
      }
    >
      <View className="gap-4">
        {isFail && (
          <View className="gap-1">
            <ChoiceChips
              label="Lý do (bắt buộc)"
              options={chips}
              value={reasonChip ?? ''}
              onChange={(v) => setReasonChip(v)}
            />
            {reasonError && (
              <AppText weight="semibold" className="text-xs text-sale">
                {reasonError}
              </AppText>
            )}
          </View>
        )}

        <TextField
          label={isFail ? 'Ghi chú thêm' : 'Ghi chú (tuỳ chọn)'}
          value={note}
          onChangeText={setNote}
          placeholder={isFail ? 'Nhập chi tiết tình huống...' : 'VD: Đã kiểm tra nguyên vẹn khi nhận'}
          multiline
        />

        <View
          className={cn(
            'gap-2 rounded-panel border border-dashed p-3',
            photoError ? 'border-rose-400 bg-rose-50/50' : 'border-leaf-300 bg-leaf-50/40',
          )}
        >
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className={cn('text-sm', photoError ? 'text-sale' : 'text-ink')}>
              Ảnh bằng chứng (bắt buộc)
            </AppText>
            <AppText weight="semibold" className={cn('text-xs', photoError ? 'text-sale' : 'text-leaf-700')}>
              {photo ? '1/1 ảnh' : '0/1 ảnh'}
            </AppText>
          </View>

          {photo ? (
            <View className="relative h-36 w-full overflow-hidden rounded-xl border border-line bg-white">
              <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 144 }} contentFit="cover" />
              <Pressable
                onPress={() => setPhoto(null)}
                hitSlop={8}
                className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-black/60"
              >
                <X size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View className="flex-row gap-2">
              <Button
                title="Chụp ảnh"
                icon={Camera}
                variant="outline"
                onPress={() => void pickImage(true)}
                className="min-h-[44px] flex-1 bg-white"
              />
              <Button
                title="Chọn ảnh"
                icon={ImagePlus}
                variant="outline"
                onPress={() => void pickImage(false)}
                className="min-h-[44px] flex-1 bg-white"
              />
            </View>
          )}
          {photoError && (
            <AppText weight="semibold" className="text-xs text-sale">
              {photoError}
            </AppText>
          )}
        </View>
      </View>
    </BottomSheet>
  )
}
