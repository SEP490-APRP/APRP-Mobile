import { Check, Truck } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import type { PreOrderResponse } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { useShipperPreOrderAction } from '../hooks/useCampaignQueries'

/** Đơn đã nhận, chờ lấy ở hub: chạm đủ thùng rồi mới bắt đầu giao, hoặc bỏ nhận */
export function HubPickupActions({ o }: { o: PreOrderResponse }) {
  const { pickup, release } = useShipperPreOrderAction()
  const showToast = useUiStore((s) => s.showToast)
  const [ticked, setTicked] = useState<number[]>([])
  const all = Array.from({ length: o.crateQuantity }, (_, i) => i + 1)
  const full = ticked.length === o.crateQuantity
  const waitingHub = o.hubId != null && !o.hubReceivedAt

  const drop = () =>
    Alert.alert(`Bỏ nhận đơn ${o.code}?`, 'Đơn trở lại hub cho tài xế khác và bạn được gỡ ký quỹ.', [
      { text: 'Thôi', style: 'cancel' },
      {
        text: 'Bỏ nhận',
        style: 'destructive',
        onPress: () => release.mutate(o.preOrderId, { onError: (e) => showToast(getErrorMessage(e, 'Chưa bỏ nhận được.')) }),
      },
    ])

  return (
    <View className="gap-2">
      {waitingHub ? (
        <View className="rounded-xl bg-amber-50 px-3 py-2">
          <AppText weight="bold" className="text-xs text-amber-700">
            Hub đang kiểm lại đơn này{o.hubIssueNote ? `: ${o.hubIssueNote}` : ''}
          </AppText>
        </View>
      ) : (
        <>
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" className="text-xs">
              Chạm từng thùng khi lấy · {ticked.length}/{o.crateQuantity}
            </AppText>
            <Pressable onPress={() => setTicked(full ? [] : all)} className="rounded-lg border border-leaf-700 px-2.5 py-1.5">
              <AppText weight="bold" className="text-[11px] text-leaf-700">
                {full ? 'Bỏ chọn' : 'Lấy cả đơn'}
              </AppText>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {all.map((n) => {
              const on = ticked.includes(n)
              return (
                <Pressable
                  key={n}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`Thùng ${n} đơn ${o.code}`}
                  onPress={() => setTicked((x) => (on ? x.filter((i) => i !== n) : [...x, n]))}
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
          <Button
            title={full ? 'Đã lấy đủ, bắt đầu giao' : `Còn ${o.crateQuantity - ticked.length} thùng chưa lấy`}
            icon={Truck}
            disabled={!full}
            loading={pickup.isPending}
            onPress={() =>
              pickup.mutate(
                { id: o.preOrderId, crates: ticked },
                { onSuccess: () => showToast('Đã lấy hàng, bắt đầu giao.'), onError: (e) => showToast(getErrorMessage(e, 'Chưa lấy hàng được.')) },
              )
            }
          />
        </>
      )}
      <Button title="Bỏ nhận" variant="ghost" loading={release.isPending} onPress={drop} />
    </View>
  )
}
