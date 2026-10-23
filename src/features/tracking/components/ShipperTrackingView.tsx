import { ArrowLeft, Crosshair, Home, Phone, RefreshCw, Store } from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { useShipperLocation } from '../hooks/useShipperLocation'
import {
  bearing,
  effectivePhase,
  formatUpdatedAt,
  hiddenShipperHint,
  isShipperVisible,
  journeyText,
  resolveEndpoints,
  routesForRole,
  shipperPosition,
  type LatLng,
  type TrackingRole,
} from '../utils/trackingRules'
import type { MapEvent, MapState } from './mapHtml'
import { TrackingMap } from './TrackingMap'

type Props = {
  orderId: number
  role: TrackingRole
  /** Toạ độ có sẵn trên đơn, dùng trước khi BE gửi vị trí */
  initial?: { shop?: Partial<LatLng>; dest?: Partial<LatLng> }
  fallback?: { shopName?: string; shopAddress?: string; recipientName?: string; destinationAddress?: string }
  /** Nút hành động ở đáy thẻ trạng thái (tài xế dùng để chỉ đường) */
  actions?: React.ReactNode
  onBack: () => void
}

/**
 * Màn theo dõi shipper dùng chung cho Buyer, Shop và chính tài xế,
 * chuyển từ GoogleMapTrackingModal bản web: bản đồ toàn màn hình, thẻ trạng thái ở dưới.
 */
