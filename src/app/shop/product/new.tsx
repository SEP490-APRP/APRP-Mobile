import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Camera, ImagePlus, Info, Send, Star, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Banner, BottomSheet, Button } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  emptyProductForm,
  ImageSourceSheet,
  MAX_PRODUCT_IMAGES,
  nextPrimaryIndexAfterRemove,
  ProductFormFields,
  toProductRequest,
  useCreateShopProduct,
  usePickProductImages,
  useProductForm,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { UploadFile } from '@/types/upload.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/** Đăng bán nông sản mới, hỗ trợ nhiều ảnh (tối đa 8) và rollback nếu ảnh chính không qua kiểm duyệt AI. */
export default function NewShopProduct() {
  const form = useProductForm(emptyProductForm())
  const create = useCreateShopProduct()
  const pickImages = usePickProductImages()
  const showToast = useUiStore((s) => s.showToast)
  const [images, setImages] = useState<UploadFile[]>([])
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [sheet, setSheet] = useState(false)
  const [imageError, setImageError] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()
  const [progressText, setProgressText] = useState<string>()

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/products'))

  const choose = async (source: 'camera' | 'library') => {
    const remaining = MAX_PRODUCT_IMAGES - images.length
    const files = await pickImages(source, remaining)
    if (files.length === 0) return
    setImages((prev) => [...prev, ...files].slice(0, MAX_PRODUCT_IMAGES))
    setImageError(undefined)
    setSubmitError(undefined)
  }

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      setPrimaryIndex((cur) => nextPrimaryIndexAfterRemove(cur, idx, next.length))
      return next
    })
    setSelectedIdx(null)
    setSubmitError(undefined)
  }

  const setAsPrimary = (idx: number) => {
    setPrimaryIndex(idx)
    setSelectedIdx(null)
    setSubmitError(undefined)
    showToast('Đã đặt làm ảnh đại diện.')
  }

  const submit = () => {
    const ok = form.validate()
    const missingImage = images.length === 0
    setImageError(missingImage ? 'Thêm ít nhất 1 ảnh nông sản thật để khách tin tưởng' : undefined)
    setSubmitError(undefined)
    if (!ok || missingImage) {
      showToast('Kiểm tra lại các ô được đánh dấu đỏ nhé.')
      return
    }
    const name = form.values.name.trim()
    setProgressText(`Đang kiểm duyệt AI (1/${images.length})…`)
    create.mutate(
      {
        request: toProductRequest(form.values),
        images,
        primaryIndex,
        onProgress: (cur, total) => setProgressText(`Đang kiểm duyệt AI (${cur}/${total})…`),
      },
      {
        onSuccess: ({ uploadedCount, failedImages }) => {
          setProgressText(undefined)
          if (failedImages.length > 0) {
            showToast(
              `Đã gửi "${name}" với ${uploadedCount} ảnh hợp lệ (${failedImages.length} ảnh bị AI từ chối). Sản phẩm đang chờ duyệt.`,
            )
          } else {
            showToast(`Đã gửi "${name}" (${uploadedCount} ảnh). Sản phẩm đang chờ quản trị viên duyệt.`)
          }
          goBack()
        },
        onError: (err) => {
          setProgressText(undefined)
          const msg = getErrorMessage(err, 'Chưa đăng được sản phẩm, thử lại nhé.')
          setSubmitError(msg)
          showToast(msg)
        },
      },
    )
  }

  const full = images.length >= MAX_PRODUCT_IMAGES
  const selectedImage = selectedIdx != null ? images[selectedIdx] : undefined

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={goBack} />
        <View className="flex-1">
          <AppText accessibilityRole="header" weight="extrabold" className="text-base">
            Đăng bán nông sản
          </AppText>
          <AppText className="text-xs text-ink-muted">Điền thông tin và thêm ảnh để niêm yết lên chợ</AppText>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          contentContainerClassName="gap-5 p-4"
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <AppText weight="semibold" className="text-sm text-ink">
                Hình ảnh nông sản *
              </AppText>
              <AppText className="text-xs text-ink-muted">
                {images.length}/{MAX_PRODUCT_IMAGES} ảnh · tối đa 5MB/ảnh
              </AppText>
            </View>

            {images.length === 0 ? (
              <Pressable
                onPress={() => setSheet(true)}
                accessibilityRole="button"
                accessibilityLabel="Thêm ảnh nông sản"
                className={cn(
                  'aspect-[4/3] w-full overflow-hidden rounded-panel border-2 border-dashed',
                  imageError ? 'border-sale bg-sale-soft' : 'border-leaf-200 bg-white',
                )}
              >
                <View className="flex-1 items-center justify-center gap-2 px-6">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-leaf-50">
                    <Camera size={26} color={colors.leaf700} />
                  </View>
                  <AppText weight="bold" className="text-base text-leaf-800">
                    Chụp hoặc chọn ảnh nông sản
                  </AppText>
                  <AppText className="text-center text-sm text-ink-muted">
                    Có thể chọn nhiều ảnh cùng lúc (tối đa {MAX_PRODUCT_IMAGES} ảnh). JPEG, PNG, WebP.
                  </AppText>
                </View>
              </Pressable>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
                  {images.map((img, idx) => {
                    const isPrimary = idx === primaryIndex
                    return (
                      <Pressable
                        key={`${img.uri}-${idx}`}
                        onPress={() => setSelectedIdx(idx)}
                        accessibilityRole="button"
                        accessibilityLabel={isPrimary ? 'Ảnh đại diện' : `Ảnh số ${idx + 1}`}
                        className={cn(
                          'h-28 w-28 overflow-hidden rounded-xl border-2',
                          isPrimary ? 'border-leaf-600' : 'border-line',
                        )}
                      >
                        <Image source={{ uri: img.uri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                        {isPrimary && (
                          <View className="absolute left-1.5 top-1.5 flex-row items-center gap-1 rounded-full bg-leaf-700 px-2 py-0.5">
                            <Star size={11} color={colors.white} fill={colors.white} />
                            <AppText weight="bold" className="text-xs text-white">
                              Chính
                            </AppText>
                          </View>
                        )}
                      </Pressable>
                    )
                  })}
                  {!full && (
                    <Pressable
                      onPress={() => setSheet(true)}
                      disabled={create.isPending}
                      accessibilityRole="button"
                      accessibilityLabel="Thêm ảnh"
                      className="h-28 w-28 items-center justify-center gap-1 rounded-xl border-2 border-dashed border-leaf-200 bg-white"
                    >
                      <ImagePlus size={22} color={colors.leaf700} />
                      <AppText weight="bold" className="text-sm text-leaf-700">
                        Thêm ảnh
                      </AppText>
                    </Pressable>
                  )}
                </ScrollView>
                <AppText className="text-xs text-ink-muted">Chạm vào ảnh để đổi ảnh đại diện hoặc xoá ảnh.</AppText>
              </>
            )}

            {!!imageError && <AppText className="text-caption text-sale">{imageError}</AppText>}
            {!!submitError && <Banner tone="error" message={submitError} />}
          </View>

          <ProductFormFields
            values={form.values}
            errors={form.errors}
            onChange={form.onChange}
            categories={form.categories}
            onSuggest={form.suggestDescription}
            suggesting={form.suggesting}
            aiNote={form.aiNote}
          />

          <View className="flex-row gap-2.5 rounded-card bg-leaf-50 p-3.5">
            <Info size={17} color={colors.leaf700} />
            <AppText className="flex-1 text-sm leading-relaxed text-leaf-900">
              AI sẽ kiểm tra ảnh bước đầu ngay khi đăng. Nếu ảnh đại diện đạt chuẩn, sản phẩm sẽ chuyển sang Chờ quản trị
              viên duyệt để mở bán.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <Button
          title={progressText ?? 'Đăng bán'}
          icon={Send}
          loading={create.isPending}
          onPress={submit}
          className="min-h-[48px]"
        />
      </View>

      <ImageSourceSheet visible={sheet} onClose={() => setSheet(false)} onPick={(s) => void choose(s)} />

      <BottomSheet
        visible={selectedImage != null}
        title={selectedIdx === primaryIndex ? 'Ảnh đại diện' : 'Ảnh phụ'}
        onClose={() => setSelectedIdx(null)}
      >
        <View className="gap-3">
          {!!selectedImage && (
            <View className="aspect-[4/3] w-full overflow-hidden rounded-card">
              <Image source={{ uri: selectedImage.uri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
            </View>
          )}
          {selectedIdx != null && selectedIdx !== primaryIndex && (
            <Button title="Đặt làm ảnh đại diện" icon={Star} onPress={() => setAsPrimary(selectedIdx)} />
          )}
          {selectedIdx != null && (
            <Button title="Xoá ảnh này" variant="outline" icon={Trash2} onPress={() => removeImage(selectedIdx)} />
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}
