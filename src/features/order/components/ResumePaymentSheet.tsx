import { Store } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText, BottomSheet, Button } from '@/components/ui'
import { money } from '@/features/product'
import { colors } from '@/theme/colors'
import type { ResumePaymentOptionsResponse } from '@/types/payment.types'

/** Đơn đặt cùng lúc từ nhiều shop: trả gộp một lần hoặc trả riêng từng đơn. */
export function ResumePaymentSheet({
  options,
  onPayAll,
  onPaySingle,
  onClose,
}: {
  options: ResumePaymentOptionsResponse | null
  onPayAll: () => void
  onPaySingle: (orderId: number) => void
  onClose: () => void
}) {
  const orders = options?.unpaidOrders ?? []
  const total = options?.payAllOption?.amount ?? options?.totalAmount ?? 0
  return (
    <BottomSheet
      visible={!!options}
      title="Chọn cách thanh toán"
      subtitle={`Lần đặt này gồm ${orders.length} đơn từ các nhà vườn khác nhau`}
      onClose={onClose}
    >
      <View className="gap-3 rounded-2xl border-2 border-leaf-700 bg-leaf-50 p-4">
        <View className="flex-row items-baseline justify-between">
          <AppText weight="bold" className="text-sm">
            Thanh toán tất cả
          </AppText>
          <AppText weight="extrabold" className="text-lg text-leaf-700">
            {money(total)}
          </AppText>
        </View>
        <AppText className="text-xs text-ink-muted">Một lần quét mã cho cả {orders.length} đơn.</AppText>
        <Button title="Thanh toán tất cả" onPress={onPayAll} />
      </View>
      <AppText weight="bold" className="mt-2 text-xs uppercase tracking-wider text-ink-muted">
        Hoặc từng đơn
      </AppText>
      {orders.map((o) => (
        <View key={o.orderId} className="flex-row items-center gap-3 rounded-2xl border border-line bg-white p-3">
          <Store size={18} color={colors.leaf700} />
          <View className="min-w-0 flex-1">
            <AppText weight="bold" numberOfLines={1} className="text-sm">
              {o.shopName}
            </AppText>
            <AppText className="text-xs text-ink-muted">
              #{o.orderId} · {money(o.amount)}
            </AppText>
          </View>
          <Button title="Trả" variant="outline" onPress={() => onPaySingle(o.orderId)} className="min-h-[40px] px-4" />
        </View>
      ))}
    </BottomSheet>
  )
}
