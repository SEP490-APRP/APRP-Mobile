import { Client } from '@stomp/stompjs'
import {
  FastForward,
  MapPin,
  Pause,
  Play,
  Square,
  Zap,
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import { stompBrokerUrl } from '@/features/tracking/utils/trackingRules'
import { useAuthStore } from '@/stores'
import { colors } from '@/theme/colors'
import { ENV } from '@/utils/env'
import { cn } from '@/utils/helpers'

interface RoutePoint {
  lat: number
  lng: number
}

function createDirectRoute(fromLat: number, fromLng: number, toLat: number, toLng: number, steps = 18): RoutePoint[] {
  const points: RoutePoint[] = []
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps
    points.push({
      lat: fromLat + (toLat - fromLat) * fraction,
      lng: fromLng + (toLng - fromLng) * fraction,
    })
  }
  return points
}

async function fetchRoute(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<RoutePoint[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    const data = await res.json()
    if (data.routes?.length) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }))
    }
  } catch {
    // Fallback to direct route interpolation if OSRM is unreachable
  }
  return createDirectRoute(fromLat, fromLng, toLat, toLng)
}

function nearbyPoint(lat: number, lng: number, offsetKm = 0.6): RoutePoint {
  const offset = offsetKm / 111
  return { lat: lat + offset, lng: lng + offset }
}

