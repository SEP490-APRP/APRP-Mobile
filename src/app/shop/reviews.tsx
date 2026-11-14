import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  CheckCircle2,
  MessageCircleReply,
  Package,
  RefreshCw,
  Search,
  Star,
  User,
  X,
} from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  useShopReplyReview,
  useShopReviewReport,
  useShopReviews,
  type ReviewResponse,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

type FilterKey = 'ALL' | 'UNREPLIED' | 'HAS_IMAGE' | '5' | '4' | '3' | '2' | '1'

const FILTER_ITEMS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'UNREPLIED', label: 'Chưa trả lời' },
  { key: 'HAS_IMAGE', label: 'Có hình ảnh' },
  { key: '5', label: '5 sao' },
  { key: '4', label: '4 sao' },
  { key: '3', label: '3 sao' },
  { key: '2', label: '2 sao' },
  { key: '1', label: '1 sao' },
]

export default function ShopReviewsScreen() {
  const showToast = useUiStore((s) => s.showToast)
  const [filter, setFilter] = useState<FilterKey>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Reply Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null)
  const [replyText, setReplyText] = useState('')

  const reviewsQuery = useShopReviews(0, 50)
  const reportQuery = useShopReviewReport()
  const replyMutation = useShopReplyReview()

  const rawReviews = reviewsQuery.data?.content ?? []
  const report = reportQuery.data

  const refreshAll = async () => {
    setRefreshing(true)
    await Promise.all([reviewsQuery.refetch(), reportQuery.refetch()])
    setRefreshing(false)
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/(tabs)/account'))

  // Lọc đánh giá
  const filteredReviews = useMemo(() => {
    return rawReviews.filter((rev) => {
      // Bộ lọc danh mục
      if (filter === 'UNREPLIED' && rev.replyFromShop) return false
      if (filter === 'HAS_IMAGE') {
        const hasImg = !!rev.evidence || (rev.imageUrls && rev.imageUrls.length > 0)
        if (!hasImg) return false
      }
      if (['5', '4', '3', '2', '1'].includes(filter)) {
        if (Math.round(Number(rev.ratingStar)) !== Number(filter)) return false
      }

      // Bộ lọc tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = rev.fullName?.toLowerCase().includes(q) || rev.buyerName?.toLowerCase().includes(q)
        const matchProd = rev.productName?.toLowerCase().includes(q) || rev.boxType?.toLowerCase().includes(q)
        const matchComment = rev.comment?.toLowerCase().includes(q)
        return matchName || matchProd || matchComment
      }

      return true
    })
  }, [rawReviews, filter, searchQuery])

  const openReplyModal = (rev: ReviewResponse) => {
    setSelectedReview(rev)
    setReplyText(rev.replyFromShop || '')
    setReplyModalOpen(true)
  }

  const handleSendReply = async () => {
    if (!selectedReview) return
    if (!replyText.trim()) {
      showToast('Vui lòng nhập nội dung phản hồi')
      return
    }

    try {
      await replyMutation.mutateAsync({
        id: selectedReview.id || selectedReview.reviewId || 0,
        data: { replyFromShop: replyText.trim() },
      })
      showToast('Gửi câu trả lời đánh giá thành công!')
      setReplyModalOpen(false)
      setSelectedReview(null)
      setReplyText('')
      reviewsQuery.refetch()
    } catch (err) {
      showToast(getErrorMessage(err, 'Lỗi khi gửi phản hồi'))
    }
  }

  const avgRating = report?.averageRating ?? 4.8
  const totalReviews = report?.totalReviewers ?? rawReviews.length

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="border-b border-line bg-paper px-3 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <BackButton onPress={goBack} />
            <AppText weight="extrabold" className="text-lg">
              Đánh Giá Của Khách Hàng
            </AppText>
          </View>
          <Pressable
            onPress={refreshAll}
            accessibilityLabel="Làm mới đánh giá"
            className="h-9 w-9 items-center justify-center rounded-full bg-leaf-50 active:bg-leaf-100"
          >
            <RefreshCw size={17} color={colors.leaf700} className={refreshing ? 'animate-spin' : ''} />
          </Pressable>
        </View>

        {/* Ô Tìm Kiếm */}
        <View className="mt-3 h-10 flex-row items-center rounded-xl border border-line bg-white px-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo tên khách, sản phẩm, nhận xét..."
            placeholderTextColor={colors.inkSubtle}
            className="h-full flex-1 px-2 text-xs text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerClassName="p-4 gap-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {/* Hero Card Tổng Quan Đánh Giá */}
        <View className="rounded-panel border border-line bg-white p-4">
          <View className="flex-row items-center gap-4">
            <View className="items-center justify-center rounded-2xl bg-sun-50 p-4 min-w-[100px]">
              <AppText weight="extrabold" className="text-3xl text-ink">
                {avgRating.toFixed(1)}
              </AppText>
              <View className="mt-1 flex-row">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    color="#eab308"
                    fill={s <= Math.round(avgRating) ? '#eab308' : 'transparent'}
                  />
                ))}
              </View>
              <AppText className="mt-1 text-[11px] text-ink-muted">
                {totalReviews} đánh giá
              </AppText>
            </View>

            {/* Phân bổ các mức sao */}
            <View className="flex-1 gap-1">
              {[
                { star: 5, count: report?.fiveStarNumber ?? 0 },
                { star: 4, count: report?.fourStarNumber ?? 0 },
                { star: 3, count: report?.threeStarNumber ?? 0 },
                { star: 2, count: report?.twoStarNumber ?? 0 },
                { star: 1, count: report?.oneStarNumber ?? 0 },
              ].map(({ star, count }) => {
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                return (
                  <View key={star} className="flex-row items-center gap-2">
                    <AppText className="w-6 text-[11px] text-ink-muted">{star}★</AppText>
                    <View className="h-2 flex-1 rounded-full bg-paper overflow-hidden">
                      <View
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-sun-400"
                      />
                    </View>
                    <AppText className="w-5 text-[10px] text-ink-subtle text-right">{count}</AppText>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* Thanh Lọc Ngang */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {FILTER_ITEMS.map((f) => {
            const isSelected = filter === f.key
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 border',
                  isSelected
                    ? 'border-leaf-700 bg-leaf-700'
                    : 'border-line bg-white active:bg-leaf-50',
                )}
              >
                <AppText
                  weight="bold"
                  className={cn('text-xs', isSelected ? 'text-white' : 'text-ink-muted')}
                >
                  {f.label}
                </AppText>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* Danh Sách Đánh Giá */}
        {reviewsQuery.isLoading ? (
          <View className="gap-3">
            <Skeleton className="h-32 rounded-panel" />
            <Skeleton className="h-32 rounded-panel" />
          </View>
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            title="Không tìm thấy đánh giá nào"
            description="Chưa có đánh giá nào phù hợp với bộ lọc hiện tại."
          />
        ) : (
          <View className="gap-3">
            {filteredReviews.map((rev) => {
              const stars = Number(rev.ratingStar) || 5
              const hasReply = !!rev.replyFromShop
              const evidenceList = (rev.imageUrls || [rev.evidence]).filter(Boolean) as string[]

              return (
                <View
                  key={rev.id || rev.reviewId}
                  className="rounded-panel border border-line bg-white p-4 gap-2.5"
                >
                  {/* Khách hàng & Ngày */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-leaf-50">
                        <User size={16} color={colors.leaf700} />
                      </View>
                      <View>
                        <AppText weight="bold" className="text-sm text-ink">
                          {rev.fullName || rev.buyerName || 'Khách hàng'}
                        </AppText>
                        <AppText className="text-[10px] text-ink-subtle">
                          {rev.createAt || rev.createdAt
                            ? new Date(rev.createAt || rev.createdAt || '').toLocaleDateString('vi-VN')
                            : 'Mới đây'}
                        </AppText>
                      </View>
                    </View>

                    {/* Số sao */}
                    <View className="flex-row">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          color="#eab308"
                          fill={s <= stars ? '#eab308' : 'transparent'}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Nông sản được đánh giá */}
                  <View className="flex-row items-center gap-1.5 rounded-lg bg-paper px-2.5 py-1.5">
                    <Package size={13} color={colors.inkMuted} />
                    <AppText numberOfLines={1} weight="semibold" className="text-xs text-ink flex-1">
                      {rev.productName || rev.comboName || rev.boxType || 'Nông sản mùa vụ'}
                    </AppText>
                  </View>

                  {/* Nhận xét */}
                  {!!rev.comment && (
                    <AppText className="text-xs leading-relaxed text-ink">
                      {rev.comment}
                    </AppText>
                  )}

                  {/* Ảnh đính kèm từ khách */}
                  {evidenceList.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 pt-1">
                      {evidenceList.map((uri, idx) => (
                        <Image
                          key={idx}
                          source={{ uri }}
                          style={{ width: 68, height: 68, borderRadius: 10 }}
                          contentFit="cover"
                        />
                      ))}
                    </View>
                  )}

                  {/* Phản hồi từ shop (nếu đã có) */}
                  {hasReply ? (
                    <View className="mt-1 rounded-xl bg-leaf-50/70 p-3 border border-leaf-100">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <CheckCircle2 size={13} color={colors.leaf700} />
                          <AppText weight="bold" className="text-xs text-leaf-800">
                            Phản hồi của Nhà vườn
                          </AppText>
                        </View>
                        <Pressable onPress={() => openReplyModal(rev)}>
                          <AppText weight="bold" className="text-[11px] text-leaf-700">
                            Chỉnh sửa
                          </AppText>
                        </Pressable>
                      </View>
                      <AppText className="mt-1 text-xs text-leaf-900 leading-relaxed">
                        {rev.replyFromShop}
                      </AppText>
                    </View>
                  ) : (
                    <View className="mt-1 flex-row justify-end">
                      <Button
                        title="Trả lời đánh giá"
                        variant="outline"
                        icon={MessageCircleReply}
                        onPress={() => openReplyModal(rev)}
                      />
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Trả Lời Đánh Giá */}
      <Modal visible={replyModalOpen} transparent animationType="slide" onRequestClose={() => setReplyModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8 gap-3.5">
            <View className="flex-row items-center justify-between border-b border-line pb-3">
              <AppText weight="extrabold" className="text-base text-ink">
                Trả Lời Đánh Giá Khách Hàng
              </AppText>
              <Pressable onPress={() => setReplyModalOpen(false)} className="p-1">
                <X size={20} color={colors.inkSubtle} />
              </Pressable>
            </View>

            {selectedReview && (
              <View className="rounded-xl bg-paper p-3">
                <AppText weight="bold" className="text-xs text-ink">
                  Khách: {selectedReview.fullName || selectedReview.buyerName}
                </AppText>
                <AppText numberOfLines={2} className="mt-0.5 text-xs text-ink-muted">
                  "{selectedReview.comment || 'Không có nhận xét văn bản'}"
                </AppText>
              </View>
            )}

            <View>
              <AppText weight="bold" className="text-xs text-ink">
                Nội dung phản hồi của Nhà vườn:
              </AppText>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="VD: Cảm ơn bạn đã tin dùng nông sản sạch của nhà vườn! Chúc bạn và gia đình thật nhiều sức khỏe."
                multiline
                numberOfLines={4}
                className="mt-1.5 min-h-[90px] rounded-xl border border-line p-3 text-xs text-ink"
                style={{ fontFamily: fontFamily.regular, textAlignVertical: 'top' }}
              />
            </View>

            <Button
              title="Gửi phản hồi cho khách"
              loading={replyMutation.isPending}
              onPress={handleSendReply}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
