import { router } from 'expo-router'
import { BookOpen, Eye, Heart, MessageCircle, Pencil, PenLine, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Pressable, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  compactCount,
  formatStoryDate,
  storyCategoryLabel,
  storyDate,
  storyExcerpt,
  storyId,
  storyImage,
  storyViews,
} from '@/features/blog/utils/storyContent'
import { ProduceImage } from '@/features/product'
import { BLOG_STATUS_LABEL, useDeleteShopBlog, useMyShopBlogs } from '@/features/shop'
import type { BlogResponse } from '@/services/blog.types'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

const STATUS_CHIP: Record<string, string> = {
  PUBLISHED: 'bg-leaf-50 text-leaf-800',
  DRAFT: 'bg-amber-50 text-amber-800',
  HIDDEN: 'bg-rose-50 text-rose-800',
  ARCHIVED: 'bg-gray-100 text-gray-700',
}

/** Bài viết của Nhà vườn, chuyển từ pages/farmer/FarmerBlogs.tsx. */
export default function ShopBlogs() {
  const blogs = useMyShopBlogs()
  const remove = useDeleteShopBlog()
  const showToast = useUiStore((s) => s.showToast)
  const [pendingDelete, setPendingDelete] = useState<BlogResponse | null>(null)

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/account'))
  const openEditor = (id?: number) =>
    router.push(id ? { pathname: '/shop/blog-editor', params: { id: String(id) } } : '/shop/blog-editor')

  const list = blogs.data ?? []
  const totals = list.reduce(
    (t, b) => ({
      views: t.views + storyViews(b),
      likes: t.likes + (b.likeCount ?? 0),
      comments: t.comments + (b.commentCount ?? 0),
    }),
    { views: 0, likes: 0, comments: 0 },
  )

  const confirmDelete = () => {
    if (!pendingDelete) return
    remove.mutate(storyId(pendingDelete), {
      onSuccess: () => showToast('Đã xoá bài viết.'),
      onError: (err) => showToast(getErrorMessage(err, 'Chưa xoá được bài viết.')),
      onSettled: () => setPendingDelete(null),
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={goBack} />
        <View className="flex-1">
          <AppText accessibilityRole="header" weight="extrabold" className="text-base">
            Chuyện nhà vườn
          </AppText>
          <AppText className="text-xs text-ink-muted">Kể chuyện mùa vụ để khách thêm tin và thương vườn</AppText>
        </View>
      </View>

      <FlatList
        data={blogs.isPending || blogs.isError ? [] : list}
        keyExtractor={(b) => String(storyId(b))}
        contentContainerClassName="gap-3 p-4 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={blogs.isRefetching}
            onRefresh={() => void blogs.refetch()}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
        ListHeaderComponent={
          list.length > 0 ? (
            <View className="flex-row rounded-panel border border-line bg-white py-3">
              <Stat label="Bài viết" value={list.length} icon={BookOpen} />
              <Stat label="Lượt xem" value={totals.views} icon={Eye} />
              <Stat label="Lượt thích" value={totals.likes} icon={Heart} />
              <Stat label="Bình luận" value={totals.comments} icon={MessageCircle} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          blogs.isPending ? (
            <View className="gap-3">
              <Skeleton className="h-28 rounded-panel" />
              <Skeleton className="h-28 rounded-panel" />
            </View>
          ) : blogs.isError ? (
            <ErrorState onRetry={() => void blogs.refetch()} />
          ) : (
            <EmptyState
              icon={<PenLine size={30} color={colors.leaf600} />}
              title="Chưa có bài viết nào"
              description="Kể về một ngày ở vườn, mẹo bảo quản hay mùa vụ sắp tới. Bài đăng sẽ hiện ở mục Chuyện nhà nông."
            />
          )
        }
        renderItem={({ item: b }) => {
          const [chipBg, chipText] = (STATUS_CHIP[b.status] ?? STATUS_CHIP.ARCHIVED).split(' ')
          const id = storyId(b)
          return (
            <View className="rounded-panel border border-line bg-white p-3">
              <Pressable
                onPress={() => openEditor(id)}
                accessibilityRole="button"
                accessibilityLabel={`Sửa bài ${b.title}`}
                className="flex-row gap-3"
              >
                <View className="h-20 w-20 overflow-hidden rounded-xl border border-line">
                  <ProduceImage src={storyImage(b) ?? ''} alt={b.title} />
                </View>
                <View className="min-w-0 flex-1 gap-1">
                  <View className="flex-row items-center gap-1.5">
                    <View className={cn('rounded-full px-2 py-0.5', chipBg)}>
                      <AppText weight="bold" className={cn('text-xs', chipText)}>
                        {BLOG_STATUS_LABEL[b.status] ?? b.status}
                      </AppText>
                    </View>
                    <AppText numberOfLines={1} className="flex-1 text-xs text-ink-muted">
                      {storyCategoryLabel(b.category)}
                    </AppText>
                  </View>
                  <AppText weight="bold" numberOfLines={2} className="text-base leading-snug">
                    {b.title}
                  </AppText>
                  <AppText numberOfLines={1} className="text-xs text-ink-muted">
                    {storyExcerpt(b.content, 80)}
                  </AppText>
                </View>
              </Pressable>
              <View className="mt-2.5 flex-row items-center gap-3 border-t border-line pt-2.5">
                <AppText className="flex-1 text-xs text-ink-muted">
                  {formatStoryDate(storyDate(b))} · {compactCount(storyViews(b))} xem · {b.likeCount ?? 0} thích ·{' '}
                  {b.commentCount ?? 0} bình luận
                </AppText>
                <Pressable
                  onPress={() => openEditor(id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Sửa bài ${b.title}`}
                  hitSlop={6}
                  className="h-9 w-9 items-center justify-center rounded-full bg-leaf-50"
                >
                  <Pencil size={15} color={colors.leaf700} />
                </Pressable>
                <Pressable
                  onPress={() => setPendingDelete(b)}
                  accessibilityRole="button"
                  accessibilityLabel={`Xoá bài ${b.title}`}
                  hitSlop={6}
                  className="h-9 w-9 items-center justify-center rounded-full border border-line"
                >
                  <Trash2 size={15} color={colors.sale} />
                </Pressable>
              </View>
            </View>
          )
        }}
      />

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <Button title="Viết bài mới" icon={PenLine} onPress={() => openEditor()} className="min-h-[48px]" />
      </View>

      <ConfirmDialog
        visible={pendingDelete != null}
        title="Xoá bài viết này?"
        message={`"${pendingDelete?.title ?? ''}" cùng lượt thích và bình luận sẽ bị xoá, không khôi phục được.`}
        confirmLabel="Xoá bài"
        cancelLabel="Giữ lại"
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Eye }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Icon size={15} color={colors.leaf700} />
      <AppText weight="extrabold" className="text-base">
        {compactCount(value)}
      </AppText>
      <AppText className="text-xs text-ink-muted">{label}</AppText>
    </View>
  )
}
