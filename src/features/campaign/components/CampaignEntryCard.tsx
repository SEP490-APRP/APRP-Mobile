import { router, type Href } from 'expo-router'
import { ChevronRight, Flame } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'
import { useHubTrips, useShipperPreOrders } from '../hooks/useCampaignQueries'

/** Lối vào "Đơn chiến dịch" trên màn chính của tài xế; số đỏ là chuyến và đơn đang chờ người nhận */
export function CampaignEntryCard() {
  const { ready, mine } = useShipperPreOrders()
  const trips = useHubTrips()
  const waiting = ready.data?.length ?? 0
  const openTrips = trips.open.data?.filter((t) => !t.declined).length ?? 0
  const myTrips = trips.mine.data?.filter((t) => t.status !== 'DELIVERED').length ?? 0
  const myOrders = mine.data?.filter((o) => o.status === 'READY' || o.status === 'SHIPPING').length ?? 0
  const fresh = waiting + openTrips
  const summary = [
    openTrips && `${openTrips} chuyến xe chờ tài xế`,
    waiting && `${waiting} đơn tại hub`,
    myTrips + myOrders && `Bạn đang giữ ${[myTrips && `${myTrips} chuyến`, myOrders && `${myOrders} đơn`].filter(Boolean).join(', ')}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Đơn chiến dịch${fresh ? `, ${fresh} mục mới` : ''}`}
      onPress={() => router.push('/shipper/campaign-orders' as Href)}
      className="flex-row items-center gap-3 rounded-panel border border-leaf-200 bg-leaf-50 p-4 active:opacity-80"
    >
      <Flame size={20} color={colors.leaf700} />
      <View className="min-w-0 flex-1">
        <AppText weight="extrabold" className="text-sm text-leaf-800">
          Đơn chiến dịch
        </AppText>
        <AppText className="text-xs text-ink-muted">{summary || 'Chở hàng ra hub và giao đơn giải cứu'}</AppText>
      </View>
      {fresh > 0 && (
        <View className="h-6 min-w-6 items-center justify-center rounded-full bg-sale px-1.5">
          <AppText weight="extrabold" className="text-xs text-white">
            {fresh}
          </AppText>
        </View>
      )}
      <ChevronRight size={18} color={colors.leaf700} />
    </Pressable>
  )
}
