import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from '@/features/order/hooks/useOrderQueries'
import { shipperService } from '@/services/shipper.service'
import type { OrderResponse } from '@/types/order.types'
import type { UploadFile } from '@/types/upload.types'
import type { DeliveryFailReason } from '@/services/shipper.service'
import { walletKeys } from '@/features/wallet/hooks/useWalletQueries'
import type { LatLng } from '../utils/shipperOrders'
import { ACTIVE_STATUSES, DONE_STATUSES, shipperErrorCode } from '../utils/shipperOrders'
import type { ShipperStatus } from '@/services/shipper.service'

export const shipperKeys = {
  all: ['shipper'] as const,
  status: () => [...shipperKeys.all, 'status'] as const,
  ready: () => [...shipperKeys.all, 'ready'] as const,
  active: () => [...shipperKeys.all, 'active'] as const,
  history: () => [...shipperKeys.all, 'history'] as const,
}

/** Dự phòng khi mất kết nối STOMP: hỏi lại định kỳ khi đang nhận đơn. */
const READY_POLL_MS = 60_000

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
    onSuccess: (_data, next) => {
      // Cập nhật trạng thái ngay để danh sách đơn mới tắt trước khi tải lại.
      // Nếu không, app vẫn tưởng còn online, gọi /orders/ready và nhận lỗi 7006 sau khi đã tắt.
      qc.setQueryData<ShipperStatus>(shipperKeys.status(), (old) => ({ ...old, online: next.online }))
      if (!next.online) qc.removeQueries({ queryKey: shipperKeys.ready() })
      void qc.invalidateQueries({ queryKey: shipperKeys.status() })
      void qc.invalidateQueries({ queryKey: shipperKeys.active() })
      if (next.online) void qc.invalidateQueries({ queryKey: shipperKeys.ready() })
    },
  })
}

/** Đơn mới quanh shipper. Đơn mới được đẩy qua STOMP (useShipperOffers), polling chỉ là dự phòng */
export function useReadyOrders(enabled: boolean, coords?: LatLng | null) {
  // Toạ độ (làm tròn ~100 m) nằm trong key: GPS sẵn sàng hoặc đổi vị trí thì tải lại danh sách theo vị trí mới
  const at = coords ? [Math.round(coords.latitude * 1000) / 1000, Math.round(coords.longitude * 1000) / 1000] : null
  return useQuery({
    queryKey: [...shipperKeys.ready(), at] as const,
    queryFn: () => shipperService.getReadyOrders(0, 30, coords),
    enabled,
    refetchInterval: enabled ? READY_POLL_MS : false,
    // 7006 (chưa trực tuyến) không tự hết khi thử lại; lỗi mạng thì thử lại 1 lần
    retry: (count, err) => shipperErrorCode(err) !== 7006 && count < 1,
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
      void qc.invalidateQueries({ queryKey: walletKeys.all })
    },
  })
}

export type DeliveryAction = 'pickup' | 'deliver' | 'fail'

/** Dữ liệu xác nhận giao (deliver / fail): ảnh chưa upload + lý do */
export interface DeliveryProof {
  photos: UploadFile[]
  reason?: DeliveryFailReason
  callAttempts?: number
  note?: string
}

/** Lấy hàng, giao thành công hoặc báo thất bại cho đơn đang giao (upload ảnh bằng chứng trước). */
export function useDeliveryAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, action, proof }: { orderId: number; action: DeliveryAction; proof?: DeliveryProof }) => {
      if (action === 'pickup') return shipperService.pickupOrder(orderId)
      const urls = await shipperService.uploadProofImages(proof?.photos ?? [])
      if (urls.length === 0) throw new Error('Không tải được ảnh lên. Vui lòng thử lại.')
      if (action === 'deliver') return shipperService.deliverOrder(orderId, urls)
      return shipperService.failOrder(orderId, {
        reason: proof?.reason ?? 'KHAC',
        note: proof?.note?.trim() || undefined,
        callAttempts: proof?.callAttempts ?? 0,
        proofImageUrls: urls,
      })
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: shipperKeys.all })
      void qc.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}
