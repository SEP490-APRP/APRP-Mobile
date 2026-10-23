import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { AlertTriangle, ImagePlus, Save, ShieldAlert, Star, Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, BottomSheet, Button, ConfirmDialog, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  emptyProductForm,
  ImageSourceSheet,
  imageUploadMessage,
  listingStatus,
  ListingStatusChip,
  MAX_PRODUCT_IMAGES,
  ProductFormFields,
  productToForm,
  toProductRequest,
  useDeleteListing,
  useMyShopProducts,
  usePickProductImage,
  useProductForm,
  useProductImageAction,
  useShopProductImages,
  useUpdateShopProduct,
} from '@/features/shop'
import type { ProductImageResponse } from '@/services/product.types'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/** Sửa nông sản và quản lý ảnh: gộp EditProductModal và ProductImageGalleryModal bản web vào một màn. */
export default function EditShopProduct() {
  const { id: raw } = useLocalSearchParams<{ id: string }>()
  const id = Number(raw) || 0
  const products = useMyShopProducts()
  const product = products.data?.find((p) => Number(p.productId ?? p.id) === id)
  const form = useProductForm(emptyProductForm())
  const update = useUpdateShopProduct()
  const remove = useDeleteListing()
  const images = useShopProductImages(id)
  const imageAction = useProductImageAction(id)
  const pick = usePickProductImage()
  const showToast = useUiStore((s) => s.showToast)
  const [sheet, setSheet] = useState(false)
  const [selected, setSelected] = useState<ProductImageResponse | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [aiWarning, setAiWarning] = useState<string>()
  const [loaded, setLoaded] = useState(false)

  const { setValues } = form
  useEffect(() => {
    if (product && !loaded) {
      setValues(productToForm(product))
      setLoaded(true)
    }
  }, [product, loaded, setValues])

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/products'))

  if (products.isPending || products.isError || !product) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center px-3 pb-2">
          <BackButton onPress={goBack} />
        </View>
        {products.isPending ? (
          <View className="gap-4 p-4">
            <Skeleton className="h-28 rounded-panel" />
            <Skeleton className="h-64 rounded-panel" />
          </View>
        ) : (
          <ErrorState
            title={products.isError ? 'Không tải được sản phẩm' : 'Không tìm thấy sản phẩm'}
            description={products.isError ? undefined : 'Sản phẩm có thể đã bị xoá.'}
            onRetry={() => void products.refetch()}
          />
        )}
      </SafeAreaView>
    )
  }

  const gallery = images.data ?? []
  const full = gallery.length >= MAX_PRODUCT_IMAGES
  const name = product.productName || product.name || 'Nông sản'

  const addImage = async (source: 'camera' | 'library') => {
    const file = await pick(source)
    if (!file) return
    setAiWarning(undefined)
    imageAction.mutate(
      { kind: 'add', file, isPrimary: gallery.length === 0, displayOrder: gallery.length },
      {
        onSuccess: () => showToast('Đã thêm ảnh. AI đã kiểm tra ảnh là nông sản thật.'),
        onError: (err) => setAiWarning(imageUploadMessage(err, getErrorMessage(err, ''))),
      },
    )
  }

  const imageCommand = (kind: 'primary' | 'delete') => {
    if (!selected) return
    imageAction.mutate(
      { kind, imageId: selected.id },
      {
        onSuccess: () => showToast(kind === 'primary' ? 'Đã đặt làm ảnh đại diện.' : 'Đã xoá ảnh.'),
        onError: (err) => showToast(getErrorMessage(err, 'Chưa cập nhật được ảnh.')),
        onSettled: () => setSelected(null),
      },
    )
  }

  const save = () => {
    if (!form.validate()) return showToast('Kiểm tra lại các ô được đánh dấu đỏ nhé.')
    update.mutate(
      { id, request: toProductRequest(form.values), status: product.status },
      {
        onSuccess: () => {
          showToast(`Đã lưu "${form.values.name.trim()}".`)
          goBack()
        },
        onError: (err) => showToast(getErrorMessage(err, 'Chưa lưu được thay đổi.')),
      },
    )
  }

  const deleteProduct = () =>
    remove.mutate(
      { kind: 'SINGLE', id },
      {
        onSuccess: () => {
          setConfirmDelete(false)
          showToast(`Đã xoá "${name}".`)
          goBack()
        },
        onError: (err) => {
          setConfirmDelete(false)
          showToast(getErrorMessage(err, 'Chưa xoá được sản phẩm.'))
        },
      },
    )

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={goBack} />
        <View className="min-w-0 flex-1">
          <AppText accessibilityRole="header" weight="extrabold" numberOfLines={1} className="text-base">
            Sửa nông sản
          </AppText>
          <AppText className="text-xs text-ink-muted">Mã #{id}</AppText>
        </View>
        <ListingStatusChip {...listingStatus(product.status)} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 p-4 pb-8" keyboardShouldPersistTaps="handled">
          {!!product.rejectReason && (
            <View className="flex-row gap-2.5 rounded-card bg-rose-50 p-3.5">
              <AlertTriangle size={17} color={colors.sale} />
              <View className="flex-1">
                <AppText weight="bold" className="text-sm text-rose-900">
                  Quản trị viên từ chối
                </AppText>
                <AppText className="text-sm text-rose-800">{product.rejectReason}</AppText>
              </View>
            </View>
          )}

          {/* Ảnh sản phẩm */}
          <View className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <AppText weight="semibold" className="text-sm text-ink">
                Ảnh sản phẩm
              </AppText>
              <AppText className="text-xs text-ink-muted">
                {gallery.length}/{MAX_PRODUCT_IMAGES} ảnh · chạm ảnh để đổi ảnh chính
              </AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
              {images.isPending && <Skeleton className="h-28 w-28 rounded-xl" />}
              {gallery.map((img) => {
                const flagged = img.isFlagged || img.isApproved === false
                return (
                  <Pressable
                    key={img.id}
                    onPress={() => setSelected(img)}
                    accessibilityRole="button"
                    accessibilityLabel={img.isPrimary ? 'Ảnh đại diện' : 'Ảnh phụ'}
                    className={cn(
                      'h-28 w-28 overflow-hidden rounded-xl border-2',
                      img.isPrimary ? 'border-leaf-600' : flagged ? 'border-amber-400' : 'border-line',
                    )}
                  >
                    <Image
                      source={{ uri: img.imageUrl }}
                      contentFit="cover"
                      style={{ width: '100%', height: '100%' }}
                    />
                    {img.isPrimary && (
                      <View className="absolute left-1.5 top-1.5 flex-row items-center gap-1 rounded-full bg-leaf-700 px-2 py-0.5">
                        <Star size={11} color={colors.white} fill={colors.white} />
                        <AppText weight="bold" className="text-xs text-white">
                          Chính
                        </AppText>
                      </View>
                    )}
                    {flagged && (
                      <View className="absolute inset-x-0 bottom-0 flex-row items-center gap-1 bg-amber-500/90 px-1.5 py-1">
                        <ShieldAlert size={12} color={colors.white} />
                        <AppText weight="bold" className="text-xs text-white">
                          Chờ duyệt
                        </AppText>
                      </View>
                    )}
                  </Pressable>
                )
              })}
              {!full && (
                <Pressable
                  onPress={() => setSheet(true)}
                  disabled={imageAction.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Thêm ảnh"
                  className="h-28 w-28 items-center justify-center gap-1 rounded-xl border-2 border-dashed border-leaf-200 bg-white"
                >
                  {imageAction.isPending && imageAction.variables?.kind === 'add' ? (
                    <>
                      <ActivityIndicator color={colors.leaf700} />
                      <AppText className="text-xs text-ink-muted">AI đang xem…</AppText>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={22} color={colors.leaf700} />
                      <AppText weight="bold" className="text-sm text-leaf-700">
                        Thêm ảnh
                      </AppText>
                    </>
                  )}
                </Pressable>
              )}
            </ScrollView>
            {!!aiWarning && (
              <View className="flex-row gap-2 rounded-xl bg-amber-50 p-3">
                <ShieldAlert size={16} color="#b45309" />
                <AppText className="flex-1 text-sm text-amber-900">{aiWarning}</AppText>
              </View>
            )}
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
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="flex-row gap-2 border-t border-line bg-white px-4 pb-2 pt-3">
        <Pressable
          onPress={() => setConfirmDelete(true)}
          accessibilityRole="button"
          accessibilityLabel="Xoá sản phẩm"
          className="min-h-[48px] w-14 items-center justify-center rounded-card border border-line active:bg-rose-50"
        >
          <Trash2 size={18} color={colors.sale} />
        </Pressable>
        <Button
          title="Lưu thay đổi"
          icon={Save}
          loading={update.isPending}
          onPress={save}
          className="min-h-[48px] flex-1"
        />
      </View>

      <ImageSourceSheet visible={sheet} onClose={() => setSheet(false)} onPick={(s) => void addImage(s)} />

      <BottomSheet
        visible={selected != null}
        title={selected?.isPrimary ? 'Ảnh đại diện' : 'Ảnh phụ'}
        subtitle={selected?.flagReason || undefined}
        onClose={() => setSelected(null)}
      >
        <View className="gap-3">
          {!!selected && (
            <View className="aspect-[4/3] w-full overflow-hidden rounded-card">
              <Image source={{ uri: selected.imageUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
            </View>
          )}
          {!selected?.isPrimary && !selected?.isFlagged && selected?.isApproved !== false && (
            <Button
              title="Đặt làm ảnh đại diện"
              icon={Star}
              loading={imageAction.isPending && imageAction.variables?.kind === 'primary'}
              onPress={() => imageCommand('primary')}
            />
          )}
          <Button
            title="Xoá ảnh này"
            variant="outline"
            icon={Trash2}
            disabled={gallery.length <= 1}
            loading={imageAction.isPending && imageAction.variables?.kind === 'delete'}
            onPress={() => imageCommand('delete')}
          />
          {gallery.length <= 1 && (
            <AppText className="text-center text-xs text-ink-muted">Sản phẩm cần giữ ít nhất một ảnh.</AppText>
          )}
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={confirmDelete}
        title={`Xoá "${name}"?`}
        message="Tin đăng sẽ bị gỡ khỏi chợ và không khôi phục được. Đơn đã đặt trước đó vẫn giữ nguyên."
        confirmLabel="Xoá tin"
        cancelLabel="Giữ lại"
        destructive
        loading={remove.isPending}
        onConfirm={deleteProduct}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  )
}
