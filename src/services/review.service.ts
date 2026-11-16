import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  ReviewCreateRequest,
  ReviewReplyRequest,
  ReviewResponse,
  ReviewShopReport,
} from './review.types'
import { mockReviews } from '@/mocks/review.mock'
import { ENV } from '@/utils'

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

  async getByProductIdPaged(
    productId: number,
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get(`/reviews/product/${productId}/paged`, {
      params: { page, size },
    })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
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

  async getByShopIdPaged(
    shopId: number,
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get(`/reviews/shop/${shopId}/paged`, {
      params: { page, size },
    })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
  },

  async getByMysteryBoxId(mysteryBoxId: number): Promise<ApiResponse<ReviewResponse[]>> {
    try {
      const res = await axiosInstance.get(`/reviews/mystery-box/${mysteryBoxId}`)
      const result = unwrap<ReviewResponse[]>(res)
      return { code: 200, result: Array.isArray(result) ? result : [] }
    } catch {
      return { code: 200, result: [] }
    }
  },

  async getMyReviews(): Promise<ApiResponse<ReviewResponse[]>> {
    const res = await axiosInstance.get('/reviews/my')
    const result = unwrap<ReviewResponse[]>(res)
    return { code: 200, result: Array.isArray(result) ? result : [] }
  },

  async getMyReviewsPaged(
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get('/reviews/my/paged', { params: { page, size } })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
  },

  /** Người mua gửi đánh giá */
  async createReview(data: ReviewCreateRequest): Promise<ApiResponse<ReviewResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400))
      const mock: ReviewResponse = {
        id: Date.now(),
        orderDetailId: data.orderDetailId,
        mysteryBoxId: data.mysteryBoxId,
        ratingStar: data.ratingStar,
        comment: data.comment,
        evidence: data.evidence,
        imageUrls: data.imageUrls,
        createdAt: new Date().toISOString(),
      }
      return { code: 200, result: mock }
    }
    const res = await axiosInstance.post('/reviews', data)
    return { code: 200, result: unwrap<ReviewResponse>(res) }
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

  async getAllReviewsAdmin(
    page = 0,
    size = 20,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get('/reviews/admin', { params: { page, size } })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
  },
}
