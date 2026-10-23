import { router } from 'expo-router'
import { BookOpen, Search, X } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  FeaturedStory,
  STORY_CATEGORIES,
  StoryRow,
  StoryRowSkeleton,
  storyId,
  TrendingStory,
  useStoryFeed,
  type StoryCategoryFilter,
} from '@/features/blog'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'

/** Chuyện nhà nông, chuyển từ pages/FarmerStoriesPage.tsx: lọc danh mục, tìm kiếm, bài nổi bật và tải thêm. */
export default function StoriesScreen() {
  const [category, setCategory] = useState<StoryCategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Chờ 350ms sau lần gõ cuối mới gọi API, như bản web.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 350)
    return () => clearTimeout(t)
  }, [query])

  const feed = useStoryFeed(category, search)
  const stories = useMemo(() => feed.data?.pages.flatMap((p) => p.content) ?? [], [feed.data])
  const total = feed.data?.pages[0]?.totalElements ?? 0
  // Bài 1 nổi bật, bài 2–4 vào dải "Đang được quan tâm" (khi đủ bài), còn lại là danh sách.
  const featured = stories[0]
  const trending = stories.length > 4 ? stories.slice(1, 4) : []
  const rest = stories.slice(1 + trending.length)
  const filtered = category !== 'all' || !!search

  const refresh = async () => {
    setRefreshing(true)
    await feed.refetch()
    setRefreshing(false)
  }

  const reset = () => {
    setCategory('all')
    setQuery('')
    setSearch('')
  }

  const header = (
    <View className="gap-4 pb-1">
      {feed.isPending ? <Skeleton className="h-72 rounded-panel" /> : featured && <FeaturedStory story={featured} />}
      {trending.length > 0 && (
        <View className="gap-3">
          <AppText weight="extrabold" className="text-lg">
            Đang được quan tâm
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3"
            className="-mx-4"
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {trending.map((b, i) => (
              <TrendingStory key={storyId(b)} story={b} rank={i + 2} />
            ))}
          </ScrollView>
        </View>
      )}
      {rest.length > 0 && (
        <AppText weight="extrabold" className="text-lg">
          Bài viết mới
        </AppText>
      )}
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="gap-3 border-b border-line bg-paper pb-3">
        <View className="flex-row items-center gap-2 px-3">
          <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer'))} />
          <View className="flex-1">
            <AppText accessibilityRole="header" weight="extrabold" className="text-base">
              Chuyện nhà nông
            </AppText>
            <AppText className="text-xs text-ink-muted">
              {feed.isPending ? 'Đang tải…' : `${total} bài viết từ các nhà vườn`}
            </AppText>
          </View>
        </View>
        <View className="mx-4 h-11 flex-row items-center rounded-xl border border-line bg-white pl-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm bài viết, mẹo hay, mùa vụ…"
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Tìm bài viết"
            returnKeyType="search"
            onSubmitEditing={() => setSearch(query.trim())}
            className="h-full flex-1 px-2 text-sm text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
          {!!query && (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá"
              hitSlop={8}
              className="h-full justify-center px-3"
            >
              <X size={16} color={colors.inkSubtle} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {STORY_CATEGORIES.map((c) => {
            const active = c.id === category
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={cn(
                  'h-9 items-center justify-center rounded-full border px-4',
                  active ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white',
                )}
              >
                <AppText weight="semibold" className={cn('text-sm', active ? 'text-white' : 'text-ink-muted')}>
                  {c.label}
                </AppText>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <FlatList
        data={feed.isError ? [] : rest}
        keyExtractor={(b) => String(storyId(b))}
        ListHeaderComponent={feed.isError || (!feed.isPending && !stories.length) ? undefined : header}
        contentContainerClassName="gap-3 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage()
        }}
        ListEmptyComponent={
          feed.isPending ? (
            <View className="gap-3">
              <StoryRowSkeleton />
              <StoryRowSkeleton />
            </View>
          ) : feed.isError ? (
            <ErrorState onRetry={() => void feed.refetch()} />
          ) : stories.length ? undefined : (
            <EmptyState
              icon={<BookOpen size={30} color={colors.leaf600} />}
              title={filtered ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào'}
              description={
                filtered
                  ? 'Thử từ khoá khác hoặc chọn "Tất cả bài viết".'
                  : 'Các nhà vườn sẽ sớm chia sẻ câu chuyện mùa vụ của họ.'
              }
              action={filtered ? <Button title="Xem tất cả bài viết" onPress={reset} /> : undefined}
            />
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <ActivityIndicator color={colors.leaf700} className="py-4" />
          ) : !feed.hasNextPage && stories.length > 4 ? (
            <AppText className="py-3 text-center text-xs text-ink-subtle">Bạn đã xem hết bài viết</AppText>
          ) : undefined
        }
        renderItem={({ item }) => <StoryRow story={item} />}
      />
    </SafeAreaView>
  )
}
