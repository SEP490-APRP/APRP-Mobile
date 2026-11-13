import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { AlertCircle, Camera, Image as ImageIcon, RotateCcw, ShieldCheck, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { AppText, BottomSheet, Button } from '@/components/ui'
import { money } from '@/features/product'
import { uploadService } from '@/services/upload.service'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { OrderItem } from '@/types/order.types'
import type { UploadFile } from '@/types/upload.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { useCreateReturnRequest } from '../hooks/useOrderQueries'

const RETURN_REASONS = [
  'Nông sản bị thối / dập nát / hư hỏng trong quá trình vận chuyển',
  'Giao sai chủng loại hoặc không đúng với mô tả trên gian hàng',
  'Giao thiếu số lượng / trọng lượng so với đơn đặt',
  'Hàng đã quá ngày sử dụng hoặc biến chất khi nhận',
  'Lý do khác',
] as const

const MAX_IMAGES = 3

export function ReturnRequestSheet({
  visible,
  item,
  orderId,
  onClose,
  onSuccess,
}: {
  visible: boolean
  item: OrderItem | null
  orderId?: number
  onClose: () => void
  onSuccess?: () => void
}) {
  const [selectedReason, setSelectedReason] = useState<string>(RETURN_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [refundAmountStr, setRefundAmountStr] = useState('')
  const [photos, setPhotos] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const createReturn = useCreateReturnRequest()
  const showToast = useUiStore((s) => s.showToast)

  const detailId = item?.orderDetailId ?? item?.id
  const itemUnitPrice = Number(item?.unitPrice || 0)
  const itemQty = Number(item?.quantity || 1)
  const maxRefundAmount = itemUnitPrice * itemQty

  useEffect(() => {
    if (visible && item) {
      setSelectedReason(RETURN_REASONS[0])
      setCustomReason('')
      setRefundAmountStr(String(maxRefundAmount))
      setPhotos([])
    }
  }, [visible, item, maxRefundAmount])

  if (!item) return null

  const displayName = item.itemName || item.productName || item.mysteryBoxType || 'Sản phẩm'

  const pickImage = async (source: 'camera' | 'library') => {
    if (photos.length >= MAX_IMAGES) {
      showToast(`Tối đa ${MAX_IMAGES} ảnh minh chứng.`)
      return
    }

    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!perm.granted) {
      showToast(source === 'camera' ? 'Cần quyền truy cập máy ảnh để chụp bằng chứng.' : 'Cần quyền truy cập thư viện ảnh.')
      return
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 }
    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options)

    const asset = res.canceled ? undefined : res.assets[0]
    if (!asset) return

    setPhotos((prev) => [
      ...prev,
      {
        uri: asset.uri,
        name: asset.fileName ?? `return-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      },
    ].slice(0, MAX_IMAGES))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!detailId) {
      showToast('Không tìm thấy thông tin mặt hàng để yêu cầu hoàn trả.')
      return
    }

    const finalReason = selectedReason === 'Lý do khác' ? customReason.trim() : selectedReason
    if (!finalReason) {
      showToast('Vui lòng nhập lý do trả hàng / hoàn tiền.')
      return
    }

    const parsedRefund = Number(refundAmountStr) || maxRefundAmount
    if (parsedRefund <= 0 || parsedRefund > maxRefundAmount) {
      showToast(`Số tiền hoàn không hợp lệ (tối đa ${money(maxRefundAmount)}).`)
      return
    }

    setUploading(true)
    try {
      const uploadedUrls: string[] = []
      for (const photo of photos) {
        const uploadRes = await uploadService.uploadImage(photo, 'returns')
        if (uploadRes.result?.url) {
          uploadedUrls.push(uploadRes.result.url)
        }
      }

      await createReturn.mutateAsync({
        orderDetailId: detailId,
        reason: finalReason,
        refundAmount: parsedRefund,
        evidenceUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      })

      showToast('Đã gửi yêu cầu trả hàng / hoàn tiền. Nhà vườn sẽ phản hồi sớm.')
      onSuccess?.()
      onClose()
    } catch (err) {
      showToast(getErrorMessage(err, 'Không thể gửi yêu cầu trả hàng. Vui lòng thử lại.'))
    } finally {
      setUploading(false)
    }
  }

  const isSubmitting = createReturn.isPending || uploading

  return (
    <BottomSheet
      visible={visible}
      title="Yêu cầu Trả hàng / Hoàn tiền"
      subtitle="Bảo vệ quyền lợi nông sản tươi ngon"
      onClose={onClose}
      footer={
        <>
          <Button title="Đóng" variant="outline" onPress={onClose} disabled={isSubmitting} className="min-h-[44px] flex-1" />
          <Button
            title="Gửi yêu cầu"
            variant="primary"
            loading={isSubmitting}
            onPress={() => void handleSubmit()}
            className="min-h-[44px] flex-1"
          />
        </>
      }
    >
      <View className="gap-4">
        {/* Thông tin sản phẩm */}
        <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-paper p-3">
          <View className="h-12 w-12 overflow-hidden rounded-xl border border-line bg-white">
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48 }} contentFit="cover" />
            ) : null}
          </View>
          <View className="flex-1">
            <AppText weight="bold" numberOfLines={1} className="text-sm">
              {displayName}
            </AppText>
            <AppText className="text-xs text-ink-muted">
              {money(itemUnitPrice)} × {itemQty} = {money(maxRefundAmount)}
            </AppText>
          </View>
        </View>

        {/* Chọn lý do trả hàng */}
        <View className="gap-2">
          <AppText weight="bold" className="text-sm">
            Lý do yêu cầu hoàn trả
          </AppText>
          <View className="gap-2">
            {RETURN_REASONS.map((reason) => {
              const active = selectedReason === reason
              return (
                <Pressable
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  className={cn(
                    'flex-row items-center gap-2.5 rounded-xl border p-3',
                    active ? 'border-leaf-700 bg-leaf-50' : 'border-line bg-white',
                  )}
                >
                  <View
                    className={cn(
                      'h-4 w-4 items-center justify-center rounded-full border-2',
                      active ? 'border-leaf-700' : 'border-line-strong',
                    )}
                  >
                    {active && <View className="h-2 w-2 rounded-full bg-leaf-700" />}
                  </View>
                  <AppText className={cn('flex-1 text-xs leading-relaxed', active ? 'text-leaf-900 font-semibold' : 'text-ink')}>
                    {reason}
                  </AppText>
                </Pressable>
              )
            })}
          </View>

          {selectedReason === 'Lý do khác' && (
            <TextInput
              value={customReason}
              onChangeText={setCustomReason}
              placeholder="Mô tả cụ thể vấn đề bạn gặp phải..."
              placeholderTextColor={colors.inkSubtle}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[72px] rounded-2xl border border-line bg-white p-3 text-xs text-ink"
              style={{ fontFamily: fontFamily.regular }}
            />
          )}
        </View>

        {/* Số tiền hoàn yêu cầu */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className="text-sm">
              Số tiền yêu cầu hoàn lại
            </AppText>
            <AppText className="text-xs text-ink-muted">Tối đa: {money(maxRefundAmount)}</AppText>
          </View>
          <TextInput
            value={refundAmountStr}
            onChangeText={setRefundAmountStr}
            keyboardType="numeric"
            placeholder="Số tiền hoàn lại"
            placeholderTextColor={colors.inkSubtle}
            className="h-12 rounded-2xl border border-line bg-white px-3.5 text-sm font-bold text-leaf-700"
            style={{ fontFamily: fontFamily.bold }}
          />
        </View>

        {/* Ảnh bằng chứng */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className="text-sm">
              Hình ảnh / Bằng chứng ({photos.length}/{MAX_IMAGES})
            </AppText>
            <AppText className="text-xs text-ink-muted">Tối đa 3 ảnh</AppText>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {photos.map((photo, index) => (
              <View key={index} className="relative h-20 w-20 overflow-hidden rounded-xl border border-line bg-paper">
                <Image source={{ uri: photo.uri }} style={{ width: 80, height: 80 }} contentFit="cover" />
                <Pressable
                  onPress={() => removePhoto(index)}
                  className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
                  accessibilityLabel="Xóa ảnh"
                >
                  <X size={14} color="#ffffff" />
                </Pressable>
              </View>
            ))}

            {photos.length < MAX_IMAGES && (
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => void pickImage('camera')}
                  className="h-20 w-20 items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong bg-white active:bg-paper"
                >
                  <Camera size={20} color={colors.inkSubtle} />
                  <AppText className="text-[11px] text-ink-muted">Chụp ảnh</AppText>
                </Pressable>
                <Pressable
                  onPress={() => void pickImage('library')}
                  className="h-20 w-20 items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong bg-white active:bg-paper"
                >
                  <ImageIcon size={20} color={colors.inkSubtle} />
                  <AppText className="text-[11px] text-ink-muted">Thư viện</AppText>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Cam kết CapNong */}
        <View className="flex-row items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
          <ShieldCheck size={16} color={colors.leaf700} />
          <AppText className="flex-1 text-xs text-ink-muted">
            CapNong bảo vệ quyền lợi người mua. Yêu cầu của bạn sẽ được thông báo ngay tới nhà vườn để giải quyết.
          </AppText>
        </View>
      </View>
    </BottomSheet>
  )
}

