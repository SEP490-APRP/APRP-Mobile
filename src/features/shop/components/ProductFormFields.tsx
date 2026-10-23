import { CalendarClock, Sparkles } from 'lucide-react-native'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { AppText, ChoiceChips, TextField } from '@/components/ui'
import { money } from '@/features/product'
import type { CategoryResponse } from '@/services/category.types'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import {
  addDays,
  digitsOnly,
  discountedPrice,
  EXPIRY_PRESETS,
  PRODUCT_UNITS,
  type ProductFormErrors,
  type ProductFormValues,
} from '../utils/productForm'
import { daysUntil } from '../utils/shopListings'

const UNIT_CHOICES = PRODUCT_UNITS.map((u) => ({ value: u, label: u }))

/** Các ô của form đăng bán / sửa nông sản (AddProduct + EditProductModal bản web). */
export function ProductFormFields({
  values,
  errors,
  onChange,
  categories,
  onSuggest,
  suggesting,
  aiNote,
}: {
  values: ProductFormValues
  errors: ProductFormErrors
  onChange: (patch: Partial<ProductFormValues>) => void
  categories: readonly CategoryResponse[]
  onSuggest: () => void
  suggesting: boolean
  aiNote?: boolean
}) {
  const price = Number(values.price) || 0
  const discount = Number(values.discountPercent) || 0
  const days = daysUntil(values.expiryDate)

  return (
    <View className="gap-5">
      <TextField
        label="Tên nông sản *"
        value={values.name}
        onChangeText={(name) => onChange({ name })}
        placeholder="VD: Cà chua bi Đà Lạt hơi méo"
        maxLength={100}
        error={errors.name}
      />

      <View className="gap-1.5">
        <ChoiceChips
          label="Danh mục *"
          options={categories.map((c) => ({ value: String(c.categoryId), label: c.name }))}
          value={values.categoryId ? String(values.categoryId) : ''}
          onChange={(v) => onChange({ categoryId: Number(v) })}
        />
        {categories.length === 0 && <AppText className="text-sm text-ink-muted">Đang tải danh mục…</AppText>}
        {!!errors.categoryId && <AppText className="text-caption text-sale">{errors.categoryId}</AppText>}
      </View>

      <ChoiceChips
        label="Đơn vị bán *"
        options={UNIT_CHOICES}
        value={values.unit}
        onChange={(unit) => onChange({ unit })}
      />

      <View className="flex-row gap-3">
        <TextField
          label={`Giá / ${values.unit} (đ) *`}
          value={values.price}
          onChangeText={(v) => onChange({ price: digitsOnly(v) })}
          keyboardType="number-pad"
          placeholder="35000"
          error={errors.price}
          className="flex-1"
        />
        <TextField
          label={`Số lượng (${values.unit}) *`}
          value={values.stock}
          onChangeText={(v) => onChange({ stock: digitsOnly(v) })}
          keyboardType="number-pad"
          placeholder="50"
          error={errors.stock}
          className="flex-1"
        />
      </View>

      <View className="gap-1.5">
        <View className="flex-row gap-3">
          <TextField
            label="Giảm giá (%)"
            value={values.discountPercent}
            onChangeText={(v) => onChange({ discountPercent: digitsOnly(v).slice(0, 3) })}
            keyboardType="number-pad"
            placeholder="0"
            error={errors.discountPercent}
            className="w-28"
          />
          <View className="flex-1 justify-end pb-1">
            {price > 0 && (
              <View className="rounded-card bg-leaf-50 px-3 py-2">
                <AppText className="text-xs text-ink-muted">Khách thấy giá</AppText>
                <AppText weight="extrabold" className="text-base text-leaf-700">
                  {money(discountedPrice(price, discount))}/{values.unit}
                </AppText>
                {discount > 0 && discount <= 100 && (
                  <AppText className="text-xs text-ink-muted">
                    Giá gốc <Text className="line-through">{money(price)}</Text> · giảm {discount}%
                  </AppText>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="gap-2">
        <TextField
          label="Hạn sử dụng *"
          icon={CalendarClock}
          value={values.expiryDate}
          onChangeText={(expiryDate) => onChange({ expiryDate })}
          placeholder="NNNN-TT-NN"
          maxLength={10}
          error={errors.expiryDate}
        />
        <View className="flex-row flex-wrap gap-2">
          {EXPIRY_PRESETS.map((d) => {
            const date = addDays(d)
            const active = values.expiryDate === date
            return (
              <Pressable
                key={d}
                onPress={() => onChange({ expiryDate: date })}
                accessibilityRole="button"
                accessibilityLabel={`Hết hạn sau ${d} ngày`}
                accessibilityState={{ selected: active }}
                className={cn(
                  'rounded-full border px-3 py-1.5',
                  active ? 'border-leaf-700 bg-leaf-50' : 'border-line-strong bg-white',
                )}
              >
                <AppText weight="semibold" className={cn('text-sm', active ? 'text-leaf-800' : 'text-ink-muted')}>
                  +{d} ngày
                </AppText>
              </Pressable>
            )
          })}
        </View>
        {days != null && days >= 0 && !errors.expiryDate && (
          <AppText className="text-xs text-ink-muted">
            {days === 0 ? 'Hết hạn trong hôm nay' : `Còn ${days} ngày trước khi hết hạn`}
          </AppText>
        )}
      </View>

      <View className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <AppText weight="semibold" className="text-sm text-ink">
            Mô tả
          </AppText>
          <Pressable
            onPress={onSuggest}
            disabled={suggesting}
            accessibilityRole="button"
            accessibilityLabel="Nhờ AI gợi ý mô tả"
            className="min-h-[36px] flex-row items-center gap-1.5 rounded-full bg-leaf-50 px-3"
          >
            {suggesting ? (
              <ActivityIndicator size="small" color={colors.leaf700} />
            ) : (
              <Sparkles size={15} color={colors.leaf700} />
            )}
            <AppText weight="bold" className="text-sm text-leaf-700">
              {suggesting ? 'AI đang viết…' : 'AI gợi ý'}
            </AppText>
          </Pressable>
        </View>
        <TextInput
          value={values.description}
          onChangeText={(description) => onChange({ description })}
          placeholder="Nguồn gốc, độ tươi, vì sao hơi méo mà vẫn ngon…"
          placeholderTextColor={colors.inkSubtle}
          accessibilityLabel="Mô tả"
          multiline
          maxLength={2000}
          textAlignVertical="top"
          className={cn(
            'min-h-[120px] rounded-card border bg-white px-3.5 py-3 text-base text-ink',
            errors.description ? 'border-sale' : 'border-line-strong',
          )}
          style={{ fontFamily: fontFamily.regular }}
        />
        {aiNote && (
          <AppText className="text-xs text-amber-800">
            Mô tả do AI gợi ý. Đọc lại và sửa cho đúng nông sản của bạn trước khi lưu nhé.
          </AppText>
        )}
        {!!errors.description && <AppText className="text-caption text-sale">{errors.description}</AppText>}
      </View>
    </View>
  )
}
