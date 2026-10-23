import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { cn } from '@/utils/helpers'
import { orderStatusLabel, orderStatusTone, type StatusTone } from '../utils/orderStatus'

const TONE: Record<StatusTone, { box: string; text: string }> = {
  leaf: { box: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
  blue: { box: 'border-blue-200 bg-blue-50', text: 'text-blue-700' },
  amber: { box: 'border-amber-300 bg-amber-50', text: 'text-amber-700' },
  rose: { box: 'border-rose-200 bg-rose-50', text: 'text-rose-700' },
  gray: { box: 'border-gray-200 bg-gray-100', text: 'text-gray-700' },
}

export function OrderStatusBadge({ status }: { status?: string | null }) {
  const tone = TONE[orderStatusTone(status)]
  return (
    <View className={cn('rounded-full border px-2.5 py-1', tone.box)}>
      <AppText weight="bold" className={cn('text-xs', tone.text)}>
        {orderStatusLabel(status)}
      </AppText>
    </View>
  )
}
