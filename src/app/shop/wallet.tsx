import { router } from 'expo-router'
import {
  ArrowDownToLine,
  ArrowUpRight,
  Coins,
  Landmark,
  RefreshCw,
  TrendingUp,
  Wallet as WalletIcon,
  X,
} from 'lucide-react-native'
import { useState } from 'react'
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { money } from '@/features/product'
import { useMyProfile } from '@/features/profile'
import {
  MIN_WITHDRAW_AMOUNT,
  useShopWallet,
  useShopWalletTransactions,
  useShopWithdrawals,
  useShopWithdrawMutation,
  WITHDRAW_STATUS_LABEL,
  type WithdrawStatus,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

type TabType = 'TRANSACTIONS' | 'WITHDRAWALS'

export default function ShopWalletScreen() {
  const showToast = useUiStore((s) => s.showToast)
  const walletQuery = useShopWallet()
  const txQuery = useShopWalletTransactions(0, 50)
  const withdrawalsQuery = useShopWithdrawals()
  const profileQuery = useMyProfile()
  const withdrawMutation = useShopWithdrawMutation()

  const [activeTab, setActiveTab] = useState<TabType>('TRANSACTIONS')
  const [modalOpen, setModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const wallet = walletQuery.data
  const profile = profileQuery.data
  const bankName = profile?.bankName || ''
  const bankNumber = profile?.bankAccountNumber || profile?.bankAccount || ''
  const bankHolder = profile?.bankAccountHolder || profile?.bankAccountName || profile?.fullName || ''

  const availableBalance = Math.max(0, (wallet?.balance ?? 0) - (wallet?.frozenBalance ?? 0))

  const refreshAll = async () => {
    setRefreshing(true)
    await Promise.all([
      walletQuery.refetch(),
      txQuery.refetch(),
      withdrawalsQuery.refetch(),
      profileQuery.refetch(),
    ])
    setRefreshing(false)
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/(tabs)/account'))

  const handleQuickAmount = (val: number) => {
    setWithdrawAmount(String(Math.min(val, availableBalance)))
  }

  const handleOpenWithdraw = () => {
    if (availableBalance < MIN_WITHDRAW_AMOUNT) {
      showToast(`Số dư khả dụng cần tối thiểu ${money(MIN_WITHDRAW_AMOUNT)} để tạo lệnh rút tiền (hiện có ${money(availableBalance)}).`)
      return
    }
    setModalOpen(true)
  }

  const handleSubmitWithdraw = async () => {
    const amt = Number(withdrawAmount.replace(/\D/g, ''))
    if (!amt || amt < MIN_WITHDRAW_AMOUNT) {
      showToast(`Số tiền rút tối thiểu là ${money(MIN_WITHDRAW_AMOUNT)}`)
      return
    }
    if (amt > availableBalance) {
      showToast('Số tiền rút vượt quá số dư khả dụng hiện tại')
      return
    }
    if (!bankName || !bankNumber) {
      showToast('Vui lòng cập nhật thông tin tài khoản ngân hàng trong hồ sơ trước khi rút tiền')
      setModalOpen(false)
      router.push('/shop/profile-edit')
      return
    }

    try {
      await withdrawMutation.mutateAsync({
        amount: amt,
        bankName,
        bankAccountNumber: bankNumber,
        bankAccountName: bankHolder,
        bankAccountHolder: bankHolder,
        note: withdrawNote.trim() || undefined,
      })
      showToast('Gửi yêu cầu rút tiền thành công! Vui lòng chờ kế toán duyệt.')
      setModalOpen(false)
      setWithdrawAmount('')
      setWithdrawNote('')
      refreshAll()
    } catch (err) {
      showToast(getErrorMessage(err, 'Lỗi khi gửi yêu cầu rút tiền'))
    }
  }

  const transactions = txQuery.data?.content ?? []
  const withdrawals = withdrawalsQuery.data ?? []

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-line bg-paper px-3 pb-3 pt-2">
        <View className="flex-row items-center gap-2">
          <BackButton onPress={goBack} />
          <AppText weight="extrabold" className="text-lg">
            Ví Tiền & Quyết Toán
          </AppText>
        </View>
        <Pressable
          onPress={refreshAll}
          accessibilityLabel="Làm mới ví tiền"
          className="h-9 w-9 items-center justify-center rounded-full bg-leaf-50 active:bg-leaf-100"
        >
          <RefreshCw size={17} color={colors.leaf700} className={refreshing ? 'animate-spin' : ''} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="p-4 gap-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {/* Hero Card Số Dư Khả Dụng */}
        <View className="rounded-panel bg-leaf-700 p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className="text-xs tracking-wider text-leaf-100 uppercase">
              Số dư khả dụng
            </AppText>
            <WalletIcon size={20} color={colors.sun300} />
          </View>
          <AppText weight="extrabold" className="mt-2 text-3xl text-white">
            {walletQuery.isLoading ? '...' : money(availableBalance)}
          </AppText>
          <View className="mt-4 flex-row items-center justify-between border-t border-white/20 pt-3">
            <View>
              <AppText className="text-[11px] text-leaf-200">Đang tạm giữ theo đơn</AppText>
              <AppText weight="bold" className="text-sm text-sun-300">
                {money(wallet?.frozenBalance ?? 0)}
              </AppText>
            </View>
            <View className="items-end">
              <AppText className="text-[11px] text-leaf-200">Đã rút về ngân hàng</AppText>
              <AppText weight="bold" className="text-sm text-white">
                {money(wallet?.totalWithdrawn ?? 0)}
              </AppText>
            </View>
          </View>
        </View>

        {/* Nút hành động Rút Tiền */}
        <View className="gap-1.5">
          <Button
            title="Rút tiền về ngân hàng"
            icon={ArrowDownToLine}
            onPress={handleOpenWithdraw}
            className="bg-leaf-700 active:bg-leaf-800"
          />
          {availableBalance < MIN_WITHDRAW_AMOUNT && (
            <AppText className="text-center text-[11px] text-ink-muted">
              Cần tối thiểu {money(MIN_WITHDRAW_AMOUNT)} khả dụng để rút tiền
            </AppText>
          )}
        </View>

        {/* Tổng doanh thu & chính sách */}
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-panel border border-line bg-white p-4">
            <View className="flex-row items-center justify-between">
              <AppText weight="bold" className="text-[11px] text-ink-muted uppercase">
                Tổng doanh thu
              </AppText>
              <TrendingUp size={16} color={colors.leaf700} />
            </View>
            <AppText weight="extrabold" className="mt-1.5 text-lg text-ink">
              {walletQuery.isLoading ? '...' : money(wallet?.totalRevenueAllTime ?? 0)}
            </AppText>
            <AppText className="mt-1 text-[10px] text-ink-subtle">Tất cả mùa vụ</AppText>
          </View>

          <View className="flex-1 rounded-panel border border-line bg-white p-4">
            <View className="flex-row items-center justify-between">
              <AppText weight="bold" className="text-[11px] text-ink-muted uppercase">
                Phí sàn CapNong
              </AppText>
              <Coins size={16} color="#eab308" />
            </View>
            <AppText weight="extrabold" className="mt-1.5 text-lg text-ink">
              10%
            </AppText>
            <AppText className="mt-1 text-[10px] text-ink-subtle">Trừ khi đơn hoàn tất</AppText>
          </View>
        </View>

        {/* Thẻ Ngân Hàng Thụ Hưởng */}
        <View className="rounded-panel border border-line bg-white p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Landmark size={18} color={colors.leaf700} />
              <AppText weight="bold" className="text-sm text-ink">
                Tài khoản nhận tiền
              </AppText>
            </View>
            <Pressable onPress={() => router.push('/shop/profile-edit')}>
              <AppText weight="bold" className="text-xs text-leaf-700">
                {bankNumber ? 'Thay đổi' : 'Liên kết ngay'}
              </AppText>
            </Pressable>
          </View>

          {bankNumber ? (
            <View className="mt-2.5 rounded-xl bg-paper p-3">
              <AppText weight="bold" className="text-sm text-ink">
                {bankName}
              </AppText>
              <AppText weight="extrabold" className="mt-0.5 text-base text-ink tracking-wider">
                {bankNumber}
              </AppText>
              {!!bankHolder && <AppText className="mt-0.5 text-xs text-ink-muted">Chủ thẻ: {bankHolder}</AppText>}
            </View>
          ) : (
            <View className="mt-2.5 rounded-xl bg-amber-50 p-3">
              <AppText className="text-xs text-amber-800">
                Bạn chưa cài đặt tài khoản ngân hàng. Hãy liên kết để có thể rút tiền doanh thu về tài khoản.
              </AppText>
            </View>
          )}
        </View>

        {/* Tab Lịch sử: Biến động số dư vs Lịch sử rút tiền */}
        <View className="mt-2">
          <View className="flex-row rounded-xl border border-line bg-white p-1">
            <Pressable
              onPress={() => setActiveTab('TRANSACTIONS')}
              className={cn(
                'flex-1 items-center justify-center rounded-lg py-2',
                activeTab === 'TRANSACTIONS' && 'bg-leaf-700 shadow-sm',
              )}
            >
              <AppText
                weight="bold"
                className={cn('text-xs', activeTab === 'TRANSACTIONS' ? 'text-white' : 'text-ink-muted')}
              >
                Biến động số dư
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('WITHDRAWALS')}
              className={cn(
                'flex-1 items-center justify-center rounded-lg py-2',
                activeTab === 'WITHDRAWALS' && 'bg-leaf-700 shadow-sm',
              )}
            >
              <AppText
                weight="bold"
                className={cn('text-xs', activeTab === 'WITHDRAWALS' ? 'text-white' : 'text-ink-muted')}
              >
                Lịch sử rút tiền
              </AppText>
            </Pressable>
          </View>

          {/* Nội dung danh sách theo Tab */}
          <View className="mt-3">
            {activeTab === 'TRANSACTIONS' ? (
              transactions.length === 0 ? (
                <View className="items-center rounded-panel border border-line bg-white p-8">
                  <AppText className="text-sm text-ink-muted">Chưa có giao dịch biến động nào</AppText>
                </View>
              ) : (
                <View className="overflow-hidden rounded-panel border border-line bg-white">
                  {transactions.map((tx, idx) => {
                    const isPositive = tx.amount > 0
                    return (
                      <View
                        key={tx.id || idx}
                        className={cn('flex-row items-center gap-3 p-3.5', idx > 0 && 'border-t border-line')}
                      >
                        <View
                          className={cn(
                            'h-10 w-10 items-center justify-center rounded-full',
                            isPositive ? 'bg-leaf-50' : 'bg-red-50',
                          )}
                        >
                          {isPositive ? (
                            <ArrowUpRight size={19} color={colors.leaf700} />
                          ) : (
                            <ArrowDownToLine size={19} color={colors.sale} />
                          )}
                        </View>
                        <View className="min-w-0 flex-1">
                          <AppText weight="bold" numberOfLines={1} className="text-sm text-ink">
                            {tx.description || (isPositive ? 'Doanh thu đơn hàng' : 'Rút tiền về tài khoản')}
                          </AppText>
                          <AppText className="text-[11px] text-ink-subtle">
                            {tx.createdAt ? new Date(String(tx.createdAt)).toLocaleDateString('vi-VN') : 'Mới đây'}
                          </AppText>
                        </View>
                        <View className="items-end">
                          <AppText
                            weight="extrabold"
                            className={cn('text-sm', isPositive ? 'text-leaf-700' : 'text-sale')}
                          >
                            {isPositive ? `+${money(tx.amount)}` : money(tx.amount)}
                          </AppText>
                          <AppText className="text-[10px] text-ink-subtle">
                            Dư: {money(tx.balanceAfter)}
                          </AppText>
                        </View>
                      </View>
                    )
                  })}
                </View>
              )
            ) : withdrawals.length === 0 ? (
              <View className="items-center rounded-panel border border-line bg-white p-8">
                <AppText className="text-sm text-ink-muted">Chưa có yêu cầu rút tiền nào</AppText>
              </View>
            ) : (
              <View className="overflow-hidden rounded-panel border border-line bg-white">
                {withdrawals.map((w, idx) => {
                  const cfg = WITHDRAW_STATUS_LABEL[w.status as WithdrawStatus] ?? {
                    label: w.status,
                    color: colors.inkMuted,
                    bg: '#f3f4f6',
                  }
                  return (
                    <View
                      key={w.id || idx}
                      className={cn('gap-2 p-3.5', idx > 0 && 'border-t border-line')}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <Landmark size={15} color={colors.inkMuted} />
                          <AppText weight="bold" className="text-sm text-ink">
                            {w.bankName} (..{w.bankAccountNumber?.slice(-4)})
                          </AppText>
                        </View>
                        <View
                          style={{ backgroundColor: cfg.bg }}
                          className="rounded-full px-2.5 py-0.5"
                        >
                          <AppText weight="bold" style={{ color: cfg.color }} className="text-[11px]">
                            {cfg.label}
                          </AppText>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <AppText weight="extrabold" className="text-base text-ink">
                          {money(w.amount)}
                        </AppText>
                        <AppText className="text-[11px] text-ink-subtle">
                          {w.createdAt ? new Date(String(w.createdAt)).toLocaleDateString('vi-VN') : ''}
                        </AppText>
                      </View>

                      {!!w.adminNote && (
                        <View className="rounded-lg bg-red-50 p-2">
                          <AppText className="text-xs text-red-700">Lý do từ chối: {w.adminNote}</AppText>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal Yêu Cầu Rút Tiền */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-line pb-3">
              <AppText weight="extrabold" className="text-lg text-ink">
                Rút Tiền Về Ngân Hàng
              </AppText>
              <Pressable onPress={() => setModalOpen(false)} className="p-1">
                <X size={20} color={colors.inkSubtle} />
              </Pressable>
            </View>

            <View className="mt-4 gap-3">
              <View className="flex-row items-center justify-between">
                <AppText className="text-xs text-ink-muted">Khả dụng rút:</AppText>
                <AppText weight="extrabold" className="text-sm text-leaf-700">
                  {money(availableBalance)}
                </AppText>
              </View>

              <View>
                <AppText weight="bold" className="text-xs text-ink">
                  Số tiền cần rút (đ)
                </AppText>
                <TextInput
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  placeholder="VD: 500000"
                  keyboardType="numeric"
                  className="mt-1.5 h-12 rounded-xl border border-line px-3 text-base font-bold text-ink"
                  style={{ fontFamily: fontFamily.bold }}
                />
              </View>

              {/* Các nút bấm chọn số tiền nhanh */}
              <View className="flex-row flex-wrap gap-2">
                {[500000, 1000000, 2000000].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => handleQuickAmount(v)}
                    className="rounded-lg border border-line bg-paper px-3 py-1.5"
                  >
                    <AppText weight="semibold" className="text-xs text-ink">
                      {money(v)}
                    </AppText>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setWithdrawAmount(String(availableBalance))}
                  className="rounded-lg border border-leaf-700 bg-leaf-50 px-3 py-1.5"
                >
                  <AppText weight="bold" className="text-xs text-leaf-700">
                    Tất cả
                  </AppText>
                </Pressable>
              </View>

              <View>
                <AppText weight="bold" className="text-xs text-ink">
                  Ghi chú cho kế toán (tuỳ chọn)
                </AppText>
                <TextInput
                  value={withdrawNote}
                  onChangeText={setWithdrawNote}
                  placeholder="Ghi chú thêm nếu cần..."
                  className="mt-1.5 h-10 rounded-xl border border-line px-3 text-xs text-ink"
                  style={{ fontFamily: fontFamily.regular }}
                />
              </View>

              <View className="rounded-xl bg-paper p-3">
                <AppText weight="semibold" className="text-xs text-ink-muted">
                  Tài khoản nhận:
                </AppText>
                <AppText weight="bold" className="mt-0.5 text-sm text-ink">
                  {bankName ? `${bankName} · ${bankNumber}` : 'Chưa thiết lập ngân hàng'}
                </AppText>
              </View>

              <Button
                title="Xác nhận rút tiền"
                loading={withdrawMutation.isPending}
                onPress={handleSubmitWithdraw}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
