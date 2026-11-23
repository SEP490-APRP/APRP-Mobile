import { Image } from 'expo-image'
import { Calendar, Check, ImagePlus, MapPin, Minus, Navigation, Plus, X, type LucideIcon } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, Linking, Pressable, View } from 'react-native'
import { AppText, Checkbox, TextField } from '@/components/ui'
import { ImageSourceSheet, uploadImageUrl, usePickProductImage, type ImageSource } from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { addDays, directionsUrl, fmtDate, TONE_CLASS } from '../utils/campaignFormat'

type Tone = keyof typeof TONE_CLASS

export function Pill({ text, tone = 'leaf', icon: Icon }: { text: string; tone?: Tone; icon?: LucideIcon }) {
  const t = TONE_CLASS[tone]
  return (
    <View className={cn('flex-row items-center gap-1 self-start rounded-full px-2.5 py-1', t.bg)}>
      {Icon && <Icon size={12} color={colors.inkMuted} />}
      <AppText weight="bold" className={cn('text-[11px]', t.text)}>
        {text}
      </AppText>
    </View>
  )
}

export function ProgressBar({ pct, marker }: { pct: number; marker?: number }) {
  return (
    <View className="h-2.5 justify-center rounded-full bg-line">
      <View className="h-2.5 rounded-full bg-leaf-600" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      {marker != null && (
        <View className="absolute h-5 w-[3px] rounded bg-amber-600" style={{ left: `${Math.min(99, marker)}%` }} />
      )}
    </View>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('gap-3 rounded-panel border border-line bg-white p-4', className)}>{children}</View>
}

export function SectionTitle({ icon: Icon, title, hint }: { icon?: LucideIcon; title: string; hint?: string }) {
  return (
    <View className="gap-0.5">
      <View className="flex-row items-center gap-2">
        {Icon && <Icon size={17} color={colors.leaf700} />}
        <AppText weight="extrabold" className="text-base">
          {title}
        </AppText>
      </View>
      {hint && <AppText className="text-xs text-ink-muted">{hint}</AppText>}
    </View>
  )
}

/** Ô thông tin nhỏ: nhãn trên, giá trị dưới */
export function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <View className={cn('min-w-0 flex-1 gap-0.5', className)}>
      <AppText className="text-[11px] text-ink-subtle" numberOfLines={1}>
        {label}
      </AppText>
      <AppText weight="extrabold" className="text-sm" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  )
}

export function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-0.5">
      <AppText className={cn('flex-1 text-sm', strong ? 'text-ink' : 'text-ink-muted')} weight={strong ? 'bold' : 'regular'}>
        {label}
      </AppText>
      <AppText weight={strong ? 'extrabold' : 'bold'} className={cn('text-sm', strong && 'text-base text-amber-700')}>
        {value}
      </AppText>
    </View>
  )
}

export function Bullet({ children, n }: { children: ReactNode; n?: number }) {
  return (
    <View className="flex-row gap-2.5">
      <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-leaf-600">
        {n != null ? (
          <AppText weight="extrabold" className="text-[11px] text-white">
            {n}
          </AppText>
        ) : (
          <Check size={12} color={colors.white} />
        )}
      </View>
      <AppText className="flex-1 text-sm leading-relaxed text-ink-muted">{children}</AppText>
    </View>
  )
}

export function Notice({ children, tone = 'amber' }: { children: ReactNode; tone?: Tone }) {
  const t = TONE_CLASS[tone]
  return (
    <View className={cn('rounded-2xl px-3.5 py-3', t.bg)}>
      <AppText className={cn('text-xs leading-relaxed', t.text)}>{children}</AppText>
    </View>
  )
}

/** Điểm tập kết + nút chỉ đường (mở Google Maps) */
export function SiteLocation({
  name,
  address,
  lat,
  lng,
  label = 'Điểm tập kết',
}: {
  name?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  label?: string
}) {
  const url = directionsUrl(lat, lng, address)
  return (
    <View className="flex-row gap-3 rounded-2xl border border-leaf-100 bg-leaf-50 p-3">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
        <MapPin size={16} color={colors.leaf700} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <AppText className="text-[11px] uppercase text-ink-subtle" weight="bold">
          {label}
        </AppText>
        <AppText weight="bold" className="text-sm">
          {name || 'Điểm gom sẽ được thông báo'}
        </AppText>
        {!!address && <AppText className="text-xs text-ink-muted">{address}</AppText>}
        {url && (
          <Pressable
            onPress={() => void Linking.openURL(url)}
            accessibilityRole="link"
            className="mt-1.5 flex-row items-center gap-1.5 self-start rounded-full bg-leaf-700 px-3 py-1.5 active:opacity-80"
          >
            <Navigation size={13} color={colors.white} />
            <AppText weight="bold" className="text-xs text-white">
              Chỉ đường
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  )
}

/** Nút -/+ chọn số lượng */
export function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <View className="flex-row items-center rounded-full border border-line">
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        accessibilityLabel="Bớt"
        className={cn('h-10 w-10 items-center justify-center', value <= min && 'opacity-40')}
      >
        <Minus size={16} color={colors.leaf700} />
      </Pressable>
      <AppText weight="extrabold" className="w-8 text-center">
        {value}
      </AppText>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        accessibilityLabel="Thêm"
        className={cn('h-10 w-10 items-center justify-center', value >= max && 'opacity-40')}
      >
        <Plus size={16} color={colors.leaf700} />
      </Pressable>
    </View>
  )
}

