import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { cn } from '@/utils/helpers'
import { pickupCode } from '../utils/orderStatus'

/**
 * Mã đối soát bàn giao hàng, hiện to rõ.
 * variant "shop": nhà vườn ghi/dán mã lên túi hàng. variant "shipper": tài xế so mã trên túi trước khi lấy hàng.
 */
export function PickupCodeTag({
  orderId,
  variant,
  className,
}: {
  orderId: number
  variant: 'shop' | 'shipper'
  className?: string
}) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-leaf-600 bg-leaf-50 px-4 py-3',
        className,
      )}
    >
      <View className="flex-1">
        <AppText weight="bold" className="text-xs uppercase text-leaf-700">
          {variant === 'shop' ? 'Mã dán lên túi hàng' : 'Mã đối soát'}
        </AppText>
        <AppText className="text-xs text-ink-muted">
          {variant === 'shop' ? 'Tài xế so mã này trước khi bấm "Đã lấy hàng"' : 'Mã trên túi hàng phải trùng mã này'}
        </AppText>
      </View>
      <AppText weight="extrabold" className="text-3xl tracking-wider text-leaf-800">
        {pickupCode(orderId)}
      </AppText>
    </View>
  )
}
