import { Navigation, PackageCheck, Phone, Truck, Warehouse } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Linking, Pressable, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import type { HubTripBox, PreOrderResponse } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { useShipperPreOrderAction } from '../hooks/useCampaignQueries'
import { directionsUrl, hubConfirmText } from '../utils/campaignFormat'
import { crateTotals, isBoxFull } from '../utils/crates'
import type { HubGroup } from '../utils/hubRun'
import { CrateSheet } from './CrateSheet'
import { ShipperPreOrderCard } from './ShipperPreOrderCard'

/** Thùng shipper đã kiểm, theo mã đơn; giữ ở màn hình để đóng màn kiểm không mất */
export type CrateTicks = Record<number, number[]>

/** Đơn đã nhận ở cùng một hub: kiểm đủ thùng của đơn nào thì đơn đó được lấy đi giao, hoặc bỏ nhận */
export function HubPickupGroup({ hub, ticks, onTick }: { hub: HubGroup; ticks: CrateTicks; onTick: (orderId: number, crates: number[]) => void }) {
  const { pickup, release } = useShipperPreOrderAction()
  const showToast = useUiStore((s) => s.showToast)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const info = hub.orders[0]
  const waiting = (o: PreOrderResponse) => o.hubId != null && !o.hubReceivedAt
  const boxes: HubTripBox[] = hub.orders
    .filter((o) => !waiting(o))
    .map((o) => ({
      orderId: o.preOrderId,
      code: o.code,
      recipientName: o.recipientName,
      hubName: o.hubName,
      crateKg: o.crateKg,
      crates: o.crateQuantity,
      loaded: ticks[o.preOrderId] ?? [],
      qrCode: o.qrCode,
    }))
  const full = boxes.filter(isBoxFull)
  const { done, total } = crateTotals(boxes)
  const way = directionsUrl(info.hubLatitude, info.hubLongitude, info.hubAddress)

  // Lấy lần lượt từng đơn đã đủ thùng; lỗi thì dừng và báo ngay trong màn kiểm
  const start = async () => {
    setSending(true)
    setError(null)
    try {
      for (const b of full) await pickup.mutateAsync({ id: b.orderId, crates: b.loaded })
      showToast(`Đã lấy ${full.length} đơn, bắt đầu giao.`)
      setOpen(false)
    } catch (e) {
      setError(getErrorMessage(e, 'Chưa lấy hàng được.'))
    } finally {
      setSending(false)
    }
  }

  const drop = (o: PreOrderResponse) =>
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
      <View className="gap-3 rounded-panel border border-leaf-200 bg-leaf-50 p-4">
        <View className="flex-row items-start gap-2">
          <Warehouse size={18} color={colors.leaf700} />
          <View className="min-w-0 flex-1">
            <AppText weight="extrabold" className="text-base text-leaf-800">
              {info.hubName ? `Hub ${info.hubName.replace(/^hub\s+/i, '')}` : hub.name}
            </AppText>
            {!!hub.address && <AppText className="text-xs text-ink-muted">{hub.address}</AppText>}
            {(!!info.hubOpenHours || !!info.hubPhone) && (
              <AppText className="text-xs text-ink-subtle">{[info.hubOpenHours, info.hubPhone].filter(Boolean).join(' · ')}</AppText>
            )}
          </View>
          {way && <IconLink icon={Navigation} label="Đường tới hub" url={way} />}
          {!!info.hubPhone && <IconLink icon={Phone} label="Gọi hub" url={`tel:${info.hubPhone}`} />}
        </View>
        {boxes.length > 0 && (
          <Button
            title={`Lấy hàng · ${done}/${total} thùng`}
            icon={PackageCheck}
            onPress={() => {
              setError(null)
              setOpen(true)
            }}
          />
        )}
      </View>

      {hub.orders.map((o) => (
        <ShipperPreOrderCard
          key={o.preOrderId}
          o={o}
          hideHub
          action={
            <View className="gap-1">
              {waiting(o) ? (
                <View className="rounded-xl bg-amber-50 px-3 py-2">
                  <AppText weight="bold" className="text-xs text-amber-700">
                    Hub đang kiểm lại đơn này{o.hubIssueNote ? `: ${o.hubIssueNote}` : ''}
                  </AppText>
                </View>
              ) : (
                !!hubConfirmText(o) && (
                  <AppText weight="bold" className="text-xs text-leaf-700">
                    ✓ {hubConfirmText(o)}
                  </AppText>
                )
              )}
              <Button title="Bỏ nhận" variant="ghost" loading={release.isPending && release.variables === o.preOrderId} onPress={() => drop(o)} />
            </View>
          }
        />
      ))}

      {open && boxes.length > 0 && (
        <CrateSheet
          title={`Lấy hàng tại ${info.hubName ?? hub.name}`}
          subtitle={hub.address}
          word="lấy"
          boxes={boxes}
          line={(b) => hub.orders.find((o) => o.preOrderId === b.orderId)?.shippingAddress ?? ''}
          saving={sending}
          error={error}
          onSet={(b, loaded) => onTick(b.orderId, loaded)}
          onClose={() => setOpen(false)}
          action={
            <Button
              title={full.length ? `Bắt đầu giao ${full.length} đơn` : 'Kiểm đủ thùng để giao'}
              icon={Truck}
              disabled={!full.length}
              loading={sending}
              onPress={() => void start()}
            />
          }
        />
      )}
    </View>
  )
}

function IconLink({ icon: Icon, label, url }: { icon: typeof Phone; label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void Linking.openURL(url)}
      className="h-10 w-10 items-center justify-center rounded-xl border border-leaf-200 bg-white active:bg-leaf-100"
    >
      <Icon size={16} color={colors.leaf700} />
    </Pressable>
  )
}
