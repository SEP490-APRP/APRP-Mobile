import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Gift, ImagePlus, Info, Plus, RefreshCw, Save, Sparkles, TriangleAlert } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ChoiceChips, ErrorState, Skeleton, TextField } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { money } from '@/features/product'
import {
  BUNDLE_LABEL,
  BUNDLE_NAME_MAX,
  BundleItemsEditor,
  bundleItemsFrom,
  bundleSaving,
  digitsOnly,
  emptyBundleForm,
  ImageSourceSheet,
  isBundleKind,
  marketValue,
  MEAL_TYPE_OPTIONS,
  ProductPickerSheet,
  productIdOf,
  productToBundleItem,
  statusKeyOf,
  useBundleDetail,
  useMyShopProducts,
  usePickProductImage,
  useSaveBundle,
  useSuggestDescription,
  validateBundle,
  type BundleFormErrors,
  type BundleFormValues,
  type BundleItem,
} from '@/features/shop'
import type { ProductResponse } from '@/services/product.types'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { UploadFile } from '@/types/upload.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/**
 * Tạo / sửa Combo và Túi mù, chuyển từ ComboBuilder.tsx và BlindBoxTool.tsx bản web.
 * Hai loại dùng chung một màn vì chỉ khác vài ô: combo có bữa ăn, thể loại, vùng; túi mù có ghi chú khẩu phần.
 */
