import { Image } from 'expo-image'
import { Trash2 } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import type { BlogCommentResponse } from '@/services/blog.service'
import { colors } from '@/theme/colors'
import { timeAgo } from '../utils/storyContent'

/** Một bình luận; người viết thấy nút xoá bình luận của mình. */
export function StoryComment({
  comment: c,
  mine,
  onDelete,
}: {
  comment: BlogCommentResponse
  mine: boolean
  onDelete: () => void
}) {
  const name = c.userName || 'Thành viên CapNong'
  return (
    <View className="flex-row gap-3">
      <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-leaf-100">
        {c.userAvatar ? (
          <Image source={{ uri: c.userAvatar }} style={{ width: 36, height: 36 }} contentFit="cover" />
        ) : (
          <AppText weight="bold" className="text-sm text-leaf-700">
            {name.trim().charAt(0).toUpperCase()}
          </AppText>
        )}
      </View>
      <View className="min-w-0 flex-1 gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2.5">
        <View className="flex-row items-center gap-2">
          <AppText weight="bold" numberOfLines={1} className="flex-1 text-sm">
            {name}
            {mine ? <AppText className="text-xs text-leaf-700"> · Bạn</AppText> : null}
          </AppText>
          <AppText className="text-xs text-ink-subtle">{timeAgo(c.createAt)}</AppText>
          {mine && (
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel="Xoá bình luận"
              hitSlop={10}
              className="pl-1"
            >
              <Trash2 size={15} color={colors.sale} />
            </Pressable>
          )}
        </View>
        <AppText className="text-sm leading-relaxed">{c.content}</AppText>
      </View>
    </View>
  )
}
