import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from '@/features/order/hooks/useOrderQueries'
import { shipperService } from '@/services/shipper.service'
import type { OrderResponse } from '@/types/order.types'
import type { LatLng } from '../utils/shipperOrders'
import { ACTIVE_STATUSES, DONE_STATUSES } from '../utils/shipperOrders'

export const shipperKeys = {
  all: ['shipper'] as const,
  status: () => [...shipperKeys.all, 'status'] as const,
  ready: () => [...shipperKeys.all, 'ready'] as const,
  active: () => [...shipperKeys.all, 'active'] as const,
  history: () => [...shipperKeys.all, 'history'] as const,
}

/** Đơn mới hiện ra khi nhà vườn báo sẵn sàng, nên hỏi lại định kỳ khi đang trực tuyến. */
const READY_POLL_MS = 20_000

export function useShipperStatus() {
  return useQuery({ queryKey: shipperKeys.status(), queryFn: shipperService.getStatus })
}

export function useToggleOnline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (next: { online: true; at: LatLng } | { online: false }) => {
      if (next.online) await shipperService.goOnline(next.at.latitude, next.at.longitude)
      else await shipperService.goOffline()
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: shipperKeys.status() }),
  })
}

export function useReadyOrders(enabled: boolean) {
  return useQuery({
    queryKey: shipperKeys.ready(),
    queryFn: () => shipperService.getReadyOrders(0, 30),
    enabled,
    refetchInterval: enabled ? READY_POLL_MS : false,
  })
}

/** Đơn đang giao (SHIPPING, PICKED_UP). Backend chỉ cho mỗi tài xế một đơn một lúc. */
export function useActiveOrders() {
  return useQuery({
    queryKey: shipperKeys.active(),
    queryFn: async () => (await shipperService.getMyOrders(ACTIVE_STATUSES, 0, 10)).content,
  })
}

/** Trang 50 đơn, tối đa 10 trang: đủ cho thống kê thu nhập mà không tải vô hạn. */
const HISTORY_PAGE = 50
const HISTORY_MAX_PAGES = 10

/** Toàn bộ đơn đã kết thúc (giao xong hoặc thất bại) của tài xế, dùng cho thu nhập và lịch sử. */
export function useShipperHistory() {
  return useQuery({
    queryKey: shipperKeys.history(),
    queryFn: async () => {
      const all: OrderResponse[] = []
      for (let page = 0; page < HISTORY_MAX_PAGES; page++) {
        const res = await shipperService.getMyOrders(DONE_STATUSES, page, HISTORY_PAGE)
        all.push(...res.content)
        if (res.last || res.content.length < HISTORY_PAGE) break
      }
      return all
    },
  })
}

export function useAcceptOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: number) => shipperService.acceptOrder(orderId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: shipperKeys.all })
      void qc.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export type DeliveryAction = 'pickup' | 'deliver' | 'fail'

/** Lấy hàng, giao thành công hoặc báo thất bại cho đơn đang giao. */
export function useDeliveryAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, action }: { orderId: number; action: DeliveryAction }) =>
      action === 'pickup'
        ? shipperService.pickupOrder(orderId)
        : action === 'deliver'
          ? shipperService.deliverOrder(orderId)
          : shipperService.failOrder(orderId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: shipperKeys.all })
      void qc.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}
