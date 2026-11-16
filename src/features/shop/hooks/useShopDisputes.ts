import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { returnService, type ReturnStatus, type ShopReturnRespondRequest } from '@/services/return.service'

export const shopDisputeKeys = {
  all: ['shop-disputes'] as const,
  list: (status?: ReturnStatus, page?: number, size?: number) =>
    [...shopDisputeKeys.all, 'list', status, page, size] as const,
  detail: (id: number) => [...shopDisputeKeys.all, 'detail', id] as const,
}

/** Danh sách khiếu nại gửi đến shop */
export function useShopDisputes(page = 0, size = 20, status?: ReturnStatus) {
  return useQuery({
    queryKey: shopDisputeKeys.list(status, page, size),
    queryFn: async () => (await returnService.getShopReturns(page, size, status)).result,
  })
}

/** Chi tiết 1 khiếu nại */
export function useShopDisputeDetail(id: number) {
  return useQuery({
    queryKey: shopDisputeKeys.detail(id),
    queryFn: async () => (await returnService.getReturnById(id)).result,
    enabled: id > 0,
  })
}

/** Shop phản hồi khiếu nại (Chấp thuận hoặc Từ chối) */
export function useShopRespondDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShopReturnRespondRequest }) =>
      returnService.shopRespond(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopDisputeKeys.all })
    },
  })
}

