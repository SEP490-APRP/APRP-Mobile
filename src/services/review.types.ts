export interface ReviewResponse {
  id: number
  reviewId?: number
  productId?: number
  productName?: string
  mysteryBoxId?: number
  boxType?: string
  comboId?: number
  comboName?: string
  shopId?: number
  shopName?: string
  buyerId?: number
  fullName?: string
  buyerName?: string
  buyerAvatar?: string
  orderDetailId?: number
  orderId?: number
  ratingStar: number
  comment?: string
  evidence?: string
  imageUrls?: string[]
  replyFromShop?: string
  createAt?: string
  createdAt?: string
  likeCount?: number
  dislikeCount?: number
  currentUserReaction?: 'LIKE' | 'DISLIKE' | null
}

export interface ReviewCreateRequest {
  orderDetailId?: number
  mysteryBoxId?: number
  ratingStar: number
  comment?: string
  evidence?: string
  imageUrls?: string[]
}

export interface ReviewReplyRequest {
  replyFromShop: string
}

export interface ReviewReactionRequest {
  reactionType: 'LIKE' | 'DISLIKE'
}

export interface ReviewShopReport {
  averageRating: number
  totalReviewers: number
  fiveStarNumber: number
  fourStarNumber: number
  threeStarNumber: number
  twoStarNumber: number
  oneStarNumber: number
}
