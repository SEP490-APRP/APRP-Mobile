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

// ── Ví thật từ BE (/wallets/me). Buyer có ví loại REFERRAL (ví giới thiệu) ──

export type WalletType = 'SHOP' | 'SHIPPER' | 'PLATFORM' | 'REFERRAL'

export interface MyWalletResponse {
  walletId: number
  type: WalletType
  userId: number
  ownerName?: string
  status?: string
  /** Số dư rút được */
  balance: number
  /** Tiền tạm giữ, chưa rút được */
  frozenBalance: number
  totalRevenueAllTime: number
  totalWithdrawn: number
  updatedAt?: string
}

export interface WalletTransactionResponse {
  id: number
  walletId: number
  walletType: WalletType
  orderId?: number | null
  type: string
  /** Có dấu: dương = cộng ví, âm = trừ ví */
  amount: number
  balanceAfter: number
  frozenAfter?: number | null
  hold?: boolean
  description?: string
  createdAt?: string
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last?: boolean
}
