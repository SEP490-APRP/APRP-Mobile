import { Check, PackageCheck, Search, X } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import type { HubTripBox } from '@/services'
import { colors } from '@/theme/colors'
import { absoluteUrl, cn } from '@/utils/helpers'
import { crateNumbers, crateTotals, filterBoxes, isBoxFull, isPackageToken, type CrateFilter } from '../utils/crates'
import { QrCode } from './QrCode'

const traceUrl = (token: string) => absoluteUrl(`/truy-xuat/${token}`)

/**
 * Màn kiểm thùng toàn màn hình (CrateScanDialog bản web): mỗi đơn một thẻ có mã QR, chạm từng thùng.
 * Dùng khi tài xế xe bốc hàng và khi shipper lấy hàng ở hub.
 */
export function CrateSheet({
  title,
  subtitle,
  word,
  boxes,
  line,
  saving = false,
  error,
  onSet,
  onClose,
  action,
}: {
  title: string
  subtitle?: string | null
  /** "nhận" (tài xế bốc lên xe) hoặc "lấy" (shipper lấy ở hub) */
  word: 'nhận' | 'lấy'
  boxes: HubTripBox[]
  /** Dòng ghi nơi giao trên mỗi thẻ */
  line: (b: HubTripBox) => string
  saving?: boolean
  /** Lỗi hiện ngay trong màn này (toast bị màn che) */
  error?: string | null
  onSet: (b: HubTripBox, loaded: number[]) => void
  onClose: () => void
  /** Nút việc tiếp theo ở chân màn */
  action?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState<CrateFilter>('all')
  const [query, setQuery] = useState('')
  const [zoomId, setZoomId] = useState<number | null>(null)
  const zoom = boxes.find((b) => b.orderId === zoomId)
  const { done, total } = crateTotals(boxes)
  const filters: { id: CrateFilter; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'left', label: 'Chưa đủ' },
    { id: 'full', label: 'Đã đủ' },
  ]

  return (
    <Modal visible animationType="slide" onRequestClose={() => (zoom ? setZoomId(null) : onClose())}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-paper">
        <View className="flex-row items-center gap-3 bg-leaf-700 px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
          <PackageCheck size={22} color={colors.sun300} />
          <View className="min-w-0 flex-1">
            <AppText accessibilityRole="header" weight="extrabold" numberOfLines={1} className="text-lg text-white">
              {title}
            </AppText>
            {!!subtitle && (
              <AppText numberOfLines={1} className="text-xs text-white/75">
                {subtitle}
              </AppText>
            )}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" hitSlop={8} onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <X size={18} color={colors.white} />
          </Pressable>
        </View>

        <View className="gap-2 border-b border-line bg-white px-4 py-3">
          <View className="flex-row gap-2">
            {filters.map((f) => {
              const on = filter === f.id
              return (
                <Pressable
                  key={f.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setFilter(f.id)}
                  className={cn('flex-1 items-center rounded-xl border py-2', on ? 'border-leaf-700 bg-leaf-50' : 'border-line')}
                >
                  <AppText weight="bold" className={cn('text-xs', on ? 'text-leaf-800' : 'text-ink-muted')}>
                    {f.label} ({filterBoxes(boxes, f.id, '').length})
                  </AppText>
                </Pressable>
              )
            })}
          </View>
          <View className="flex-row items-center gap-2 rounded-xl border border-line px-3">
            <Search size={15} color={colors.inkSubtle} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm tên, mã đơn hoặc hub"
              placeholderTextColor={colors.inkSubtle}
              accessibilityLabel="Tìm đơn"
              autoCorrect={false}
              className="min-h-[40px] flex-1 text-sm text-ink"
            />
          </View>
        </View>

        <FlatList
          className="flex-1"
          contentContainerClassName="gap-3 p-4"
          keyboardShouldPersistTaps="handled"
          data={filterBoxes(boxes, filter, query)}
          keyExtractor={(b) => String(b.orderId)}
          ListEmptyComponent={<AppText className="py-10 text-center text-sm text-ink-subtle">Không có đơn nào.</AppText>}
          renderItem={({ item: b }) => {
            const full = isBoxFull(b)
            const all = crateNumbers(b.crates)
            return (
              <View className={cn('gap-2.5 rounded-2xl border-2 bg-white p-3', full ? 'border-leaf-700' : 'border-line')}>
                <View className="flex-row gap-3">
                  {isPackageToken(b.qrCode) ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Phóng to mã QR đơn ${b.code}`} onPress={() => setZoomId(b.orderId)} className="self-start rounded-xl border border-line p-1">
                      <QrCode value={traceUrl(b.qrCode)} size={84} label={`Mã QR đơn ${b.code}`} />
                    </Pressable>
                  ) : (
                    <View className="h-[94px] w-[94px] items-center justify-center rounded-xl bg-paper">
                      <AppText className="text-center text-[11px] text-ink-subtle">Chưa có mã QR</AppText>
                    </View>
                  )}
                  <View className="min-w-0 flex-1 gap-0.5">
                    <View className="flex-row items-start justify-between gap-2">
                      <AppText weight="extrabold" numberOfLines={1} className="flex-1 text-sm">
                        {b.recipientName}
                      </AppText>
                      <View className={cn('rounded-full px-2 py-0.5', full ? 'bg-leaf-100' : 'bg-amber-50')}>
                        <AppText weight="bold" className={cn('text-[11px]', full ? 'text-leaf-800' : 'text-amber-700')}>
                          {b.loaded.length}/{b.crates} thùng
                        </AppText>
                      </View>
                    </View>
                    <AppText weight="bold" className="text-xs">
                      {b.crates} × {b.crateKg} kg = {b.crates * b.crateKg} kg
                    </AppText>
                    <AppText numberOfLines={1} className="text-xs text-ink-subtle">
                      {b.code}
                    </AppText>
                    <AppText weight="semibold" numberOfLines={2} className="text-xs text-leaf-700">
                      {line(b)}
                    </AppText>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {all.map((n) => {
                    const on = b.loaded.includes(n)
                    return (
                      <Pressable
                        key={n}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={`Thùng ${n} đơn ${b.code}`}
                        onPress={() => onSet(b, on ? b.loaded.filter((x) => x !== n) : [...b.loaded, n])}
                        className={cn('h-11 min-w-11 flex-row items-center justify-center gap-0.5 rounded-lg border px-2', on ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white')}
                      >
                        {on && <Check size={13} color={colors.white} />}
                        <AppText weight="extrabold" className={cn('text-sm', on ? 'text-white' : 'text-ink-muted')}>
                          {n}
                        </AppText>
                      </Pressable>
                    )
                  })}
                  <Pressable accessibilityRole="button" onPress={() => onSet(b, full ? [] : all)} className="ml-auto h-11 justify-center rounded-lg border border-leaf-700 px-3">
                    <AppText weight="bold" className="text-xs text-leaf-700">
                      {full ? 'Bỏ chọn' : `${word === 'nhận' ? 'Nhận' : 'Lấy'} cả đơn`}
                    </AppText>
                  </Pressable>
                </View>
              </View>
            )
          }}
        />

        <View className="gap-2 border-t border-line bg-white px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 8) + 6 }}>
          {!!error && (
            <AppText accessibilityRole="alert" weight="bold" className="text-xs text-sale">
              {error}
            </AppText>
          )}
          <View className="flex-row items-center gap-2">
            <AppText weight="extrabold" className="text-sm">
              Đã {word} {done}/{total} thùng
            </AppText>
            {saving && <ActivityIndicator size="small" color={colors.leaf700} />}
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-line">
            <View className="h-2 rounded-full bg-leaf-700" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </View>
          {action}
        </View>

        {zoom && isPackageToken(zoom.qrCode) && (
          <Pressable accessibilityLabel="Đóng mã QR" onPress={() => setZoomId(null)} className="absolute inset-0 items-center justify-center bg-black/70 p-6">
            <Pressable className="w-full max-w-sm items-center gap-3 rounded-panel bg-white p-5">
              <QrCode value={traceUrl(zoom.qrCode)} size={260} label={`Mã QR đơn ${zoom.code}`} />
              <AppText weight="extrabold" className="text-center text-base">
                {zoom.recipientName} · {zoom.crates} × {zoom.crateKg} kg
              </AppText>
              <AppText className="text-center text-xs text-ink-muted">
                {zoom.code}
                {zoom.hubName ? ` · ${zoom.hubName}` : ''}
              </AppText>
              <View className="gap-1 self-stretch">
                <Button title="Xem thông tin thùng" variant="outline" onPress={() => void Linking.openURL(traceUrl(zoom.qrCode as string))} />
                <Button title="Đóng" variant="ghost" onPress={() => setZoomId(null)} />
              </View>
            </Pressable>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}
