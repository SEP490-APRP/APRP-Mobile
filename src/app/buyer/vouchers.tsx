import { router } from 'expo-router'
import { Sparkles, Ticket } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  isPlatformVoucher,
  isShippingVoucher,
  normalizeCode,
  useCheckoutVouchers,
  useCollectVoucher,
  type CheckoutVoucher,
} from '@/features/checkout'
import { voucherLabels } from '@/features/voucher'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

type Kind = 'ALL' | 'SHIPPING' | 'PLATFORM' | 'SHOP'

const kindOf = (v: CheckoutVoucher): Exclude<Kind, 'ALL'> =>
  isShippingVoucher(v) ? 'SHIPPING' : isPlatformVoucher(v) ? 'PLATFORM' : 'SHOP'

const KIND_STYLE = {
  SHIPPING: { strip: 'bg-blue-600', chip: 'bg-blue-100', chipText: 'text-blue-700', label: 'Freeship' },
  PLATFORM: { strip: 'bg-purple-600', chip: 'bg-purple-100', chipText: 'text-purple-700', label: 'Toàn sàn' },
  SHOP: { strip: 'bg-amber-500', chip: 'bg-amber-100', chipText: 'text-amber-800', label: 'Shop' },
} as const

const formatDate = (value?: unknown) => {
  if (Array.isArray(value)) return `${value[2]}/${value[1]}/${value[0]}`
  if (typeof value !== 'string' || !value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('vi-VN')
}

/** Kho voucher, chuyển từ MyVouchersPage bản web: nhập mã, lọc theo loại, lưu mã công khai. */
export default function VouchersScreen() {
  const vouchersQuery = useCheckoutVouchers()
  const collect = useCollectVoucher()
  const showToast = useUiStore((s) => s.showToast)
  const [kind, setKind] = useState<Kind>('ALL')
  const [code, setCode] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const vouchers = vouchersQuery.data ?? []
  const counts = useMemo(() => {
    const c = { ALL: vouchers.length, SHIPPING: 0, PLATFORM: 0, SHOP: 0 }
    vouchers.forEach((v) => c[kindOf(v)]++)
    return c
  }, [vouchers])
  // Mã đã nằm trong ví lên trước.
  const list = vouchers
    .filter((v) => kind === 'ALL' || kindOf(v) === kind)
    .sort((a, b) => Number(!!b.isCollected) - Number(!!a.isCollected))

  const save = (raw: string, after?: () => void) => {
    const c = normalizeCode(raw)
    if (!c) return
    collect.mutate(c, {
      onSuccess: () => {
        showToast(`Đã lưu mã ${c} vào kho voucher.`)
        after?.()
      },
      onError: (err) => showToast(getErrorMessage(err, 'Mã không hợp lệ, đã hết lượt hoặc đã hết hạn.')),
    })
  }

  const use = (v: CheckoutVoucher) =>
    v.shopId && kindOf(v) === 'SHOP'
      ? router.push({ pathname: '/buyer/shop/[id]', params: { id: String(v.shopId) } })
      : router.navigate('/buyer/fresh')

  const refresh = async () => {
    setRefreshing(true)
    await vouchersQuery.refetch()
    setRefreshing(false)
  }

  const tabs: { key: Kind; label: string }[] = [
    { key: 'ALL', label: `Tất cả (${counts.ALL})` },
    { key: 'SHIPPING', label: `Freeship (${counts.SHIPPING})` },
    { key: 'PLATFORM', label: `Toàn sàn (${counts.PLATFORM})` },
    { key: 'SHOP', label: `Shop (${counts.SHOP})` },
  ]

  const top = (
    <View className="gap-4 pb-2">
      <View className="gap-3 rounded-panel border border-emerald-100 bg-white p-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color="#f59e0b" />
          <AppText weight="bold" className="text-sm">
            Nhập mã nhận thêm ưu đãi
          </AppText>
        </View>
        <View className="flex-row gap-2">
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            placeholder="VD: CAPNONG10K"
            placeholderTextColor={colors.inkSubtle}
            autoCapitalize="characters"
            accessibilityLabel="Mã voucher"
            className="min-h-[48px] flex-1 rounded-xl border border-line-strong bg-paper px-3.5 text-base text-ink"
            style={{ fontFamily: fontFamily.semibold }}
          />
          <Button
            title="Lưu mã"
            loading={collect.isPending && collect.variables === normalizeCode(code)}
            disabled={!code.trim()}
            onPress={() => save(code, () => setCode(''))}
            className="min-h-[48px]"
          />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {tabs.map((t) => {
          const active = t.key === kind
          return (
            <Pressable
              key={t.key}
              onPress={() => setKind(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={cn('h-9 items-center justify-center rounded-full border px-4', active ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white')}
            >
              <AppText weight="semibold" className={cn('text-sm', active ? 'text-white' : 'text-ink-muted')}>
                {t.label}
              </AppText>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer/account'))} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Kho voucher của tôi
        </AppText>
      </View>
      {vouchersQuery.isPending ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-28 w-full rounded-panel" />
          <Skeleton className="h-28 w-full rounded-panel" />
        </View>
      ) : vouchersQuery.isError ? (
        <View className="flex-1 justify-center p-4">
          <ErrorState onRetry={() => void vouchersQuery.refetch()} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(v) => normalizeCode(v.voucherCode)}
          ListHeaderComponent={top}
          contentContainerClassName="gap-3 p-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Ticket size={30} color={colors.leaf600} />}
              title="Chưa có voucher"
              description="Lưu voucher ở trang cửa hàng hoặc nhập mã bạn nhận được."
            />
          }
          renderItem={({ item }) => {
            const k = kindOf(item)
            const style = KIND_STYLE[k]
            const { discount, condition } = voucherLabels(item)
            const upper = normalizeCode(item.voucherCode)
            return (
              <View className="flex-row overflow-hidden rounded-panel border border-line bg-white">
                <View className={cn('w-2', style.strip)} />
                <View className="flex-1 gap-1 p-4">
                  <View className="flex-row items-center gap-2">
                    <View className={cn('rounded-md px-2 py-0.5', style.chip)}>
                      <AppText weight="bold" className={cn('text-xs', style.chipText)}>
                        {style.label}
                      </AppText>
                    </View>
                    <AppText weight="bold" className="text-xs uppercase text-ink-muted">
                      {item.voucherCode}
                    </AppText>
                  </View>
                  <AppText weight="extrabold" className="text-lg">
                    {discount}
                  </AppText>
                  <AppText className="text-xs text-ink-muted">{condition}</AppText>
                  <View className="mt-1 flex-row items-center justify-between">
                    <AppText className="text-xs text-ink-subtle">HSD: {formatDate(item.expiryDate)}</AppText>
                    {item.isCollected ? (
                      <Button title="Dùng ngay" variant="outline" onPress={() => use(item)} className="min-h-[40px] px-4" />
                    ) : (
                      <Button
                        title="Lưu"
                        loading={collect.isPending && collect.variables === upper}
                        onPress={() => save(upper)}
                        className="min-h-[40px] px-5"
                      />
                    )}
                  </View>
                </View>
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
