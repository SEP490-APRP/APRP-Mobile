export interface ReviewResponse {
  id: number
  productId?: number
  productName?: string
  boxType?: string
  shopId?: number
  buyerId?: number
  fullName?: string
  ratingStar: number
  comment?: string
  evidence?: string
  replyFromShop?: string
  createAt?: string
  createdAt?: string
  likeCount?: number
  dislikeCount?: number
  currentUserReaction?: 'LIKE' | 'DISLIKE' | null
}
