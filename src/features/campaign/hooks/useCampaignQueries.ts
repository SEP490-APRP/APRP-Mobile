import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  campaignProposalService,
  campaignService,
  notificationService,
  shipperPreOrderService,
  type CampaignPhase,
  type CampaignProposalRequest,
  type FarmRegistrationRequest,
} from '@/services'

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (phase: CampaignPhase, page: number, size: number) => [...campaignKeys.all, 'list', phase, page, size] as const,
  detail: (id: number) => [...campaignKeys.all, 'detail', id] as const,
  homeBanners: () => [...campaignKeys.all, 'home-banners'] as const,
  myPreOrders: () => ['pre-orders', 'my'] as const,
  shipQuote: (...args: unknown[]) => ['campaign-ship-quote', ...args] as const,
  shopCalls: () => ['shop-campaigns', 'calls'] as const,
  shopMine: () => ['shop-campaigns', 'mine'] as const,
  shopInviteNotis: () => ['notifications', 'my', 'campaign-invites'] as const,
  proposalsMine: () => ['campaign-proposals', 'mine'] as const,
  proposalInvites: () => ['campaign-proposals', 'invites'] as const,
  nearby: (id: number, radius: number, same: boolean) => ['campaign-proposals', id, 'nearby', radius, same] as const,
  shipperAll: ['shipper-preorders'] as const,
}

/* ───── Khách mua ───── */

/** Danh sách chiến dịch theo giai đoạn (bộ lọc trên màn Chiến dịch) */
export function useCampaignsByPhase(phase: CampaignPhase, page = 0, size = 10) {
  return useQuery({
    queryKey: campaignKeys.list(phase, page, size),
    queryFn: () => campaignService.getCampaigns(phase, page, size),
    staleTime: 60_000,
    retry: 1,
  })
}

/** Banner chiến dịch ở đầu trang chủ (Admin chọn). Lỗi thì trang chủ bỏ qua khối này. */
export function useHomeBanners() {
  return useQuery({
    queryKey: campaignKeys.homeBanners(),
    queryFn: () => campaignService.getHomeBanners(),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useCampaign(campaignId: number | null) {
  return useQuery({
    queryKey: campaignKeys.detail(campaignId ?? 0),
    queryFn: () => campaignService.getCampaign(campaignId as number),
    enabled: !!campaignId,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useMyPreOrders(enabled = true) {
  return useQuery({
    queryKey: campaignKeys.myPreOrders(),
    queryFn: async () => (await campaignService.getMyPreOrders(0, 50)).content ?? [],
    enabled,
  })
}

export function useCancelPreOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => campaignService.cancelPreOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.myPreOrders() }),
  })
}

/* ───── Nhà vườn ───── */

export function useOpenFarmCalls() {
  return useQuery({ queryKey: campaignKeys.shopCalls(), queryFn: () => campaignService.getOpenFarmCalls(), retry: 1 })
}

export function useMyRegistrations() {
  return useQuery({ queryKey: campaignKeys.shopMine(), queryFn: () => campaignService.getMyRegistrations(), retry: 1 })
}

export function useRegisterFarm(campaignId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: FarmRegistrationRequest) => campaignService.registerFarm(campaignId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-campaigns'] }),
  })
}

/** Lời mời góp hàng của CapNong gửi qua thông báo của shop */
export function useCampaignInviteNotifications() {
  return useQuery({
    queryKey: campaignKeys.shopInviteNotis(),
    queryFn: async () => (await notificationService.getMyNotifications()).result ?? [],
    retry: 1,
  })
}

export function useMyProposals() {
  return useQuery({ queryKey: campaignKeys.proposalsMine(), queryFn: () => campaignProposalService.getMine(), retry: 1 })
}

export function useProposalInvites() {
  return useQuery({ queryKey: campaignKeys.proposalInvites(), queryFn: () => campaignProposalService.getInvites(), retry: 1 })
}

/** Làm mới cả đề xuất của tôi lẫn lời mời */
export function useRefreshProposals() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['campaign-proposals'] })
}

export function useSaveProposal() {
  const refresh = useRefreshProposals()
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: CampaignProposalRequest }) =>
      id ? campaignProposalService.update(id, body) : campaignProposalService.create(body),
    onSuccess: () => void refresh(),
  })
}

export function useNearbyShops(id: number, radiusKm: number, sameCategory: boolean, enabled: boolean) {
  return useQuery({
    queryKey: campaignKeys.nearby(id, radiusKm, sameCategory),
    queryFn: () => campaignProposalService.nearbyShops(id, radiusKm, sameCategory),
    enabled,
  })
}

/* ───── Tài xế ───── */

export function useShipperPreOrders() {
  const ready = useQuery({
    queryKey: [...campaignKeys.shipperAll, 'ready'],
    queryFn: shipperPreOrderService.ready,
    refetchInterval: 30_000,
  })
  const mine = useQuery({
    queryKey: [...campaignKeys.shipperAll, 'mine'],
    queryFn: shipperPreOrderService.mine,
    refetchInterval: 30_000,
  })
  return { ready, mine }
}

export function useShipperPreOrderAction() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: campaignKeys.shipperAll })
  const accept = useMutation({ mutationFn: (id: number) => shipperPreOrderService.accept(id), onSuccess: refresh })
  const deliver = useMutation({
    mutationFn: ({ id, pod }: { id: number; pod?: string }) => shipperPreOrderService.deliver(id, pod),
    onSuccess: refresh,
  })
  const fail = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => shipperPreOrderService.fail(id, reason),
    onSuccess: refresh,
  })
  return { accept, deliver, fail }
}
