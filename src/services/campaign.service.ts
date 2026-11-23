import type { AxiosResponse } from 'axios'
import { axiosInstance } from './api/axiosInstance'
import { unwrap as unwrapRaw } from './api/apiUtils'
import type {
  CampaignPage,
  CampaignPhase,
  CampaignResponse,
  DamageClaim,
  FarmRegistrationRequest,
  FarmRegistrationResponse,
  HomeBannerConfig,
  PreOrderCreateRequest,
  PreOrderResponse,
  ShippingQuote,
} from './campaign.types'

export type * from './campaign.types'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * BE trả LocalDate/LocalDateTime dạng mảng [yyyy, M, d, H, m, s]. Interceptor chung chỉ đổi khoá …At/…Date,
 * nên ở đây đổi thêm deliverBy, damageClaimDeadline (giống campaign.service bản web).
 */
export function normalizeCampaignDates<T>(v: T, keyPattern = /(At|Date|By|Deadline)$/): T {
  if (Array.isArray(v)) return v.map((x) => normalizeCampaignDates(x, keyPattern)) as T
  if (!v || typeof v !== 'object') return v
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (keyPattern.test(k) && Array.isArray(val) && val.length >= 3 && val.every((x) => typeof x === 'number')) {
      const [y, mo, d, h, mi, se = 0] = val as number[]
      out[k] = h == null ? `${y}-${pad(mo)}-${pad(d)}` : `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi ?? 0)}:${pad(se)}`
    } else {
      out[k] = normalizeCampaignDates(val, keyPattern)
    }
  }
  return out as T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrap = <T,>(res: AxiosResponse<any>): T => normalizeCampaignDates(unwrapRaw<T>(res))

/** Chiến dịch giải cứu: chép từ campaign.service bản web, giữ nguyên endpoint */
export const campaignService = {
  /** Danh sách công khai theo giai đoạn: sắp mở / đang diễn ra / đang giao / đã hoàn thành */
  async getCampaigns(phase: CampaignPhase, page = 0, size = 10): Promise<CampaignPage<CampaignResponse>> {
    return unwrap(await axiosInstance.get('/campaigns', { params: { phase, page, size } }))
  },
  async getActiveCampaigns(page = 0, size = 10): Promise<CampaignPage<CampaignResponse>> {
    return campaignService.getCampaigns('ONGOING', page, size)
  },
  /** Banner đầu trang chủ do Admin chọn */
  async getHomeBanners(): Promise<HomeBannerConfig> {
    return unwrap(await axiosInstance.get('/campaigns/home-banners'))
  },
  async getCampaign(campaignId: number): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.get(`/campaigns/${campaignId}`))
  },

  /** Người mua đặt thùng + nhận link cọc PayOS (checkoutUrl) */
  async createPreOrder(campaignId: number, body: PreOrderCreateRequest): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/campaigns/${campaignId}/pre-orders`, body))
  },
  async getMyPreOrders(page = 0, size = 10): Promise<CampaignPage<PreOrderResponse>> {
    return unwrap(await axiosInstance.get('/pre-orders/my', { params: { page, size } }))
  },
  async cancelPreOrder(preOrderId: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/pre-orders/${preOrderId}/cancel`))
  },
  /** Hỏi BE (BE hỏi PayOS) xem tiền cọc đã về chưa; gọi nhiều lần vẫn an toàn */
  async confirmDepositPayment(preOrderId: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/pre-orders/${preOrderId}/confirm-payment`))
  },
  /** Báo giá phí giao trước khi đặt */
  async quoteShipping(
    campaignId: number,
    params: { totalKg: number; method: 'DELIVERY' | 'PICKUP'; lat?: number; lng?: number; address?: string },
  ): Promise<ShippingQuote> {
    return unwrap(await axiosInstance.get(`/campaigns/${campaignId}/shipping-quote`, { params }))
  },
  /** Báo hàng hư: số kg tự cân + ảnh cân / ảnh hàng (không cần hoàn hàng) */
  async reportDamage(preOrderId: number, body: { claimedKg: number; photoUrls: string[]; reason?: string }): Promise<DamageClaim> {
    return unwrap(await axiosInstance.post(`/pre-orders/${preOrderId}/damage-claims`, body))
  },
  async myDamageClaims(preOrderId: number): Promise<DamageClaim[]> {
    return unwrap(await axiosInstance.get(`/pre-orders/${preOrderId}/damage-claims`))
  },

  /* ───── Nhà vườn (shop) ───── */

  /** Chiến dịch đang kêu gọi nhà vườn góp hàng */
  async getOpenFarmCalls(): Promise<CampaignResponse[]> {
    return unwrap(await axiosInstance.get('/shop/campaigns/calls'))
  },
  /** Đăng ký lô hàng (sản phẩm, số kg, ảnh, giá đề xuất, cam kết, thời gian bảo quản) */
  async registerFarm(campaignId: number, body: FarmRegistrationRequest): Promise<FarmRegistrationResponse> {
    return unwrap(await axiosInstance.post(`/shop/campaigns/${campaignId}/register`, body))
  },
  async getMyRegistrations(): Promise<FarmRegistrationResponse[]> {
    return unwrap(await axiosInstance.get('/shop/campaigns/my'))
  },
}

/** Shipper nhận và giao đơn chiến dịch tại hub: /shipper/pre-orders/* */
export const shipperPreOrderService = {
  /** Đơn tại hub chưa có ai nhận (xếp theo độ gấp) */
  async ready(): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.get('/shipper/pre-orders/ready'))
  },
  /** Đơn đã giao cho tôi / tôi đang giao */
  async mine(): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.get('/shipper/pre-orders/my'))
  },
  async accept(id: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/accept`))
  },
  async deliver(id: number, podImageUrl?: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/deliver`, { podImageUrl }))
  },
  async fail(id: number, reason: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/fail`, { reason }))
  },
}
