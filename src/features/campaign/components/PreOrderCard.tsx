import { router } from 'expo-router'
import { ChevronRight, CreditCard, Flame, Scale, XCircle } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import type { PreOrderResponse } from '@/services'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { fmtDateTime, formatVnd, PRE_ORDER_STATUS, PRE_ORDER_STEPS } from '../utils/campaignFormat'
import { Notice, Pill } from './CampaignBits'

/** Thẻ đơn đặt trước chiến dịch (PreOrderCard bản web) */
export function PreOrderCard({
  p,
  onPay,
  onCancel,
  onClaim,
  paying,
  cancelling,
  campaignHref,
}: {
  p: PreOrderResponse
  onPay: () => void
  onCancel: () => void
  onClaim: () => void
  paying: boolean
  cancelling: boolean
  campaignHref: string
}) {
  // Đơn cũ nhận trước khi có trạng thái SHIPPING: READY + pickedUpAt cũng là "Đang giao"
  const st = p.status === 'READY' && p.pickedUpAt ? PRE_ORDER_STATUS.SHIPPING : (PRE_ORDER_STATUS[p.status] ?? PRE_ORDER_STATUS.PENDING)
  const unpaid = p.status === 'PENDING'
  const stepIndex = PRE_ORDER_STEPS.findIndex((s) => s.key.includes(p.status))
  const reduced = p.originalCrateQuantity != null && p.originalCrateQuantity > p.crateQuantity
  const refund = Number(p.shortfallRefundAmount ?? 0)
  const remainingDue = ['DEPOSIT_PAID', 'PROCESSING', 'READY', 'SHIPPING'].includes(p.status)
  const claimOpen =
    p.status === 'DELIVERED' && !!p.damageClaimDeadline && Date.parse(p.damageClaimDeadline) > Date.now() && p.damageClaimStatus !== 'PENDING'

  return (
    <View className={cn('overflow-hidden rounded-panel border bg-white', unpaid ? 'border-amber-300' : 'border-line')}>
      <Pressable onPress={() => router.push(campaignHref as never)} className="flex-row items-center gap-3 border-b border-line bg-orange-50/60 px-4 py-3">
        <View className="h-8 w-8 items-center justify-center rounded-xl bg-white">
          <Flame size={16} color="#ea580c" />
        </View>
        <View className="min-w-0 flex-1">
          <AppText weight="bold" numberOfLines={1} className="text-sm">
            {p.campaignTitle}
          </AppText>
          <AppText className="text-[11px] text-ink-subtle">
            Mã {p.code}
            {p.createdAt ? ` · ${fmtDateTime(p.createdAt)}` : ''}
          </AppText>
        </View>
        <ChevronRight size={16} color={colors.inkSubtle} />
      </Pressable>

      <View className="gap-2.5 p-4">
        <Pill
          tone={st.tone}
          text={p.status === 'FAILED' && p.fulfillmentMethod === 'PICKUP' ? 'Không tới nhận · mất cọc' : st.label}
        />
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <AppText weight="bold" className="text-sm">
              {p.crateQuantity} thùng × {p.crateKg} kg · tổng {p.totalKg} kg
            </AppText>
            <AppText className="text-xs text-ink-muted">
              {formatVnd(p.unitPrice)}/kg ·{' '}
              {p.fulfillmentMethod === 'PICKUP'
                ? `tự đến lấy tại ${p.collectionSiteName || 'điểm tập kết'}`
                : `giao về ${p.shippingAddress || 'địa chỉ của bạn'} · phí giao ${Number(p.shippingFee ?? 0) > 0 ? formatVnd(p.shippingFee) : 'miễn phí'}`}
            </AppText>
          </View>
          <AppText weight="extrabold" className="text-sm text-leaf-700">
            {formatVnd(p.totalAmount)}
          </AppText>
        </View>

        {p.fulfillmentMethod === 'PICKUP' && p.status === 'PROCESSING' && (
          <Notice tone="leaf">Đã đóng gói xong, mời bạn tới lấy · đọc mã {p.code}</Notice>
        )}
        {Number(p.shippingDiscountAmount ?? 0) > 0 && (
          <Notice tone="leaf">Gom đơn cùng phường: giảm {formatVnd(p.shippingDiscountAmount)} phí giao</Notice>
        )}
        {reduced && <Notice>Giảm từ {p.originalCrateQuantity} thùng do nhà vườn thiếu hàng</Notice>}

        {stepIndex >= 0 && (
          <View className="flex-row gap-1">
            {PRE_ORDER_STEPS.map((s, i) => (
              <View key={s.label} className="flex-1 gap-1">
                <View className={cn('h-1.5 rounded-full', i <= stepIndex ? 'bg-leaf-600' : 'bg-line')} />
                <AppText weight="semibold" className={cn('text-[10px]', i <= stepIndex ? 'text-leaf-700' : 'text-ink-subtle')}>
                  {s.label}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {p.damageClaimStatus && (
          <Notice tone={p.damageClaimStatus === 'PENDING' ? 'amber' : p.damageClaimStatus === 'APPROVED' ? 'leaf' : 'rose'}>
            {p.damageClaimStatus === 'PENDING'
              ? `Đã báo hư ${p.damageClaimKg} kg · CapNong đang xem ảnh`
              : p.damageClaimStatus === 'APPROVED'
                ? `Báo hư được duyệt ${p.damageClaimKg} kg · đã hoàn ${formatVnd(p.damageRefundTotal)} vào ví`
                : 'Báo hư gần nhất bị từ chối, xem lý do trong thông báo'}
          </Notice>
        )}
        {(p.cancelReason || p.failReason) && <Notice tone="gray">Lý do: {p.cancelReason || p.failReason}</Notice>}
      </View>

      <View className="gap-3 border-t border-line bg-paper px-4 py-3">
        <View>
          <AppText className="text-xs text-ink-muted">
            {unpaid ? 'Cần cọc' : 'Đã cọc'}:{' '}
            <AppText weight="bold" className="text-xs">
              {formatVnd(p.depositAmount)}
            </AppText>
            {remainingDue && (
              <>
                {' · '}Trả khi nhận:{' '}
                <AppText weight="bold" className="text-xs">
                  {formatVnd(p.remainingAmount)}
                </AppText>
              </>
            )}
          </AppText>
          {refund > 0 && (
            <AppText weight="semibold" className="text-xs text-sale">
              Đã hoàn {formatVnd(refund)} vào ví
            </AppText>
          )}
        </View>
        {(unpaid || claimOpen) && (
          <View className="flex-row flex-wrap gap-2">
            {claimOpen && <Button title="Báo hàng hư" variant="outline" icon={Scale} onPress={onClaim} />}
            {unpaid && <Button title="Thanh toán cọc" icon={CreditCard} loading={paying} onPress={onPay} />}
            {unpaid && <Button title="Huỷ đơn" variant="ghost" icon={XCircle} loading={cancelling} onPress={onCancel} />}
          </View>
        )}
      </View>
    </View>
  )
}
