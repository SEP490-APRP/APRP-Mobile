import { Image } from 'expo-image'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { AppText } from '@/components/ui'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import type { StoryBlock, StoryRun } from '../utils/storyContent'

/** Đoạn đậm / nghiêng lồng trong AppText cha: dùng Text trần để kế thừa cỡ chữ và màu của khối. */
function Runs({ runs }: { runs: StoryRun[] }) {
  return runs.map((r, i) =>
    r.bold || r.italic ? (
      <Text
        key={i}
        style={{ fontFamily: r.bold ? fontFamily.bold : undefined, fontStyle: r.italic ? 'italic' : undefined }}
      >
        {r.text}
      </Text>
    ) : (
      r.text
    ),
  )
}

const HEADING = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' } as const

/** Ảnh trong bài: giữ đúng tỉ lệ sau khi tải, mặc định 4:3. */
function BodyImage({ src, alt }: { src: string; alt?: string }) {
  const [ratio, setRatio] = useState(4 / 3)
  return (
    <View className="overflow-hidden rounded-2xl bg-leaf-50">
      <Image
        source={{ uri: src }}
        accessibilityLabel={alt || 'Ảnh trong bài viết'}
        contentFit="cover"
        transition={150}
        onLoad={(e) => e.source.width && e.source.height && setRatio(e.source.width / e.source.height)}
        style={{ width: '100%', aspectRatio: ratio }}
      />
      {!!alt && <AppText className="px-3 py-2 text-xs italic text-ink-muted">{alt}</AppText>}
    </View>
  )
}

/** Nội dung bài viết đã tách khối (xem parseStoryContent). */
export function StoryBody({ blocks }: { blocks: StoryBlock[] }) {
  return (
    <View className="gap-4">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return (
              <AppText key={i} accessibilityRole="header" weight="extrabold" className={cn(HEADING[b.level], 'mt-1')}>
                <Runs runs={b.runs} />
              </AppText>
            )
          case 'quote':
            return (
              <View key={i} className="rounded-r-xl border-l-4 border-leaf-500 bg-leaf-50 px-4 py-3">
                <AppText className="text-base italic leading-relaxed text-leaf-800">
                  <Runs runs={b.runs} />
                </AppText>
              </View>
            )
          case 'list':
            return (
              <View key={i} className="gap-2">
                {b.items.map((item, j) => (
                  <View key={j} className="flex-row gap-2">
                    <AppText weight="bold" className="w-5 text-base leading-relaxed text-leaf-700">
                      {b.ordered ? `${j + 1}.` : '•'}
                    </AppText>
                    <AppText className="flex-1 text-base leading-relaxed">
                      <Runs runs={item} />
                    </AppText>
                  </View>
                ))}
              </View>
            )
          case 'image':
            return <BodyImage key={i} src={b.src} alt={b.alt} />
          default:
            return (
              <AppText key={i} className="text-base leading-relaxed">
                <Runs runs={b.runs} />
              </AppText>
            )
        }
      })}
    </View>
  )
}
