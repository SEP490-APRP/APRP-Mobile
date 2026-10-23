import { router } from 'expo-router'
import { ArrowRight, BookOpen } from 'lucide-react-native'
import { Pressable, ScrollView, View } from 'react-native'
import { AppText, Skeleton } from '@/components/ui'
import { storyId, TrendingStory, useStoryFeed } from '@/features/blog'
import { colors } from '@/theme/colors'

/** Ba bài "Chuyện nhà nông" mới nhất trên Trang chủ; ẩn hẳn khi lỗi hoặc chưa có bài. */
export function StoriesTeaser() {
  const feed = useStoryFeed('all', '', 3)
  const stories = feed.data?.pages[0]?.content ?? []
  if (feed.isError || (!feed.isPending && !stories.length)) return null

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <BookOpen size={18} color={colors.leaf700} />
          <AppText weight="extrabold" className="text-lg">
            Chuyện nhà nông
          </AppText>
        </View>
        <Pressable
          onPress={() => router.push('/buyer/stories')}
          accessibilityRole="link"
          hitSlop={8}
          className="flex-row items-center gap-1"
        >
          <AppText weight="bold" className="text-sm text-leaf-700">
            Xem tất cả
          </AppText>
          <ArrowRight size={15} color={colors.leaf700} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5"
        contentContainerClassName="gap-3"
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {feed.isPending
          ? [0, 1].map((i) => <Skeleton key={i} className="h-52 w-56 rounded-2xl" />)
          : stories.map((b, i) => <TrendingStory key={storyId(b)} story={b} rank={i + 1} />)}
      </ScrollView>
    </View>
  )
}
