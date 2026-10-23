import { Image } from 'expo-image'
import { Leaf } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'

/** Ảnh nông sản; thiếu link hoặc lỗi tải thì hiện khung lá cây kèm tên, như bản web. */
export function ProduceImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={alt}
        className="h-full w-full items-center justify-center gap-2 bg-leaf-50 p-3"
      >
        <Leaf size={36} color={colors.leaf600} />
        <AppText weight="semibold" numberOfLines={2} className="text-center text-xs text-ink-muted">
          {alt}
        </AppText>
      </View>
    )
  }

  return (
    <Image
      source={{ uri: src }}
      accessibilityLabel={alt}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
