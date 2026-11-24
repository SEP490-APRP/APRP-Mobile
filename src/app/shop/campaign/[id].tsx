import { useLocalSearchParams } from 'expo-router'
import { CampaignDetailView } from '@/features/campaign'

/** Bài chiến dịch cho Nhà vườn: đọc chi tiết và đăng ký góp lô ngay trong bài */
export default function ShopCampaignDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <CampaignDetailView id={Number(id) || null} />
}
