import { Image } from 'expo-image'
import { useState } from 'react'
import { Linking, ScrollView, Text, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { absoluteUrl, cn } from '@/utils/helpers'
import type { StoryBlock, StoryRun } from '../utils/storyContent'

function openRunLink(href: string) {
  const target = href.startsWith('/') ? absoluteUrl(href) : href
  void Linking.openURL(target).catch(() => {})
}

/** Đoạn đậm / nghiêng / gạch chân / link lồng trong AppText cha: dùng Text trần để kế thừa cỡ chữ và màu của khối. */
function Runs({ runs }: { runs: StoryRun[] }) {
  return runs.map((r, i) =>
    r.bold || r.italic || r.underline || r.href ? (
      <Text
        key={i}
        accessibilityRole={r.href ? 'link' : undefined}
        onPress={r.href ? () => openRunLink(r.href!) : undefined}
        style={{
          fontFamily: r.bold ? fontFamily.bold : undefined,
          fontStyle: r.italic ? 'italic' : undefined,
          textDecorationLine: r.underline || r.href ? 'underline' : undefined,
          color: r.href ? colors.leaf700 : undefined,
        }}
      >
        {r.text}
      </Text>
    ) : (
      r.text
    ),
  )
}

const HEADING = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' } as const

/** Ảnh trong bài: giữ đúng tỉ lệ sau khi tải, mặc định 4:3, hiển thị caption (ưu tiên figcaption) hoặc alt. */
function BodyImage({ src, alt, caption }: { src: string; alt?: string; caption?: string }) {
  const [ratio, setRatio] = useState(4 / 3)
  const note = caption || alt
  return (
    <View className="overflow-hidden rounded-2xl bg-leaf-50">
      <Image
        source={{ uri: src }}
        accessibilityLabel={alt || caption || 'Ảnh trong bài viết'}
        contentFit="cover"
        transition={150}
        onLoad={(e) => e.source.width && e.source.height && setRatio(e.source.width / e.source.height)}
        style={{ width: '100%', aspectRatio: ratio }}
      />
      {!!note && <AppText className="px-3 py-2 text-xs italic text-ink-muted">{note}</AppText>}
    </View>
  )
}

/** Bảng từ CKEditor: cuộn ngang nếu nhiều cột để không tràn màn hình nhỏ. */
function BodyTable({ rows }: { rows: string[][] }) {
  if (!rows.length) return null
  const colCount = Math.max(...rows.map((r) => r.length), 1)
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="rounded-2xl border border-line bg-white"
    >
      <View className="min-w-full">
        {rows.map((row, ri) => (
          <View
            key={ri}
            className={cn(
              'flex-row',
              ri === 0 ? 'border-b border-line bg-leaf-50' : ri % 2 === 1 ? 'bg-white' : 'bg-paper/60',
              ri > 0 && 'border-t border-line/60',
            )}
          >
            {Array.from({ length: colCount }).map((_, ci) => (
              <View key={ci} className="min-w-[110px] flex-1 px-3 py-2">
                <AppText
                  weight={ri === 0 ? 'bold' : 'regular'}
                  className={cn('text-sm leading-snug', ri === 0 ? 'text-leaf-800' : 'text-ink')}
                >
                  {row[ci] ?? ''}
                </AppText>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
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
            return <BodyImage key={i} src={b.src} alt={b.alt} caption={b.caption} />
          case 'table':
            return <BodyTable key={i} rows={b.rows} />
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
