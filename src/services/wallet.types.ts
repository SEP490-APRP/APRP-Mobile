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

// ── Ví thật từ backend (/wallets), chép từ APRP-FE/src/services/wallet.types.ts ──

export type WalletType = 'SHOP' | 'SHIPPER' | 'PLATFORM' | 'REFERRAL' | 'BUYER'

export interface MyWalletResponse {
  walletId: number
  type: WalletType
  userId: number
  ownerName?: string
  status?: string
  /** Tổng số dư. Ví Shipper có thể âm khi còn tiền COD luồng cũ chưa nộp */
  balance: number
  frozenBalance: number
  totalRevenueAllTime: number
  totalWithdrawn: number
  /** Chỉ ví Shipper: tiền mặt COD luồng cũ chưa nộp về sàn */
  codCashHolding?: number | null
  /** Tiền đang ký quỹ cho đơn COD đang giao */
  codReserved?: number | null
  /** Số dư khả dụng = balance - codReserved (dùng để nhận đơn COD và rút tiền) */
  availableBalance?: number | null
  updatedAt?: string | null
}

export interface WalletTransactionResponse {
  id: number
  walletId: number
  walletType: WalletType
  orderId?: number | null
  type: string
  /** Có dấu: dương = cộng, âm = trừ */
  amount: number
  balanceAfter: number
  frozenAfter?: number | null
  /** Bút toán tiền tạm giữ, không đổi số dư */
  hold?: boolean
  /** Giữ chỗ / gỡ ký quỹ COD: amount là thay đổi số dư khả dụng, số dư không đổi */
  reserve?: boolean
  description?: string
  createdAt?: string | null
}

export type WalletTopupStatus = 'PENDING' | 'PAID' | 'CANCELLED'

/** Lệnh nạp ví qua PayOS (POST /wallets/topups) */
export interface WalletTopupResponse {
  id: number
  amount: number
  status: WalletTopupStatus
  orderCode: string
  /** Chỉ có khi còn PENDING */
  checkoutUrl?: string | null
  createdAt?: string | null
  paidAt?: string | null
}

export interface WalletTopupCreateRequest {
  amount: number
  returnUrl?: string
  cancelUrl?: string
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
