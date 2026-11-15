import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletService, type WithdrawCreateRequest } from '@/services/wallet.service'

export const shopWalletKeys = {
  all: ['shop-wallet'] as const,
  wallet: () => [...shopWalletKeys.all, 'detail'] as const,
  transactions: (page: number, size: number) => [...shopWalletKeys.all, 'transactions', page, size] as const,
  withdrawals: () => [...shopWalletKeys.all, 'withdrawals'] as const,
}

/** Lấy thông tin ví shop (balance, frozenBalance, totalRevenueAllTime, totalWithdrawn) */
export function useShopWallet() {
  return useQuery({
    queryKey: shopWalletKeys.wallet(),
    queryFn: async () => (await walletService.getMyWallet()).result,
  })
}

/** Lấy lịch sử biến động số dư ví */
export function useShopWalletTransactions(page = 0, size = 20) {
  return useQuery({
    queryKey: shopWalletKeys.transactions(page, size),
    queryFn: async () => (await walletService.getMyTransactions(page, size)).result,
  })
}

/** Lấy danh sách yêu cầu rút tiền của shop */
export function useShopWithdrawals() {
  return useQuery({
    queryKey: shopWalletKeys.withdrawals(),
    queryFn: async () => (await walletService.getMyWithdrawals()).result,
  })
}

/** Tạo lệnh rút tiền về tài khoản ngân hàng */
export function useShopWithdrawMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: WithdrawCreateRequest) => walletService.requestWithdraw(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopWalletKeys.all })
    },
  })
}

