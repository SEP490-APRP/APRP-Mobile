export type BackendDateTime = string | number[] | null | undefined

export type WalletType = 'SHOP' | 'SHIPPER' | 'PLATFORM' | 'REFERRAL' | 'MEMBER' | 'BUYER'

export interface WithdrawRequestResponse {
  id: number
  amount: number
  receiveAmount?: number
  status: 'PENDING' | 'SUCCESS' | 'REJECTED' | 'COMPLETED'
  walletType?: WalletType
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

export interface MyWalletResponse {
  walletId: number
  type: WalletType
  userId: number
  ownerName?: string
  status?: string
  balance: number
  frozenBalance: number
  totalRevenueAllTime: number
  totalWithdrawn: number
  commissionEarned?: number | null
  codCashHolding?: number | null
  updatedAt?: BackendDateTime
}

export type WalletTransactionType =
  | 'SHOP_INCOME'
  | 'SHIPPER_INCOME'
  | 'PLATFORM_FARMER_FEE'
  | 'PLATFORM_SHIPPER_FEE'
  | 'PLATFORM_VOUCHER_SUBSIDY'
  | 'PLATFORM_FREESHIP_SUBSIDY'
  | 'COD_CASH_COLLECTED'
  | 'COD_CASH_REMITTED'
  | 'SHOP_INCOME_HOLD'
  | 'SHIPPER_INCOME_HOLD'
  | 'PLATFORM_INCOME_HOLD'
  | 'HOLD_RELEASED'
  | 'HOLD_CANCELLED'
  | 'WITHDRAW_REQUESTED'
  | 'WITHDRAW_REFUNDED'
  | 'WITHDRAWAL'
  | string

export interface WalletTransactionResponse {
  id: number
  walletId: number
  walletType: WalletType
  orderId?: number | null
  type: WalletTransactionType
  amount: number
  balanceAfter: number
  frozenAfter?: number | null
  hold?: boolean
  description?: string
  createdAt?: BackendDateTime
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface WithdrawCreateRequest {
  amount: number
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  note?: string
}

export type WithdrawStatus = 'PENDING' | 'COMPLETED' | 'SUCCESS' | 'REJECTED'

export interface WithdrawResponse {
  id: number
  walletId: number
  userId: number
  amount: number
  status: WithdrawStatus
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  note?: string
  adminNote?: string
  createdAt: BackendDateTime
  processedAt?: BackendDateTime
}
