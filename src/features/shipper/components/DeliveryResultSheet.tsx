import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Camera, ImagePlus, Minus, Plus, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button, ChoiceChips, TextField } from '@/components/ui'
import { money } from '@/features/product'
import { MAX_PROOF_IMAGES, type DeliveryFailReason } from '@/services/shipper.service'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { UploadFile } from '@/types/upload.types'
import type { DeliveryProof } from '../hooks/useShipperQueries'
import { FAIL_REASONS, MIN_CALLS_WHEN_UNREACHABLE, validateDeliveryProof } from '../utils/deliveryProof'

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
  /** Chưa lấy hàng thì "thất bại" nghĩa là không lấy được hàng */
  stage: 'pickup' | 'delivery'
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

  useEffect(() => {
    if (!visible) return
    setPhotos([])
    setReason(null)
    setCalls(0)
    setNote('')
    setTouched(false)
  }, [visible])

  const errors = validateDeliveryProof({ photoCount: photos.length, reason, callAttempts: calls, note }, failed)

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

  const title = failed
    ? stage === 'pickup'
      ? `Không lấy được hàng · #${orderId}`
      : `Báo giao thất bại · #${orderId}`
    : `Xác nhận đã giao · #${orderId}`

  return (
    <BottomSheet
      visible={visible}
      onClose={() => !loading && onClose()}
      title={title}
      subtitle={failed ? 'Đơn sẽ bị huỷ giao, hàng hoàn về kho' : 'Chụp ảnh hàng tại nhà khách hoặc lúc khách nhận'}
      footer={
        <>
          <Button title="Huỷ" variant="outline" disabled={loading} onPress={onClose} className="min-h-[48px] flex-1" />
          <Button
            title={failed ? 'Báo thất bại' : 'Đã giao'}
            variant={failed ? 'danger' : 'primary'}
            loading={loading}
            onPress={submit}
            className="min-h-[48px] flex-[1.6]"
          />
        </>
      }
    >
      <View className="gap-4">
        {!failed && (
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
              options={FAIL_REASONS}
              value={reason ?? ''}
              onChange={(v) => setReason(v as DeliveryFailReason)}
            />
            {touched && errors.reason && <AppText className="text-xs text-sale">{errors.reason}</AppText>}

            <View className="flex-row items-center justify-between gap-3 rounded-card border border-line p-3">
              <View className="flex-1">
                <AppText weight="bold" className="text-sm">
                  Số cuộc đã gọi khách
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
              placeholder="VD: khách hẹn giao lại ngày mai"
              error={touched ? errors.note : undefined}
            />
          </>
        )}

        <View className="gap-2">
          <AppText weight="semibold" className="text-sm">
            {failed ? 'Ảnh bằng chứng (cửa nhà, lịch sử cuộc gọi…)' : 'Ảnh giao hàng'}
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {photos.map((p, i) => (
              <View key={p.uri} className="h-20 w-20 overflow-hidden rounded-xl border border-line">
                <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <Pressable
                  onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  accessibilityRole="button"
                  accessibilityLabel="Xoá ảnh"
                  className="absolute right-1 top-1 rounded-full bg-ink/70 p-1"
                >
                  <X size={12} color={colors.white} />
                </Pressable>
              </View>
            ))}
          </View>
          {photos.length < MAX_PROOF_IMAGES && (
            <View className="flex-row gap-2">
              <Button title="Chụp ảnh" icon={Camera} variant="outline" onPress={() => void pick('camera')} className="min-h-[44px] flex-1" />
              <Button title="Chọn ảnh" icon={ImagePlus} variant="outline" onPress={() => void pick('library')} className="min-h-[44px] flex-1" />
            </View>
          )}
          <AppText className="text-xs text-ink-muted">Bắt buộc ít nhất 1 ảnh, tối đa {MAX_PROOF_IMAGES} ảnh.</AppText>
          {touched && errors.photos && <AppText className="text-xs text-sale">{errors.photos}</AppText>}
        </View>
      </View>
    </BottomSheet>
  )
}
