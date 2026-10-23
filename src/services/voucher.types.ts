export type VoucherType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
export type VoucherScope = 'SHOP' | 'PLATFORM' | 'WELCOME' | 'SYSTEM'
export type VoucherTarget = 'ORDER' | 'SHIPPING' | 'SHOP' | 'ITEM'

export interface VoucherResponse {
  voucherId: number
  voucherCode: string
  voucherType: VoucherType
  voucherScope?: VoucherScope | null
  voucherTarget?: VoucherTarget | null
  discountValue: number
  maxDiscount?: number | null
  minOrderValue?: number | null
  claimLimit?: number | null
  claimedCount?: number | null
  usedCount?: number | null
  perUserLimit?: number | null
  active?: boolean
  expiryDate: string
  createAt?: string
  creatorRole?: string
  shopId?: number | null
  isPublic?: boolean
  isCollected?: boolean
  isUsed?: boolean
  userRemainingQuantity?: number
}

export interface VoucherCreateRequest {
  voucherCode: string
  voucherType: VoucherType
  voucherScope?: VoucherScope
  voucherTarget: VoucherTarget
  discountValue: number
  maxDiscount?: number
  minOrderValue?: number
  claimLimit: number
  perUserLimit: number
  expiryDate: string
  isPublic?: boolean
}
