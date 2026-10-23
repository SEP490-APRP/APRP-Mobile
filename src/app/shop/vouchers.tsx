import { router } from 'expo-router'
import { Pause, Play, Plus, TicketPercent, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { formatStoryDate } from '@/features/blog/utils/storyContent'
import {
  canDeleteVoucher,
  useShopVoucherAction,
  useShopVouchers,
  VOUCHER_STATE_LABEL,
  voucherState,
  type VoucherState,
} from '@/features/shop'
import { voucherLabels } from '@/features/voucher/components/VoucherCard'
import type { VoucherResponse } from '@/services/voucher.types'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

const STATE_CHIP: Record<VoucherState, string> = {
  RUNNING: 'bg-leaf-50 text-leaf-800',
  PAUSED: 'bg-gray-100 text-gray-700',
  EXPIRED: 'bg-rose-50 text-rose-800',
  USED_UP: 'bg-amber-50 text-amber-800',
}

/** Mã giảm giá của gian hàng, chuyển từ pages/farmer/Vouchers.tsx. */
export default function ShopVouchers() {
  const vouchers = useShopVouchers()
  const action = useShopVoucherAction()
  const showToast = useUiStore((s) => s.showToast)
  const [pendingDelete, setPendingDelete] = useState<VoucherResponse | null>(null)

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/account'))
  const busyId = action.isPending ? action.variables?.id : undefined

  const toggle = (v: VoucherResponse) =>
    action.mutate(
      { id: v.voucherId, action: 'toggle' },
      {
        onSuccess: () =>
          showToast(v.active === false ? `Đã mở lại mã ${v.voucherCode}.` : `Đã tạm dừng mã ${v.voucherCode}.`),
        onError: (err) => showToast(getErrorMessage(err, 'Chưa đổi được trạng thái mã.')),
      },
    )

  const remove = () => {
    if (!pendingDelete) return
    const { voucherId, voucherCode } = pendingDelete
    action.mutate(
      { id: voucherId, action: 'delete' },
      {
        onSuccess: () => showToast(`Đã xoá mã ${voucherCode}.`),
        onError: (err) => showToast(getErrorMessage(err, 'Chưa xoá được mã.')),
        onSettled: () => setPendingDelete(null),
      },
    )
  }

  const list = vouchers.data ?? []
  const running = list.filter((v) => voucherState(v) === 'RUNNING').length

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={goBack} />
        <View className="min-w-0 flex-1">
          <AppText accessibilityRole="header" weight="extrabold" className="text-base">
            Mã giảm giá của vườn
          </AppText>
          <AppText className="text-xs text-ink-muted">
            {vouchers.data ? `${running} mã đang chạy · ${list.length} mã` : 'Thu hút khách mua nông sản của bạn'}
          </AppText>
        </View>
      </View>

      <FlatList
        data={vouchers.isPending || vouchers.isError ? [] : list}
        keyExtractor={(v) => String(v.voucherId)}
        contentContainerClassName="gap-3 p-4 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={vouchers.isRefetching}
            onRefresh={() => void vouchers.refetch()}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
        ListEmptyComponent={
          vouchers.isPending ? (
            <View className="gap-3">
              <Skeleton className="h-32 rounded-panel" />
              <Skeleton className="h-32 rounded-panel" />
            </View>
          ) : vouchers.isError ? (
            <ErrorState onRetry={() => void vouchers.refetch()} />
          ) : (
            <EmptyState
              icon={<TicketPercent size={30} color={colors.leaf600} />}
              title="Chưa có mã giảm giá nào"
              description="Tạo mã đầu tiên để kéo khách mới và tăng đơn cho vườn."
            />
          )
        }
        renderItem={({ item: v }) => {
          const state = voucherState(v)
          const { discount, condition } = voucherLabels(v)
          const [chipBg, chipText] = STATE_CHIP[state].split(' ')
          const claimed = v.claimedCount ?? 0
          const busy = busyId === v.voucherId
          return (
            <View
              className={cn(
                'gap-3 rounded-panel border bg-white p-4',
                state === 'RUNNING' ? 'border-line' : 'border-dashed border-line-strong',
              )}
            >
              <View className="flex-row items-start gap-3">
                <View
                  className={cn(
                    'h-12 w-12 items-center justify-center rounded-2xl',
                    state === 'RUNNING' ? 'bg-leaf-50' : 'bg-gray-100',
                  )}
                >
                  <TicketPercent size={22} color={state === 'RUNNING' ? colors.leaf700 : colors.inkSubtle} />
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <AppText weight="extrabold" className="text-base tracking-wide">
                      {v.voucherCode}
                    </AppText>
                    <View className={cn('rounded-full px-2 py-0.5', chipBg)}>
                      <AppText weight="bold" className={cn('text-xs', chipText)}>
                        {VOUCHER_STATE_LABEL[state]}
                      </AppText>
                    </View>
                  </View>
                  <AppText weight="bold" className="text-sm text-leaf-700">
                    {discount}
                  </AppText>
                  <AppText className="text-xs text-ink-muted">{condition}</AppText>
                </View>
              </View>

              <View className="gap-1.5">
                <View className="h-1.5 overflow-hidden rounded-full bg-paper">
                  <View
                    className="h-full rounded-full bg-leaf-600"
                    style={{ width: `${v.claimLimit ? Math.min(100, (claimed / v.claimLimit) * 100) : 0}%` }}
                  />
                </View>
                <AppText className="text-xs text-ink-muted">
                  Đã lưu {claimed}/{v.claimLimit ?? '∞'} · đã dùng {v.usedCount ?? 0} · mỗi khách {v.perUserLimit ?? 1}{' '}
                  lần · hết hạn {formatStoryDate(v.expiryDate)}
                  {v.isPublic === false ? ' · mã riêng' : ''}
                </AppText>
              </View>

              {state !== 'EXPIRED' && (
                <View className="flex-row gap-2 border-t border-line pt-3">
                  <Pressable
                    onPress={() => toggle(v)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={
                      v.active === false ? `Mở lại mã ${v.voucherCode}` : `Tạm dừng mã ${v.voucherCode}`
                    }
                    className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-leaf-50 active:bg-leaf-100"
                  >
                    {busy && action.variables?.action === 'toggle' ? (
                      <ActivityIndicator size="small" color={colors.leaf700} />
                    ) : v.active === false ? (
                      <Play size={15} color={colors.leaf700} />
                    ) : (
                      <Pause size={15} color={colors.leaf700} />
                    )}
                    <AppText weight="bold" className="text-sm text-leaf-700">
                      {v.active === false ? 'Mở lại' : 'Tạm dừng'}
                    </AppText>
                  </Pressable>
                  {canDeleteVoucher(v) && (
                    <Pressable
                      onPress={() => setPendingDelete(v)}
                      accessibilityRole="button"
                      accessibilityLabel={`Xoá mã ${v.voucherCode}`}
                      className="h-10 w-12 items-center justify-center rounded-xl border border-line active:bg-rose-50"
                    >
                      <Trash2 size={16} color={colors.sale} />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )
        }}
        ListFooterComponent={
          list.length > 0 && list.some((v) => v.active !== false) ? (
            <AppText className="pt-1 text-center text-xs text-ink-subtle">
              Muốn xoá mã thì tạm dừng mã đó trước.
            </AppText>
          ) : undefined
        }
      />

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <Button
          title="Tạo mã giảm giá"
          icon={Plus}
          onPress={() => router.push('/shop/voucher-new')}
          className="min-h-[48px]"
        />
      </View>

      <ConfirmDialog
        visible={pendingDelete != null}
        title={`Xoá mã ${pendingDelete?.voucherCode ?? ''}?`}
        message="Mã sẽ bị xoá vĩnh viễn. Khách đã lưu mã này sẽ không dùng được nữa."
        confirmLabel="Xoá mã"
        cancelLabel="Giữ lại"
        destructive
        loading={action.isPending && action.variables?.action === 'delete'}
        onConfirm={remove}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  )
}
