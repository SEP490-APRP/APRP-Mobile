import type { ShelfLifeTier } from './campaign.types'

export type CampaignProposalStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
export type ProposalMemberStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REMOVED'

export interface ProposalMember {
  memberId: number
  shopId: number
  shopName: string
  logoUrl?: string | null
  ratingAverage?: number | null
  /** Chỉ có khi cả 2 bên đã tham gia */
  phone?: string | null
  role: 'INITIATOR' | 'INVITED'
  status: ProposalMemberStatus
  estimatedKg?: number | null
  message?: string | null
  distanceKm?: number | null
  verified: boolean
  invitedAt?: string | null
  respondedAt?: string | null
  expiresAt?: string | null
}

export interface CampaignProposal {
  proposalId: number
  code: string
  status: CampaignProposalStatus
  initiatorShopId: number
  initiatorShopName: string
  initiatorLogoUrl?: string | null
  initiatorRating?: number | null
  initiatorVerified: boolean
  categoryId?: number | null
  categoryName?: string | null
  productName?: string | null
  photoUrls: string[]
  story?: string | null
  harvestFrom?: string | null
  harvestTo?: string | null
  /** Ngày shop đề xuất mở bán / kết thúc chiến dịch */
  proposedOpenDate?: string | null
  proposedCloseDate?: string | null
  shelfLifeTier?: ShelfLifeTier | null
  desiredPricePerKg?: number | null
  marketPricePerKg?: number | null
  siteName?: string | null
  siteAddress?: string | null
  siteLatitude?: number | null
  siteLongitude?: number | null
  totalEstimatedKg: number
  acceptedShopCount: number
  pendingInviteCount: number
  minSubmitKg: number
  adminNote?: string | null
  reviewedAt?: string | null
  campaignId?: number | null
  campaignCode?: string | null
  campaignStatus?: string | null
  submittedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  myInvite?: ProposalMember | null
  members: ProposalMember[]
  initiatorPastRegistrations?: number | null
}

export interface CampaignProposalRequest {
  categoryId?: number | null
  productName?: string
  photoUrls?: string[]
  story?: string
  estimatedKg?: number | null
  harvestFrom?: string | null
  harvestTo?: string | null
  proposedOpenDate?: string | null
  proposedCloseDate?: string | null
  shelfLifeTier?: ShelfLifeTier | null
  desiredPricePerKg?: number | null
  marketPricePerKg?: number | null
  siteName?: string
  siteAddress?: string
  siteLatitude?: number | null
  siteLongitude?: number | null
}

export interface NearbyShop {
  shopId: number
  shopName: string
  logoUrl?: string | null
  ratingAverage?: number | null
  distanceKm: number
  approxLatitude: number
  approxLongitude: number
  categories: string[]
  sameCategory: boolean
  inviteStatus?: ProposalMemberStatus | null
}
