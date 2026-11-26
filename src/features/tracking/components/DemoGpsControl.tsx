import { Client } from '@stomp/stompjs'
import { FastForward, MapPin, Pause, Play, Square, Zap } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import { useBroadcastState } from '@/features/shipper/hooks/useBroadcastLocation'
import { fetchOsrmRoute, haversineMeters } from '@/features/tracking/utils/routeResample'
import { stompBrokerUrl, type LatLng } from '@/features/tracking/utils/trackingRules'
import { useAuthStore } from '@/stores'
import { colors } from '@/theme/colors'
import { ENV } from '@/utils/env'
import { cn } from '@/utils/helpers'

function nearbyPoint(lat: number, lng: number, offsetKm = 0.6): LatLng {
  const offset = offsetKm / 111
  return { lat: lat + offset, lng: lng + offset }
}

export function DemoGpsControl({
  orderId,
  currentPos,
  shopLat,
  shopLng,
  destLat,
  destLng,
  orderStatus,
  mode = 'DELIVERY',
  onRouteReady,
}: {
  orderId: number
  currentPos?: LatLng | null
  shopLat?: number
  shopLng?: number
  destLat?: number
  destLng?: number
  orderStatus?: string
  mode?: 'DELIVERY' | 'RETURN'
  onRouteReady?: (route: { phase: 'TO_SHOP' | 'TO_BUYER'; points: LatLng[] } | null) => void
}) {
  const token = useAuthStore((s) => s.token)
  const setFakeGpsActive = useBroadcastState((s) => s.setFakeGpsActive)
  const setFakeCoords = useBroadcastState((s) => s.setFakeCoords)
  const [expanded, setExpanded] = useState(false)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [running, setRunning] = useState(false)
  const [speedMs, setSpeedMs] = useState(1000)
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [stage, setStage] = useState<'TO_SHOP' | 'TO_BUYER'>(
    orderStatus === 'PICKED_UP' ? 'TO_BUYER' : 'TO_SHOP',
  )
  const [statusText, setStatusText] = useState('Chưa kích hoạt')

  const clientRef = useRef<Client | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const routeRef = useRef<LatLng[]>([])
  const stepIdxRef = useRef(0)
  const stageRef = useRef(stage)
  stageRef.current = stage

  // Tự động chuyển sang chặng 2 khi đã lấy hàng, hoặc quay về chặng 1 khi đang hoàn hàng về Vườn
  useEffect(() => {
    if (orderStatus === 'PICKED_UP' && stageRef.current === 'TO_SHOP') {
      if (timerRef.current) clearInterval(timerRef.current)
      setRunning(false)
      stepIdxRef.current = 0
      setCurrentStep(0)
      setTotalSteps(0)
      routeRef.current = []
      setStage('TO_BUYER')
      setStatusText('📦 Đã lấy hàng · Sẵn sàng giao khách')
    } else if (orderStatus === 'RETURNING_TO_SHOP' && stageRef.current === 'TO_BUYER') {
      if (timerRef.current) clearInterval(timerRef.current)
      setRunning(false)
      stepIdxRef.current = 0
      setCurrentStep(0)
      setTotalSteps(0)
      routeRef.current = []
      setStage('TO_SHOP')
      setStatusText('↩️ Đang hoàn hàng · Chọn chạy hoặc Tới Vườn ngay')
    }
  }, [orderStatus])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      setFakeGpsActive(false)
      setFakeCoords(null)
      void clientRef.current?.deactivate()
    }
  }, [setFakeGpsActive, setFakeCoords])

  const ensureStomp = useCallback((): Promise<Client> => {
    return new Promise((resolve, reject) => {
      if (clientRef.current?.connected) {
        resolve(clientRef.current)
        return
      }
      if (clientRef.current) {
        void clientRef.current.deactivate()
        clientRef.current = null
      }

      let settled = false
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true
          setStatusText('Kết nối STOMP quá hạn')
          reject(new Error('STOMP timeout'))
        }
      }, 8000)

      const client = new Client({
        brokerURL: stompBrokerUrl(ENV.API_URL),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 0,
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        onConnect: () => {
          if (!settled) {
            settled = true
            clearTimeout(timeout)
            resolve(client)
          }
        },
        onStompError: () => {
          if (!settled) {
            settled = true
            clearTimeout(timeout)
            setStatusText('Lỗi kết nối STOMP')
            reject(new Error('STOMP error'))
          }
        },
        onWebSocketError: () => {
          if (!settled) {
            settled = true
            clearTimeout(timeout)
            setStatusText('Lỗi WebSocket')
            reject(new Error('WebSocket error'))
          }
        },
      })
      client.activate()
      clientRef.current = client
    })
  }, [token])

  const sendPoint = useCallback(
    (lat: number, lng: number, currentPhase: 'TO_SHOP' | 'AT_SHOP' | 'TO_BUYER') => {
      setFakeCoords({ latitude: lat, longitude: lng })
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
    },
    [orderId, setFakeCoords],
  )

  const runLoop = useCallback(
    (pts: LatLng[], targetStage: 'TO_SHOP' | 'TO_BUYER', intervalMs: number) => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        const idx = stepIdxRef.current
        if (idx >= pts.length) {
          if (timerRef.current) clearInterval(timerRef.current)
          setRunning(false)
          if (targetStage === 'TO_SHOP' && shopLat && shopLng) {
            sendPoint(shopLat, shopLng, 'AT_SHOP')
            setStatusText('🏁 Đã đến Nhà Vườn! Bấm "Đã lấy hàng" bên dưới')
          } else {
            setStatusText('🏁 Đã đến Người Mua! Bấm "Giao thành công" bên dưới')
          }
          return
        }

        const p = pts[idx]
        sendPoint(p.lat, p.lng, targetStage)
        setCurrentStep(idx + 1)
        stepIdxRef.current++
      }, intervalMs)
    },
    [sendPoint, shopLat, shopLng],
  )

  // Cập nhật tốc độ ngay lập tức khi đang chạy
  useEffect(() => {
    if (running && routeRef.current.length > 0) {
      runLoop(routeRef.current, stageRef.current, speedMs)
    }
  }, [speedMs, running, runLoop])

  const startSimulation = async (targetStage = stage) => {
    if (!shopLat || !shopLng || !destLat || !destLng) {
      Alert.alert('Thiếu toạ độ', 'Đơn hàng này chưa có đủ toạ độ nhà vườn hoặc người mua để demo.')
      return
    }

    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setLoadingRoute(true)
    setStatusText('Đang tải tuyến đường OSRM...')
    setFakeGpsActive(true)

    const shopPt = { lat: shopLat, lng: shopLng }
    const canUseCurrent =
      currentPos != null &&
      haversineMeters(currentPos, shopPt) > 80 &&
      haversineMeters(currentPos, shopPt) < 50_000
    const from = targetStage === 'TO_SHOP' ? (canUseCurrent ? currentPos! : nearbyPoint(shopLat, shopLng)) : shopPt
    const to = targetStage === 'TO_SHOP' ? shopPt : { lat: destLat, lng: destLng }

    // Chia đều mỗi bước ~35m để xe chạy đều tốc độ trên cả khúc cua và đường thẳng
    const pts = await fetchOsrmRoute(from, to, 35)
    setLoadingRoute(false)
    if (pts.length === 0) {
      setFakeGpsActive(false)
      setStatusText('Không tải được tuyến đường OSRM')
      Alert.alert('Lỗi tuyến đường', 'Không kết nối được OSRM để lấy đường đi thực tế. Vui lòng thử lại.')
      return
    }

    try {
      await ensureStomp()
    } catch {
      setFakeGpsActive(false)
      Alert.alert('Lỗi kết nối', 'Không kết nối được máy chủ WebSocket để phát vị trí.')
      return
    }

    routeRef.current = pts
    onRouteReady?.({ phase: targetStage, points: pts })
    setTotalSteps(pts.length)
    // Gửi điểm xuất phát ngay lập tức để bản đồ hiện xe ở đầu tuyến trước khi bước tiếp theo chạy
    sendPoint(pts[0].lat, pts[0].lng, targetStage)
    setCurrentStep(1)
    stepIdxRef.current = 1

    setStatusText(targetStage === 'TO_SHOP' ? '🛵 Đang chạy tới Vườn' : '🛵 Đang giao tới Khách')
    setRunning(true)
  }

  const pauseSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setStatusText('Đã tạm dừng')
  }

  const stopSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setFakeGpsActive(false)
    setFakeCoords(null)
    stepIdxRef.current = 0
    setCurrentStep(0)
    onRouteReady?.(null)
    setStatusText('Đã dừng')
  }

  /** Nhảy nhanh tới Nhà Vườn hoặc Nhà Khách (<500m) để demo/test xác nhận ngay không cần chờ. */
  const teleport = async (target: 'SHOP' | 'BUYER') => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    onRouteReady?.(null)
    setFakeGpsActive(true)
    try {
      await ensureStomp()
    } catch {
      setFakeGpsActive(false)
      Alert.alert('Lỗi kết nối', 'Không kết nối được máy chủ WebSocket.')
      return
    }
    if (target === 'SHOP') {
      if (!shopLat || !shopLng) return
      sendPoint(shopLat, shopLng, 'AT_SHOP')
      setStage('TO_SHOP')
      setStatusText('📍 Đã đến ngay Nhà Vườn')
    } else {
      if (!destLat || !destLng) return
      sendPoint(destLat, destLng, 'TO_BUYER')
      setStage('TO_BUYER')
      setStatusText('📍 Đã đến ngay Khách (<500m)')
    }
  }

  const isShipping = orderStatus === 'SHIPPING'
  const isPickedUp = orderStatus === 'PICKED_UP'
  const isReturning = orderStatus === 'RETURNING_TO_SHOP'
  const canDemoToShop = isShipping || isReturning
  const canDemoToBuyer = isPickedUp

  if (orderStatus && !isShipping && !isPickedUp && !isReturning) {
    return null
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-amber-300 bg-amber-50/95 shadow-sm">
      {/* Header Bar */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between px-3.5 py-2.5 active:bg-amber-100/50"
      >
        <View className="flex-1 flex-row items-center gap-2 pr-2">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-amber-200">
            <Zap size={14} color="#92400e" />
          </View>
          <View className="flex-1">
            <AppText weight="bold" className="text-xs text-amber-900">
              Chế độ Demo Fake GPS
            </AppText>
            <AppText numberOfLines={1} className="text-[10px] text-amber-800">
              {statusText}
            </AppText>
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
        <View className="gap-2.5 border-t border-amber-200/80 bg-white/80 p-3">
          {/* Chọn chặng demo (ràng buộc theo đúng trạng thái đơn hàng) */}
          <View className="flex-row gap-2">
            {canDemoToShop && (
              <Pressable
                onPress={() => {
                  setStage('TO_SHOP')
                  if (running) void startSimulation('TO_SHOP')
                }}
                className={cn(
                  'flex-1 items-center justify-center rounded-xl border py-2',
                  stage === 'TO_SHOP' ? 'border-amber-600 bg-amber-100' : 'border-line bg-white',
                )}
              >
                <AppText
                  weight="bold"
                  className={cn('text-xs', stage === 'TO_SHOP' ? 'text-amber-900' : 'text-ink-muted')}
                >
                  {mode === 'RETURN'
                    ? '1. Chạy tới Khách'
                    : isReturning
                      ? '↩️ Quay về Vườn'
                      : '1. Chạy tới Vườn'}
                </AppText>
              </Pressable>
            )}

            {canDemoToBuyer && (
              <Pressable
                onPress={() => {
                  setStage('TO_BUYER')
                  if (running) void startSimulation('TO_BUYER')
                }}
                className={cn(
                  'flex-1 items-center justify-center rounded-xl border py-2',
                  stage === 'TO_BUYER' ? 'border-amber-600 bg-amber-100' : 'border-line bg-white',
                )}
              >
                <AppText
                  weight="bold"
                  className={cn('text-xs', stage === 'TO_BUYER' ? 'text-amber-900' : 'text-ink-muted')}
                >
                  {mode === 'RETURN' ? '2. Chạy về Vườn' : '2. Chạy tới Khách'}
                </AppText>
              </Pressable>
            )}
          </View>

          {/* Chọn tốc độ */}
          <View className="flex-row items-center justify-between">
            <AppText className="text-xs text-ink-muted">Tốc độ mô phỏng:</AppText>
            <View className="flex-row gap-1.5">
              <Pressable
                onPress={() => setSpeedMs(1400)}
                className={cn(
                  'rounded-lg border px-2.5 py-1',
                  speedMs === 1400 ? 'border-amber-600 bg-amber-100' : 'border-line bg-white',
                )}
              >
                <AppText weight="bold" className="text-[11px] text-amber-900">
                  Vừa 1.4s
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setSpeedMs(1000)}
                className={cn(
                  'rounded-lg border px-2.5 py-1',
                  speedMs === 1000 ? 'border-amber-600 bg-amber-100' : 'border-line bg-white',
                )}
              >
                <AppText weight="bold" className="text-[11px] text-amber-900">
                  Chuẩn 1s
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setSpeedMs(600)}
                className={cn(
                  'rounded-lg border px-2.5 py-1',
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
                title={loadingRoute ? 'Đang tải tuyến...' : 'Bắt đầu chạy xe'}
                icon={Play}
                loading={loadingRoute}
                disabled={loadingRoute}
                onPress={() => void startSimulation()}
                className="min-h-[42px] flex-1 bg-amber-600 active:bg-amber-700"
              />
            ) : (
              <Button
                title="Tạm dừng"
                icon={Pause}
                variant="outline"
                onPress={pauseSimulation}
                className="min-h-[42px] flex-1"
              />
            )}
            <Button
              title="Dừng"
              icon={Square}
              variant="outline"
              disabled={!running && currentStep === 0}
              onPress={stopSimulation}
              className="min-h-[42px] w-24"
            />
          </View>

          {/* Nhảy nhanh tới điểm lấy / giao hàng để test ngay không cần chờ */}
          <View className="flex-row gap-2">
            {canDemoToShop && (
              <Pressable
                onPress={() => void teleport('SHOP')}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-2 active:bg-amber-100"
              >
                <MapPin size={13} color={colors.soil600} />
                <AppText weight="bold" className="text-xs text-amber-900">
                  {mode === 'RETURN' ? 'Tới Khách ngay' : isReturning ? 'Về Vườn ngay' : 'Tới Vườn ngay'}
                </AppText>
              </Pressable>
            )}

            {canDemoToBuyer && (
              <Pressable
                onPress={() => void teleport('BUYER')}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-leaf-600/30 bg-leaf-50 py-2 active:bg-leaf-100"
              >
                <FastForward size={13} color={colors.leaf700} />
                <AppText weight="bold" className="text-xs text-leaf-800">
                  {mode === 'RETURN' ? 'Về Vườn ngay' : 'Tới Khách ngay'}
                </AppText>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
