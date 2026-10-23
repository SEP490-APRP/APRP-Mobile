import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import { blogService, type BlogCommentResponse, type BlogResponse } from '@/services/blog.service'
import type { PageResponse } from '@/types'
import { storyId, type StoryCategoryFilter } from '../utils/storyContent'

const FEED_SIZE = 10
const COMMENT_SIZE = 10

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (category: StoryCategoryFilter, search: string, size: number) =>
    [...blogKeys.lists(), category, search, size] as const,
  detail: (id: number) => [...blogKeys.all, 'detail', id] as const,
  comments: (id: number) => [...blogKeys.all, 'comments', id] as const,
}

type Feed = InfiniteData<PageResponse<BlogResponse>, number>
type Comments = InfiniteData<PageResponse<BlogCommentResponse>, number>

const nextPage = <T>(last: PageResponse<T>) => (last.last || !last.content.length ? undefined : last.page + 1)

/** Bài viết công khai, tải thêm khi cuộn (trang "Chuyện nhà nông"). */
export function useStoryFeed(category: StoryCategoryFilter, search: string, size = FEED_SIZE) {
  return useInfiniteQuery({
    queryKey: blogKeys.list(category, search, size),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => blogService.getPublicBlogs({ page: pageParam, size, category, search }),
    getNextPageParam: nextPage,
  })
}

export function useStory(id: number) {
  return useQuery({
    queryKey: blogKeys.detail(id),
    enabled: id > 0,
    queryFn: () => blogService.getBlogDetail(id),
  })
}

/** Sửa một bài ở mọi nơi đang cache: chi tiết và các danh sách. */
function patchStory(qc: QueryClient, id: number, patch: (b: BlogResponse) => BlogResponse) {
  qc.setQueryData<BlogResponse>(blogKeys.detail(id), (b) => (b ? patch(b) : b))
  qc.setQueriesData<Feed>({ queryKey: blogKeys.lists() }, (feed) =>
    feed
      ? {
          ...feed,
          pages: feed.pages.map((p) => ({
            ...p,
            content: p.content.map((b) => (storyId(b) === id ? patch(b) : b)),
          })),
        }
      : feed,
  )
}

const withLike = (liked: boolean) => (b: BlogResponse) =>
  b.isLikedByCurrentUser === liked
    ? b
    : { ...b, isLikedByCurrentUser: liked, likeCount: Math.max(0, (b.likeCount ?? 0) + (liked ? 1 : -1)) }

/** Thả tim / bỏ tim: đổi ngay trên màn hình, khớp lại theo kết quả server, lỗi thì trả về như cũ. */
export function useToggleStoryLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number; liked: boolean }) => blogService.toggleLike(id),
    onMutate: ({ id, liked }) => patchStory(qc, id, withLike(!liked)),
    onSuccess: (res, { id }) => patchStory(qc, id, withLike(res.isLiked)),
    onError: (_err, { id, liked }) => patchStory(qc, id, withLike(liked)),
  })
}

export function useStoryComments(id: number) {
  return useInfiniteQuery({
    queryKey: blogKeys.comments(id),
    enabled: id > 0,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => blogService.getBlogComments(id, { page: pageParam, size: COMMENT_SIZE }),
    getNextPageParam: nextPage,
  })
}

const bumpComments = (delta: number) => (b: BlogResponse) => ({
  ...b,
  commentCount: Math.max(0, (b.commentCount ?? 0) + delta),
})

export function useAddStoryComment(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => blogService.addComment(id, content.trim()),
    onSuccess: (comment) => {
      qc.setQueryData<Comments>(blogKeys.comments(id), (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((p, i) =>
                i === 0 ? { ...p, content: [comment, ...p.content], totalElements: p.totalElements + 1 } : p,
              ),
            }
          : data,
      )
      patchStory(qc, id, bumpComments(1))
    },
  })
}

export function useDeleteStoryComment(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => blogService.deleteComment(commentId),
    onSuccess: (_ok, commentId) => {
      qc.setQueryData<Comments>(blogKeys.comments(id), (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((p) => ({
                ...p,
                content: p.content.filter((c) => c.commentId !== commentId),
                totalElements: Math.max(
                  0,
                  p.totalElements - (p.content.some((c) => c.commentId === commentId) ? 1 : 0),
                ),
              })),
            }
          : data,
      )
      patchStory(qc, id, bumpComments(-1))
    },
  })
}
