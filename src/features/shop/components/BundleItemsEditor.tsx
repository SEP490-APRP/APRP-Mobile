import { Minus, PackagePlus, Plus, Search, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { AppText, BottomSheet, Button, Checkbox } from '@/components/ui'
import { money, ProduceImage } from '@/features/product'
import type { ProductResponse } from '@/services/product.types'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import {
  checkStock,
  productIdOf,
  productPrice,
  productStock,
  type BundleItem,
  type PreviousBundle,
} from '../utils/bundleForm'
import { productImageOf } from '../utils/shopListings'

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** Danh sách nông sản trong gói: số lượng mỗi gói, cảnh báo thiếu hàng, nút thêm từ kho. */
export function BundleItemsEditor({
  label,
  items,
  totalQuantity,
  previous,
  error,
  onAdd,
  onChangeQty,
  onRemove,
  lockedNote,
}: {
  label: string
  items: readonly BundleItem[]
  totalQuantity: number
  previous?: PreviousBundle
  error?: string
  onAdd: () => void
  onChangeQty: (productId: number, qty: number) => void
  onRemove: (productId: number) => void
  /** Có giá trị khi API không cho đổi danh sách nông sản: chỉ hiện, không sửa. */
  lockedNote?: string
}) {
  const stock = checkStock(items, totalQuantity, previous)
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <AppText weight="semibold" className="text-sm text-ink">
          {label} *
        </AppText>
        <AppText className="text-xs text-ink-muted">{items.length} loại</AppText>
      </View>
      <View className={cn('rounded-card border bg-white', error ? 'border-sale' : 'border-line')}>
        {items.map((it, i) => {
          const s = stock[i]
          return (
            <View key={it.productId} className={cn('gap-1.5 px-3.5 py-3', i > 0 && 'border-t border-line')}>
              <View className="flex-row items-center gap-2">
                <View className="min-w-0 flex-1">
                  <AppText weight="bold" numberOfLines={1} className="text-sm">
                    {it.productName}
                  </AppText>
                  <AppText className="text-xs text-ink-muted">
                    {money(it.price)}/{it.unit}
                  </AppText>
                </View>
                {lockedNote ? (
                  <AppText weight="bold" className="text-sm">
                    × {it.quantity}
                  </AppText>
                ) : (
                  <>
                    <View className="flex-row items-center rounded-full border border-line-strong">
                      <Pressable
                        onPress={() => onChangeQty(it.productId, it.quantity - 1)}
                        disabled={it.quantity <= 1}
                        accessibilityRole="button"
                        accessibilityLabel={`Bớt ${it.productName}`}
                        className={cn('h-9 w-9 items-center justify-center', it.quantity <= 1 && 'opacity-30')}
                      >
                        <Minus size={15} color={colors.ink} />
                      </Pressable>
                      <AppText weight="bold" className="min-w-[28px] text-center text-sm">
                        {it.quantity}
                      </AppText>
                      <Pressable
                        onPress={() => onChangeQty(it.productId, it.quantity + 1)}
                        accessibilityRole="button"
                        accessibilityLabel={`Thêm ${it.productName}`}
                        className="h-9 w-9 items-center justify-center"
                      >
                        <Plus size={15} color={colors.ink} />
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => onRemove(it.productId)}
                      accessibilityRole="button"
                      accessibilityLabel={`Bỏ ${it.productName}`}
                      hitSlop={6}
                      className="h-9 w-8 items-center justify-center"
                    >
                      <X size={16} color={colors.inkSubtle} />
                    </Pressable>
                  </>
                )}
              </View>
              <AppText className={cn('text-xs', s?.short ? 'text-sale' : 'text-ink-muted')}>
                {it.quantity} {it.unit}/gói · cần {s?.needed ?? 0} {it.unit} cho {totalQuantity || 0} gói · kho còn{' '}
                {s?.available ?? 0}
                {s?.short ? ' (thiếu hàng)' : ''}
              </AppText>
            </View>
          )
        })}
        {lockedNote ? (
          <AppText className={cn('px-3.5 py-3 text-xs text-ink-muted', items.length > 0 && 'border-t border-line')}>
            {lockedNote}
          </AppText>
        ) : (
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            className={cn(
              'min-h-[48px] flex-row items-center justify-center gap-2 px-4 active:bg-leaf-50',
              items.length > 0 && 'border-t border-line',
            )}
          >
            <PackagePlus size={18} color={colors.leaf700} />
            <AppText weight="bold" className="text-sm text-leaf-700">
              {items.length ? 'Thêm nông sản khác' : 'Chọn nông sản trong kho'}
            </AppText>
          </Pressable>
        )}
      </View>
      {!!error && <AppText className="text-caption text-sale">{error}</AppText>}
    </View>
  )
}

/** Tấm chọn nông sản đang bán trong kho để đóng vào gói. */
export function ProductPickerSheet({
  visible,
  onClose,
  products,
  selectedIds,
  onToggle,
}: {
  visible: boolean
  onClose: () => void
  products: readonly ProductResponse[]
  selectedIds: readonly number[]
  onToggle: (p: ProductResponse) => void
}) {
  const [query, setQuery] = useState('')
  const list = useMemo(() => {
    const q = fold(query.trim())
    return q ? products.filter((p) => fold(p.productName || p.name || '').includes(q)) : products
  }, [products, query])

  return (
    <BottomSheet
      visible={visible}
      title="Chọn nông sản trong kho"
      subtitle="Chỉ hiện nông sản đang bán"
      onClose={onClose}
      footer={<Button title={`Xong (${selectedIds.length} đã chọn)`} onPress={onClose} className="flex-1" />}
    >
      <View className="gap-3">
        <View className="h-11 flex-row items-center rounded-xl border border-line bg-paper pl-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm nhanh theo tên…"
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Tìm nông sản"
            className="h-full flex-1 px-2 text-sm text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
        </View>
        {list.length === 0 && (
          <AppText className="py-6 text-center text-sm text-ink-muted">
            {products.length ? 'Không có nông sản khớp từ khoá.' : 'Kho chưa có nông sản nào đang bán.'}
          </AppText>
        )}
        {list.map((p) => {
          const id = productIdOf(p)
          const checked = selectedIds.includes(id)
          const name = p.productName || p.name || 'Nông sản'
          return (
            <View key={id} className="flex-row items-center gap-1">
              <Checkbox checked={checked} onChange={() => onToggle(p)} label={name} />
              <Pressable onPress={() => onToggle(p)} accessible={false} className="flex-1 flex-row items-center gap-3">
                <View className="h-11 w-11 overflow-hidden rounded-lg border border-line">
                  <ProduceImage src={productImageOf(p) ?? ''} alt={name} />
                </View>
                <View className="min-w-0 flex-1">
                  <AppText weight="semibold" numberOfLines={1} className="text-sm">
                    {name}
                  </AppText>
                  <AppText className="text-xs text-ink-muted">
                    {money(productPrice(p))}/{p.unit || 'kg'} · còn {productStock(p)} {p.unit || 'kg'}
                  </AppText>
                </View>
              </Pressable>
            </View>
          )
        })}
      </View>
    </BottomSheet>
  )
}
