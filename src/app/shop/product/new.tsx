import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Camera, Info, RefreshCw, Send } from 'lucide-react-native'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  emptyProductForm,
  ImageSourceSheet,
  imageUploadMessage,
  ProductFormFields,
  toProductRequest,
  useCreateShopProduct,
  usePickProductImage,
  useProductForm,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { UploadFile } from '@/types/upload.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/** Đăng bán nông sản mới, chuyển từ pages/farmer/AddProduct.tsx. */
export default function NewShopProduct() {
  const form = useProductForm(emptyProductForm())
  const create = useCreateShopProduct()
  const pick = usePickProductImage()
  const showToast = useUiStore((s) => s.showToast)
  const [image, setImage] = useState<UploadFile>()
  const [sheet, setSheet] = useState(false)
  const [imageError, setImageError] = useState<string>()

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/products'))

  const choose = async (source: 'camera' | 'library') => {
    const file = await pick(source)
    if (file) {
      setImage(file)
      setImageError(undefined)
    }
  }

  const submit = () => {
    const ok = form.validate()
    const missingImage = !image
    setImageError(missingImage ? 'Thêm một ảnh nông sản thật để khách tin tưởng' : undefined)
    if (!ok || missingImage) {
      showToast('Kiểm tra lại các ô được đánh dấu đỏ nhé.')
      return
    }
    const name = form.values.name.trim()
    create.mutate(
      { request: toProductRequest(form.values), image },
      {
        onSuccess: ({ productId, imageError: err }) => {
          if (err) {
            // Sản phẩm đã tạo; mở màn sửa để nhà vườn đổi ảnh khác.
            showToast(`Đã tạo "${name}" nhưng ảnh chưa đạt. ${imageUploadMessage(err, getErrorMessage(err, ''))}`)
            if (productId > 0) router.replace({ pathname: '/shop/product/[id]', params: { id: String(productId) } })
            else goBack()
            return
          }
          showToast(`Đã gửi "${name}". Sản phẩm đang chờ quản trị viên duyệt.`)
          goBack()
        },
        onError: (err) => showToast(getErrorMessage(err, 'Chưa đăng được sản phẩm, thử lại nhé.')),
      },
    )
  }

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
        <ScrollView contentContainerClassName="gap-5 p-4 pb-8" keyboardShouldPersistTaps="handled">
          <View className="gap-1.5">
            <AppText weight="semibold" className="text-sm text-ink">
              Ảnh đại diện *
            </AppText>
            <Pressable
              onPress={() => setSheet(true)}
              accessibilityRole="button"
              accessibilityLabel={image ? 'Đổi ảnh nông sản' : 'Thêm ảnh nông sản'}
              className={cn(
                'aspect-[4/3] w-full overflow-hidden rounded-panel border-2 border-dashed',
                imageError ? 'border-sale bg-sale-soft' : image ? 'border-transparent' : 'border-leaf-200 bg-white',
              )}
            >
              {image ? (
                <>
                  <Image source={{ uri: image.uri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                  <View className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5">
                    <RefreshCw size={14} color={colors.white} />
                    <AppText weight="bold" className="text-sm text-white">
                      Đổi ảnh
                    </AppText>
                  </View>
                </>
              ) : (
                <View className="flex-1 items-center justify-center gap-2 px-6">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-leaf-50">
                    <Camera size={26} color={colors.leaf700} />
                  </View>
                  <AppText weight="bold" className="text-base text-leaf-800">
                    Chụp hoặc chọn ảnh nông sản
                  </AppText>
                  <AppText className="text-center text-sm text-ink-muted">
                    Ảnh thật tại vườn bán chạy hơn. JPEG, PNG, WebP, tối đa 5MB.
                  </AppText>
                </View>
              )}
            </Pressable>
            {!!imageError && <AppText className="text-caption text-sale">{imageError}</AppText>}
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
              Sản phẩm mới ở trạng thái Chờ duyệt. Quản trị viên duyệt xong thì khách mới thấy trên chợ. AI cũng kiểm
              tra ảnh có đúng là nông sản thật.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <Button title="Đăng bán" icon={Send} loading={create.isPending} onPress={submit} className="min-h-[48px]" />
      </View>

      <ImageSourceSheet visible={sheet} onClose={() => setSheet(false)} onPick={(s) => void choose(s)} />
    </SafeAreaView>
  )
}
