import { View } from 'react-native'
import { AppText, EmptyState, Skeleton } from '@/components/ui'
import { money } from '@/features/product'
import { WITHDRAW_STATUS_LABEL } from '@/services/wallet.service'
import type { WithdrawResponse, WithdrawStatus } from '@/services/wallet.types'
import { useMyWithdrawals } from '../hooks/useWalletQueries'

function formatDateTime(v?: string | number[] | null) {
  if (!v) return 'Gần đây'
  let d: Date
  if (Array.isArray(v)) {
    d = new Date(v[0], (v[1] || 1) - 1, v[2] || 1, v[3] || 0, v[4] || 0)
  } else {
    d = new Date(v)
  }
  if (Number.isNaN(d.getTime())) return 'Gần đây'
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  return `${time} · ${date}`
}

export function WithdrawHistoryList() {
  const { data: withdrawals, isLoading, isError } = useMyWithdrawals()

  if (isLoading) {
    return (
      <View className="gap-2">
        <Skeleton className="h-20 w-full rounded-card" />
        <Skeleton className="h-20 w-full rounded-card" />
      </View>
    )
  }

  if (isError) {
    return (
      <View className="rounded-card bg-amber-50 p-4">
        <AppText className="text-center text-xs text-amber-800">
          Không thể tải lịch sử rút tiền. Nhấn để thử lại.
        </AppText>
      </View>
    )
  }

  if (!withdrawals || withdrawals.length === 0) {
    return (
      <EmptyState
        title="Chưa có yêu cầu rút tiền"
        description="Bạn chưa tạo lệnh rút tiền nào từ ví này."
      />
    )
  }

  return (
    <View className="gap-3">
      {withdrawals.map((item: WithdrawResponse) => {
        const meta = WITHDRAW_STATUS_LABEL[item.status as WithdrawStatus] ?? {
          label: item.status,
          color: '#64748b',
          bg: '#f1f5f9',
        }
        const maskedAccount =
          item.bankAccountNumber.length > 4
            ? `•••• ${item.bankAccountNumber.slice(-4)}`
            : item.bankAccountNumber

        return (
          <View
            key={item.id}
            className="gap-2 rounded-card border border-line bg-white p-3.5 shadow-xs"
          >
            <View className="flex-row items-start justify-between gap-2">
              <View className="gap-0.5">
                <AppText weight="extrabold" className="text-base text-ink">
                  {money(item.amount)}
                </AppText>
                <AppText className="text-xs text-ink-muted">
                  {formatDateTime(item.createdAt)}
                </AppText>
              </View>
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: meta.bg }}
              >
                <AppText
                  weight="bold"
                  className="text-xs"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </AppText>
              </View>
            </View>

            <View className="rounded-md bg-slate-50 p-2 gap-0.5">
              <AppText weight="medium" className="text-xs text-ink">
                {item.bankName} · {maskedAccount}
              </AppText>
              {Boolean(item.bankAccountHolder || item.bankAccountName) && (
                <AppText className="text-xs text-ink-muted">
                  Chủ TK: {item.bankAccountHolder || item.bankAccountName}
                </AppText>
              )}
            </View>

            {Boolean(item.note) && (
              <AppText className="text-xs italic text-ink-muted">
                Ghi chú: {item.note}
              </AppText>
            )}

            {Boolean(item.adminNote) && (
              <View className="rounded-md bg-rose-50 p-2">
                <AppText className="text-xs text-rose-800">
                  Phản hồi admin: {item.adminNote}
                </AppText>
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}
