import { useState, useMemo } from 'react'
import { View, Pressable, ScrollView } from 'react-native'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Gift,
  History,
} from 'lucide-react-native'
import { AppText, Skeleton } from '@/components/ui'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import type { WalletTransactionResponse } from '@/services/wallet.types'
import { WALLET_TX_LABEL } from '../utils/topup'

export type TransactionCategory = 'MAIN' | 'HOLD' | 'COMMISSION'

interface MobileWalletTransactionListProps {
  items: WalletTransactionResponse[]
  isLoading?: boolean
  emptyText?: string
  showCommissionTab?: boolean
  showHoldTab?: boolean
}

const money = (n: number) => `${Number(n || 0).toLocaleString('vi-VN')}đ`

export function getTransactionCategory(tx: WalletTransactionResponse): TransactionCategory {
  const typeStr = String(tx.type || '')
  if (
    typeStr === 'REFERRAL_COMMISSION' ||
    (tx.walletType as string) === 'REFERRAL' ||
    tx.description?.toLowerCase().includes('hoa hồng') ||
    tx.description?.toLowerCase().includes('tiếp thị liên kết')
  ) {
    return 'COMMISSION'
  }
  if (
    tx.hold === true ||
    tx.reserve === true ||
    typeStr.includes('HOLD') ||
    typeStr.includes('RESERVE')
  ) {
    return 'HOLD'
  }
  return 'MAIN'
}

export function getTransactionTitle(tx: WalletTransactionResponse): string {
  const typeStr = String(tx.type || '')
  if (typeStr === 'REFERRAL_COMMISSION' || tx.description?.toLowerCase().includes('hoa hồng')) {
    return 'Hoa hồng tiếp thị liên kết'
  }
  if (tx.type === 'BUYER_REFUND' || tx.type === 'ORDER_WALLET_REFUND') {
    return 'Hoàn tiền đơn hàng'
  }
  if (tx.type === 'TOP_UP') {
    return 'Nạp tiền vào ví'
  }
  if (tx.type === 'ORDER_WALLET_PAYMENT') {
    return 'Thanh toán đơn hàng'
  }
  if (tx.type === 'WITHDRAW_REQUESTED' || tx.type === 'WITHDRAWAL') {
    return 'Rút tiền về ngân hàng'
  }
  if (tx.type === 'WITHDRAW_REFUNDED') {
    return 'Hoàn tiền lệnh rút bị từ chối'
  }
  if (
    tx.hold ||
    tx.type === 'SHOP_INCOME_HOLD' ||
    tx.type === 'PLATFORM_INCOME_HOLD' ||
    tx.type === 'SHIPPER_INCOME_HOLD'
  ) {
    if (tx.amount < 0) {
      return 'Admin điều chỉnh tạm giữ'
    }
    return 'Admin tạm giữ tiền'
  }
  if (tx.type === 'HOLD_RELEASED') {
    return 'Giải ngân tiền tạm giữ'
  }
  if (tx.type === 'SHOP_INCOME' || tx.type === 'SHIPPER_INCOME') {
    return 'Tiền được cộng vào ví'
  }
  if (tx.type === 'SHOP_RETURN_SHIPPING_DEDUCT') {
    return 'Thanh toán cước ship hoàn'
  }
  if (tx.type === 'COD_RESERVED') {
    return 'Ký quỹ nhận đơn COD'
  }
  if (tx.type === 'COD_RESERVE_RELEASED') {
    return 'Hoàn trả ký quỹ đơn COD'
  }
  if (tx.amount >= 0) {
    return 'Tiền được cộng vào ví'
  }
  return WALLET_TX_LABEL[tx.type] ?? tx.description ?? 'Giao dịch ví'
}

