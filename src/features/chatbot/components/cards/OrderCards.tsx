import { AlertTriangle, ArrowRight, Coins, Copy, CreditCard, ExternalLink, Headphones, MapPin, Phone, ShieldCheck, Truck, Wallet, XCircle } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { money } from '@/features/product'
import type {
  OrderCancelDto,
  OrderTrackingDto,
  PaymentAssistanceDto,
  ReturnGuidanceDto,
  UpdateShippingInfoDto,
  WalletInfoDto,
} from '@/services/chatbot.types'
import { colors } from '@/theme/colors'
import {
  callPhone,
  copyText,
  leaveChatTo,
  openChatbotUrl,
  openOrderDetail,
  openPaymentLink,
} from '../../chatbotLinks'
import { orderTrackingAction } from '../../utils/chatbotNavigation'
import { CardText, CardTitle, ChatAction, ChatCard, Chip, InfoRow } from './CardParts'

export function OrderTrackingCard({ tracking }: { tracking: OrderTrackingDto }) {
  const action = orderTrackingAction(tracking.orderId, tracking.orderStatus)
  return (
    <ChatCard>
      <CardTitle
        icon={Truck}
        title={`Đơn hàng #${tracking.orderId}`}
        subtitle={tracking.shopName || 'Nhà vườn CapNong'}
        right={<Chip label={tracking.statusDescription} />}
      />
      <View className="flex-row gap-1.5">
        <MapPin size={14} color={colors.inkMuted} />
        <AppText className="flex-1 text-caption text-ink-muted">{tracking.shippingAddress || 'Địa chỉ nhận hàng'}</AppText>
      </View>
      <InfoRow label="Tài xế:" value={tracking.shipperName || 'Đang điều phối tài xế'} />
      <InfoRow strong label="Tổng thanh toán:" value={money(tracking.totalAmount ?? 0)} />
      {!!tracking.shipperPhone && (
        <ChatAction
          label={`Gọi tài xế ${tracking.shipperPhone}`}
          icon={Phone}
          variant="outline"
          onPress={() => callPhone(tracking.shipperPhone!)}
        />
      )}
      <ChatAction label={action.label} icon={ArrowRight} onPress={() => leaveChatTo(action.href)} />
    </ChatCard>
  )
}

export function ReturnGuidanceCard({ guidance }: { guidance: ReturnGuidanceDto }) {
  return (
    <ChatCard tone="leaf">
      <CardTitle icon={ShieldCheck} title={guidance.policyTitle} />
      <CardText>{guidance.policyContent}</CardText>
      <ChatAction label={guidance.actionLabel || 'Xem đơn hàng'} icon={ArrowRight} onPress={() => openChatbotUrl(guidance.actionUrl || '/orders')} />
    </ChatCard>
  )
}

export function OrderCancelCard({ orderCancel }: { orderCancel: OrderCancelDto }) {
  const { canCancel, orderId, refundAmount } = orderCancel
  return (
    <ChatCard tone={canCancel ? 'danger' : 'default'}>
      <CardTitle
        icon={canCancel ? AlertTriangle : XCircle}
        danger={canCancel}
        title={`Đơn hàng #${orderId} - Trạng thái: ${orderCancel.orderStatus}`}
      />
      <CardText>{orderCancel.message}</CardText>
      {canCancel && !!refundAmount && refundAmount > 0 && (
        <InfoRow strong label="Số tiền đã thanh toán:" value={money(refundAmount)} />
      )}
      <ChatAction
        label={canCancel ? `Mở chi tiết đơn hàng #${orderId} để hủy` : `Mở chi tiết đơn hàng #${orderId}`}
        icon={ExternalLink}
        variant={canCancel ? 'danger' : 'primary'}
        onPress={() => openOrderDetail(orderId)}
      />
    </ChatCard>
  )
}

export function PaymentAssistanceCard({ payment }: { payment: PaymentAssistanceDto }) {
  const hotline = payment.supportHotline
  return (
    <ChatCard>
      <CardTitle
        icon={CreditCard}
        title={payment.orderId ? `Hỗ trợ thanh toán Đơn #${payment.orderId}` : 'Cổng thanh toán CapNong'}
        subtitle={payment.paymentMethod ? `Phương thức: ${payment.paymentMethod}` : undefined}
      />
      {!!payment.amountDue && payment.amountDue > 0 && <InfoRow strong label="Cần thanh toán:" value={money(payment.amountDue)} />}
      {!!payment.guidance && <CardText>{payment.guidance}</CardText>}
      {!!payment.bankAccount && !!payment.bankName && (
        <View className="gap-1.5 rounded-card bg-paper p-2.5">
          <InfoRow label="Ngân hàng:" value={payment.bankName} />
          {!!payment.accountHolder && <InfoRow label="Chủ tài khoản:" value={payment.accountHolder} />}
          <InfoRow label="Số tài khoản:" value={payment.bankAccount} />
          <ChatAction
            label="Sao chép số tài khoản"
            icon={Copy}
            variant="outline"
            onPress={() => copyText(payment.bankAccount!, 'Đã sao chép số tài khoản')}
          />
        </View>
      )}
      {!!payment.stepInstructions?.length && (
        <View className="gap-1">
          <AppText weight="semibold" className="text-caption">
            Các bước xử lý an toàn:
          </AppText>
          {payment.stepInstructions.map((step) => (
            <AppText key={step} className="text-caption text-ink-muted">
              • {step}
            </AppText>
          ))}
        </View>
      )}
      {!!payment.payosUrl && (
        <ChatAction label="Mở PayOS thanh toán" icon={ExternalLink} onPress={() => openPaymentLink(payment.payosUrl!)} />
      )}
      {!!hotline && <ChatAction label="Hotline hỗ trợ" icon={Phone} variant="outline" onPress={() => callPhone(hotline)} />}
    </ChatCard>
  )
}

