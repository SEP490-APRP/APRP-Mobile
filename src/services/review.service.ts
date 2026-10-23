import type { ApiResponse } from '@/types'
import type { ReviewResponse } from './review.types'
import { mockReviews } from '@/mocks/review.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './review.types'

export const reviewService = freshResponses({
  async getByProductId(productId: number): Promise<ApiResponse<ReviewResponse[]>> {
    await new Promise((r) => setTimeout(r, 150))
    const list = mockReviews.filter((r) => !r.productId || r.productId === productId)
    return { code: 200, result: list }
  },

  async getByShopId(shopId: number): Promise<ApiResponse<ReviewResponse[]>> {
    await new Promise((r) => setTimeout(r, 150))
    const list = mockReviews.filter((r) => !r.shopId || r.shopId === shopId)
    return { code: 200, result: list }
  },

  async reactToReview(
    reviewId: number,
    reactionType: 'LIKE' | 'DISLIKE',
  ): Promise<ApiResponse<ReviewResponse>> {
    await new Promise((r) => setTimeout(r, 100))
    const rev = mockReviews.find((r) => r.id === reviewId)
    if (rev) {
      if (rev.currentUserReaction === reactionType) {
        rev.currentUserReaction = null
        if (reactionType === 'LIKE') rev.likeCount = Math.max(0, (rev.likeCount || 1) - 1)
        else rev.dislikeCount = Math.max(0, (rev.dislikeCount || 1) - 1)
      } else {
        if (rev.currentUserReaction === 'LIKE')
          rev.likeCount = Math.max(0, (rev.likeCount || 1) - 1)
        if (rev.currentUserReaction === 'DISLIKE')
          rev.dislikeCount = Math.max(0, (rev.dislikeCount || 1) - 1)
        rev.currentUserReaction = reactionType
        if (reactionType === 'LIKE') rev.likeCount = (rev.likeCount || 0) + 1
        else rev.dislikeCount = (rev.dislikeCount || 0) + 1
      }
      return { code: 200, result: { ...rev } }
    }
    return { code: 200, result: mockReviews[0] }
  },
})
