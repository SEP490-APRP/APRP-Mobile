import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services'
import { ORDER_TABS, type OrderTab } from '../utils/orderStatus'

export const orderKeys = {
  all: ['orders'] as const,
  mine: (tab: OrderTab) => [...orderKeys.all, 'mine', tab] as const,
  detail: (id: number) => [...orderKeys.all, 'detail', id] as const,
}

/** 50 đơn gần nhất theo nhóm trạng thái, như bản web (chưa phân trang). */
export function useMyOrders(tab: OrderTab) {
  const statuses = ORDER_TABS.find((t) => t.key === tab)?.statuses
  return useQuery({
    queryKey: orderKeys.mine(tab),
    queryFn: async () => (await orderService.fetchMyOrders({ page: 0, size: 50, statuses })).content ?? [],
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.getOrderById(id),
    enabled: id > 0,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: number) => orderService.cancelOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  })
}
