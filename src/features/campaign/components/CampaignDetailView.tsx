import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useCampaign } from '../hooks/useCampaignQueries'
import { CampaignArticle } from './CampaignArticle'

/** Khung màn chi tiết chiến dịch, dùng chung cho Khách mua và Nhà vườn */
export function CampaignDetailView({ id }: { id: number | null }) {
  const insets = useSafeAreaInsets()
  const q = useCampaign(id)
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-2">
        <BackButton />
        <AppText weight="extrabold" numberOfLines={1} className="flex-1 text-lg">
          {q.data?.title ?? 'Chiến dịch giải cứu'}
        </AppText>
      </View>
      {q.isPending ? (
        <View className="gap-4 px-4">
          <Skeleton className="h-64 rounded-panel" />
          <Skeleton className="h-40 rounded-panel" />
        </View>
      ) : q.isError || !q.data ? (
        <EmptyState
          title="Không tìm thấy chiến dịch"
          description="Chiến dịch có thể đã bị gỡ hoặc đường dẫn không đúng."
          action={<Button title="Quay lại" variant="outline" icon={ArrowLeft} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
        />
      ) : (
        <CampaignArticle c={q.data} bottomInset={insets.bottom} />
      )}
    </SafeAreaView>
  )
}