export default function ShopBundleEditor() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>()
  const kind = isBundleKind(params.kind) ? params.kind : 'COMBO'
  const id = Number(params.id) || 0
  const isCombo = kind === 'COMBO'
  const label = BUNDLE_LABEL[kind]

  const products = useMyShopProducts()
  const detail = useBundleDetail(kind, id)
  const save = useSaveBundle(kind)
  const suggest = useSuggestDescription()
  const pick = usePickProductImage()
  const showToast = useUiStore((s) => s.showToast)

  const [values, setValues] = useState<BundleFormValues>(() => emptyBundleForm(kind))
  const [items, setItems] = useState<BundleItem[]>([])
  const [errors, setErrors] = useState<BundleFormErrors>({})
  const [image, setImage] = useState<UploadFile>()
  const [imageUrl, setImageUrl] = useState<string>()
  const [aiNote, setAiNote] = useState(false)
  const [imageSheet, setImageSheet] = useState(false)
  const [picker, setPicker] = useState(false)
  const [loaded, setLoaded] = useState(id === 0)

  const selling = useMemo(
    () => (products.data ?? []).filter((p) => statusKeyOf(p.status) === 'ACTIVE'),
    [products.data],
  )

  // Màn sửa: đổ dữ liệu gói cũ vào form một lần, khi đã có cả gói và kho.
  useEffect(() => {
    if (loaded || !detail.data || !products.data) return
    setValues(detail.data.values)
    setItems(bundleItemsFrom(detail.data.rawItems, products.data))
    setImageUrl(detail.data.imageUrl)
    setLoaded(true)
  }, [loaded, detail.data, products.data])

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/products'))

  const change = (patch: Partial<BundleFormValues>) => {
    setValues((v) => ({ ...v, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      for (const k of Object.keys(patch) as (keyof BundleFormValues)[]) delete next[k]
      if ('totalQuantity' in patch) delete next.items
      return next
    })
    if ('description' in patch) setAiNote(false)
  }

  const editItems = (fn: (prev: BundleItem[]) => BundleItem[]) => {
    setItems(fn)
    setErrors((e) => ({ ...e, items: undefined }))
  }
  const toggleProduct = (p: ProductResponse) =>
    editItems((prev) =>
      prev.some((it) => it.productId === productIdOf(p))
        ? prev.filter((it) => it.productId !== productIdOf(p))
        : [...prev, productToBundleItem(p)],
    )

  const chooseImage = async (source: 'camera' | 'library') => {
    const file = await pick(source)
    if (file) setImage(file)
  }

  const suggestDescription = () => {
    const name = values.name.trim()
    if (!name) return setErrors((e) => ({ ...e, name: `Nhập tên ${label} trước để AI viết mô tả` }))
    suggest.mutate(
      {
        productName: name,
        productType: kind,
        mealType: isCombo ? values.mealType : undefined,
        categoryName: isCombo ? 'Combo món ăn tiện lợi' : 'Hộp mù nông sản',
        origin: values.region || 'Đà Lạt & Lâm Đồng',
        includedItems: items.map((it) => it.productName),
        currentDescription: values.description || undefined,
      },
      {
        onSuccess: (res) => {
          if (!res?.suggestedDescription) return showToast('AI chưa nghĩ ra mô tả, thử lại sau nhé.')
          setValues((v) => ({ ...v, description: res.suggestedDescription }))
          setAiNote(true)
        },
        onError: (err) => showToast(getErrorMessage(err, 'Chưa gợi ý được mô tả lúc này.')),
      },
    )
  }

  const submit = () => {
    const next = validateBundle(kind, values, items, detail.data?.previous)
    setErrors(next)
    if (Object.keys(next).length > 0) return showToast('Kiểm tra lại các ô được đánh dấu đỏ nhé.')
    const name = values.name.trim()
    save.mutate(
      { id: id || undefined, values, items, image, imageUrl },
      {
        onSuccess: () => {
          showToast(id ? `Đã lưu ${label} "${name}".` : `Đã tạo ${label} "${name}" và gửi duyệt.`)
          goBack()
        },
        onError: (err) => {
          const msg = getErrorMessage(err, `Chưa lưu được ${label}, thử lại nhé.`)
          showToast(
            /not agricultural|inappropriate|không phải là nông sản/i.test(msg)
              ? 'Ảnh chưa phải ảnh nông sản hoặc chưa hợp quy định của sàn. Chọn ảnh khác nhé.'
              : msg,
          )
        },
      },
    )
  }

  const header = (
    <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
      <BackButton onPress={goBack} />
      <View className="min-w-0 flex-1">
        <AppText accessibilityRole="header" weight="extrabold" className="text-base">
          {id ? `Sửa ${label}` : isCombo ? 'Tạo combo nông sản' : 'Tạo túi mù'}
        </AppText>
        <AppText numberOfLines={1} className="text-xs text-ink-muted">
          {isCombo
            ? 'Ghép nhiều loại rau củ thành set món ăn tiện lợi'
            : 'Đóng nông sản thành túi bất ngờ, bán nhanh cuối ngày'}
        </AppText>
      </View>
    </View>
  )

  if (id > 0 && !loaded) {
    const failed = detail.isError || products.isError
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        {failed ? (
          <ErrorState
            title={`Không tải được ${label}`}
            onRetry={() => void Promise.all([detail.refetch(), products.refetch()])}
          />
        ) : (
          <View className="gap-4 p-4">
            <Skeleton className="h-40 rounded-panel" />
            <Skeleton className="h-64 rounded-panel" />
          </View>
        )}
      </SafeAreaView>
    )
  }

  const price = Number(values.price) || 0
  const total = Number(values.totalQuantity) || 0
  const market = marketValue(items)
  const saving = bundleSaving(price, market)
  const preview = image?.uri ?? imageUrl

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 p-4 pb-8" keyboardShouldPersistTaps="handled">
          {/* Ảnh đại diện */}
          <Pressable
            onPress={() => setImageSheet(true)}
            accessibilityRole="button"
            accessibilityLabel={preview ? `Đổi ảnh ${label}` : `Thêm ảnh ${label}`}
            className={cn(
              'aspect-[16/9] w-full overflow-hidden rounded-panel',
              preview ? '' : 'border-2 border-dashed border-leaf-200 bg-white',
            )}
          >
            {preview ? (
              <>
                <Image source={{ uri: preview }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                <View className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5">
                  <RefreshCw size={14} color={colors.white} />
                  <AppText weight="bold" className="text-sm text-white">
                    Đổi ảnh
                  </AppText>
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center gap-1.5 px-6">
                {isCombo ? <ImagePlus size={26} color={colors.leaf700} /> : <Gift size={26} color={colors.leaf700} />}
                <AppText weight="bold" className="text-base text-leaf-800">
                  Thêm ảnh {label}
                </AppText>
                <AppText className="text-center text-sm text-ink-muted">
                  {isCombo ? 'Chụp cả set nguyên liệu bày sẵn' : 'Chụp túi đã đóng gói, chưa lộ món bên trong'}
                </AppText>
              </View>
            )}
          </Pressable>

          <TextField
            label={isCombo ? 'Tên combo *' : 'Tên túi mù *'}
            value={values.name}
            onChangeText={(name) => change({ name })}
            placeholder={isCombo ? 'VD: Combo lẩu nấm & rau vườn cuối tuần' : 'VD: Túi mù nông sản giải cứu 5kg'}
            maxLength={BUNDLE_NAME_MAX[kind]}
            error={errors.name}
          />

          <View className="flex-row gap-3">
            <TextField
              label="Giá bán (đ) *"
              value={values.price}
              onChangeText={(v) => change({ price: digitsOnly(v) })}
              keyboardType="number-pad"
              error={errors.price}
              className="flex-1"
            />
            <TextField
              label="Số gói phát hành *"
              value={values.totalQuantity}
              onChangeText={(v) => change({ totalQuantity: digitsOnly(v).slice(0, 5) })}
              keyboardType="number-pad"
              error={errors.totalQuantity}
              className="flex-1"
            />
          </View>

          {isCombo ? (
            <>
              <ChoiceChips
                label="Dành cho bữa"
                options={MEAL_TYPE_OPTIONS}
                value={values.mealType}
                onChange={(mealType) => change({ mealType })}
              />
              {/* Xếp dọc: hai ô nửa bề ngang làm cụt chữ trên máy nhỏ */}
              <TextField
                label="Thể loại"
                value={values.type}
                onChangeText={(type) => change({ type })}
                placeholder="Món lẩu, nấu canh…"
              />
              <TextField
                label="Vùng xuất xứ"
                value={values.region}
                onChangeText={(region) => change({ region })}
                placeholder="Đà Lạt & Lâm Đồng"
              />
            </>
          ) : (
            <TextField
              label="Khẩu phần, trọng lượng"
              value={values.note}
              onChangeText={(note) => change({ note })}
              placeholder="Khoảng 5kg, đủ cho gia đình 3–4 người"
              maxLength={200}
            />
          )}

          <BundleItemsEditor
            label={isCombo ? 'Nguyên liệu trong combo' : 'Nông sản có thể có trong túi'}
            items={items}
            totalQuantity={total}
            previous={detail.data?.previous}
            error={errors.items}
            lockedNote={
              !isCombo && id
                ? 'Hệ thống chưa cho đổi nông sản của túi mù đã đăng. Muốn đổi, hãy tạo túi mới.'
                : undefined
            }
            onAdd={() => setPicker(true)}
            onChangeQty={(pid, q) =>
              q >= 1 && editItems((prev) => prev.map((it) => (it.productId === pid ? { ...it, quantity: q } : it)))
            }
            onRemove={(pid) => editItems((prev) => prev.filter((it) => it.productId !== pid))}
          />

          {market > 0 && (
            <View
              className={cn('flex-row gap-2.5 rounded-card p-3.5', saving.overpriced ? 'bg-amber-50' : 'bg-leaf-50')}
            >
              {saving.overpriced ? (
                <TriangleAlert size={17} color="#b45309" />
              ) : (
                <Info size={17} color={colors.leaf700} />
              )}
              <View className="flex-1 gap-0.5">
                <AppText className="text-sm text-ink">
                  Mua lẻ các món này hết <Text style={{ fontFamily: fontFamily.bold }}>{money(market)}</Text> mỗi gói.
                </AppText>
                <AppText
                  weight="semibold"
                  className={cn('text-sm', saving.overpriced ? 'text-amber-800' : 'text-leaf-800')}
                >
                  {saving.overpriced
                    ? `Giá ${label} đang cao hơn mua lẻ, khách sẽ khó chọn.`
                    : saving.percent > 0
                      ? `Khách tiết kiệm ${saving.percent}% so với mua lẻ.`
                      : 'Giá bằng mua lẻ.'}
                </AppText>
              </View>
            </View>
          )}

          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <AppText weight="semibold" className="text-sm text-ink">
                Mô tả
              </AppText>
              <Pressable
                onPress={suggestDescription}
                disabled={suggest.isPending}
                accessibilityRole="button"
                accessibilityLabel="Nhờ AI gợi ý mô tả"
                className="min-h-[36px] flex-row items-center gap-1.5 rounded-full bg-leaf-50 px-3"
              >
                {suggest.isPending ? (
                  <ActivityIndicator size="small" color={colors.leaf700} />
                ) : (
                  <Sparkles size={15} color={colors.leaf700} />
                )}
                <AppText weight="bold" className="text-sm text-leaf-700">
                  {suggest.isPending ? 'AI đang viết…' : 'AI gợi ý'}
                </AppText>
              </Pressable>
            </View>
            <TextInput
              value={values.description}
              onChangeText={(description) => change({ description })}
              placeholder={
                isCombo
                  ? 'Set nguyên liệu tươi được chọn kỹ cho bữa ăn gia đình…'
                  : 'Túi có gì bất ngờ, vì sao giá tốt…'
              }
              placeholderTextColor={colors.inkSubtle}
              accessibilityLabel="Mô tả"
              multiline
              maxLength={2000}
              textAlignVertical="top"
              className={cn(
                'min-h-[110px] rounded-card border bg-white px-3.5 py-3 text-base text-ink',
                errors.description ? 'border-sale' : 'border-line-strong',
              )}
              style={{ fontFamily: fontFamily.regular }}
            />
            {aiNote && (
              <AppText className="text-xs text-amber-800">
                Mô tả do AI gợi ý. Rà lại nguyên liệu, cách chế biến, khẩu phần cho đúng thực tế trước khi lưu nhé.
              </AppText>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <Button
          title={id ? 'Lưu thay đổi' : `Tạo ${label}`}
          icon={id ? Save : isCombo ? Plus : Gift}
          loading={save.isPending}
          onPress={submit}
          className="min-h-[48px]"
        />
      </View>

      <ImageSourceSheet visible={imageSheet} onClose={() => setImageSheet(false)} onPick={(s) => void chooseImage(s)} />
      <ProductPickerSheet
        visible={picker}
        onClose={() => setPicker(false)}
        products={selling}
        selectedIds={items.map((it) => it.productId)}
        onToggle={toggleProduct}
      />
    </SafeAreaView>
  )
}
