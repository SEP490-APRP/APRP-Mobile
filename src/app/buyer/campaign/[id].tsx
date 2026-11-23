import { useLocalSearchParams } from 'expo-router'
import { CampaignDetailView } from '@/features/campaign'

/** Chi tiết chiến dịch cho Khách mua (pages/CampaignDetailPage.tsx bản web) */
export default function BuyerCampaignDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <CampaignDetailView id={Number(id) || null} />
}
