import { router } from 'expo-router'
import { AlertTriangle, PackageX, ShoppingBag } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText, BottomSheet, Button } from '@/components/ui'
import { colors } from '@/theme/colors'
import type { StockShortageItem } from '../utils/stockRules'

export function StockShortageSheet({
  visible,
  items,
  message,
  onClose,
}: {
  visible: boolean
  items: readonly StockShortageItem[]
  message?: string
  onClose: () => void
}) {
  return (
    <BottomSheet
      visible={visible}
      title="Số lượng tồn kho không đủ"
      subtitle={message || 'Một số mặt hàng trong kho đã thay đổi số lượng'}
      onClose={onClose}
      footer={
        <>
          <Button title="Đã hiểu" variant="outline" onPress={onClose} className="min-h-[44px] flex-1" />
          <Button
            title="Về giỏ hàng"
            variant="primary"
            onPress={() => {
              onClose()
              router.replace('/buyer/cart')
            }}
            className="min-h-[44px] flex-1"
          />
        </>
      }
    >
      <View className="gap-3">
        <View className="flex-row items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3">
          <AlertTriangle size={18} color="#be123c" />
          <AppText className="flex-1 text-xs text-rose-900 leading-relaxed">
            Vui lòng điều chỉnh lại số lượng hoặc chọn sản phẩm khác từ nhà vườn.
          </AppText>
        </View>

        {items.map((item, idx) => (
          <View key={idx} className="flex-row items-center gap-3 rounded-2xl border border-line bg-paper p-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white border border-line">
              <PackageX size={20} color={colors.inkSubtle} />
            </View>
            <View className="flex-1">
              <AppText weight="bold" numberOfLines={1} className="text-sm">
                {item.itemName}
              </AppText>
              <View className="flex-row items-center gap-2 mt-0.5">
                {item.requestedQuantity != null && (
                  <AppText className="text-xs text-ink-muted">Bạn đặt: {item.requestedQuantity}</AppText>
                )}
                {item.availableQuantity != null && (
                  <AppText weight="semibold" className="text-xs text-rose-700">
                    Kho còn: {item.availableQuantity}
                  </AppText>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </BottomSheet>
  )
}