export function WalletInfoCard({ wallet }: { wallet: WalletInfoDto }) {
  return (
    <ChatCard tone="leaf">
      <CardTitle icon={Wallet} title="Ví Tiện Ích & Điểm Tích Lũy" subtitle={`Trạng thái: ${wallet.walletStatus}`} />
      <View className="items-center gap-0.5 rounded-card bg-white p-2.5">
        <View className="flex-row items-center gap-1">
          <Coins size={15} color={colors.leaf700} />
          <AppText weight="bold" className="text-base">
            {wallet.loyaltyPoints}
          </AppText>
        </View>
        <AppText className="text-caption text-ink-muted">Điểm tích lũy</AppText>
      </View>
      {!!wallet.linkedBankName && (
        <InfoRow
          label="Tài khoản rút/nhận tiền:"
          value={`${wallet.linkedBankName} (${wallet.linkedBankAccount ? `*${wallet.linkedBankAccount.slice(-4)}` : 'Đã kết nối'})`}
        />
      )}
      <CardText muted>{wallet.message}</CardText>
      <ChatAction
        label={wallet.navigationLabel || 'Xem tài khoản'}
        icon={ArrowRight}
        onPress={() => openChatbotUrl(wallet.navigationUrl || '/tai-khoan')}
      />
    </ChatCard>
  )
}

export function UpdateShippingInfoCard({ info }: { info: UpdateShippingInfoDto }) {
  const isPhone = info.updateType === 'PHONE'
  const hotline = info.supportContact
  const guidance =
    info.guidance ||
    info.note ||
    info.suggestedAction ||
    (isPhone
      ? 'Hệ thống không hỗ trợ sửa trực tiếp số điện thoại trên đơn đã chốt để tránh xung đột dữ liệu vận chuyển. Bạn hãy liên hệ trực tiếp với tài xế giao hàng hoặc bộ phận hỗ trợ để được chuyển số mới nhé!'
      : 'Hệ thống CapNong tính cước vận chuyển tự động theo toạ độ Google Maps giữa nhà vườn và người nhận nên không hỗ trợ đổi trực tiếp địa chỉ trên đơn đã chốt. Nếu đơn chưa giao, bạn có thể Hủy đơn trong mục Đơn hàng của tôi để đặt lại địa chỉ mới nhé!')
  const status = info.orderStatus
    ? `Trạng thái: ${info.orderStatus}`
    : isPhone
      ? 'Số điện thoại đã lưu vào đơn'
      : 'Địa chỉ giao hàng đã chốt'

  return (
    <ChatCard tone="sun">
      <CardTitle
        icon={isPhone ? Phone : MapPin}
        title={info.orderId > 0 ? `Đơn hàng #${info.orderId}` : 'Thông tin nhận hàng'}
        subtitle={status}
      />
      <Chip tone="sun" label={isPhone ? 'Không thể tự sửa trên app' : 'Không thể đổi trực tiếp'} />
      <InfoRow label="Địa chỉ nhận:" value={info.currentAddress || 'Chưa cập nhật'} />
      <InfoRow label="SĐT người nhận:" value={info.currentPhone || 'Chưa cập nhật'} />
      {!!info.shipperPhone && <InfoRow label="Tài xế giao hàng:" value={info.shipperName || 'Shipper CapNong'} />}
      <CardText>{guidance}</CardText>
      {isPhone && info.shipperPhone ? (
        <ChatAction label="Gọi Shipper báo số mới" icon={Phone} onPress={() => callPhone(info.shipperPhone!)} />
      ) : (
        <ChatAction label="Xem đơn hàng của tôi" icon={ArrowRight} onPress={() => openChatbotUrl('/orders')} />
      )}
      {!!hotline && <ChatAction label="Gọi hotline" icon={Headphones} variant="outline" onPress={() => callPhone(hotline)} />}
    </ChatCard>
  )
}
