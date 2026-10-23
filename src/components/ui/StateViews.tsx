import { AlertTriangle, Leaf, RefreshCw } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { AppText } from './AppText'
import { Button } from './Button'

type StateViewProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

function StateFrame({
  title,
  description,
  icon,
  action,
  className,
  tone,
}: StateViewProps & { tone: 'neutral' | 'danger' }) {
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}
      className={cn(
        'items-center gap-3 rounded-panel border px-6 py-12',
        tone === 'danger' ? 'border-red-200 bg-sale-soft' : 'border-line bg-white',
        className,
      )}
    >
      <View
        className={cn(
          'mb-1 h-16 w-16 items-center justify-center rounded-full',
          tone === 'danger' ? 'bg-white' : 'bg-leaf-50',
        )}
      >
        {icon}
      </View>
      <AppText weight="bold" className="text-center text-lg text-ink">
        {title}
      </AppText>
      {!!description && (
        <AppText className="max-w-sm text-center text-sm text-ink-muted">{description}</AppText>
      )}
      {action && <View className="mt-2 self-stretch">{action}</View>}
    </View>
  )
}

/** Danh sách rỗng: luôn nói rõ vì sao rỗng và cho người dùng một hành động tiếp theo. */
export function EmptyState({ icon = <Leaf size={32} color={colors.leaf600} />, ...props }: StateViewProps) {
  return <StateFrame {...props} icon={icon} tone="neutral" />
}

/** Lỗi tải dữ liệu: có nút "Thử lại" thay vì chỉ in dòng chữ đỏ. */
export function ErrorState({
  title = 'Không tải được dữ liệu',
  description = 'Kết nối bị gián đoạn. Vui lòng kiểm tra mạng và thử lại.',
  onRetry,
  ...props
}: Partial<StateViewProps> & { onRetry?: () => void }) {
  return (
    <StateFrame
      {...props}
      title={title}
      description={description}
      icon={<AlertTriangle size={30} color={colors.sale} />}
      tone="danger"
      action={onRetry && <Button title="Thử lại" variant="outline" icon={RefreshCw} onPress={onRetry} />}
    />
  )
}
