import { Image } from 'expo-image'
import {
  Banknote,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Gift,
  Navigation,
  Package,
  Phone,
  QrCode,
  XCircle,
} from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, Button, Checkbox } from '@/components/ui'
import { OrderStatusBadge } from '@/features/order/components/OrderStatusBadge'
import { orderIdOf } from '@/features/order/utils/orderStatus'
import { money } from '@/features/product'
import { colors } from '@/theme/colors'
import type { OrderItem, OrderResponse } from '@/types/order.types'
import { cn } from '@/utils/helpers'
import {
  isPrepaid,
  itemName,
  itemSubtotal,
  orderTime,
  shopCanCancel,
  shopOrderStage,
  stageHint,
  WEIGHT_PLEDGE,
} from '../utils/shopOrders'

const MAX_ITEMS = 2

export function PaymentChip({ order }: { order: Pick<OrderResponse, 'status' | 'paymentMethod'> }) {
  const prepaid = isPrepaid(order)
  return (
    <View
      className={cn(
        'flex-row items-center gap-1 rounded-full border px-2 py-0.5',
        prepaid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50',
      )}
    >
      {prepaid ? <QrCode size={12} color="#047857" /> : <Banknote size={12} color="#b45309" />}
      <AppText weight="bold" className={cn('text-xs', prepaid ? 'text-emerald-700' : 'text-amber-700')}>
        {prepaid ? 'Đã trả VietQR' : 'Thu COD'}
      </AppText>
    </View>
  )
}

export function OrderItemRow({ item }: { item: OrderItem }) {
  const name = itemName(item)
  const mystery = item.itemType === 'MYSTERY_BOX' || item.mysteryBoxType != null
  return (
    <View className="flex-row items-center gap-3 py-2">
      <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-line bg-paper">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48 }} contentFit="cover" />
        ) : mystery ? (
          <Gift size={18} color={colors.leaf700} />
        ) : (
          <Package size={18} color={colors.leaf700} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-sm">
          {name}
        </AppText>
        <AppText className="text-xs text-ink-muted">
          {item.quantity} × {money(Number(item.unitPrice || 0))}
        </AppText>
      </View>
      <AppText weight="bold" className="text-sm">
        {money(itemSubtotal(item))}
      </AppText>
    </View>
  )
}

