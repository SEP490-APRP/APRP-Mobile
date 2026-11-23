import type { AxiosResponse } from 'axios'
import { axiosInstance } from './api/axiosInstance'
import { unwrap as unwrapRaw } from './api/apiUtils'
import { normalizeCampaignDates } from './campaign.service'
import type { CampaignProposal, CampaignProposalRequest, NearbyShop } from './campaignProposal.types'

export type * from './campaignProposal.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrap = <T,>(res: AxiosResponse<any>): T => normalizeCampaignDates(unwrapRaw<T>(res), /(At|From|To|Date)$/)

const SHOP = '/shop/campaign-proposals'

/** Shop đề xuất mở chiến dịch giải cứu, mời shop lân cận cùng góp (chép từ bản web, bỏ phần admin) */
export const campaignProposalService = {
  async create(body: CampaignProposalRequest): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(SHOP, body))
  },
  async update(id: number, body: CampaignProposalRequest): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.put(`${SHOP}/${id}`, body))
  },
  async getMine(): Promise<CampaignProposal[]> {
    return unwrap(await axiosInstance.get(`${SHOP}/my`))
  },
  async getInvites(): Promise<CampaignProposal[]> {
    return unwrap(await axiosInstance.get(`${SHOP}/invites`))
  },
  async nearbyShops(id: number, radiusKm: number, sameCategory = false): Promise<NearbyShop[]> {
    return unwrap(await axiosInstance.get(`${SHOP}/${id}/nearby-shops`, { params: { radiusKm, sameCategory } }))
  },
  async invite(id: number, shopIds: number[], message?: string): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/${id}/invites`, { shopIds, message }))
  },
  async removeMember(id: number, shopId: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.delete(`${SHOP}/${id}/members/${shopId}`))
  },
  async submit(id: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/${id}/submit`))
  },
  async withdraw(id: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/${id}/withdraw`))
  },
  async acceptInvite(memberId: number, estimatedKg: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/invites/${memberId}/accept`, { estimatedKg }))
  },
  async declineInvite(memberId: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/invites/${memberId}/decline`))
  },
}
