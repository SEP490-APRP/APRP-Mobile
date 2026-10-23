import { router } from 'expo-router'
import { Eye, Heart, MessageCircle } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText, Skeleton } from '@/components/ui'
import type { BlogResponse } from '@/services/blog.service'
import { colors } from '@/theme/colors'
import {
  compactCount,
  formatStoryDate,
  readingMinutes,
  storyAuthor,
  storyCategoryLabel,
  storyDate,
  storyExcerpt,
  storyId,
  storyImage,
  storyViews,
} from '../utils/storyContent'
import { StoryImage } from './StoryImage'

export const openStory = (b: BlogResponse) =>
  router.push({ pathname: '/buyer/story/[id]', params: { id: String(storyId(b)) } })

/** Lượt tim, bình luận, xem; chỉ để đọc (thả tim nằm trong màn đọc bài). */
export function StoryStats({ story: b, light }: { story: BlogResponse; light?: boolean }) {
  const tone = light ? 'text-white/85' : 'text-ink-muted'
  const icon = light ? colors.white : colors.inkSubtle
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-row items-center gap-1">
        <Heart
          size={13}
          color={b.isLikedByCurrentUser ? colors.sale : icon}
          fill={b.isLikedByCurrentUser ? colors.sale : 'transparent'}
        />
        <AppText className={`text-xs ${tone}`}>{compactCount(b.likeCount)}</AppText>
      </View>
      <View className="flex-row items-center gap-1">
        <MessageCircle size={13} color={icon} />
        <AppText className={`text-xs ${tone}`}>{compactCount(b.commentCount)}</AppText>
      </View>
      <View className="flex-row items-center gap-1">
        <Eye size={13} color={icon} />
        <AppText className={`text-xs ${tone}`}>{compactCount(storyViews(b))}</AppText>
      </View>
    </View>
  )
}

/** Bài nổi bật đầu trang: ảnh lớn, chữ đè lên nền tối. */
export function FeaturedStory({ story: b }: { story: BlogResponse }) {
  return (
    <Pressable
      onPress={() => openStory(b)}
      accessibilityRole="link"
      accessibilityLabel={`Bài nổi bật: ${b.title}`}
      className="h-72 overflow-hidden rounded-panel bg-leaf-800 active:opacity-90"
    >
      <StoryImage uri={storyImage(b)} alt={b.title} />
      <View className="absolute inset-x-0 bottom-0 gap-2 bg-black/60 p-4">
        <View className="flex-row items-center gap-2">
          <View className="rounded-full bg-sun-300 px-2.5 py-0.5">
            <AppText weight="bold" className="text-xs text-leaf-800">
              Nổi bật
            </AppText>
          </View>
          <AppText weight="semibold" className="text-xs text-white/85">
            {storyCategoryLabel(b.category)}
          </AppText>
        </View>
        <AppText weight="extrabold" numberOfLines={2} className="text-xl leading-snug text-white">
          {b.title}
        </AppText>
        <AppText numberOfLines={2} className="text-sm text-white/85">
          {storyExcerpt(b.content, 120)}
        </AppText>
        <View className="flex-row items-center justify-between">
          <AppText numberOfLines={1} className="flex-1 text-xs text-white/85">
            {storyAuthor(b)} · {readingMinutes(b.content)} phút đọc
          </AppText>
          <StoryStats story={b} light />
        </View>
      </View>
    </Pressable>
  )
}

/** Thẻ dọc nhỏ cho dải "Đang được quan tâm". */
export function TrendingStory({ story: b, rank }: { story: BlogResponse; rank: number }) {
  return (
    <Pressable
      onPress={() => openStory(b)}
      accessibilityRole="link"
      accessibilityLabel={b.title}
      className="w-56 overflow-hidden rounded-2xl border border-line bg-white active:opacity-90"
    >
      <View className="h-28 bg-leaf-50">
        <StoryImage uri={storyImage(b)} alt={b.title} />
        <View className="absolute left-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-leaf-700">
          <AppText weight="extrabold" className="text-xs text-white">
            {rank}
          </AppText>
        </View>
      </View>
      <View className="gap-1.5 p-3">
        <AppText weight="bold" numberOfLines={2} className="text-sm leading-snug">
          {b.title}
        </AppText>
        <StoryStats story={b} />
      </View>
    </Pressable>
  )
}

/** Dòng bài viết trong danh sách: ảnh vuông bên trái, tiêu đề và trích đoạn bên phải. */
export function StoryRow({ story: b }: { story: BlogResponse }) {
  return (
    <Pressable
      onPress={() => openStory(b)}
      accessibilityRole="link"
      accessibilityLabel={b.title}
      className="flex-row gap-3 rounded-2xl border border-line bg-white p-3 active:opacity-90"
    >
      <View className="h-24 w-24 overflow-hidden rounded-xl bg-leaf-50">
        <StoryImage uri={storyImage(b)} alt={b.title} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <AppText weight="semibold" numberOfLines={1} className="text-xs text-leaf-700">
          {storyCategoryLabel(b.category)}
        </AppText>
        <AppText weight="bold" numberOfLines={2} className="text-sm leading-snug">
          {b.title}
        </AppText>
        <AppText numberOfLines={1} className="text-xs text-ink-muted">
          {storyAuthor(b)}
          {storyDate(b) ? ` · ${formatStoryDate(storyDate(b))}` : ''}
        </AppText>
        <StoryStats story={b} />
      </View>
    </Pressable>
  )
}

export function StoryRowSkeleton() {
  return (
    <View className="flex-row gap-3 rounded-2xl border border-line bg-white p-3">
      <Skeleton className="h-24 w-24 rounded-xl" />
      <View className="flex-1 gap-2 py-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-24" />
      </View>
    </View>
  )
}