/** Khối gợi ý theo bước (màu theo mức cần làm). */
export function StageHint({ order }: { order: Pick<OrderResponse, 'status' | 'paymentMethod'> }) {
  const stage = shopOrderStage(order.status)
  const text = stageHint(order)
  if (!text) return null
  const tone =
    stage === 'cancelled'
      ? { box: 'bg-rose-50 border-rose-200', text: 'text-rose-800', Icon: XCircle, color: '#be123c' }
      : stage === 'done' || (stage === 'confirm' && isPrepaid(order))
        ? { box: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', Icon: CheckCircle2, color: '#047857' }
        : stage === 'shipping'
          ? { box: 'bg-sky-50 border-sky-200', text: 'text-sky-800', Icon: Navigation, color: '#0369a1' }
          : { box: 'bg-amber-50 border-amber-200', text: 'text-amber-800', Icon: Boxes, color: '#b45309' }
  return (
    <View className={cn('flex-row gap-2 rounded-xl border p-3', tone.box)}>
      <tone.Icon size={16} color={tone.color} />
      <AppText className={cn('flex-1 text-xs leading-relaxed', tone.text)}>{text}</AppText>
    </View>
  )
}

/** Ô tích cam kết cân nặng, bắt buộc trước khi xác nhận đơn (như web). */
export function WeightPledge({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <View className="flex-row items-center">
      <Checkbox checked={checked} onChange={onToggle} label="Cam kết cân đủ trọng lượng" />
      <Pressable onPress={onToggle} accessible={false} className="flex-1">
        <AppText className="text-xs leading-relaxed text-ink-muted">{WEIGHT_PLEDGE}</AppText>
      </Pressable>
    </View>
  )
}

/** Thẻ đơn của Nhà vườn: người nhận, món, tổng tiền và nút theo bước xử lý. */
export function ShopOrderCard({
  order,
  busy,
  onOpen,
  onConfirm,
  onCancel,
  onPack,
  onTrack,
}: {
  order: OrderResponse
  busy: boolean
  onOpen: () => void
  onConfirm: () => void
  onCancel: () => void
  onPack: () => void
  onTrack: () => void
}) {
  const [pledged, setPledged] = useState(false)
  const id = orderIdOf(order)
  const stage = shopOrderStage(order.status)
  const items = order.items ?? []
  const more = items.length - MAX_ITEMS

  return (
    <View
      className={cn(
        'overflow-hidden rounded-panel border bg-white',
        stage === 'confirm' ? 'border-amber-300' : 'border-line',
      )}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Đơn #${id}`}
        className="active:opacity-80"
      >
        <View className="gap-1.5 border-b border-line bg-paper px-4 py-3">
          <View className="flex-row items-center gap-2">
            <AppText weight="extrabold" className="text-sm">
              #{id}
            </AppText>
            <PaymentChip order={order} />
            <View className="flex-1" />
            <OrderStatusBadge status={order.status} />
          </View>
          <View className="flex-row items-center gap-1.5">
            <AppText numberOfLines={1} weight="semibold" className="flex-1 text-sm">
              {order.recipientName || 'Khách mua'}
            </AppText>
            {!!order.recipientPhone && (
              <View className="flex-row items-center gap-1">
                <Phone size={12} color={colors.inkSubtle} />
                <AppText className="text-xs text-ink-muted">{order.recipientPhone}</AppText>
              </View>
            )}
          </View>
          <AppText className="text-xs text-ink-subtle">{orderTime(order.createdAt)}</AppText>
        </View>

        <View className="px-4 py-1">
          {items.slice(0, MAX_ITEMS).map((it, i) => (
            <OrderItemRow key={it.orderDetailId ?? i} item={it} />
          ))}
          {more > 0 && <AppText className="pb-1 text-xs text-ink-muted">và {more} món khác</AppText>}
          {!!order.note && (
            <AppText numberOfLines={2} className="pb-2 text-xs italic text-ink-muted">
              Ghi chú: {order.note}
            </AppText>
          )}
        </View>
      </Pressable>

      <View className="gap-3 border-t border-line px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onOpen} accessibilityRole="link" hitSlop={8} className="flex-row items-center gap-1">
            <AppText weight="semibold" className="text-sm text-leaf-700">
              Chi tiết
            </AppText>
            <ChevronRight size={16} color={colors.leaf700} />
          </Pressable>
          <View className="flex-row items-baseline gap-1">
            <AppText className="text-xs text-ink-muted">Tổng</AppText>
            <AppText weight="extrabold" className="text-base text-leaf-700">
              {money(Number(order.totalAmount || 0))}
            </AppText>
          </View>
        </View>

        <StageHint order={order} />

        {stage === 'confirm' && <WeightPledge checked={pledged} onToggle={() => setPledged((v) => !v)} />}

        {(stage === 'confirm' || stage === 'pack' || stage === 'shipping') && (
          <View className="flex-row gap-2">
            {shopCanCancel(order.status) && (
              <Button
                title="Huỷ đơn"
                variant="outline"
                onPress={onCancel}
                disabled={busy}
                className="min-h-[44px] flex-1"
              />
            )}
            {stage === 'confirm' && (
              <Button
                title="Xác nhận đơn"
                icon={CheckCircle2}
                onPress={onConfirm}
                loading={busy}
                disabled={!pledged}
                className="min-h-[44px] flex-[1.5]"
              />
            )}
            {stage === 'pack' && (
              <Button title="Đóng gói" icon={Boxes} onPress={onPack} className="min-h-[44px] flex-[1.5]" />
            )}
            {stage === 'shipping' && (
              <Button title="Theo dõi shipper" icon={Navigation} onPress={onTrack} className="min-h-[44px] flex-1" />
            )}
          </View>
        )}
      </View>
    </View>
  )
}
