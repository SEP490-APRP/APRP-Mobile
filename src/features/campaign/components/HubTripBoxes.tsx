import { Check } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import type { HubTrip } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { useLoadBoxes } from '../hooks/useCampaignQueries'

/** Nhận hàng lên xe: chạm từng thùng (hoặc cả đơn); đủ hết mới chạy ra hub được */
export function HubTripBoxes({ t, locked }: { t: HubTrip; locked: boolean }) {
  const save = useLoadBoxes()
  const showToast = useUiStore((s) => s.showToast)
  const boxes = t.boxes ?? []
  if (!boxes.length) return null
  const total = t.boxTotal ?? 0
  const done = t.boxLoaded ?? 0
  const send = (orderId: number, loaded: number[]) =>
    save.mutate({ id: t.tripId, orderId, loaded }, { onError: (e) => showToast(getErrorMessage(e, 'Chưa lưu được thùng đã nhận.')) })

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <AppText weight="extrabold" className="text-sm">
          Nhận thùng lên xe
        </AppText>
        <AppText weight="extrabold" className={`text-sm ${done === total ? 'text-leaf-700' : 'text-amber-700'}`}>
          {done}/{total} thùng
        </AppText>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-line">
        <View className="h-2 rounded-full bg-leaf-700" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </View>
      {locked ? (
        <AppText className="text-[11px] text-ink-subtle">Tới ngày lấy hàng và sau khi CapNong chốt xe, bạn chạm từng thùng khi bốc lên xe.</AppText>
      ) : (
        boxes.map((b) => {
          const full = b.loaded.length === b.crates
          const all = Array.from({ length: b.crates }, (_, i) => i + 1)
          return (
            <View key={b.orderId} className={`gap-2 rounded-2xl border p-3 ${full ? 'border-leaf-200 bg-leaf-50' : 'border-line'}`}>
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">
                  <AppText weight="bold" className="text-xs">
                    {b.hubName} · {b.code}
                  </AppText>
                  <AppText className="text-[11px] text-ink-muted">
                    {b.recipientName} · {b.crates} thùng × {b.crateKg} kg
                  </AppText>
                </View>
                <Pressable disabled={save.isPending} onPress={() => send(b.orderId, full ? [] : all)} className="rounded-lg border border-leaf-700 px-2.5 py-1.5">
                  <AppText weight="bold" className="text-[11px] text-leaf-700">
                    {full ? 'Bỏ chọn' : 'Nhận cả đơn'}
                  </AppText>
                </Pressable>
              </View>
              <View className="flex-row flex-wrap gap-1.5">
                {all.map((n) => {
                  const on = b.loaded.includes(n)
                  return (
                    <Pressable
                      key={n}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`Thùng ${n} đơn ${b.code}`}
                      disabled={save.isPending}
                      onPress={() => send(b.orderId, on ? b.loaded.filter((x) => x !== n) : [...b.loaded, n])}
                      className={`h-10 min-w-10 flex-row items-center justify-center gap-0.5 rounded-lg border px-2 ${on ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white'}`}
                    >
                      {on && <Check size={12} color={colors.white} />}
                      <AppText weight="extrabold" className={`text-xs ${on ? 'text-white' : 'text-ink-muted'}`}>
                        {n}
                      </AppText>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )
        })
      )}
    </View>
  )
}
