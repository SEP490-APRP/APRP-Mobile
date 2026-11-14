import * as ImagePicker from 'expo-image-picker'
import { AlertCircle, Camera, Image as ImageIcon, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, CapNongLoading } from '@/components/ui'
import { productService } from '@/services/product.service'
import type { ProductResponse } from '@/services/product.types'
import { colors } from '@/theme/colors'

interface ImageSearchModalProps {
  visible: boolean
  onClose: () => void
  onSelectKeyword: (keyword: string, initialProducts?: ProductResponse[]) => void
}

export function ImageSearchModal({ visible, onClose, onSelectKeyword }: ImageSearchModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [nonAgriAlert, setNonAgriAlert] = useState<{ message: string; keywords: string[] } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Scanning laser animation
  const scanAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isAnalyzing) {
      scanAnim.setValue(0)
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      )
      animation.start()
      return () => animation.stop()
    }
  }, [isAnalyzing, scanAnim])

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 226],
  })

  const resetState = () => {
    setSelectedImage(null)
    setIsAnalyzing(false)
    setNonAgriAlert(null)
    setErrorMessage(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handlePickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập thư viện',
          'CapNong cần quyền truy cập bộ sưu tập để chọn ảnh nông sản. Vui lòng cấp quyền trong Cài đặt.',
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processImage(result.assets[0])
      }
    } catch (err: any) {
      console.warn('Lỗi khi mở thư viện ảnh:', err)
      setErrorMessage('Không thể mở thư viện ảnh. Vui lòng thử lại.')
    }
  }

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Quyền máy ảnh',
          'CapNong cần quyền mở camera để chụp ảnh nông sản trực tiếp. Vui lòng cấp quyền trong Cài đặt.',
        )
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processImage(result.assets[0])
      }
    } catch (err: any) {
      console.warn('Lỗi khi mở camera:', err)
      setErrorMessage('Không thể kích hoạt máy ảnh. Vui lòng thử lại.')
    }
  }

  const processImage = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    setSelectedImage(imageAsset.uri)
    setIsAnalyzing(true)
    setNonAgriAlert(null)
    setErrorMessage(null)

    try {
      const response = await productService.searchByImage({
        uri: imageAsset.uri,
        fileName: imageAsset.fileName ?? undefined,
        mimeType: imageAsset.mimeType ?? undefined,
        file: (imageAsset as any).file,
      })
      const data = response?.result

      if (!data) {
        setErrorMessage('Không nhận được phản hồi phân tích từ máy chủ.')
        setIsAnalyzing(false)
        return
      }

      const isAgri = Boolean(data.isAgricultural ?? data.agricultural)
      if (!isAgri) {
        setNonAgriAlert({
          message: 'Chưa nhận diện được rau, củ, quả nào trong ảnh. Bạn vui lòng chụp cận cảnh nông sản tươi hơn nhé!',
          keywords: data.detectedKeywords || [],
        })
        setIsAnalyzing(false)
        return
      }

      // Nhận diện thành công: Đóng modal ngay và delay resetState để animation mượt mà
      const keyword = data.searchKeyword || data.identifiedProduce || ''
      onClose()
      setTimeout(() => {
        resetState()
      }, 350)
      onSelectKeyword(keyword, data.products || [])
    } catch (err: any) {
      console.error('Visual Search error:', err)
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        setErrorMessage('Thời gian xử lý quá 60s. Vui lòng thử lại với ảnh dung lượng nhỏ hơn hoặc kết nối mạng ổn định.')
      } else {
        const serverMsg = err?.response?.data?.message || err?.message
        setErrorMessage(serverMsg || 'Không thể kết nối máy chủ phân tích AI. Vui lòng thử lại.')
      }
      setIsAnalyzing(false)
    }
  }

  if (!visible) return null

  const isScanningMode = isAnalyzing || !!nonAgriAlert || !!errorMessage

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      {isScanningMode ? (
        // ── 1. MÀN HÌNH QUÉT CAMERA SCANNER HUD (GIAO DIỆN TẬP TRUNG, KHÔNG BỊ TRÀN HAY LEM MÀN DƯỚI) ──
        <View style={styles.scanningBackdrop}>
          <SafeAreaView edges={['top', 'bottom']} className="flex-1 justify-between">
            {/* Top Bar: Nút Đóng tinh gọn */}
            <View className="flex-row items-center justify-end px-5 pt-2">
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Đóng quét ảnh"
                hitSlop={12}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
              >
                <X size={18} color="#ffffff" />
              </Pressable>
            </View>

            {/* Middle: Khung ngắm ảnh & Khối Loading tập trung */}
            <View className="items-center justify-center px-6">
              {/* Khung ảnh vuông với 4 góc ngắm Camera HUD */}
              <View style={styles.viewfinder}>
                {!!selectedImage && (
                  <Image source={{ uri: selectedImage }} className="h-full w-full" resizeMode="cover" />
                )}

                {/* 4 Góc ngắm công nghệ cao */}
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />

                {/* Tia Laser Quét */}
                {isAnalyzing && (
                  <Animated.View
                    style={[
                      styles.scanLaser,
                      {
                        transform: [{ translateY }],
                      },
                    ]}
                  />
                )}
              </View>

              {/* Trạng thái Loading CapNong đặc trưng (gọn gàng ngay dưới ảnh) */}
              {isAnalyzing && (
                <View className="mt-5 items-center">
                  <CapNongLoading
                    size="sm"
                    variant="transparent-dark"
                    compact
                    message="Đang tìm kiếm nông sản..."
                    subMessage="Đối chiếu với kho nông sản tươi CapNong"
                  />
                </View>
              )}

              {/* Cảnh báo không nhận diện được nông sản */}
              {!!nonAgriAlert && (
                <View className="mt-5 w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">
                  <View className="flex-row items-center gap-2">
                    <AlertCircle size={18} color="#ea580c" />
                    <AppText weight="bold" className="text-sm text-ink">
                      Chưa nhận diện được nông sản
                    </AppText>
                  </View>
                  <AppText className="mt-2 text-xs leading-relaxed text-ink-muted">
                    {nonAgriAlert.message}
                  </AppText>
                  <View className="mt-3.5 flex-row gap-2">
                    <Pressable
                      onPress={handleTakePhoto}
                      className="h-9 flex-1 items-center justify-center rounded-xl bg-leaf-700 active:bg-leaf-800"
                    >
                      <AppText weight="bold" className="text-xs text-white">
                        Chụp lại ảnh
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={handlePickFromLibrary}
                      className="h-9 flex-1 items-center justify-center rounded-xl border border-line bg-paper active:bg-paperHover"
                    >
                      <AppText weight="bold" className="text-xs text-ink">
                        Chọn ảnh khác
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Báo lỗi kết nối hoặc timeout */}
              {!!errorMessage && !nonAgriAlert && (
                <View className="mt-5 w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">
                  <View className="flex-row items-center gap-2">
                    <AlertCircle size={18} color={colors.sale} />
                    <AppText weight="bold" className="text-sm text-ink">
                      Không thể phân tích
                    </AppText>
                  </View>
                  <AppText className="mt-2 text-xs leading-relaxed text-ink-muted">
                    {errorMessage}
                  </AppText>
                  <View className="mt-3.5 flex-row gap-2">
                    <Pressable
                      onPress={handleTakePhoto}
                      className="h-9 flex-1 items-center justify-center rounded-xl bg-leaf-700 active:bg-leaf-800"
                    >
                      <AppText weight="bold" className="text-xs text-white">
                        Thử lại
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={handleClose}
                      className="h-9 flex-1 items-center justify-center rounded-xl border border-line bg-paper active:bg-paperHover"
                    >
                      <AppText weight="bold" className="text-xs text-ink">
                        Đóng
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Bottom: Nút hủy nhẹ nhàng */}
            <View className="items-center pb-2">
              {isAnalyzing && (
                <Pressable
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Hủy tìm kiếm"
                  className="h-9 items-center justify-center rounded-xl px-4 active:bg-white/10"
                >
                  <AppText className="text-xs text-white/50">Hủy quét ảnh</AppText>
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </View>
      ) : (
        // ── 2. BOTTOM ACTION SHEET (LỰA CHỌN CHỤP ẢNH / THƯ VIỆN CHUẨN MOBILE) ──
        <Pressable className="flex-1 justify-end bg-black/50" onPress={handleClose}>
          <Pressable
            className="rounded-t-3xl bg-white px-5 pb-8 pt-3 shadow-2xl"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Thanh gạt nhỏ trên cùng */}
            <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-lineStrong" />

            <AppText weight="bold" className="mb-4 text-center text-sm text-ink-muted">
              Tìm kiếm nông sản bằng hình ảnh
            </AppText>

            {/* 2 Lựa chọn chính dạng Action Row */}
            <View className="gap-2.5">
              <Pressable
                onPress={handleTakePhoto}
                accessibilityRole="button"
                accessibilityLabel="Chụp ảnh trực tiếp"
                className="h-14 flex-row items-center gap-3.5 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 active:bg-leaf-100"
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-leaf-700">
                  <Camera size={18} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <AppText weight="extrabold" className="text-sm text-leaf-900">
                    Chụp ảnh trực tiếp
                  </AppText>
                  <AppText className="text-[11px] text-leaf-700">
                    Chụp cận cảnh rau, củ, quả tươi ngoài vườn
                  </AppText>
                </View>
              </Pressable>

              <Pressable
                onPress={handlePickFromLibrary}
                accessibilityRole="button"
                accessibilityLabel="Chọn từ thư viện"
                className="h-14 flex-row items-center gap-3.5 rounded-2xl border border-line bg-paper px-4 active:bg-leaf-50"
              >
                <View className="h-9 w-9 items-center justify-center rounded-full border border-line bg-white">
                  <ImageIcon size={18} color={colors.leaf700} />
                </View>
                <View className="flex-1">
                  <AppText weight="bold" className="text-sm text-ink">
                    Chọn từ thư viện ảnh
                  </AppText>
                  <AppText className="text-[11px] text-ink-muted">
                    Chọn ảnh nông sản có sẵn trong điện thoại
                  </AppText>
                </View>
              </Pressable>
            </View>

            {/* Nút Hủy */}
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              className="mt-3 h-11 items-center justify-center rounded-xl active:bg-paper"
            >
              <AppText weight="bold" className="text-sm text-ink-muted">
                Hủy bỏ
              </AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  scanningBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#080d0a',
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    backgroundColor: '#000000',
    position: 'relative',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  scanLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: '#4ade80',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
    elevation: 6,
  },
  cornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4ade80',
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4ade80',
    borderTopRightRadius: 6,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4ade80',
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4ade80',
    borderBottomRightRadius: 6,
  },
})
