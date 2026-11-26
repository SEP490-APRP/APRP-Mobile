import { useQuery } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { router } from 'expo-router'
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Map,
  Package,
  Tag,
  Trash2,
  Truck,
  Wallet,
} from 'lucide-react-native'
import { Alert, Linking, Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button } from '@/components/ui'
import { orderIdOf, orderKeys, OrderStatusBadge } from '@/features/order'
import { shipperErrorCode, shipperErrorMessage, useAcceptOrder } from '@/features/shipper'
import { orderService } from '@/services'
import type { NotificationItem } from '@/services/notification.types'
import { shipperService } from '@/services/shipper.service'
import { useAuthStore, useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

export interface NotificationDetailBottomSheetProps {
  notification: NotificationItem | null
  visible: boolean
  onClose: () => void
  onDelete?: (id: number) => void
}

function formatDetailDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  } catch {
    return ''
  }
}

export function NotificationDetailBottomSheet({
  notification,
  visible,
  onClose,
  onDelete,
}: NotificationDetailBottomSheetProps) {
  const user = useAuthStore((s) => s.user)
  const showToast = useUiStore((s) => s.showToast)
  const acceptOrder = useAcceptOrder()
  const role = user?.role?.toLowerCase()

  const rawTargetOrderId = (() => {
    if (!notification) return null
    if (notification.referenceId) return notification.referenceId
    const txt = `${notification.title ?? ''} ${notification.message ?? ''} ${notification.evidence ?? ''}`
    const match = txt.match(/đơn hàng.*?#?(\d+)/i) || txt.match(/#(\d+)/) || (notification.evidence && notification.evidence.match(/(\d+)/))
    return match?.[1] ? parseInt(match[1], 10) : null
  })()

  const isShipperOrderCheckEnabled = visible && role === 'shipper' && Boolean(rawTargetOrderId) && !isNaN(rawTargetOrderId!)

  const shipperOrderQuery = useQuery({
    queryKey: orderKeys.detail(rawTargetOrderId ?? 0),
    queryFn: () => orderService.getOrderById(rawTargetOrderId!),
    enabled: isShipperOrderCheckEnabled,
    retry: false,
  })

  const shipperReadyQuery = useQuery({
    queryKey: ['shipper', 'notif-ready-check', rawTargetOrderId],
    queryFn: async () => {
      const page = await shipperService.getReadyOrders(0, 50)
      return page.content.find((o) => orderIdOf(o) === rawTargetOrderId) ?? null
    },
    enabled: isShipperOrderCheckEnabled && shipperOrderQuery.isError,
    retry: false,
  })

  if (!notification) return null

  const notif = notification
  const textContent = `${notif.title ?? ''} ${notif.message ?? ''} ${notif.evidence ?? ''}`.toLowerCase()
  const type = (notif.type ?? '').toUpperCase()

  // 1. Phân loại Category
  let categoryLabel = 'HỆ THỐNG'
  let CategoryIcon = Bell
  let categoryColor: string = colors.leaf700
  let categoryBg = 'bg-leaf-100'

  const isDeliveryReturnFlow =
    textContent.includes('giao thất bại') ||
    textContent.includes('giao không thành công') ||
    textContent.includes('hoàn về vườn') ||
    textContent.includes('nhận lại hàng') ||
    textContent.includes('trả hàng về shop') ||
    textContent.includes('lấy hàng đơn') ||
    type === 'ORDER_FAILED' ||
    type === 'ORDER_RETURN_TO_SHOP'

  const isDisputeRelated =
    !isDeliveryReturnFlow &&
    (type.includes('RETURN') ||
      type.includes('DISPUTE') ||
      type.includes('ADMIN_APPROVED') ||
      textContent.includes('khiếu nại') ||
      textContent.includes('hoàn trả') ||
      textContent.includes('trả hàng') ||
      textContent.includes('hoàn tiền'))

  if (isDisputeRelated) {
    categoryLabel = 'KHIẾU NẠI'
    CategoryIcon = AlertTriangle
    categoryColor = '#e11d48'
    categoryBg = 'bg-rose-100'
  } else if (
    type.includes('ORDER') ||
    type.includes('SHIPPER') ||
    type.includes('DISPATCH') ||
    textContent.includes('đơn hàng') ||
    textContent.includes('vận chuyển') ||
    textContent.includes('giao hàng')
  ) {
    categoryLabel = 'ĐƠN HÀNG'
    CategoryIcon = Truck
    categoryColor = colors.leaf700
    categoryBg = 'bg-leaf-100'
  } else if (
    textContent.includes('sản phẩm') ||
    textContent.includes('kho') ||
    textContent.includes('đóng gói')
  ) {
    categoryLabel = 'SẢN PHẨM'
    CategoryIcon = Package
    categoryColor = colors.soil600
    categoryBg = 'bg-amber-100'
  } else if (
    textContent.includes('ví tiền') ||
    textContent.includes('ký quỹ') ||
    textContent.includes('rút tiền') ||
    textContent.includes('nạp tiền') ||
    textContent.includes('quyết toán')
  ) {
    categoryLabel = 'TÀI CHÍNH'
    CategoryIcon = Wallet
    categoryColor = '#0284c7'
    categoryBg = 'bg-sky-100'
  } else if (
    textContent.includes('voucher') ||
    textContent.includes('khuyến mãi') ||
    textContent.includes('giảm giá')
  ) {
    categoryLabel = 'ƯU ĐÃI'
    CategoryIcon = Tag
    categoryColor = colors.soil600
    categoryBg = 'bg-amber-100'
  }

  // 2. Tìm kiếm OrderId tham chiếu nếu có
  let targetOrderId: number | null = notif.referenceId ?? null
  if (!targetOrderId) {
    const match = textContent.match(/đơn hàng.*?#?(\d+)/i) || (notif.evidence && notif.evidence.match(/(\d+)/))
    if (match && match[1]) {
      targetOrderId = parseInt(match[1], 10)
    }
  }

  // 3. Xử lý mở Evidence Link
  const handleOpenEvidence = async (url: string) => {
    try {
      const trimmed = url.trim()
      const target = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`
      await WebBrowser.openBrowserAsync(target)
    } catch {
      void Linking.openURL(url)
    }
  }

  // 4. Xử lý Hành động chính (Smart CTA)
  const handlePrimaryAction = () => {
    onClose()

    // Điều hướng khiếu nại / hoàn trả
    if (isDisputeRelated) {
      if (role === 'shop') {
        if (targetOrderId) {
          router.push({ pathname: '/shop/dispute/[id]' as any, params: { id: targetOrderId } })
        } else {
          router.push('/shop/disputes' as any)
        }
      } else if (targetOrderId) {
        router.push({ pathname: '/buyer/order/[id]', params: { id: targetOrderId } })
      } else {
        router.push('/buyer/orders')
      }
      return
    }

    // Điều hướng đơn hàng
    if (targetOrderId) {
      if (role === 'shop') {
        router.push({ pathname: '/shop/order/[id]' as any, params: { id: targetOrderId } })
      } else if (role === 'shipper') {
        router.push({ pathname: '/shipper/order/[id]' as any, params: { id: targetOrderId } })
      } else {
        router.push({ pathname: '/buyer/order/[id]', params: { id: targetOrderId } })
      }
      return
    }

    // Điều hướng ví tiền
    if (categoryLabel === 'TÀI CHÍNH') {
      if (role === 'shop') {
        router.push('/shop/wallet' as any)
      } else if (role === 'shipper') {
        router.push('/shipper/wallet' as any)
      }
      return
    }

    // Điều hướng voucher
    if (categoryLabel === 'ƯU ĐÃI') {
      if (role === 'shop') {
        router.push('/shop/vouchers' as any)
      } else {
        router.push('/buyer/vouchers')
      }
      return
    }
  }

  const handleDelete = () => {
    Alert.alert('Xóa thông báo', 'Bạn có chắc chắn muốn xóa thông báo này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          onClose()
          onDelete?.(notif.id)
        },
      },
    ])
  }

  const hasSmartAction =
    isDisputeRelated ||
    Boolean(targetOrderId) ||
    categoryLabel === 'TÀI CHÍNH' ||
    (categoryLabel === 'ƯU ĐÃI' && (role === 'buyer' || role === 'shop'))

  let smartActionTitle = 'Xem chi tiết'
  if (isDisputeRelated) {
    if (role === 'shop') {
      smartActionTitle = targetOrderId ? `Xử lý khiếu nại #${targetOrderId}` : 'Đến trung tâm khiếu nại'
    } else {
      smartActionTitle = targetOrderId ? `Xem đơn hàng #${targetOrderId}` : 'Xem đơn hàng của tôi'
    }
  } else if (targetOrderId) {
    if (role === 'shop' && isDeliveryReturnFlow) {
      smartActionTitle = textContent.includes('nhận lại hàng')
        ? `Kiểm tra & Xác nhận hoàn #${targetOrderId}`
        : `Xem đơn hàng #${targetOrderId}`
    } else {
      smartActionTitle = `Xem chi tiết đơn hàng #${targetOrderId}`
    }
  } else if (categoryLabel === 'TÀI CHÍNH') {
    smartActionTitle = 'Đến ví tiền'
  } else if (categoryLabel === 'ƯU ĐÃI') {
    smartActionTitle = role === 'shop' ? 'Quản lý voucher' : 'Xem kho voucher'
  }

  const liveOrder = shipperOrderQuery.data ?? shipperReadyQuery.data ?? null
  const isCheckingOrder =
    isShipperOrderCheckEnabled &&
    (shipperOrderQuery.isFetching || (shipperOrderQuery.isError && shipperReadyQuery.isFetching))
  const isShipperOrderReady = role === 'shipper' && liveOrder?.status === 'READY'
  const isShipperOrderActive =
    role === 'shipper' &&
    (liveOrder?.status === 'SHIPPING' || liveOrder?.status === 'PICKED_UP' || liveOrder?.status === 'RETURNING_TO_SHOP')
  const isShipperOrderUnavailable =
    role === 'shipper' &&
    Boolean(targetOrderId) &&
    !isCheckingOrder &&
    !liveOrder &&
    shipperOrderQuery.isError &&
    !shipperReadyQuery.isFetching

  const handleQuickAccept = () => {
    if (!targetOrderId) return
    acceptOrder.mutate(targetOrderId, {
      onSuccess: () => {
        onClose()
        showToast(`Đã nhận đơn #${targetOrderId}. Đến nhà vườn lấy hàng nhé!`)
        router.navigate('/shipper/delivering' as any)
      },
      onError: (e) => {
        const msg = shipperErrorMessage(e, 'Chưa nhận được đơn, thử lại nhé.')
        if (shipperErrorCode(e) === 16013) {
          Alert.alert('Số dư ký quỹ không đủ', msg, [
            {
              text: 'Nạp ví ngay',
              onPress: () => {
                onClose()
                router.push('/shipper/wallet' as any)
              },
            },
            { text: 'Đóng', style: 'cancel' },
          ])
        } else {
          showToast(msg)
        }
      },
    })
  }

  return (
    <BottomSheet
      visible={visible}
      title="Chi tiết thông báo"
      onClose={onClose}
      footer={
        <View className="w-full gap-2">
          {role === 'shipper' && Boolean(targetOrderId) && !isDisputeRelated ? (
            isCheckingOrder ? (
              <Button
                title="Đang kiểm tra trạng thái đơn..."
                variant="outline"
                loading
                disabled
                onPress={() => {}}
                className="min-h-[44px] w-full"
              />
            ) : isShipperOrderReady ? (
              <View className="flex-row gap-2">
                <Button
                  title="Xem chi tiết"
                  variant="outline"
                  disabled={acceptOrder.isPending}
                  onPress={handlePrimaryAction}
                  className="min-h-[44px] flex-1 px-2.5"
                  textClassName="text-sm"
                />
                <Button
                  title={`Nhận đơn #${targetOrderId}`}
                  icon={CheckCircle2}
                  variant="primary"
                  loading={acceptOrder.isPending}
                  onPress={handleQuickAccept}
                  className="min-h-[44px] flex-1 px-2.5"
                  textClassName="text-sm"
                />
              </View>
            ) : isShipperOrderActive ? (
              <View className="flex-row gap-2">
                <Button
                  title="Xem chi tiết"
                  variant="outline"
                  onPress={handlePrimaryAction}
                  className="min-h-[44px] flex-1 px-2.5"
                  textClassName="text-sm"
                />
                <Button
                  title="Mở bản đồ"
                  icon={Map}
                  variant="primary"
                  onPress={() => {
                    onClose()
                    router.push({ pathname: '/shipper/tracking/[id]' as any, params: { id: targetOrderId } })
                  }}
                  className="min-h-[44px] flex-1 px-2.5"
                  textClassName="text-sm"
                />
              </View>
            ) : liveOrder ? (
              <Button
                title={`Xem chi tiết đơn #${targetOrderId}`}
                variant="primary"
                onPress={handlePrimaryAction}
                className="min-h-[44px] w-full"
              />
            ) : null
          ) : (
            hasSmartAction && (
              <Button
                title={smartActionTitle}
                variant="primary"
                onPress={handlePrimaryAction}
                className="min-h-[44px] w-full"
              />
            )
          )}
          <View className="flex-row items-center gap-2">
            {onDelete && (
              <Button
                title="Xóa"
                icon={Trash2}
                variant="danger"
                onPress={handleDelete}
                className="min-h-[44px] flex-1 px-2.5"
                textClassName="text-sm"
              />
            )}
            <Button
              title="Đóng"
              variant={hasSmartAction ? 'outline' : 'primary'}
              onPress={onClose}
              className={cn('min-h-[44px] px-2.5', onDelete ? 'flex-1' : 'w-full')}
              textClassName="text-sm"
            />
          </View>
        </View>
      }
    >
      <View className="gap-3">
        {/* Category Tag & Time */}
        <View className="flex-row items-center justify-between">
          <View className={cn('flex-row items-center gap-1.5 rounded-lg px-2.5 py-1', categoryBg)}>
            <CategoryIcon size={14} color={categoryColor} />
            <AppText weight="bold" className="text-[11px] uppercase tracking-wide" style={{ color: categoryColor }}>
              {categoryLabel}
            </AppText>
          </View>

          {(notif.createAt || notif.createdAt) && (
            <View className="flex-row items-center gap-1">
              <Calendar size={13} color={colors.inkSubtle} />
              <AppText className="text-xs text-ink-subtle">
                {formatDetailDate(notif.createAt || notif.createdAt)}
              </AppText>
            </View>
          )}
        </View>

        {/* Tiêu đề */}
        <AppText weight="extrabold" className="text-base leading-snug text-ink">
          {notif.title}
        </AppText>

        {/* Nội dung chi tiết */}
        <View className="rounded-xl border border-line bg-paper p-3.5">
          <AppText className="text-sm leading-relaxed text-ink select-text">
            {notif.message}
          </AppText>
        </View>

        {/* Trạng thái thực tế của đơn hàng đối với Shipper */}
        {role === 'shipper' && Boolean(targetOrderId) && !isDisputeRelated && liveOrder && (
          <View className="flex-row items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5">
            <AppText className="text-xs text-ink-muted">Trạng thái hiện tại của đơn #{targetOrderId}</AppText>
            <OrderStatusBadge status={liveOrder.status} />
          </View>
        )}
        {isShipperOrderUnavailable && (
          <View className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <AppText weight="semibold" className="text-xs text-amber-800">
              {shipperErrorCode(shipperReadyQuery.error) === 7006
                ? 'Bạn đang tắt nhận đơn nên chưa kiểm tra được đơn mới. Hãy bật "Đang nhận đơn" ở trang chủ.'
                : `Đơn #${targetOrderId} đã có tài xế khác nhận hoặc không còn ở trạng thái chờ giao.`}
            </AppText>
          </View>
        )}

        {/* Evidence / Liên kết đính kèm nếu có */}
        {Boolean(notif.evidence) &&
          (notif.evidence!.startsWith('http') || notif.evidence!.includes('.')) && (
            <Pressable
              onPress={() => handleOpenEvidence(notif.evidence!)}
              className="flex-row items-center justify-between rounded-xl border border-leaf-200 bg-leaf-50/70 p-3 active:bg-leaf-100"
            >
              <View className="flex-1 pr-2">
                <AppText weight="bold" className="text-xs text-leaf-800">
                  Liên kết đính kèm
                </AppText>
                <AppText numberOfLines={1} className="mt-0.5 text-xs text-leaf-700">
                  {notif.evidence}
                </AppText>
              </View>
              <ExternalLink size={16} color={colors.leaf700} />
            </Pressable>
          )}
      </View>
    </BottomSheet>
  )
}
