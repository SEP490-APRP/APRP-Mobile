import { Image } from 'expo-image'
import { Camera, CheckCircle2 } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import { ImageSourceSheet, uploadImageUrl, usePickProductImage, type ImageSource } from '@/features/shop'
import { useUiStore } from '@/stores'
import { getErrorMessage } from '@/utils/errors'

/** Chụp ảnh minh chứng rồi mới bấm xác nhận được (bốc hàng lên xe, giao tới hub) */
export function PhotoConfirm({
  subtitle,
  captureLabel,
  confirmLabel,
  busy,
  onConfirm,
}: {
  subtitle: string
  captureLabel: string
  confirmLabel: string
  busy: boolean
  onConfirm: (photoUrl: string) => void
}) {
  const pick = usePickProductImage()
  const showToast = useUiStore((s) => s.showToast)
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [open, setOpen] = useState(false)

  const onPick = async (source: ImageSource) => {
    setOpen(false)
    const file = await pick(source, [3, 4])
    if (!file) return
    setUploading(true)
    try {
      setPhoto(await uploadImageUrl(file, 'pod'))
    } catch (e) {
      showToast(getErrorMessage(e, 'Không tải được ảnh, thử lại nhé.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <View className="gap-2">
      {photo && (
        <View className="h-24 w-24 overflow-hidden rounded-xl border border-line">
          <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
      )}
      <Button title={photo ? 'Chụp lại' : captureLabel} variant="ghost" icon={Camera} loading={uploading} onPress={() => setOpen(true)} />
      {!photo && <AppText className="text-[11px] text-amber-700">Chụp ảnh trước khi bấm {confirmLabel.toLowerCase()}.</AppText>}
      <Button title={confirmLabel} icon={CheckCircle2} disabled={!photo || uploading} loading={busy} onPress={() => photo && onConfirm(photo)} />
      <ImageSourceSheet visible={open} title="Ảnh minh chứng" subtitle={subtitle} onClose={() => setOpen(false)} onPick={(s) => void onPick(s)} />
    </View>
  )
}
