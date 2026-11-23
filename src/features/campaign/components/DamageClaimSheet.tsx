import { Scale, ShieldCheck } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button, TextField } from '@/components/ui'
import { campaignService, type PreOrderResponse } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { fmtDateTime, formatVnd } from '../utils/campaignFormat'
import { NumberField, PhotoPicker } from './CampaignBits'

const REASONS = ['Dập nát', 'Héo / úng', 'Thối, có mùi', 'Sai loại hàng']

/** Báo hàng hư đơn chiến dịch (không cần hoàn hàng): cân phần hư, chụp ảnh, CapNong duyệt và hoàn tiền vào ví */
export function DamageClaimSheet({ p, onClose, onDone }: { p: PreOrderResponse | null; onClose: () => void; onDone: () => void }) {
  const showToast = useUiStore((s) => s.showToast)
  const [kg, setKg] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [reasons, setReasons] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (p) {
      setKg('')
      setPhotos([])
      setReasons([])
      setNote('')
    }
  }, [p])

  if (!p) return null
  const kgNum = Number(kg)
  const maxKg = Number(p.totalKg ?? 0)
  const estimate = kgNum > 0 ? kgNum * Number(p.unitPrice ?? 0) : 0
  const kgError = kg !== '' && !(kgNum > 0) ? 'Nhập số kg lớn hơn 0' : kgNum > maxKg ? `Đơn chỉ có ${maxKg} kg` : null
  const valid = kgNum > 0 && kgNum <= maxKg && photos.length > 0

  const submit = async () => {
    if (!valid) return
    setSending(true)
    try {
      const reason = [reasons.join(', '), note.trim()].filter(Boolean).join(' · ')
      await campaignService.reportDamage(p.preOrderId, { claimedKg: kgNum, photoUrls: photos, reason: reason || undefined })
      showToast(`Đã gửi báo hư ${kgNum} kg. CapNong sẽ xem ảnh và hoàn tiền vào ví của bạn.`)
      onDone()
    } catch (e) {
      showToast(getErrorMessage(e, 'Gửi báo hư không thành công.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <BottomSheet
      visible
      title="Báo hàng hư"
      subtitle={`Đơn ${p.code}`}
      onClose={() => !sending && onClose()}
      footer={<Button className="flex-1" title="Gửi báo hư" icon={Scale} loading={sending} disabled={!valid} onPress={() => void submit()} />}
    >
      <View className="gap-4">
        <View className="gap-1.5 rounded-2xl bg-leaf-50 p-3.5">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color={colors.leaf700} />
            <AppText weight="bold" className="text-sm text-leaf-800">
              Không cần gửi trả hàng
            </AppText>
          </View>
          <AppText className="text-xs leading-relaxed text-leaf-800">
            1. Đặt phần hàng hư lên cân, chụp ảnh thấy rõ số trên cân.{'\n'}2. Chụp thêm ảnh cận cảnh hàng hư và thùng có mã đơn {p.code}.{'\n'}3. CapNong
            đối chiếu ảnh và hoàn tiền phần hư vào ví (thường trong 24 giờ).
          </AppText>
        </View>
        <NumberField label="Số kg hư (theo cân)" suffix="kg" value={kg} onChange={setKg} placeholder={`Tối đa ${maxKg} kg`} error={kgError} />
        <View className="gap-1.5">
          <AppText weight="semibold" className="text-sm">
            Ảnh cân và ảnh hàng hư
          </AppText>
          <PhotoPicker urls={photos} onChange={setPhotos} folder="campaign-damage" />
        </View>
        <View className="gap-2">
          <AppText weight="semibold" className="text-sm">
            Tình trạng
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {REASONS.map((r) => {
              const on = reasons.includes(r)
              return (
                <Pressable
                  key={r}
                  onPress={() => setReasons((x) => (on ? x.filter((y) => y !== r) : [...x, r]))}
                  className={cn('rounded-full border px-3 py-1.5', on ? 'border-leaf-700 bg-leaf-50' : 'border-line')}
                >
                  <AppText weight="semibold" className={cn('text-xs', on ? 'text-leaf-700' : 'text-ink-muted')}>
                    {r}
                  </AppText>
                </Pressable>
              )
            })}
          </View>
          <TextField label="Mô tả thêm (không bắt buộc)" value={note} onChangeText={setNote} maxLength={300} multiline />
        </View>
        <View className="flex-row items-center justify-between rounded-2xl bg-paper p-3.5">
          <AppText className="flex-1 text-xs text-ink-muted">
            Dự kiến hoàn ({kgNum > 0 ? kgNum : 0} kg × {formatVnd(p.unitPrice)}/kg)
          </AppText>
          <AppText weight="extrabold" className="text-lg text-leaf-700">
            {formatVnd(estimate)}
          </AppText>
        </View>
        {p.damageClaimDeadline && (
          <AppText className="text-xs text-ink-subtle">Hạn báo hư: {fmtDateTime(p.damageClaimDeadline)} (24 giờ sau khi nhận hàng).</AppText>
        )}
      </View>
    </BottomSheet>
  )
}
