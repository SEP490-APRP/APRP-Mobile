import * as WebBrowser from 'expo-web-browser'
import { router } from 'expo-router'
import {
  AlertTriangle,
  Bell,
  Calendar,
  ExternalLink,
  Package,
  Tag,
  Trash2,
  Truck,
  Wallet,
} from 'lucide-react-native'
import { Alert, Linking, Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button } from '@/components/ui'
import type { NotificationItem } from '@/services/notification.types'
import { useAuthStore } from '@/stores'
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
  const role = user?.role?.toLowerCase()

  if (!notification) return null

  const notif = notification
  const textContent = `${notif.title ?? ''} ${notif.message ?? ''} ${notif.evidence ?? ''}`.toLowerCase()
  const type = (notif.type ?? '').toUpperCase()

  // 1. Phân loại Category
  let categoryLabel = 'HỆ THỐNG'
  let CategoryIcon = Bell
  let categoryColor: string = colors.leaf700
  let categoryBg = 'bg-leaf-100'

  const isDisputeRelated =
    type.includes('RETURN') ||
    type.includes('DISPUTE') ||
    type.includes('ADMIN_APPROVED') ||
    textContent.includes('khiếu nại') ||
    textContent.includes('hoàn trả') ||
    textContent.includes('trả hàng') ||
    textContent.includes('hoàn tiền')

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
        router.push({ pathname: '/shipper/tracking/[id]' as any, params: { id: targetOrderId } })
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
    smartActionTitle = `Xem chi tiết đơn hàng #${targetOrderId}`
  } else if (categoryLabel === 'TÀI CHÍNH') {
    smartActionTitle = 'Đến ví tiền'
  } else if (categoryLabel === 'ƯU ĐÃI') {
    smartActionTitle = role === 'shop' ? 'Quản lý voucher' : 'Xem kho voucher'
  }

  return (
    <BottomSheet
      visible={visible}
      title="Chi tiết thông báo"
      onClose={onClose}
      footer={
        <View className="w-full gap-2">
          {hasSmartAction && (
            <Button
              title={smartActionTitle}
              variant="primary"
              onPress={handlePrimaryAction}
              className="min-h-[44px] w-full"
            />
          )}
          <View className="flex-row items-center gap-2">
            {onDelete && (
              <Button
                title="Xóa"
                icon={Trash2}
                variant="danger"
                onPress={handleDelete}
                className="flex-1 min-h-[42px]"
              />
            )}
            <Button
              title="Đóng"
              variant={hasSmartAction ? 'outline' : 'primary'}
              onPress={onClose}
              className={cn('min-h-[42px]', onDelete ? 'flex-1' : 'w-full')}
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
