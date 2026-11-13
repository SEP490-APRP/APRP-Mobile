import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { Camera, Image as ImageIcon, Star, Trash2, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native'
import { AppText, BottomSheet, Button } from '@/components/ui'
import { uploadService } from '@/services/upload.service'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { OrderItem } from '@/types/order.types'
import type { UploadFile } from '@/types/upload.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { useCreateReview } from '../hooks/useReviewQueries'

const RATING_LABELS: Record<number, string> = {
  1: 'Rất thất vọng (1/5 ⭐)',
  2: 'Không hài lòng (2/5 ⭐)',
  3: 'Bình thường (3/5 ⭐)',
  4: 'Hài lòng (4/5 ⭐)',
  5: 'Tuyệt vời (5/5 ⭐)',
}

const MAX_IMAGES = 3

export function ReviewSheet({
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
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const createReview = useCreateReview()
  const showToast = useUiStore((s) => s.showToast)

  useEffect(() => {
    if (visible) {
      setRating(5)
      setComment('')
      setPhotos([])
    }
  }, [visible])

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
      showToast(source === 'camera' ? 'Cần quyền truy cập máy ảnh để chụp ảnh.' : 'Cần quyền truy cập thư viện ảnh.')
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
        name: asset.fileName ?? `review-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      },
    ].slice(0, MAX_IMAGES))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const detailId = item.orderDetailId ?? item.id
    if (!detailId && !item.mysteryBoxId) {
      showToast('Không tìm thấy thông tin mặt hàng để đánh giá.')
      return
    }

    setUploading(true)
    try {
      // Tải ảnh lên nếu có
      const uploadedUrls: string[] = []
      for (const photo of photos) {
        const uploadRes = await uploadService.uploadImage(photo, 'reviews')
        if (uploadRes.result?.url) {
          uploadedUrls.push(uploadRes.result.url)
        }
      }

      await createReview.mutateAsync({
        orderDetailId: detailId,
        mysteryBoxId: item.mysteryBoxId,
        ratingStar: rating,
        comment: comment.trim(),
        evidence: uploadedUrls[0],
        imageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      })

      showToast('Cảm ơn bạn đã gửi đánh giá!')
      onSuccess?.()
      onClose()
    } catch (err) {
      showToast(getErrorMessage(err, 'Có lỗi khi gửi đánh giá. Vui lòng thử lại.'))
    } finally {
      setUploading(false)
    }
  }

  const isSubmitting = createReview.isPending || uploading

  return (
    <BottomSheet
      visible={visible}
      title="Đánh giá sản phẩm"
      subtitle="Ý kiến của bạn giúp nhà vườn nâng cao chất lượng"
      onClose={onClose}
      footer={
        <>
          <Button title="Đóng" variant="outline" onPress={onClose} disabled={isSubmitting} className="min-h-[44px] flex-1" />
          <Button
            title="Gửi đánh giá"
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
            <AppText className="text-xs text-ink-muted">x{item.quantity}</AppText>
          </View>
        </View>

        {/* Chọn số sao */}
        <View className="items-center gap-2 rounded-2xl border border-line bg-white p-4">
          <View className="flex-row items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                accessibilityRole="button"
                accessibilityLabel={`${star} sao`}
                className="p-1"
              >
                <Star
                  size={32}
                  color={star <= rating ? '#f59e0b' : colors.inkSubtle}
                  fill={star <= rating ? '#f59e0b' : 'transparent'}
                />
              </Pressable>
            ))}
          </View>
          <AppText weight="bold" className="text-sm text-amber-600">
            {RATING_LABELS[rating]}
          </AppText>
        </View>

        {/* Nội dung đánh giá */}
        <View className="gap-1.5">
          <AppText weight="bold" className="text-sm">
            Nhận xét của bạn
          </AppText>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ cảm nhận về độ tươi ngon, đóng gói của nông sản..."
            placeholderTextColor={colors.inkSubtle}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="min-h-[96px] rounded-2xl border border-line bg-white p-3.5 text-sm text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
        </View>

        {/* Đính kèm ảnh */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className="text-sm">
              Hình ảnh thực tế ({photos.length}/{MAX_IMAGES})
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
      </View>
    </BottomSheet>
  )
}