export function ShipperTrackingView({ orderId, role, initial, fallback, actions, onBack }: Props) {
  const { data, connected, gpsPaused, refresh } = useShipperLocation(orderId)
  const [follow, setFollow] = useState(true)
  const [recenter, setRecenter] = useState(0)
  const [mapError, setMapError] = useState<string | null>(null)
  const heading = useRef(0)
  const lastPos = useRef<LatLng | null>(null)

  const { shop, dest } = resolveEndpoints(data, initial)
  const pos = shipperPosition(data)
  const phase = effectivePhase(data, pos, shop, dest)
  const visible = !!pos && isShipperVisible(role, phase)
  const routes = routesForRole(role)

  if (pos && lastPos.current && (pos.lat !== lastPos.current.lat || pos.lng !== lastPos.current.lng)) {
    heading.current = bearing(lastPos.current, pos)
  }
  useEffect(() => {
    if (pos) lastPos.current = pos
  }, [pos?.lat, pos?.lng])

  const mapState = useMemo<MapState>(
    () => ({
      shop,
      dest,
      shipper: visible ? pos : null,
      heading: heading.current,
      routes,
      follow: follow && visible,
      recenter,
    }),
    // Toạ độ là số nguyên thuỷ nên so theo giá trị để không đẩy xuống bản đồ thừa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shop.lat, shop.lng, dest.lat, dest.lng, visible, pos?.lat, pos?.lng, follow, recenter, role],
  )

  const onMapEvent = (e: MapEvent) => {
    if (e.type === 'userMoved') setFollow(false)
    if (e.type === 'error') setMapError(e.message)
  }

  const centre = () => {
    setFollow(true)
    setRecenter((n) => n + 1)
  }

  const live = gpsPaused
    ? { label: 'GPS tạm dừng', dot: 'bg-rose-500', box: 'bg-rose-50', text: 'text-rose-700' }
    : connected
      ? { label: 'Trực tiếp', dot: 'bg-emerald-500', box: 'bg-emerald-50', text: 'text-emerald-700' }
      : data
        ? { label: 'Cập nhật định kỳ', dot: 'bg-amber-500', box: 'bg-amber-50', text: 'text-amber-700' }
        : { label: 'Đang kết nối', dot: 'bg-amber-500', box: 'bg-amber-50', text: 'text-amber-700' }

  const shipperName = data?.shipperName || 'Tài xế giao hàng'
  const phone = data?.shipperPhone

  return (
    <View className="flex-1 bg-paper">
      {/* Vùng bản đồ dừng phía trên thẻ trạng thái để xe ở giữa không bị che */}
      <View className="flex-1">
        <View className="absolute inset-0">
          {mapError ? (
            <View className="flex-1 items-center justify-center gap-2 p-8">
              <AppText weight="bold" className="text-center text-base">
                {mapError}
              </AppText>
              <AppText className="text-center text-sm text-ink-muted">
                Kiểm tra kết nối mạng rồi mở lại màn hình này.
              </AppText>
            </View>
          ) : (
            <TrackingMap state={mapState} onEvent={onMapEvent} />
          )}
        </View>

        {/* Thanh trên */}
        <SafeAreaView edges={['top']} pointerEvents="box-none">
          <View className="flex-row items-center gap-2 px-3 pt-2" pointerEvents="box-none">
            <RoundButton label="Quay lại" onPress={onBack}>
              <ArrowLeft size={22} color={colors.ink} />
            </RoundButton>
            <View className="h-11 flex-1 flex-row items-center gap-2 rounded-full bg-white px-4 shadow-md">
              <AppText weight="extrabold" numberOfLines={1} className="flex-1 text-sm">
                Đơn #{orderId}
              </AppText>
              <View className={cn('flex-row items-center gap-1.5 rounded-full px-2.5 py-1', live.box)}>
                <View className={cn('h-2 w-2 rounded-full', live.dot)} />
                <AppText weight="bold" className={cn('text-xs', live.text)}>
                  {live.label}
                </AppText>
              </View>
            </View>
            <RoundButton label="Làm mới vị trí" onPress={refresh}>
              <RefreshCw size={18} color={colors.ink} />
            </RoundButton>
          </View>
          {gpsPaused && (
            <View className="mx-3 mt-2 self-center rounded-full bg-rose-600 px-4 py-2">
              <AppText weight="bold" className="text-xs text-white">
                Tài xế đang tạm dừng cập nhật GPS
              </AppText>
            </View>
          )}
        </SafeAreaView>

        <View className="flex-1" pointerEvents="box-none" />

        {/* Nút căn bản đồ */}
        <View className="items-end px-3 pb-10" pointerEvents="box-none">
          <Pressable
            onPress={centre}
            accessibilityRole="button"
            className={cn(
              'h-11 flex-row items-center gap-2 rounded-full px-4 shadow-md',
              follow && visible ? 'bg-leaf-700' : 'bg-white',
            )}
          >
            <Crosshair size={16} color={follow && visible ? colors.white : colors.leaf700} />
            <AppText weight="bold" className={cn('text-xs', follow && visible ? 'text-white' : 'text-leaf-700')}>
              {visible
                ? follow
                  ? 'Đang bám theo xe'
                  : 'Về vị trí xe'
                : role === 'BUYER'
                  ? 'Xem tuyến giao'
                  : 'Về vị trí quán'}
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* Thẻ trạng thái */}
      <SafeAreaView edges={['bottom']} className="-mt-7 rounded-t-[28px] bg-white shadow-lg">
        <View className="gap-3 px-4 pb-2 pt-4">
          <View className="flex-row items-center gap-2 rounded-2xl bg-leaf-50 px-3 py-2.5">
            <View className="h-2.5 w-2.5 rounded-full bg-leaf-600" />
            <AppText weight="bold" className="flex-1 text-sm text-leaf-800">
              {journeyText(role, phase)}
            </AppText>
          </View>

          {role !== 'SHIPPER' && (
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                <AppText className="text-xl">🛵</AppText>
              </View>
              <View className="min-w-0 flex-1">
                <AppText weight="bold" numberOfLines={1} className="text-sm">
                  {shipperName}
                </AppText>
                <AppText numberOfLines={2} className="text-xs text-ink-muted">
                  {[
                    data?.vehicleNumber && `Biển số ${data.vehicleNumber}`,
                    visible ? `Cập nhật ${formatUpdatedAt(data?.updatedAt)}` : hiddenShipperHint(role),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </View>
              {!!phone && (
                <Pressable
                  onPress={() => void Linking.openURL(`tel:${phone}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Gọi tài xế ${phone}`}
                  className="h-11 w-11 items-center justify-center rounded-full bg-leaf-700 active:opacity-80"
                >
                  <Phone size={18} color={colors.white} />
                </Pressable>
              )}
            </View>
          )}

          <View className="gap-2 border-t border-line pt-3">
            <Stop
              icon={<Store size={15} color="#7c3aed" />}
              box="bg-purple-50"
              title={data?.shopName || fallback?.shopName || 'Nhà vườn'}
              subtitle={data?.shopAddress || fallback?.shopAddress}
            />
            <Stop
              icon={<Home size={15} color="#e11d48" />}
              box="bg-rose-50"
              title={data?.recipientName || fallback?.recipientName || 'Người nhận'}
              subtitle={data?.destinationAddress || fallback?.destinationAddress}
            />
          </View>

          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
            {routes.toShop && <Legend color="#EA580C" label="Shipper ➔ Nhà vườn" />}
            {routes.toBuyer && <Legend color="#00B14F" label="Nhà vườn ➔ Người nhận" />}
          </View>
          {actions}
        </View>
      </SafeAreaView>
    </View>
  )
}

function RoundButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-md active:bg-paper"
    >
      {children}
    </Pressable>
  )
}

function Stop({
  icon,
  box,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  box: string
  title: string
  subtitle?: string
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className={cn('h-8 w-8 items-center justify-center rounded-xl', box)}>{icon}</View>
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-sm">
          {title}
        </AppText>
        {!!subtitle && (
          <AppText numberOfLines={1} className="text-xs text-ink-muted">
            {subtitle}
          </AppText>
        )}
      </View>
    </View>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-1.5 w-5 rounded-full" style={{ backgroundColor: color }} />
      <AppText className="text-xs text-ink-muted">{label}</AppText>
    </View>
  )
}
