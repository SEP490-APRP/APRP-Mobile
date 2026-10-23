import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { cn } from '@/utils/helpers'
import { CapNongLoading } from './CapNongLoading'

/**
 * Khung màn hình: vùng an toàn (tai thỏ), không bị bàn phím che, cuộn được.
 * `loading` là câu thông báo: khi có, phủ CapNongLoading toàn màn và chặn thao tác.
 */
export function Screen({
  children,
  scroll = true,
  loading,
  className,
}: {
  children: ReactNode
  scroll?: boolean
  loading?: string | false
  className?: string
}) {
  const body = <View className={cn('flex-1 px-5 pb-8 pt-4', className)}>{children}</View>
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerClassName="flex-grow"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </KeyboardAvoidingView>
      {!!loading && <CapNongLoading fullScreen message={loading} />}
    </SafeAreaView>
  )
}