/** Ô tick kèm chữ (cam kết, đồng ý điều khoản) */
export function CheckRow({ checked, onChange, children, disabled }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      className={cn('flex-row items-start gap-1 rounded-2xl border p-2 pr-3', checked ? 'border-leaf-700 bg-leaf-50' : 'border-line', disabled && 'opacity-50')}
    >
      <Checkbox checked={checked} onChange={() => !disabled && onChange(!checked)} label="Đồng ý" disabled={disabled} />
      <AppText className="flex-1 pt-2.5 text-xs leading-relaxed text-ink">{children}</AppText>
    </Pressable>
  )
}

/**
 * Chọn ngày 'yyyy-MM-dd' không cần thư viện lịch: lùi / tiến từng ngày và vài mốc nhanh.
 * Thay cho ô <input type="date"> của bản web.
 */
export function DateField({
  label,
  value,
  onChange,
  min,
  max,
  error,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  min?: string
  max?: string
  error?: string | null
  hint?: string
}) {
  const clamp = (v: string) => (min && v < min ? min : max && v > max ? max : v)
  const base = value || clamp(min ?? addDays(new Date().toISOString().slice(0, 10), 0))
  const step = (n: number) => onChange(clamp(addDays(base, n)))
  return (
    <View className="gap-1.5">
      <AppText weight="semibold" className="text-sm">
        {label}
      </AppText>
      <View className={cn('flex-row items-center rounded-card border bg-white', error ? 'border-sale' : 'border-line-strong')}>
        <Pressable onPress={() => step(-1)} accessibilityLabel="Lùi một ngày" className="h-12 w-12 items-center justify-center">
          <Minus size={16} color={colors.leaf700} />
        </Pressable>
        <Pressable onPress={() => !value && onChange(base)} className="flex-1 flex-row items-center justify-center gap-2">
          <Calendar size={15} color={colors.inkSubtle} />
          <AppText weight="bold" className={cn('text-base', !value && 'text-ink-subtle')}>
            {value ? fmtDate(value) : 'Chạm để chọn'}
          </AppText>
        </Pressable>
        <Pressable onPress={() => step(1)} accessibilityLabel="Tiến một ngày" className="h-12 w-12 items-center justify-center">
          <Plus size={16} color={colors.leaf700} />
        </Pressable>
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {[
          { l: '-7 ngày', n: -7 },
          { l: '+7 ngày', n: 7 },
        ].map((s) => (
          <Pressable key={s.l} onPress={() => step(s.n)} className="rounded-full bg-paper px-2.5 py-1">
            <AppText className="text-[11px] text-ink-muted">{s.l}</AppText>
          </Pressable>
        ))}
      </View>
      {!!hint && !error && <AppText className="text-[11px] text-ink-subtle">{hint}</AppText>}
      {!!error && <AppText className="text-xs text-sale">{error}</AppText>}
    </View>
  )
}

/** Ô nhập số (kg, giá) */
export function NumberField(props: { label: string; value: string; onChange: (v: string) => void; error?: string | null; placeholder?: string; suffix?: string }) {
  return (
    <TextField
      label={props.suffix ? `${props.label} (${props.suffix})` : props.label}
      value={props.value}
      onChangeText={(t) => props.onChange(t.replace(',', '.').replace(/[^\d.]/g, ''))}
      keyboardType="decimal-pad"
      placeholder={props.placeholder}
      error={props.error ?? undefined}
    />
  )
}

/** Lưới ảnh đã chọn + nút thêm (chụp / thư viện), tự tải lên Cloudinary */
export function PhotoPicker({
  urls,
  onChange,
  max = 5,
  folder,
  error,
}: {
  urls: string[]
  onChange: (next: string[]) => void
  max?: number
  folder: string
  error?: string | null
}) {
  const pick = usePickProductImage()
  const showToast = useUiStore((s) => s.showToast)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const onPick = async (source: ImageSource) => {
    setOpen(false)
    const file = await pick(source, [1, 1])
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImageUrl(file, folder)
      onChange([...urls, url].slice(0, max))
    } catch (err) {
      showToast(getErrorMessage(err, 'Không tải được ảnh, thử lại nhé.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <View className="gap-1.5">
      <View className="flex-row flex-wrap gap-2">
        {urls.map((u) => (
          <View key={u} className="h-20 w-20 overflow-hidden rounded-xl border border-line">
            <Image source={{ uri: u }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            <Pressable
              onPress={() => onChange(urls.filter((x) => x !== u))}
              accessibilityLabel="Bỏ ảnh"
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5"
            >
              <X size={12} color={colors.white} />
            </Pressable>
          </View>
        ))}
        {urls.length < max && (
          <Pressable
            onPress={() => setOpen(true)}
            disabled={uploading}
            className="h-20 w-20 items-center justify-center gap-1 rounded-xl border-2 border-dashed border-leaf-200"
          >
            {uploading ? <ActivityIndicator color={colors.leaf700} /> : <ImagePlus size={18} color={colors.leaf700} />}
            <AppText weight="bold" className="text-[11px] text-leaf-700">
              {uploading ? 'Đang tải' : 'Thêm ảnh'}
            </AppText>
          </Pressable>
        )}
      </View>
      <AppText className="text-[11px] text-ink-subtle">
        {urls.length}/{max} ảnh
      </AppText>
      {!!error && <AppText className="text-xs text-sale">{error}</AppText>}
      <ImageSourceSheet visible={open} title="Thêm ảnh" subtitle="Chụp rõ, đủ sáng" onClose={() => setOpen(false)} onPick={(s) => void onPick(s)} />
    </View>
  )
}
