import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native'
import { View } from 'react-native'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { AppText } from './AppText'

type Tone = 'error' | 'success' | 'info'

const styles: Record<Tone, { box: string; text: string; color: string; Icon: typeof Info }> = {
  error: { box: 'bg-sale-soft border-sale/40', text: 'text-sale', color: colors.sale, Icon: AlertCircle },
  success: { box: 'bg-leaf-50 border-leaf-700/40', text: 'text-leaf-800', color: colors.leaf700, Icon: CheckCircle2 },
  info: { box: 'bg-sun-100 border-sun-500/50', text: 'text-soil-700', color: '#6f3e16', Icon: Info },
}

/** Hộp thông báo lỗi/thành công phía trên form (thay cho các khối alert của bản web). */
export function Banner({ tone, message }: { tone: Tone; message: string }) {
  if (!message) return null
  const { box, text, color, Icon } = styles[tone]
  return (
    <View
      accessibilityRole="alert"
      className={cn('flex-row items-start gap-2 rounded-card border p-3', box)}
    >
      <Icon size={18} color={color} />
      <AppText className={cn('flex-1 text-sm', text)}>{message}</AppText>
    </View>
  )
}
