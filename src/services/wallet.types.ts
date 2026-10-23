export interface WithdrawRequestResponse {
  id: number
  amount: number
  receiveAmount?: number
  status: 'PENDING' | 'SUCCESS' | 'REJECTED'
  walletType?: 'MEMBER' | 'SHIPPER' | 'SHOP' | 'BUYER'
  walletId?: number
  buyerId?: number
  shopOwnerId?: number
  shipperId?: number
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  createdAt: string
  processedAt?: string
  note?: string
  adminNote?: string
}

export interface WalletResponse {
  id: number
  balance: number
  totalBalance?: number
  frozenBalance: number
  totalWithdrawn: number
  totalDeposited: number
  commissionEarned: number
}
