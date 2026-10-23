import { Image } from 'expo-image'
import { X } from 'lucide-react-native'
import { useState } from 'react'
import {
  FlatList,
  Modal,
  Pressable,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText } from '@/components/ui'
import type { ProductImageResponse } from '@/services'
import { cn } from '@/utils/helpers'
import { ProduceImage } from './ProduceImage'

/** Thêm biến đổi Cloudinary như bản web: ảnh chính nét, ảnh nhỏ cắt vuông nhẹ. */
function clImg(url: string | undefined, mode: 'main' | 'thumb' = 'main'): string {
  if (!url || !url.includes('res.cloudinary.com')) return url ?? ''
  const transform =
    mode === 'main' ? 'f_auto,q_auto:best,e_sharpen:60' : 'f_auto,q_auto:eco,c_fill,w_150,h_150,g_center'
  return url.replace('/upload/', `/upload/${transform}/`)
}

const byPrimaryThenOrder = (a: ProductImageResponse, b: ProductImageResponse) => {
  if (a.isPrimary) return -1
  if (b.isPrimary) return 1
  return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
}

/**
 * Gallery vuốt ngang + hàng ảnh nhỏ; chạm ảnh để xem toàn màn hình.
 * Thay ImageGallery (nút trái/phải, phím mũi tên) của bản web.
 */
export function ImageGallery({
  images,
  fallbackUrl,
  productName,
}: {
  images?: ProductImageResponse[]
  fallbackUrl?: string
  productName: string
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const sorted = [...(images ?? [])].sort(byPrimaryThenOrder)
  const urls = sorted.length > 0 ? sorted.map((i) => i.imageUrl) : fallbackUrl ? [fallbackUrl] : []

  const onScrollEnd = (pageWidth: number) => (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setActive(Math.round(e.nativeEvent.contentOffset.x / pageWidth))

  if (urls.length === 0) {
    return (
      <View className="aspect-square overflow-hidden rounded-2xl border border-line">
        <ProduceImage src="" alt={productName} />
      </View>
    )
  }

  return (
    <View className="gap-3">
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        className="aspect-square overflow-hidden rounded-2xl border border-line bg-white"
      >
        {width > 0 && (
          <FlatList
            data={urls}
            keyExtractor={(u, i) => `${i}-${u}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd(width)}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => setLightbox(true)}
                accessibilityRole="imagebutton"
                accessibilityLabel={`${productName}, ảnh ${index + 1}/${urls.length}. Chạm để phóng to`}
                style={{ width, height: width }}
              >
                <Image source={{ uri: clImg(item) }} contentFit="contain" style={{ width, height: width }} />
              </Pressable>
            )}
          />
        )}
        {urls.length > 1 && (
          <View className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1">
            <AppText weight="bold" className="text-xs text-white">
              {active + 1}/{urls.length}
            </AppText>
          </View>
        )}
      </View>

      {urls.length > 1 && (
        <View className="flex-row flex-wrap gap-2">
          {urls.map((u, i) => (
            <View
              key={`${i}-${u}`}
              className={cn(
                'h-14 w-14 overflow-hidden rounded-xl border-2',
                i === active ? 'border-leaf-700' : 'border-line',
              )}
            >
              <Image source={{ uri: clImg(u, 'thumb') }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
            </View>
          ))}
        </View>
      )}

      <Modal visible={lightbox} transparent animationType="fade" onRequestClose={() => setLightbox(false)}>
        <View className="flex-1 bg-black">
          <FlatList
            data={urls}
            keyExtractor={(u, i) => `lb-${i}-${u}`}
            horizontal
            pagingEnabled
            initialScrollIndex={active}
            getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd(screenWidth)}
            renderItem={({ item }) => (
              <Image
                source={{ uri: clImg(item) }}
                accessibilityLabel={productName}
                contentFit="contain"
                style={{ width: screenWidth, height: screenHeight }}
              />
            )}
          />
          <Pressable
            onPress={() => setLightbox(false)}
            accessibilityRole="button"
            accessibilityLabel="Đóng ảnh"
            className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-white/20"
            style={{ top: insets.top + 8 }}
          >
            <X size={22} color="#ffffff" />
          </Pressable>
          <View className="absolute left-0 right-0 items-center" style={{ bottom: insets.bottom + 16 }}>
            <AppText weight="bold" className="text-sm text-white/70">
              {active + 1} / {urls.length}
            </AppText>
          </View>
        </View>
      </Modal>
    </View>
  )
}
