import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewService, type ReviewReplyRequest } from '@/services/review.service'

export const shopReviewKeys = {
  all: ['shop-reviews'] as const,
  list: (page: number, size: number) => [...shopReviewKeys.all, 'list', page, size] as const,
  report: () => [...shopReviewKeys.all, 'report'] as const,
}

/** Danh sách đánh giá của khách gửi về gian hàng */
export function useShopReviews(page = 0, size = 15) {
  return useQuery({
    queryKey: shopReviewKeys.list(page, size),
    queryFn: async () => (await reviewService.getMyShopReviewsPaged(page, size)).result,
  })
}

/** Thống kê sao trung bình, phân bổ sao của Shop */
export function useShopReviewReport() {
  return useQuery({
    queryKey: shopReviewKeys.report(),
    queryFn: async () => (await reviewService.getMyShopReport()).result,
  })
}

/** Shop gửi câu trả lời đánh giá */
export function useShopReplyReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewReplyRequest }) =>
      reviewService.replyReview(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopReviewKeys.all })
    },
  })
}

