import type { ReactNode } from 'react'
import { View } from 'react-native'
import { EmptyState, ErrorState } from '@/components/ui'
import type { Product } from '../utils/storefrontProduct'
import { ProductCard, ProductCardSkeleton } from './ProductCard'

export type GridStatus = 'loading' | 'error' | 'success'

type ProductGridProps = {
  products: readonly Product[]
  onAdd: (id: string) => void
  status?: GridStatus
  error?: string
  onRetry?: () => void
  cart?: Readonly<Record<string, number>>
  addingId?: string
  skeletonCount?: number
  empty?: { title: string; description?: string; action?: ReactNode }
}

/** Chia mảng thành các hàng 2 cột; hàng lẻ cuối thêm ô trống để card không giãn cả hàng. */
function pairs<T>(items: readonly T[]): (T | null)[][] {
  const rows: (T | null)[][] = []
  for (let i = 0; i < items.length; i += 2) rows.push([items[i], items[i + 1] ?? null])
  return rows
}

/**
 * Lưới 2 cột không cuộn riêng, dùng cho danh sách ngắn nằm trong ScrollView (VD Trang chủ).
 * Danh sách dài dùng FlatList ở trang Nông sản tươi.
 */
export function ProductGrid({
  products,
  onAdd,
  status = 'success',
  error,
  onRetry,
  cart,
  addingId,
  skeletonCount = 4,
  empty = { title: 'Chưa có nông sản nào', description: 'Vui lòng quay lại sau nhé.' },
}: ProductGridProps) {
  if (status === 'loading') {
    return (
      <View accessibilityLabel="Đang tải nông sản" className="gap-3">
        {pairs(Array.from({ length: skeletonCount }, (_, i) => i)).map((row, r) => (
          <View key={r} className="flex-row gap-3">
            {row.map((cell, c) => (cell === null ? <View key={c} className="flex-1" /> : <ProductCardSkeleton key={c} />))}
          </View>
        ))}
      </View>
    )
  }

  if (status === 'error') return <ErrorState description={error} onRetry={onRetry} />
  if (products.length === 0) return <EmptyState {...empty} />

  return (
    <View className="gap-3">
      {pairs(products).map((row) => (
        <View key={row[0]!.id} className="flex-row gap-3">
          {row.map((p, c) =>
            p ? (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={onAdd}
                inCartQuantity={cart?.[p.id]}
                adding={addingId === p.id}
              />
            ) : (
              <View key={c} className="flex-1" />
            ),
          )}
        </View>
      ))}
    </View>
  )
}
