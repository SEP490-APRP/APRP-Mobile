import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  ReviewReplyRequest,
  ReviewResponse,
  ReviewShopReport,
} from './review.types'
import { mockReviews } from '@/mocks/review.mock'

export type * from './review.types'

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if (
      'data' in res &&
      (res as { data: unknown }).data &&
      typeof (res as { data: unknown }).data === 'object' &&
      'result' in (res as { data: { result: unknown } }).data
    ) {
      return (res as { data: ApiResponse<T> }).data.result as T
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result as T
    }
  }
  return res as T
}

export const reviewService = {
  /** Lấy danh sách đánh giá của gian hàng mình GET /reviews/my-shop */
  async getMyShopReviewsPaged(
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    try {
      const res = await axiosInstance.get('/reviews/my-shop', { params: { page, size } })
      return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
    } catch {
      return {
        code: 200,
        result: {
          content: mockReviews as ReviewResponse[],
          page,
          size,
          totalElements: mockReviews.length,
          totalPages: 1,
          first: page === 0,
          last: true,
        },
      }
    }
  },

  /** Báo cáo thống kê đánh giá của Shop GET /reviews/shop/report */
  async getMyShopReport(): Promise<ApiResponse<ReviewShopReport>> {
    try {
      const res = await axiosInstance.get('/reviews/shop/report')
      return { code: 200, result: unwrap<ReviewShopReport>(res) }
    } catch {
      return {
        code: 200,
        result: {
          averageRating: 4.8,
          totalReviewers: 36,
          fiveStarNumber: 28,
          fourStarNumber: 5,
          threeStarNumber: 2,
          twoStarNumber: 1,
          oneStarNumber: 0,
        },
      }
    }
  },

  /** Shop trả lời đánh giá POST /reviews/{id}/reply */
  async replyReview(id: number, data: ReviewReplyRequest): Promise<ApiResponse<ReviewResponse>> {
    const res = await axiosInstance.post(`/reviews/${id}/reply`, data)
    return { code: 200, result: unwrap<ReviewResponse>(res) }
  },

  async getByProductId(productId: number): Promise<ApiResponse<ReviewResponse[]>> {
    try {
      const res = await axiosInstance.get(`/reviews/product/${productId}`)
      const result = unwrap<ReviewResponse[]>(res)
      return { code: 200, result: Array.isArray(result) ? result : [] }
    } catch {
      const list = mockReviews.filter((r) => !r.productId || r.productId === productId)
      return { code: 200, result: list as ReviewResponse[] }
    }
  },

  async getByShopId(shopId: number): Promise<ApiResponse<ReviewResponse[]>> {
    try {
      const res = await axiosInstance.get(`/reviews/shop/${shopId}`)
      const result = unwrap<ReviewResponse[]>(res)
      return { code: 200, result: Array.isArray(result) ? result : [] }
    } catch {
      const list = mockReviews.filter((r) => !r.shopId || r.shopId === shopId)
      return { code: 200, result: list as ReviewResponse[] }
    }
  },

  async reactToReview(
    reviewId: number,
    reactionType: 'LIKE' | 'DISLIKE',
  ): Promise<ApiResponse<ReviewResponse>> {
    try {
      const res = await axiosInstance.post(`/reviews/${reviewId}/react`, { reactionType })
      return { code: 200, result: unwrap<ReviewResponse>(res) }
    } catch {
      const rev = mockReviews.find((r) => r.id === reviewId) || mockReviews[0]
      return { code: 200, result: rev as ReviewResponse }
    }
  },
}
