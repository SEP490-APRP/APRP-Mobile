import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Camera, ImagePlus, Minus, Plus, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button, ChoiceChips, TextField } from '@/components/ui'
import { money } from '@/features/product'
import { MAX_PROOF_IMAGES, type DeliveryFailReason } from '@/services/shipper.service'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { UploadFile } from '@/types/upload.types'
import type { DeliveryProof } from '../hooks/useShipperQueries'
import { FAIL_REASONS, MIN_CALLS_WHEN_UNREACHABLE, PICKUP_FAIL_REASONS, validateDeliveryProof } from '../utils/deliveryProof'

/**
 * Xác nhận giao hàng (Bước 3), thay cho ConfirmDialog cũ:
 * giao thành công cần ảnh bằng chứng; thất bại cần lý do, số cuộc gọi và ảnh.
 */
export function DeliveryResultSheet({
  visible,
  orderId,
  failed,
  codAmount = 0,
  paymentMethod,
  stage,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean
  orderId: number
  failed: boolean
  /** Tiền mặt cần thu (đơn COD) */
  codAmount?: number
  paymentMethod?: string
  /** Chưa lấy hàng thì "thất bại" nghĩa là không lấy được hàng; return_shop là trả hàng hoàn về Vườn */
  stage: 'pickup' | 'delivery' | 'return_shop'
  loading?: boolean
  onSubmit: (proof: DeliveryProof) => void
  onClose: () => void
}) {
  const showToast = useUiStore((s) => s.showToast)
  const isCod = codAmount > 0 || paymentMethod?.toUpperCase() === 'COD'
  const [photos, setPhotos] = useState<UploadFile[]>([])
  const [reason, setReason] = useState<DeliveryFailReason | null>(null)
  const [calls, setCalls] = useState(0)
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  const [previewUri, setPreviewUri] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setPhotos([])
    setReason(null)
    setCalls(0)
    setNote('')
    setTouched(false)
    setPreviewUri(null)
  }, [visible])

  const errors = validateDeliveryProof({ photoCount: photos.length, reason, callAttempts: calls, note }, failed, stage)

  const pick = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showToast(source === 'camera' ? 'Cần quyền camera để chụp ảnh. Bật trong Cài đặt nhé.' : 'Cần quyền truy cập ảnh. Bật trong Cài đặt nhé.')
      return
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 }
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)
    const asset = res.canceled ? undefined : res.assets[0]
    if (!asset) return
    setPhotos((prev) =>
      [...prev, { uri: asset.uri, name: asset.fileName ?? `giao-hang-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' }].slice(
        0,
        MAX_PROOF_IMAGES,
      ),
    )
  }

  const submit = () => {
    setTouched(true)
    if (Object.keys(errors).length > 0) {
      showToast('Kiểm tra lại các mục được đánh dấu đỏ nhé.')
      return
    }
    onSubmit({ photos, reason: reason ?? undefined, callAttempts: calls, note })
  }

  const isReturnShop = stage === 'return_shop'
  const isPickupFail = failed && stage === 'pickup'
  const title = failed
    ? isPickupFail
      ? `Không lấy được hàng tại vườn · #${orderId}`
      : `Báo giao thất bại · #${orderId}`
    : isReturnShop
      ? `Trả hàng hoàn về Shop · #${orderId}`
      : `Xác nhận đã giao · #${orderId}`

  const subtitle = isPickupFail
    ? 'Đơn sẽ bị huỷ giao và hoàn tiền cho khách (nếu đã thanh toán)'
    : failed
      ? 'Đơn sẽ chuyển hoàn hàng về nhà vườn'
      : isReturnShop
        ? 'Chụp ảnh bàn giao lại kiện hàng cho nhà vườn'
        : 'Chụp ảnh hàng tại nhà khách hoặc lúc khách nhận'

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={() => !loading && onClose()}
        title={title}
        subtitle={subtitle}
        footer={
          <View className="flex-row gap-2.5">
            <Button title="Huỷ" variant="outline" disabled={loading} onPress={onClose} className="min-h-[48px] flex-1" />
            <Button
              title={isPickupFail ? 'Báo không lấy được' : failed ? 'Báo thất bại' : isReturnShop ? 'Đã trả hàng' : 'Đã giao'}
              variant={failed ? 'danger' : 'primary'}
              loading={loading}
              onPress={submit}
              className="min-h-[48px] flex-[1.5]"
              textClassName="text-sm"
            />
          </View>
        }
      >
      <View className="gap-4">
        {!failed && !isReturnShop && (
          isCod ? (
            <View className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <View className="flex-row items-center justify-between">
                <AppText weight="bold" className="text-xs uppercase tracking-wider text-amber-700">
                  Đơn thu tiền mặt (COD)
                </AppText>
                <AppText weight="extrabold" className="text-base text-amber-900">
                  {money(codAmount)}
                </AppText>
              </View>
              <AppText className="mt-1 text-xs text-amber-800 leading-relaxed">
                Vui lòng thu đủ <AppText weight="extrabold">{money(codAmount)}</AppText> tiền mặt của khách trước khi bàn giao hàng. Khoản tiền này đã được ký quỹ trong ví.
              </AppText>
            </View>
          ) : (
            <View className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
              <View className="flex-row items-center justify-between">
                <AppText weight="bold" className="text-xs uppercase tracking-wider text-emerald-700">
                  Đã thanh toán online ({paymentMethod || 'VietQR / Ví'})
                </AppText>
                <View className="rounded-md bg-emerald-200/80 px-2 py-0.5">
                  <AppText weight="extrabold" className="text-xs text-emerald-800">
                    0 đ
                  </AppText>
                </View>
              </View>
              <AppText weight="semibold" className="mt-1 text-xs text-emerald-800 leading-relaxed">
                Đơn hàng đã thanh toán 100% online. <AppText weight="extrabold" className="text-emerald-950 underline">TUYỆT ĐỐI KHÔNG THU TIỀN MẶT CỦA KHÁCH.</AppText>
              </AppText>
            </View>
          )
        )}

        {failed && (
          <>
            <ChoiceChips
              label="Lý do"
              options={isPickupFail ? PICKUP_FAIL_REASONS : FAIL_REASONS}
              value={reason ?? ''}
              onChange={(v) => setReason(v as DeliveryFailReason)}
            />
            {touched && errors.reason && <AppText className="text-xs text-sale">{errors.reason}</AppText>}

            <View className="flex-row items-center justify-between gap-3 rounded-card border border-line p-3">
              <View className="flex-1">
                <AppText weight="bold" className="text-sm">
                  {isPickupFail ? 'Số cuộc đã gọi nhà vườn' : 'Số cuộc đã gọi khách'}
                </AppText>
                <AppText className="text-xs text-ink-muted">
                  {reason === 'KHONG_LIEN_LAC_DUOC' ? `Tối thiểu ${MIN_CALLS_WHEN_UNREACHABLE} cuộc` : 'Không bắt buộc'}
                </AppText>
              </View>
              <Pressable
                onPress={() => setCalls((c) => Math.max(0, c - 1))}
                accessibilityRole="button"
                accessibilityLabel="Bớt 1 cuộc"
                className="h-11 w-11 items-center justify-center rounded-xl border border-line"
              >
                <Minus size={16} color={colors.ink} />
              </Pressable>
              <AppText weight="extrabold" className="w-8 text-center text-lg">
                {calls}
              </AppText>
              <Pressable
                onPress={() => setCalls((c) => Math.min(20, c + 1))}
                accessibilityRole="button"
                accessibilityLabel="Thêm 1 cuộc"
                className="h-11 w-11 items-center justify-center rounded-xl border border-line"
              >
                <Plus size={16} color={colors.ink} />
              </Pressable>
            </View>
            {touched && errors.callAttempts && <AppText className="text-xs text-sale">{errors.callAttempts}</AppText>}

            <TextField
              label={reason === 'KHAC' ? 'Ghi chú (bắt buộc)' : 'Ghi chú'}
              value={note}
              onChangeText={setNote}
              maxLength={500}
              multiline
              placeholder={
                isPickupFail
                  ? 'VD: vườn đóng cửa, hàng chưa đóng gói xong...'
                  : 'VD: khách hẹn giao lại ngày mai'
              }
              error={touched ? errors.note : undefined}
            />
          </>
        )}

        <View
          className={`gap-2.5 rounded-2xl border border-dashed p-3.5 ${
            touched && errors.photos ? 'border-rose-400 bg-rose-50/50' : 'border-leaf-600/35 bg-leaf-50/40'
          }`}
        >
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className={`text-sm ${touched && errors.photos ? 'text-sale' : 'text-ink'}`}>
              {failed ? 'Ảnh bằng chứng (bắt buộc)' : 'Ảnh giao hàng (bắt buộc)'}
            </AppText>
            <AppText weight="semibold" className={`text-xs ${touched && errors.photos ? 'text-sale' : 'text-leaf-700'}`}>
              {photos.length}/{MAX_PROOF_IMAGES} ảnh
            </AppText>
          </View>
          {photos.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {photos.map((p, i) => (
                <View key={p.uri} className="h-20 w-20 overflow-hidden rounded-xl border border-line bg-white">
                  <Pressable onPress={() => setPreviewUri(p.uri)} className="h-full w-full">
                    <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </Pressable>
                  <Pressable
                    onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    accessibilityRole="button"
                    accessibilityLabel="Xoá ảnh"
                    className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 active:bg-ink"
                  >
                    <X size={12} color={colors.white} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          {photos.length < MAX_PROOF_IMAGES && (
            <View className="flex-row gap-2">
              <Button title="Chụp ảnh" icon={Camera} variant="outline" onPress={() => void pick('camera')} className="min-h-[44px] flex-1 bg-white px-2.5" textClassName="text-sm" />
              <Button title="Chọn ảnh" icon={ImagePlus} variant="outline" onPress={() => void pick('library')} className="min-h-[44px] flex-1 bg-white px-2.5" textClassName="text-sm" />
            </View>
          )}
          <AppText className="text-xs leading-relaxed text-ink-muted">
            {isPickupFail
              ? 'Chụp cửa vườn/kho đóng, lịch sử cuộc gọi với shop… (tối thiểu 1 ảnh).'
              : failed
                ? 'Chụp cửa nhà khách, lịch sử cuộc gọi… (tối thiểu 1 ảnh, nhấn ảnh để phóng to).'
                : 'Bắt buộc ít nhất 1 ảnh (nhấn vào ảnh để phóng to kiểm tra độ nét).'}
          </AppText>
          {touched && errors.photos && (
            <AppText weight="semibold" className="text-xs text-sale">
              {errors.photos}
            </AppText>
          )}
        </View>
      </View>
    </BottomSheet>

    {/* Modal phóng to ảnh bằng chứng (tách khỏi BottomSheet để tránh lồng Modal trên Android) */}
    <Modal visible={Boolean(previewUri)} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
      <View className="flex-1 items-center justify-center bg-black/90 p-4">
        <Pressable
          onPress={() => setPreviewUri(null)}
          accessibilityRole="button"
          accessibilityLabel="Đóng xem ảnh"
          className="absolute right-4 top-12 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/40"
        >
          <X size={22} color="#ffffff" />
        </Pressable>
        {Boolean(previewUri) && (
          <Image
            source={{ uri: previewUri! }}
            className="h-[80%] w-full"
            contentFit="contain"
          />
        )}
      </View>
    </Modal>
  </>
  )
}
