import { router, useLocalSearchParams } from 'expo-router'
import { CheckCircle2, Gift, HelpCircle, Package, ShoppingBasket, Store } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useAddProductToCart } from '@/features/cart'
import { ComboImage, discountLabel, soldPercent, useComboDetail, type ComboKind } from '@/features/combo'
import { money, QuantityStepper } from '@/features/product'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const PERKS = [
  'Thu hoạch và đóng gói trong ngày',
  'Giao nhanh 2–4 giờ nội thành',
  'Đổi trả nếu nông sản hư hỏng',
] as const

/** Chi tiết combo / túi mù. Bản web chỉ có thẻ, mobile thêm màn này để xem thành phần trước khi mua. */
export default function ComboDetailScreen() {
  const params = useLocalSearchParams<{ id: string; kind?: string }>()
  const id = Number(params.id)
  const kind: ComboKind = params.kind === 'MYSTERY_BOX' ? 'MYSTERY_BOX' : 'BUILD_COMBO'
  const detail = useComboDetail(kind, id)
  const { addProduct, pendingId } = useAddProductToCart()
  const [qty, setQty] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const back = () => (router.canGoBack() ? router.back() : router.replace('/buyer/combos'))
  const header = (
    <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
      <BackButton onPress={back} />
      <AppText accessibilityRole="header" weight="extrabold" numberOfLines={1} className="flex-1 text-base">
        {kind === 'MYSTERY_BOX' ? 'Túi mù' : 'Combo'}
      </AppText>
    </View>
  )

  if (detail.isPending) return <CapNongLoading message="Đang tải gói nông sản" />
  if (detail.isError || !detail.data) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        <View className="flex-1 justify-center p-5">
          <ErrorState description="Không tải được gói này." onRetry={() => void detail.refetch()} />
        </View>
      </SafeAreaView>
    )
  }

  const { card: c, items } = detail.data
  const mystery = c.kind === 'MYSTERY_BOX'
  const discount = discountLabel(c)
  const soldOut = c.stock <= 0
  const maxQty = Math.max(1, c.stock)

  const refresh = async () => {
    setRefreshing(true)
    await detail.refetch()
    setRefreshing(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {header}
      <ScrollView
        contentContainerClassName="gap-4 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        <View className="aspect-[4/3] bg-leaf-50">
          <ComboImage uri={c.imageUrl} kind={c.kind} alt={c.name} />
          {!!discount && (
            <View className="absolute left-4 top-4 rounded-lg bg-sale px-2.5 py-1">
              <AppText weight="extrabold" className="text-sm text-white">
                {discount}
              </AppText>
            </View>
          )}
        </View>

        <View className="gap-2 px-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <View
              className={cn(
                'flex-row items-center gap-1 rounded-lg px-2.5 py-1',
                mystery ? 'bg-purple-50' : 'bg-leaf-50',
              )}
            >
              {mystery ? <Gift size={13} color="#7c3aed" /> : <Package size={13} color={colors.leaf700} />}
              <AppText weight="bold" className={cn('text-xs', mystery ? 'text-purple-700' : 'text-leaf-800')}>
                {mystery ? 'Túi mù' : 'Combo'}
              </AppText>
            </View>
            <AppText className="text-xs text-ink-muted">
              {c.tag} · {c.portion}
            </AppText>
          </View>
          <AppText weight="extrabold" className="text-2xl leading-tight">
            {c.name}
          </AppText>
          <View className="flex-row flex-wrap items-baseline gap-x-2">
            <AppText weight="extrabold" className="text-2xl text-leaf-800">
              {money(c.price)}
            </AppText>
            {c.original > c.price && (
              <>
                <AppText className="text-sm text-ink-subtle line-through">{money(c.original)}</AppText>
                <AppText weight="bold" className="text-xs text-emerald-700">
                  Tiết kiệm {money(c.original - c.price)}
                </AppText>
              </>
            )}
          </View>
          <View className="gap-1">
            <View className="h-2 overflow-hidden rounded-full bg-line">
              <View className="h-full rounded-full bg-leaf-600" style={{ width: `${soldPercent(c)}%` }} />
            </View>
            <View className="flex-row justify-between">
              <AppText className="text-xs text-ink-muted">Đã bán {c.sold}</AppText>
              <AppText weight="semibold" className={soldOut ? 'text-xs text-sale' : 'text-xs text-leaf-700'}>
                {soldOut ? 'Tạm hết' : `Còn ${c.stock} ${c.unit}`}
              </AppText>
            </View>
          </View>
        </View>

        {!!c.shopId && (
          <Pressable
            onPress={() => router.push({ pathname: '/buyer/shop/[id]', params: { id: String(c.shopId) } })}
            accessibilityRole="link"
            className="mx-4 flex-row items-center gap-3 rounded-panel border border-line bg-white p-4 active:bg-paper"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-leaf-50">
              <Store size={18} color={colors.leaf700} />
            </View>
            <View className="flex-1">
              <AppText weight="bold" className="text-sm">
                {c.shopName || 'Nhà vườn'}
              </AppText>
              <AppText className="text-xs text-ink-muted">Xem cửa hàng</AppText>
            </View>
          </Pressable>
        )}

        <View className="mx-4 gap-2 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="text-sm">
            Giới thiệu
          </AppText>
          <AppText className="text-sm leading-relaxed text-ink-muted">{c.description}</AppText>
        </View>

        <View className="mx-4 gap-2 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="text-sm">
            {mystery ? 'Bên trong túi' : `Trong combo có ${items.length} loại`}
          </AppText>
          {mystery ? (
            <View className="flex-row items-center gap-3 rounded-2xl bg-purple-50 p-3">
              <HelpCircle size={22} color="#7c3aed" />
              <AppText className="flex-1 text-sm leading-relaxed text-purple-900">
                Nông sản trong túi được nhà vườn chọn ngẫu nhiên từ mẻ thu hoạch trong ngày, bạn sẽ biết khi mở túi.
              </AppText>
            </View>
          ) : items.length === 0 ? (
            <AppText className="text-sm text-ink-muted">Nhà vườn chưa cập nhật thành phần.</AppText>
          ) : (
            items.map((it, i) => (
              <View
                key={`${it.productId}-${i}`}
                className={cn('flex-row items-center gap-3 py-2', i > 0 && 'border-t border-line')}
              >
                <View className="h-2 w-2 rounded-full bg-leaf-600" />
                <AppText className="flex-1 text-sm">{it.name}</AppText>
                <AppText weight="semibold" className="text-sm text-ink-muted">
                  {it.quantity} {it.unit || 'phần'}
                </AppText>
              </View>
            ))
          )}
        </View>

        <View className="mx-4 gap-2">
          {PERKS.map((p) => (
            <View key={p} className="flex-row items-center gap-2">
              <CheckCircle2 size={16} color={colors.leaf600} />
              <AppText className="flex-1 text-sm text-ink-muted">{p}</AppText>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-3 border-t border-line bg-white px-4 pt-3">
        <QuantityStepper value={qty} min={1} max={maxQty} unit={mystery ? 'túi' : 'gói'} disabled={soldOut} onChange={setQty} />
        <Button
          title={soldOut ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
          icon={ShoppingBasket}
          disabled={soldOut}
          loading={pendingId === c.id}
          onPress={() =>
            addProduct(c.id, {
              itemType: c.kind,
              quantity: qty,
              successMessage: mystery ? 'Đã thêm túi mù vào giỏ!' : 'Đã thêm combo vào giỏ!',
            })
          }
          className="flex-1"
        />
      </View>
    </SafeAreaView>
  )
}
