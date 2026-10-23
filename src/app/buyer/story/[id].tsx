import { router, useLocalSearchParams } from 'expo-router'
import { Clock, Eye, Heart, MessageCircle, Send, Share2, Store } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, ConfirmDialog, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  compactCount,
  formatStoryDate,
  parseStoryContent,
  readingMinutes,
  StoryBody,
  StoryComment,
  StoryImage,
  storyAuthor,
  storyCategoryLabel,
  storyDate,
  storyImage,
  storyShareUrl,
  storyViews,
  useAddStoryComment,
  useDeleteStoryComment,
  useStory,
  useStoryComments,
  useToggleStoryLike,
} from '@/features/blog'
import { useAuth, useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

const MAX_COMMENT = 500

/** Đọc bài "Chuyện nhà nông" (modal đọc bài của bản web): nội dung, thả tim, chia sẻ và bình luận. */
export default function StoryScreen() {
  const { id: raw } = useLocalSearchParams<{ id: string }>()
  const id = Number(raw) || 0
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const showToast = useUiStore((s) => s.showToast)
  const story = useStory(id)
  const comments = useStoryComments(id)
  const like = useToggleStoryLike()
  const addComment = useAddStoryComment(id)
  const deleteComment = useDeleteStoryComment(id)
  const [draft, setDraft] = useState('')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const b = story.data
  const blocks = useMemo(() => parseStoryContent(b?.content), [b?.content])
  const list = comments.data?.pages.flatMap((p) => p.content) ?? []
  const commentTotal = Math.max(b?.commentCount ?? 0, comments.data?.pages[0]?.totalElements ?? 0)

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/buyer/stories'))

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([story.refetch(), comments.refetch()])
    setRefreshing(false)
  }

  const toggleLike = () => {
    if (!b) return
    like.mutate(
      { id, liked: !!b.isLikedByCurrentUser },
      { onError: (err) => showToast(getErrorMessage(err, 'Chưa thả tim được, thử lại nhé.')) },
    )
  }

  const share = async () => {
    if (!b) return
    const url = storyShareUrl(id)
    try {
      await Share.share({ title: b.title, message: `${b.title} – Chuyện nhà nông trên CapNong ${url}`, url })
    } catch {
      /* người dùng đóng bảng chia sẻ */
    }
  }

  const send = () => {
    const text = draft.trim()
    if (!text || addComment.isPending) return
    addComment.mutate(text, {
      onSuccess: () => setDraft(''),
      onError: (err) => showToast(getErrorMessage(err, 'Chưa gửi được bình luận.')),
    })
  }

  const remove = () => {
    if (confirmId == null) return
    deleteComment.mutate(confirmId, {
      onSuccess: () => showToast('Đã xoá bình luận.'),
      onError: (err) => showToast(getErrorMessage(err, 'Chưa xoá được bình luận.')),
      onSettled: () => setConfirmId(null),
    })
  }

  if (story.isPending || story.isError || !b) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center px-3 pb-2">
          <BackButton onPress={goBack} />
        </View>
        {story.isPending ? (
          <View className="gap-4 p-4">
            <Skeleton className="h-60 rounded-panel" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </View>
        ) : (
          <ErrorState
            title="Không mở được bài viết"
            description="Bài viết có thể đã bị ẩn hoặc kết nối đang chập chờn."
            onRetry={() => void story.refetch()}
          />
        )}
      </SafeAreaView>
    )
  }

  const liked = !!b.isLikedByCurrentUser
  const date = formatStoryDate(storyDate(b))

  return (
    <KeyboardAvoidingView className="flex-1 bg-paper" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        <View className="h-72 bg-leaf-800">
          <StoryImage uri={storyImage(b)} alt={b.title} />
          <View
            className="absolute inset-x-0 top-0 flex-row items-center justify-between px-3"
            style={{ paddingTop: insets.top + 6 }}
          >
            <View className="rounded-full bg-white/90">
              <BackButton onPress={goBack} />
            </View>
            <Pressable
              onPress={() => void share()}
              accessibilityRole="button"
              accessibilityLabel="Chia sẻ bài viết"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/90"
            >
              <Share2 size={19} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <View className="-mt-6 gap-4 rounded-t-3xl bg-paper px-5 pt-5">
          <View className="self-start rounded-full bg-leaf-100 px-3 py-1">
            <AppText weight="bold" className="text-xs text-leaf-800">
              {storyCategoryLabel(b.category)}
            </AppText>
          </View>
          <AppText accessibilityRole="header" weight="extrabold" className="text-2xl leading-tight">
            {b.title}
          </AppText>

          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-leaf-100">
              {b.shopAvatar ? (
                <StoryImage uri={b.shopAvatar} alt={storyAuthor(b)} />
              ) : (
                <Store size={18} color={colors.leaf700} />
              )}
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="bold" numberOfLines={1} className="text-sm">
                {storyAuthor(b)}
              </AppText>
              <View className="flex-row flex-wrap items-center gap-x-3">
                {!!date && <AppText className="text-xs text-ink-muted">{date}</AppText>}
                <View className="flex-row items-center gap-1">
                  <Clock size={12} color={colors.inkSubtle} />
                  <AppText className="text-xs text-ink-muted">{readingMinutes(b.content)} phút đọc</AppText>
                </View>
                <View className="flex-row items-center gap-1">
                  <Eye size={12} color={colors.inkSubtle} />
                  <AppText className="text-xs text-ink-muted">{compactCount(storyViews(b))} lượt xem</AppText>
                </View>
              </View>
            </View>
            {!!b.shopId && (
              <Pressable
                onPress={() => router.push({ pathname: '/buyer/shop/[id]', params: { id: String(b.shopId) } })}
                accessibilityRole="link"
                className="rounded-full border border-leaf-700 px-3 py-1.5 active:bg-leaf-50"
              >
                <AppText weight="bold" className="text-xs text-leaf-700">
                  Ghé vườn
                </AppText>
              </Pressable>
            )}
          </View>

          <View className="h-px bg-line" />
          {blocks.length ? (
            <StoryBody blocks={blocks} />
          ) : (
            <AppText className="text-sm italic text-ink-muted">Bài viết chưa có nội dung.</AppText>
          )}

          <View className="mt-2 flex-row gap-3">
            <Pressable
              onPress={toggleLike}
              accessibilityRole="button"
              accessibilityState={{ selected: liked }}
              accessibilityLabel={liked ? 'Bỏ thả tim' : 'Thả tim bài viết'}
              className={cn(
                'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border',
                liked ? 'border-sale bg-red-50' : 'border-line bg-white',
              )}
            >
              <Heart size={18} color={liked ? colors.sale : colors.ink} fill={liked ? colors.sale : 'transparent'} />
              <AppText weight="bold" className={cn('text-sm', liked ? 'text-sale' : 'text-ink')}>
                {compactCount(b.likeCount)} · {liked ? 'Đã thích' : 'Thích'}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => void share()}
              accessibilityRole="button"
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-line bg-white"
            >
              <Share2 size={18} color={colors.ink} />
              <AppText weight="bold" className="text-sm">
                Chia sẻ
              </AppText>
            </Pressable>
          </View>

          <View className="gap-3 pt-2">
            <View className="flex-row items-center gap-2">
              <MessageCircle size={18} color={colors.leaf700} />
              <AppText weight="extrabold" className="text-lg">
                Bình luận ({commentTotal})
              </AppText>
            </View>
            {comments.isPending ? (
              <Skeleton className="h-16 rounded-2xl" />
            ) : comments.isError ? (
              <Pressable onPress={() => void comments.refetch()} accessibilityRole="button" className="py-2">
                <AppText className="text-sm text-sale">Chưa tải được bình luận. Chạm để thử lại.</AppText>
              </Pressable>
            ) : list.length === 0 ? (
              <AppText className="text-sm text-ink-muted">Chưa có bình luận nào. Hãy là người đầu tiên!</AppText>
            ) : (
              list.map((c) => (
                <StoryComment
                  key={c.commentId}
                  comment={c}
                  mine={!!user && String(c.userId) === user.id}
                  onDelete={() => setConfirmId(c.commentId)}
                />
              ))
            )}
            {comments.hasNextPage && (
              <Pressable
                onPress={() => void comments.fetchNextPage()}
                disabled={comments.isFetchingNextPage}
                accessibilityRole="button"
                className="items-center py-2"
              >
                {comments.isFetchingNextPage ? (
                  <ActivityIndicator color={colors.leaf700} />
                ) : (
                  <AppText weight="bold" className="text-sm text-leaf-700">
                    Xem thêm bình luận
                  </AppText>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        className="flex-row items-end gap-2 border-t border-line bg-white px-4 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Viết bình luận…"
          placeholderTextColor={colors.inkSubtle}
          accessibilityLabel="Viết bình luận"
          multiline
          numberOfLines={1}
          maxLength={MAX_COMMENT}
          className="max-h-28 min-h-[44px] flex-1 rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm text-ink"
          style={{ fontFamily: fontFamily.regular }}
        />
        <Pressable
          onPress={send}
          disabled={!draft.trim() || addComment.isPending}
          accessibilityRole="button"
          accessibilityLabel="Gửi bình luận"
          className={cn(
            'h-11 w-11 items-center justify-center rounded-full',
            draft.trim() ? 'bg-leaf-700' : 'bg-leaf-200',
          )}
        >
          {addComment.isPending ? <ActivityIndicator color={colors.white} /> : <Send size={18} color={colors.white} />}
        </Pressable>
      </View>

      <ConfirmDialog
        visible={confirmId != null}
        title="Xoá bình luận?"
        message="Bình luận sẽ bị xoá vĩnh viễn khỏi bài viết."
        confirmLabel="Xoá"
        destructive
        loading={deleteComment.isPending}
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />
    </KeyboardAvoidingView>
  )
}
