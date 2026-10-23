import { Check, X } from 'lucide-react-native'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { useCategories } from '../hooks/useProductQueries'
import { ALL_CATEGORIES, CATEGORIES, PRICE_RANGES, type Filters } from '../utils/filters'

type Option<T extends string> = { readonly id: T; readonly label: string }

function RadioGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={legend} className="gap-1">
      <AppText weight="bold" className="mb-1 text-xs uppercase tracking-wider text-ink-muted">
        {legend}
      </AppText>
      {options.map((o) => {
        const checked = o.id === value
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            onPress={() => onChange(o.id)}
            className={cn(
              'min-h-[44px] flex-row items-center gap-2.5 rounded-lg px-3',
              checked ? 'bg-leaf-50' : 'active:bg-paper',
            )}
          >
            <View
              className={cn(
                'h-5 w-5 items-center justify-center rounded-full border-2',
                checked ? 'border-leaf-600' : 'border-line-strong',
              )}
            >
              {checked && <View className="h-2.5 w-2.5 rounded-full bg-leaf-600" />}
            </View>
            <AppText
              weight={checked ? 'bold' : 'regular'}
              className={cn('flex-1 text-sm', checked ? 'text-leaf-800' : 'text-ink-muted')}
            >
              {o.label}
            </AppText>
            {checked && <Check size={15} color={colors.leaf600} />}
          </Pressable>
        )
      })}
    </View>
  )
}

/** Bộ lọc dạng tấm trượt từ dưới lên, thay cho Drawer + FilterPanel của bản web. */
export function FilterSheet({
  visible,
  filters,
  resultCount,
  onChange,
  onReset,
  onClose,
}: {
  visible: boolean
  filters: Filters
  resultCount: number
  onChange: (next: Filters) => void
  onReset: () => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const { data: apiCategories = [] } = useCategories()
  const categoryOptions: readonly Option<string>[] =
    apiCategories.length > 0
      ? [{ id: ALL_CATEGORIES, label: 'Tất cả nông sản' }, ...apiCategories.map((c) => ({ id: c.name, label: c.name }))]
      : CATEGORIES

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Đóng bộ lọc" className="flex-1 bg-black/40" onPress={onClose} />
      <View className="max-h-[80%] rounded-t-panel bg-white" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="flex-row items-center justify-between border-b border-line px-5 py-4">
          <AppText weight="extrabold" className="text-lg">
            Bộ lọc sản phẩm
          </AppText>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-paper"
          >
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerClassName="gap-6 px-5 py-4">
          <RadioGroup
            legend="Danh mục"
            options={categoryOptions}
            value={filters.category}
            onChange={(category) => onChange({ ...filters, category })}
          />
          <RadioGroup
            legend="Khoảng giá"
            options={PRICE_RANGES}
            value={filters.price}
            onChange={(price) => onChange({ ...filters, price })}
          />
        </ScrollView>
        <View className="flex-row gap-3 border-t border-line px-5 pt-3">
          <Button title="Đặt lại" variant="outline" onPress={onReset} className="flex-1" />
          <Button title={`Xem ${resultCount} sản phẩm`} onPress={onClose} className="flex-[2]" />
        </View>
      </View>
    </Modal>
  )
}
