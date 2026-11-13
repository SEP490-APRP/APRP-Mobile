import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderService, returnService } from '@/services'
import type { ReturnCreateRequest, ReturnStatus } from '@/services/return.types'
import { ORDER_TABS, type OrderTab } from '../utils/orderStatus'

export const orderKeys = {
  all: ['orders'] as const,
  mine: (tab: OrderTab) => [...orderKeys.all, 'mine', tab] as const,
  detail: (id: number) => [...orderKeys.all, 'detail', id] as const,
  buyerReturns: (status?: ReturnStatus) => [...orderKeys.all, 'buyer-returns', status] as const,
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

/** Buyer xác nhận đã nhận hàng: DELIVERED → COMPLETED, backend chia tiền */
export function useCompleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: number) => orderService.completeOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  })
}

/** Buyer gửi yêu cầu trả hàng / hoàn tiền */
export function useCreateReturnRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReturnCreateRequest) => returnService.createReturnRequest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  })
}

/** Buyer huỷ yêu cầu trả hàng */
export function useCancelReturnRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => returnService.cancelReturnRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  })
}

/** Danh sách yêu cầu hoàn trả của Buyer */
export function useBuyerReturns(status?: ReturnStatus) {
  return useQuery({
    queryKey: orderKeys.buyerReturns(status),
    queryFn: async () => (await returnService.getBuyerReturns(0, 50, status)).result?.content ?? [],
  })
}
