import AsyncStorage from '@react-native-async-storage/async-storage'
import { axiosInstance } from './api/axiosInstance'
import { unwrap } from './api/apiUtils'
import type { SpringPage } from './wallet.types'
import type {
  ReferralCommissionResponse,
  ReferralLinkCreateRequest,
  ReferralLinkResponse,
  ReferralResolveResponse,
  ReferralStatsResponse,
} from './referral.types'

export type * from './referral.types'

const PENDING_REFERRAL_KEY = 'capnong_mobile_pending_referral'

export const referralService = {
  /** Tạo mới hoặc lấy link tiếp thị cho sản phẩm hoặc shop */
  async getOrCreateLink(data: ReferralLinkCreateRequest): Promise<ReferralLinkResponse> {
    const res = await axiosInstance.post('/referrals/links', data)
    return unwrap<ReferralLinkResponse>(res)
  },

  /** Danh sách link đã tạo của Buyer (0-based) */
  async getMyLinks(params?: { page?: number; size?: number }): Promise<SpringPage<ReferralLinkResponse>> {
    const res = await axiosInstance.get('/referrals/links/my', { params })
    return unwrap<SpringPage<ReferralLinkResponse>>(res)
  },

  /** Phân giải thông tin link referral công khai */
  async resolveLink(code: string): Promise<ReferralResolveResponse> {
    const res = await axiosInstance.get(`/referrals/resolve/${encodeURIComponent(code)}`)
    return unwrap<ReferralResolveResponse>(res)
  },

  /** Ghi nhận click từ client (public) */
  async trackClick(code: string): Promise<void> {
    await axiosInstance.post('/referrals/clicks', { referralCode: code })
  },

  /** Gắn mã pending của khách vào tài khoản sau login */
  async claimReferral(code: string): Promise<void> {
    await axiosInstance.post('/referrals/claim', { referralCode: code })
  },

  /** Thống kê hoa hồng của tôi */
  async getDashboard(): Promise<ReferralStatsResponse> {
    const res = await axiosInstance.get('/referrals/dashboard')
    return unwrap<ReferralStatsResponse>(res)
  },

  /** Lịch sử hoa hồng chi tiết (0-based) */
  async getMyCommissions(params?: { page?: number; size?: number }): Promise<SpringPage<ReferralCommissionResponse>> {
    const res = await axiosInstance.get('/referrals/commissions', { params })
    return unwrap<SpringPage<ReferralCommissionResponse>>(res)
  },
}

/** Lưu mã referral đang chờ claim vào AsyncStorage */
export async function savePendingReferral(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PENDING_REFERRAL_KEY,
      JSON.stringify({
        code,
        timestamp: Date.now(),
      }),
    )
  } catch {
    // ignore
  }
}

/** Tự động claim mã referral đang chờ nếu có */
export async function claimPendingReferral(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_REFERRAL_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as { code: string; timestamp: number }
    if (data?.code && Date.now() - (data.timestamp || 0) < 7 * 24 * 60 * 60 * 1000) {
      await referralService.claimReferral(data.code).catch(() => {})
    }
    await AsyncStorage.removeItem(PENDING_REFERRAL_KEY)
  } catch {
    await AsyncStorage.removeItem(PENDING_REFERRAL_KEY).catch(() => {})
  }
}