function formatTxDate(raw?: unknown): string {
  if (!raw) return 'Gần đây'
  let d: Date | null = null
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, day, hh = 0, mm = 0] = raw as number[]
    d = new Date(y, m - 1, day, hh, mm)
  } else if (typeof raw === 'string' || typeof raw === 'number') {
    d = new Date(raw)
  }
  if (!d || Number.isNaN(d.getTime())) return 'Gần đây'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function MobileWalletTransactionList({
  items,
  isLoading,
  emptyText = 'Chưa có giao dịch biến động nào.',
  showCommissionTab = false,
  showHoldTab = false,
}: MobileWalletTransactionListProps) {
  const [openId, setOpenId] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState<'ALL' | TransactionCategory>('ALL')

  // Đếm số lượng theo danh mục
  const { mainCount, holdCount, commissionCount } = useMemo(() => {
    let main = 0
    let hold = 0
    let commission = 0
    for (const item of items) {
      const cat = getTransactionCategory(item)
      if (cat === 'HOLD') hold++
      else if (cat === 'COMMISSION') commission++
      else main++
    }
    return { mainCount: main, holdCount: hold, commissionCount: commission }
  }, [items])

  // Lọc theo tab
  const filteredItems = useMemo(() => {
    if (filterCategory === 'ALL') return items
    return items.filter((tx) => getTransactionCategory(tx) === filterCategory)
  }, [items, filterCategory])

  if (isLoading) {
    return (
      <View className="gap-3 py-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </View>
    )
  }

  return (
    <View className="gap-3">
      {/* BỘ LỌC PHÂN LOẠI DẠNG PILLS (Cuộn ngang êm ái trên Mobile) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
        className="py-1"
      >
        {/* Tất cả */}
        <Pressable
          onPress={() => setFilterCategory('ALL')}
          className={cn(
            'flex-row items-center rounded-full px-3.5 py-1.5 border',
            filterCategory === 'ALL'
              ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
              : 'bg-slate-100 border-transparent',
          )}
        >
          <AppText
            weight="bold"
            className={cn('text-xs', filterCategory === 'ALL' ? 'text-emerald-800' : 'text-slate-600')}
          >
            Tất cả ({items.length})
          </AppText>
        </Pressable>

        {/* Ví chính (Xanh lục) */}
        <Pressable
          onPress={() => setFilterCategory('MAIN')}
          className={cn(
            'flex-row items-center rounded-full px-3.5 py-1.5 border',
            filterCategory === 'MAIN'
              ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
              : 'bg-slate-100 border-transparent',
          )}
        >
          <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-600" />
          <AppText
            weight="bold"
            className={cn('text-xs', filterCategory === 'MAIN' ? 'text-emerald-800' : 'text-slate-600')}
          >
            Ví chính ({mainCount})
          </AppText>
        </Pressable>

        {/* Ví tạm giữ (Cam/Hổ phách) */}
        {(showHoldTab || holdCount > 0) && (
          <Pressable
            onPress={() => setFilterCategory('HOLD')}
            className={cn(
              'flex-row items-center rounded-full px-3.5 py-1.5 border',
              filterCategory === 'HOLD'
                ? 'bg-amber-100 border-amber-500 shadow-2xs'
                : 'bg-amber-50/70 border-amber-200/50',
            )}
          >
            <View className="mr-1.5 h-2 w-2 rounded-full bg-amber-600" />
            <AppText
              weight="bold"
              className={cn('text-xs', filterCategory === 'HOLD' ? 'text-amber-900' : 'text-amber-800')}
            >
              Ví tạm giữ ({holdCount})
            </AppText>
          </Pressable>
        )}

        {/* Ví hoa hồng (Xanh dương) */}
        {(showCommissionTab || commissionCount > 0) && (
          <Pressable
            onPress={() => setFilterCategory('COMMISSION')}
            className={cn(
              'flex-row items-center rounded-full px-3.5 py-1.5 border',
              filterCategory === 'COMMISSION'
                ? 'bg-blue-100 border-blue-500 shadow-2xs'
                : 'bg-blue-50/70 border-blue-200/50',
            )}
          >
            <View className="mr-1.5 h-2 w-2 rounded-full bg-blue-600" />
            <AppText
              weight="bold"
              className={cn('text-xs', filterCategory === 'COMMISSION' ? 'text-blue-900' : 'text-blue-800')}
            >
              Ví hoa hồng ({commissionCount})
            </AppText>
          </Pressable>
        )}
      </ScrollView>

      {/* DANH SÁCH GIAO DỊCH */}
      {filteredItems.length === 0 ? (
        <View className="items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-paper py-10 px-4">
          <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <History size={20} color={colors.inkSubtle} />
          </View>
          <AppText weight="bold" className="text-sm text-ink">
            Chưa có giao dịch
          </AppText>
          <AppText className="mt-1 text-center text-xs text-ink-muted">
            {emptyText}
          </AppText>
        </View>
      ) : (
        <View className="gap-2">
          {filteredItems.map((tx) => {
            const cat = getTransactionCategory(tx)
            const isIn = tx.amount >= 0
            const isHold = cat === 'HOLD'
            const isCommission = cat === 'COMMISSION'
            const title = getTransactionTitle(tx)
            const dateStr = formatTxDate(tx.createdAt)
            const open = openId === tx.id

            // Màu icon & badge
            let iconBg = 'bg-emerald-50'
            let iconColor: string = colors.leaf700
            let badgeBg = 'bg-emerald-50'
            let badgeText = 'text-emerald-800'
            let badgeLabel = 'Ví chính'
            let amountColor = isIn ? 'text-leaf-700' : 'text-sale'

            if (isHold) {
              iconBg = 'bg-amber-100'
              iconColor = '#d97706'
              badgeBg = 'bg-amber-100'
              badgeText = 'text-amber-900'
              badgeLabel = 'Ví tạm giữ'
              amountColor = isIn ? 'text-amber-800' : 'text-amber-700'
            } else if (isCommission) {
              iconBg = 'bg-blue-100'
              iconColor = '#2563eb'
              badgeBg = 'bg-blue-100'
              badgeText = 'text-blue-900'
              badgeLabel = 'Ví hoa hồng'
              amountColor = 'text-blue-700'
            }

            return (
              <View
                key={tx.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs"
              >
                {/* DÒNG TIÊU ĐỀ BẤM ĐƯỢC ĐỂ MỞ/ĐÓNG ACCORDION */}
                <Pressable
                  onPress={() => setOpenId(open ? null : tx.id)}
                  className="flex-row items-center justify-between p-3.5 active:bg-slate-50"
                >
                  <View className="flex-1 flex-row items-center gap-3 pr-2">
                    <View className={cn('h-10 w-10 shrink-0 items-center justify-center rounded-full', iconBg)}>
                      {isHold ? (
                        <Clock size={18} color={iconColor} />
                      ) : isCommission ? (
                        <Gift size={18} color={iconColor} />
                      ) : isIn ? (
                        <ArrowDownLeft size={18} color={iconColor} />
                      ) : (
                        <ArrowUpRight size={18} color={iconColor} />
                      )}
                    </View>

                    <View className="flex-1">
                      <AppText weight="bold" numberOfLines={1} className="text-xs text-ink">
                        {title}
                      </AppText>
                      <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
                        <View className={cn('rounded px-1.5 py-0.5', badgeBg)}>
                          <AppText weight="bold" className={cn('text-[9px]', badgeText)}>
                            {badgeLabel}
                          </AppText>
                        </View>
                        <AppText className="text-[10px] text-ink-muted">{dateStr}</AppText>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1">
                    <View className="items-end">
                      <AppText weight="extrabold" className={cn('text-xs', amountColor)}>
                        {isIn ? '+' : ''}
                        {money(tx.amount)}
                      </AppText>
                      {!isHold && tx.balanceAfter != null && (
                        <AppText className="text-[10px] text-ink-muted">
                          Dư: {money(tx.balanceAfter)}
                        </AppText>
                      )}
                    </View>
                    <View className="ml-1 opacity-60">
                      {open ? (
                        <ChevronUp size={16} color={colors.ink} />
                      ) : (
                        <ChevronDown size={16} color={colors.ink} />
                      )}
                    </View>
                  </View>
                </Pressable>

                {/* KHỐI XỔ XUỐNG CHI TIẾT (ACCORDION) */}
                {open && (
                  <View className="border-t border-slate-100 bg-slate-50/80 p-3.5 gap-2.5">
                    {/* Bảng thông số 2 cột gọn gàng */}
                    <View className="flex-row gap-2">
                      <View className="flex-1 rounded-xl bg-white p-2.5 border border-slate-200/60">
                        <AppText className="text-[10px] text-ink-muted">Ví bị tác động</AppText>
                        <AppText weight="bold" className="mt-0.5 text-xs text-ink">
                          {isHold ? 'Ví tạm giữ' : isCommission ? 'Ví hoa hồng' : 'Ví số dư chính'}
                        </AppText>
                      </View>
                      <View className="flex-1 rounded-xl bg-white p-2.5 border border-slate-200/60">
                        <AppText className="text-[10px] text-ink-muted">Loại biến động</AppText>
                        <AppText weight="bold" className="mt-0.5 text-xs text-ink" numberOfLines={1}>
                          {isHold
                            ? 'Tạm giữ an toàn'
                            : isIn
                              ? 'Cộng tiền vào ví'
                              : 'Trừ tiền số dư'}
                        </AppText>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <View className="flex-1 rounded-xl bg-white p-2.5 border border-slate-200/60">
                        <AppText className="text-[10px] text-ink-muted">Mã bút toán</AppText>
                        <AppText weight="bold" className="mt-0.5 text-xs text-ink">
                          #{tx.id}
                        </AppText>
                      </View>
                      <View className="flex-1 rounded-xl bg-white p-2.5 border border-slate-200/60">
                        <AppText className="text-[10px] text-ink-muted">Đơn hàng liên quan</AppText>
                        <AppText weight="bold" className="mt-0.5 text-xs text-ink">
                          {tx.orderId ? `#${tx.orderId}` : '—'}
                        </AppText>
                      </View>
                    </View>

                    {/* Số dư sau giao dịch */}
                    {tx.balanceAfter != null && (
                      <View className="flex-row items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-200/60">
                        <AppText className="text-[11px] text-ink-muted">Số dư sau bút toán:</AppText>
                        <AppText weight="extrabold" className="text-xs text-ink">
                          {money(tx.balanceAfter)}
                        </AppText>
                      </View>
                    )}

                    {/* Tạm giữ sau giao dịch */}
                    {tx.frozenAfter != null && (
                      <View className="flex-row items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-200/60">
                        <AppText className="text-[11px] text-amber-800">Tạm giữ sau bút toán:</AppText>
                        <AppText weight="extrabold" className="text-xs text-amber-800">
                          {money(tx.frozenAfter)}
                        </AppText>
                      </View>
                    )}

                    {/* Ý nghĩa giải thích */}
                    <View className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-200/60">
                      <AppText weight="bold" className="text-[11px] text-emerald-900">
                        Ý nghĩa khoản tiền:
                      </AppText>
                      <AppText className="mt-1 text-[11px] text-emerald-800 leading-relaxed">
                        {isHold
                          ? 'Khoản tiền này thuộc diện tạm giữ 24h. Sẽ tự động giải ngân vào số dư khả dụng khi đơn hàng hoàn tất hoặc đổi trả xong.'
                          : isCommission
                            ? 'Tiền hoa hồng nhận được từ tiếp thị liên kết khi người mua hoàn tất đơn hàng qua link giới thiệu.'
                            : 'Khoản tiền này tác động trực tiếp vào số dư ví khả dụng của bạn (có thể dùng để rút tiền về ngân hàng hoặc thanh toán ngay).'}
                      </AppText>
                    </View>

                    {/* Ghi chú chi tiết nếu có */}
                    {!!tx.description && (
                      <View className="rounded-xl bg-white p-2.5 border border-slate-200/60">
                        <AppText weight="bold" className="text-[11px] text-ink-muted">
                          Ghi chú hệ thống:
                        </AppText>
                        <AppText className="mt-0.5 text-[11px] text-ink">
                          {tx.description}
                        </AppText>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
