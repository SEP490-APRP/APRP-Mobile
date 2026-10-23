import { Image } from 'expo-image'
import { ThumbsDown, ThumbsUp } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import type { ReviewResponse } from '@/services/review.types'
import { cn } from '@/utils/helpers'
import { StarRow } from './StarRow'

function ReactButton({
  kind,
  count,
  active,
  disabled,
  onPress,
}: {
  kind: 'LIKE' | 'DISLIKE'
  count: number
  active: boolean
  disabled: boolean
  onPress: () => void
}) {
  const Icon = kind === 'LIKE' ? ThumbsUp : ThumbsDown
  const activeBg = kind === 'LIKE' ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${kind === 'LIKE' ? 'Hữu ích' : 'Không hữu ích'}, ${count}`}
      accessibilityState={{ selected: active, disabled }}
      className={cn(
        'h-8 flex-row items-center gap-1 rounded-full border px-2.5',
        active ? activeBg : 'border-line bg-white',
        disabled && 'opacity-50',
      )}
    >
      <Icon size={13} color={active ? '#ffffff' : '#6b7280'} />
      <AppText weight="bold" className={cn('text-xs', active ? 'text-white' : 'text-ink-muted')}>
        {count}
      </AppText>
    </Pressable>
  )
}

/** Một đánh giá: người viết, sao, nội dung, ảnh minh chứng, phản hồi của nhà vườn. */
export function ReviewCard({
  review,
  reacting,
  onReact,
}: {
  review: ReviewResponse
  reacting: boolean
  onReact: (reaction: 'LIKE' | 'DISLIKE') => void
}) {
  const name = review.fullName || `Người dùng #${review.buyerId ?? ''}`
  const date = review.createAt ?? review.createdAt
  return (
    <View className="gap-3 rounded-panel border border-line bg-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-leaf-50">
          <AppText weight="bold" className="text-leaf-700">
            {name.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <View className="flex-1 gap-0.5">
          <AppText weight="extrabold" numberOfLines={1} className="text-sm">
            {name}
          </AppText>
          <AppText className="text-xs text-ink-subtle">
            {date ? new Date(date).toLocaleDateString('vi-VN') : 'Gần đây'}
          </AppText>
          <StarRow rating={review.ratingStar} size={12} />
        </View>
      </View>
      {!!review.comment && <AppText className="text-sm leading-relaxed text-ink-muted">{review.comment}</AppText>}
      {!!review.evidence && (
        <Image
          source={{ uri: review.evidence }}
          accessibilityLabel="Ảnh minh chứng"
          contentFit="cover"
          style={{ width: 112, height: 112, borderRadius: 12 }}
        />
      )}
      {!!review.replyFromShop && (
        <View className="gap-1 rounded-card border border-leaf-200 bg-leaf-50 p-3">
          <AppText weight="bold" className="text-xs uppercase text-leaf-700">
            Phản hồi từ nhà vườn
          </AppText>
          <AppText className="text-sm italic text-ink-muted">{review.replyFromShop}</AppText>
        </View>
      )}
      <View className="flex-row items-center justify-end gap-2">
        <AppText weight="bold" className="mr-1 text-xs uppercase text-ink-subtle">
          Hữu ích?
        </AppText>
        <ReactButton
          kind="LIKE"
          count={review.likeCount ?? 0}
          active={review.currentUserReaction === 'LIKE'}
          disabled={reacting}
          onPress={() => onReact('LIKE')}
        />
        <ReactButton
          kind="DISLIKE"
          count={review.dislikeCount ?? 0}
          active={review.currentUserReaction === 'DISLIKE'}
          disabled={reacting}
          onPress={() => onReact('DISLIKE')}
        />
      </View>
    </View>
  )
}