export function DemoGpsControl({
  orderId,
  shopLat,
  shopLng,
  destLat,
  destLng,
  orderStatus,
}: {
  orderId: number
  shopLat?: number
  shopLng?: number
  destLat?: number
  destLng?: number
  orderStatus?: string
}) {
  const token = useAuthStore((s) => s.token)
  const [expanded, setExpanded] = useState(false)
  const [running, setRunning] = useState(false)
  const [speedMs, setSpeedMs] = useState(1200) // 1.2s per step
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [stage, setStage] = useState<'TO_SHOP' | 'TO_BUYER'>(
    orderStatus === 'PICKED_UP' ? 'TO_BUYER' : 'TO_SHOP',
  )
  const [statusText, setStatusText] = useState('Chưa kích hoạt')

  const clientRef = useRef<Client | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const routeRef = useRef<RoutePoint[]>([])
  const stepIdxRef = useRef(0)

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      void clientRef.current?.deactivate()
    }
  }, [])

  const ensureStomp = (): Promise<Client> => {
    return new Promise((resolve) => {
      if (clientRef.current?.connected) {
        resolve(clientRef.current)
        return
      }

      const client = new Client({
        brokerURL: stompBrokerUrl(ENV.API_URL),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 0,
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        onConnect: () => {
          resolve(client)
        },
        onStompError: () => {
          setStatusText('Lỗi kết nối STOMP')
        },
      })
      client.activate()
      clientRef.current = client
    })
  }

  const sendPoint = (lat: number, lng: number, currentPhase: 'TO_SHOP' | 'TO_BUYER') => {
    if (!clientRef.current?.connected) return
    clientRef.current.publish({
      destination: '/app/shipper/location',
      body: JSON.stringify({
        orderId,
        latitude: lat,
        longitude: lng,
        isFake: true,
        deliveryPhase: currentPhase,
      }),
    })
  }

  const startSimulation = async (targetStage = stage) => {
    if (!shopLat || !shopLng || !destLat || !destLng) {
      Alert.alert('Thiếu toạ độ', 'Đơn hàng này chưa có đủ toạ độ nhà vườn hoặc người mua để demo.')
      return
    }

    setStatusText('Đang tải tuyến đường OSRM...')
    setRunning(true)

    const from = targetStage === 'TO_SHOP' ? nearbyPoint(shopLat, shopLng) : { lat: shopLat, lng: shopLng }
    const to = targetStage === 'TO_SHOP' ? { lat: shopLat, lng: shopLng } : { lat: destLat, lng: destLng }

    const pts = await fetchRoute(from.lat, from.lng, to.lat, to.lng)
    routeRef.current = pts
    setTotalSteps(pts.length)
    stepIdxRef.current = 0
    setCurrentStep(0)

    await ensureStomp()
    setStatusText(targetStage === 'TO_SHOP' ? '🛵 Đang chạy tới Vườn' : '🛵 Đang giao tới Khách')

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const idx = stepIdxRef.current
      if (idx >= pts.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setRunning(false)
        setStatusText(targetStage === 'TO_SHOP' ? '🏁 Đã đến Nhà Vườn!' : '🏁 Đã đến Người Mua!')
        return
      }

      const p = pts[idx]
      sendPoint(p.lat, p.lng, targetStage)
      setCurrentStep(idx + 1)
      stepIdxRef.current++
    }, speedMs)
  }

  const pauseSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setStatusText('Đã tạm dừng')
  }

  const stopSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    stepIdxRef.current = 0
    setCurrentStep(0)
    setStatusText('Đã dừng')
  }

  // Nhảy tức thì (Teleport) đến toạ độ đích (vượt qua Geofence < 500m)
  const teleport = async (target: 'SHOP' | 'BUYER') => {
    await ensureStomp()
    if (target === 'SHOP') {
      if (!shopLat || !shopLng) return
      sendPoint(shopLat, shopLng, 'TO_SHOP')
      setStage('TO_SHOP')
      setStatusText('📍 Đã nhảy đến Nhà Vườn')
    } else {
      if (!destLat || !destLng) return
      sendPoint(destLat, destLng, 'TO_BUYER')
      setStage('TO_BUYER')
      setStatusText('📍 Đã nhảy đến Người Mua (Đạt Geofence)')
    }
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-amber-300 bg-amber-50/95 shadow-sm">
      {/* Header Bar */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between px-3.5 py-2.5 active:bg-amber-100/50"
      >
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-amber-200">
            <Zap size={14} color="#92400e" />
          </View>
          <View>
            <AppText weight="bold" className="text-xs text-amber-900">
              Chế độ Demo Fake GPS Giảng viên
            </AppText>
            <AppText className="text-[10px] text-amber-800">{statusText}</AppText>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {running && (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5">
              <AppText weight="bold" className="text-[10px] text-amber-900">
                {currentStep}/{totalSteps}
              </AppText>
            </View>
          )}
          <AppText weight="bold" className="text-xs text-amber-800">
            {expanded ? 'Thu gọn ▲' : 'Điều khiển ▼'}
          </AppText>
        </View>
      </Pressable>

      {/* Expanded Control Box */}
      {expanded && (
        <View className="border-t border-amber-200/80 p-3 gap-2.5 bg-white/80">
          {/* Chọn chặng demo */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setStage('TO_SHOP')
                if (running) void startSimulation('TO_SHOP')
              }}
              className={cn(
                'flex-1 items-center justify-center rounded-xl py-2 border',
                stage === 'TO_SHOP' ? 'border-amber-600 bg-amber-100' : 'border-line bg-white',
              )}
            >
              <AppText
                weight="bold"
                className={cn('text-xs', stage === 'TO_SHOP' ? 'text-amber-900' : 'text-ink-muted')}
              >
                1. Chạy tới Vườn
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => {
                setStage('TO_BUYER')
                if (running) void startSimulation('TO_BUYER')
              }}
              className={cn(
                'flex-1 items-center justify-center rounded-xl py-2 border',
                stage === 'TO_BUYER' ? 'border-amber-600 bg-amber-100' : 'border-line bg-white',
              )}
            >
              <AppText
                weight="bold"
                className={cn('text-xs', stage === 'TO_BUYER' ? 'text-amber-900' : 'text-ink-muted')}
              >
                2. Chạy tới Khách
              </AppText>
            </Pressable>
          </View>

          {/* Chọn tốc độ */}
          <View className="flex-row items-center justify-between">
            <AppText className="text-xs text-ink-muted">Tốc độ mô phỏng:</AppText>
            <View className="flex-row gap-1.5">
              <Pressable
                onPress={() => setSpeedMs(1500)}
                className={cn(
                  'rounded-lg px-2.5 py-1 border',
                  speedMs === 1500 ? 'border-amber-600 bg-amber-100' : 'border-line bg-white',
                )}
              >
                <AppText weight="bold" className="text-[11px] text-amber-900">
                  Chuẩn 1.5s
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setSpeedMs(600)}
                className={cn(
                  'rounded-lg px-2.5 py-1 border',
                  speedMs === 600 ? 'border-amber-600 bg-amber-100' : 'border-line bg-white',
                )}
              >
                <AppText weight="bold" className="text-[11px] text-amber-900">
                  Nhanh 0.6s
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* Nút hành động mô phỏng */}
          <View className="flex-row gap-2 pt-1">
            {!running ? (
              <Button
                title="Bắt đầu chạy xe"
                icon={Play}
                onPress={() => void startSimulation()}
                className="flex-1 min-h-[42px] bg-amber-600 active:bg-amber-700"
              />
            ) : (
              <Button
                title="Tạm dừng"
                icon={Pause}
                variant="outline"
                onPress={pauseSimulation}
                className="flex-1 min-h-[42px]"
              />
            )}
            <Button
              title="Dừng"
              icon={Square}
              variant="outline"
              disabled={!running && currentStep === 0}
              onPress={stopSimulation}
              className="w-24 min-h-[42px]"
            />
          </View>

          {/* Nút dịch chuyển tức thời (Teleport) qua Geofence */}
          <View className="mt-1 flex-row gap-2">
            <Pressable
              onPress={() => void teleport('SHOP')}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-line bg-slate-50 py-2 active:bg-slate-100"
            >
              <MapPin size={12} color={colors.inkMuted} />
              <AppText weight="semibold" className="text-[11px] text-ink">
                Đến ngay Vườn
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => void teleport('BUYER')}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-line bg-slate-50 py-2 active:bg-slate-100"
            >
              <FastForward size={12} color={colors.inkMuted} />
              <AppText weight="semibold" className="text-[11px] text-ink">
                Đến ngay Khách (&lt;500m)
              </AppText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}
