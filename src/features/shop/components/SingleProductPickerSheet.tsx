import { Check, Search, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { AppText, BottomSheet } from '@/components/ui'
import { money, ProduceImage } from '@/features/product'
import type { ProductResponse } from '@/services/product.types'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import { productIdOf, productPrice, productStock } from '../utils/bundleForm'
import { productImageOf } from '../utils/shopListings'

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

export function SingleProductPickerSheet({
  visible,
  onClose,
  products,
  selectedId,
  onSelect,
}: {
  visible: boolean
  onClose: () => void
  products: readonly ProductResponse[]
  selectedId?: number | null
  onSelect: (productId: number | null) => void
}) {
  const [query, setQuery] = useState('')
  const list = useMemo(() => {
    const q = fold(query.trim())
    return q ? products.filter((p) => fold(p.productName || p.name || '').includes(q)) : products
  }, [products, query])

  const handleSelect = (id: number) => {
    onSelect(selectedId === id ? null : id)
    onClose()
  }

  return (
    <BottomSheet
      visible={visible}
      title="Đính kèm nông sản vào bài"
      subtitle="Chọn 1 nông sản đang bán để người đọc bấm xem ngay"
      onClose={onClose}
    >
      <View className="gap-3 pb-6">
        <View className="h-11 flex-row items-center rounded-xl border border-line bg-paper pl-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm nhanh nông sản theo tên…"
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Tìm nông sản"
            className="h-full flex-1 px-2 text-sm text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')} className="p-2.5">
              <X size={15} color={colors.inkSubtle} />
            </Pressable>
          )}
        </View>

        {list.length === 0 && (
          <AppText className="py-6 text-center text-sm text-ink-muted">
            {products.length ? 'Không có nông sản khớp từ khoá.' : 'Vườn chưa có nông sản nào đang mở bán.'}
          </AppText>
        )}

        <ScrollView className="max-h-[360px]" showsVerticalScrollIndicator={false}>
          <View className="gap-2">
            {list.map((p) => {
              const id = productIdOf(p)
              const selected = selectedId === id
              const name = p.productName || p.name || 'Nông sản'
              const price = productPrice(p)
              const unit = p.unit || 'kg'
              const img = productImageOf(p) ?? ''

              return (
                <Pressable
                  key={id}
                  onPress={() => handleSelect(id)}
                  className={cn(
                    'flex-row items-center gap-3 rounded-2xl border p-2.5 transition-all',
                    selected ? 'border-leaf-700 bg-leaf-50' : 'border-line bg-white active:bg-paper',
                  )}
                >
                  <View className="h-14 w-14 overflow-hidden rounded-xl border border-line bg-stone-100">
                    <ProduceImage src={img} alt={name} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <AppText weight="bold" numberOfLines={1} className="text-sm text-ink">
                      {name}
                    </AppText>
                    <AppText className="mt-0.5 text-xs text-rose-600 font-bold">
                      {money(price)}/{unit}
                    </AppText>
                    <AppText className="text-[11px] text-ink-muted">
                      Còn {productStock(p)} {unit}
                    </AppText>
                  </View>
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-full border',
                      selected ? 'border-leaf-700 bg-leaf-700' : 'border-line-strong bg-white',
                    )}
                  >
                    {selected && <Check size={14} color="#ffffff" />}
                  </View>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  )
}
