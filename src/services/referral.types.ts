export type ReferralTargetType = 'PRODUCT' | 'SHOP' | 'BUILD_COMBO' | 'MYSTERY_BOX'

export type CommissionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export interface ReferralLinkCreateRequest {
  targetType: ReferralTargetType
  targetId: number
}

export interface ReferralLinkResponse {
  id: number
  referralCode: string
  shareUrl: string
  targetType: ReferralTargetType
  targetId: number
  targetName: string
  targetImageUrl?: string
  commissionRate: number
  clicksCount: number
  isActive: boolean
  createdAt: string
}

export interface ReferralResolveResponse {
  referralCode: string
  targetType: ReferralTargetType
  targetId: number
  targetName: string
  targetUrl: string
  imageUrl?: string
  price?: number
  shopName?: string
  referrerName: string
}

export interface ReferralStatsResponse {
  totalEarned: number
  pendingCommission: number
  totalClicks: number
  totalOrders: number
  defaultCommissionRate: number
}

export interface ReferralCommissionResponse {
  id: number
  orderId: number
  orderDetailId: number
  productName: string
  productImageUrl?: string
  commissionRate: number
  baseAmount: number
  commissionAmount: number
  status: CommissionStatus
  settledAt?: string
  createdAt: string
}

