import { useQuery } from '@tanstack/react-query'
import { myWalletApi } from '@/services'

export const walletKeys = {
  all: ['wallet'] as const,
  me: () => [...walletKeys.all, 'me'] as const,
  myTransactions: (page: number, size: number) => [...walletKeys.all, 'me', 'transactions', { page, size }] as const,
}

export function useMyWallet() {
  return useQuery({ queryKey: walletKeys.me(), queryFn: () => myWalletApi.getMyWallet() })
}

export function useMyWalletTransactions(page = 0, size = 20) {
  return useQuery({
    queryKey: walletKeys.myTransactions(page, size),
    queryFn: () => myWalletApi.getMyTransactions(page, size),
  })
}
