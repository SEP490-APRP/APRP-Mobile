import { Image } from 'expo-image'
import { ArrowRight, CalendarClock, MapPin, Users } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import type { CampaignResponse } from '@/services'
import { colors } from '@/theme/colors'
import { campaignExcerpt, campaignView, formatVnd } from '../utils/campaignFormat'
import { ProgressBar } from './CampaignBits'

const fallbackCover = require('../../../../assets/images/hero-farmer.jpg')

/** Thẻ chiến dịch: ảnh bìa, giá giải cứu, tiến độ đặt (hoặc gom nhà vườn khi sắp mở) */
export function CampaignCard({ c, onPress, featuredBadge }: { c: CampaignResponse; onPress: () => void; featuredBadge?: string }) {
  const v = campaignView(c)
  const tag = [c.categoryName, c.season].filter(Boolean).join(' · ') || 'Nông sản'
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={c.title}
      className="overflow-hidden rounded-panel border border-line bg-white active:opacity-90"
    >
      <View className="h-44 bg-leaf-50">
        <Image
          source={c.coverImageUrl ? { uri: c.coverImageUrl } : fallbackCover}
          contentFit="cover"
          style={{ width: '100%', height: '100%' }}
        />
        {featuredBadge && (
          <View className="absolute left-3 top-3 rounded-full bg-sale px-3 py-1">
            <AppText weight="extrabold" className="text-[11px] text-white">
              {featuredBadge}
            </AppText>
          </View>
        )}
        <View className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1">
          <AppText weight="extrabold" className="text-[10px] uppercase text-leaf-700">
            {tag}
          </AppText>
        </View>
        <View className="absolute bottom-3 right-3 flex-row items-center gap-1 rounded-full bg-black/60 px-2.5 py-1">
          <CalendarClock size={12} color={colors.white} />
          <AppText weight="semibold" className="text-[11px] text-white">
            {v.chip}
          </AppText>
        </View>
      </View>
      <View className="gap-2 p-4">
        <View className="flex-row items-center gap-1">
          <MapPin size={12} color={colors.inkSubtle} />
          <AppText numberOfLines={1} className="flex-1 text-[11px] text-ink-subtle">
            {v.place}
          </AppText>
          <View className="rounded-full bg-sun-300 px-2 py-0.5">
            <AppText weight="extrabold" className="text-[11px] text-soil-600">
              {formatVnd(c.rescuePricePerKg)}/kg
            </AppText>
          </View>
        </View>
        <AppText weight="extrabold" numberOfLines={2} className="text-lg leading-snug">
          {c.title}
        </AppText>
        <AppText numberOfLines={2} className="text-[13px] leading-relaxed text-ink-muted">
          {campaignExcerpt(c)}
        </AppText>
        <ProgressBar pct={v.pct} />
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Users size={13} color={colors.inkMuted} />
            <AppText weight="bold" className="text-xs text-ink-muted">
              {c.approvedFarmCount} nhà vườn · {Math.round(v.pct)}%
            </AppText>
          </View>
          <View className="flex-row items-center gap-1">
            <AppText weight="extrabold" className="text-xs text-leaf-700">
              Xem chiến dịch
            </AppText>
            <ArrowRight size={14} color={colors.leaf700} />
          </View>
        </View>
        <AppText className="text-[11px] text-ink-subtle">{v.progressText}</AppText>
      </View>
    </Pressable>
  )
}
