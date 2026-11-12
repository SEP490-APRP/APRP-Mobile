import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletApi } from '@/services/wallet.service'

export const walletKeys = {
  all: ['wallet'] as const,
  me: () => [...walletKeys.all, 'me'] as const,
  transactions: (page: number, size: number) => [...walletKeys.all, 'me', 'tx', page, size] as const,
  topups: () => [...walletKeys.all, 'me', 'topups'] as const,
}

/** Ví của tôi (Shipper / Shop) */
export function useMyWallet(enabled = true) {
  return useQuery({ queryKey: walletKeys.me(), queryFn: walletApi.getMyWallet, enabled })
}

export function useMyWalletTransactions(page = 0, size = 20) {
  return useQuery({
    queryKey: walletKeys.transactions(page, size),
    queryFn: () => walletApi.getMyTransactions(page, size),
  })
}

/** Tạo link PayOS nạp ví */
export function useCreateTopup() {
  return useMutation({ mutationFn: walletApi.createTopup })
}

/** Xác nhận lệnh nạp sau khi quay lại từ PayOS, tải lại ví */
export function useConfirmTopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: walletApi.confirmTopup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  })
}
