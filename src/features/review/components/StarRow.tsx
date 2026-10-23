import { Star } from 'lucide-react-native'
import { View } from 'react-native'

const FILLED = '#facc15'
const EMPTY = '#e5e7eb'

/** 5 ngôi sao, tô theo điểm làm tròn. */
export function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const filled = Math.round(rating)
  return (
    <View accessible accessibilityLabel={`${rating.toFixed(1)} trên 5 sao`} className="flex-row gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} color={i < filled ? FILLED : EMPTY} fill={i < filled ? FILLED : 'transparent'} />
      ))}
    </View>
  )
}
