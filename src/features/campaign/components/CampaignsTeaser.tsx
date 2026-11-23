import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ArrowRight, Flame } from 'lucide-react-native'
import { Pressable, ScrollView, View } from 'react-native'
import { AppText } from '@/components/ui'
import type { CampaignResponse } from '@/services'
import { colors } from '@/theme/colors'
import { useCampaignsByPhase, useHomeBanners } from '../hooks/useCampaignQueries'
import { campaignView, formatVnd } from '../utils/campaignFormat'
import { ProgressBar } from './CampaignBits'

const fallbackCover = require('../../../../assets/images/hero-farmer.jpg')

/** Chiến dịch đang mở trên Trang chủ (thay cho banner chiến dịch đầu trang bản web). Không có thì ẩn. */
export function CampaignsTeaser() {
  const banners = useHomeBanners()
  const ongoing = useCampaignsByPhase('ONGOING', 0, 6)
  const list: CampaignResponse[] = banners.data?.campaigns?.length ? banners.data.campaigns : (ongoing.data?.content ?? [])
  if (!list.length) return null
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Flame size={18} color="#ea580c" />
          <AppText weight="extrabold" className="text-lg">
            Chiến dịch giải cứu
          </AppText>
        </View>
        <Pressable onPress={() => router.push('/buyer/campaigns' as never)} hitSlop={8} className="flex-row items-center gap-1">
          <AppText weight="bold" className="text-sm text-leaf-700">
            Xem tất cả
          </AppText>
          <ArrowRight size={14} color={colors.leaf700} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
        {list.map((c) => {
          const v = campaignView(c)
          return (
            <Pressable
              key={c.campaignId}
              onPress={() => router.push(`/buyer/campaign/${c.campaignId}` as never)}
              className="w-72 overflow-hidden rounded-panel border border-line bg-white active:opacity-90"
            >
              <View className="h-32">
                <Image source={c.coverImageUrl ? { uri: c.coverImageUrl } : fallbackCover} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                <View className="absolute bottom-2 right-2 rounded-full bg-sun-300 px-2 py-0.5">
                  <AppText weight="extrabold" className="text-[11px] text-soil-600">
                    {formatVnd(c.rescuePricePerKg)}/kg
                  </AppText>
                </View>
                <View className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5">
                  <AppText weight="semibold" className="text-[11px] text-white">
                    {v.chip}
                  </AppText>
                </View>
              </View>
              <View className="gap-2 p-3">
                <AppText weight="extrabold" numberOfLines={2} className="text-sm leading-snug">
                  {c.bannerHeadline || c.title}
                </AppText>
                <ProgressBar pct={v.pct} />
                <AppText className="text-[11px] text-ink-subtle">{v.progressText}</AppText>
              </View>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
