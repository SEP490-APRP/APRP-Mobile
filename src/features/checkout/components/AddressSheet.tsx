import { Home, Plus } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button } from '@/components/ui'
import { AddressFormSheet } from '@/features/address'
import { colors } from '@/theme/colors'
import type { SavedAddress } from '@/types/address.types'
import { cn } from '@/utils/helpers'

/** Chọn địa chỉ nhận hàng trong sổ hoặc thêm mới (thay cho modal "Sổ địa chỉ" bản web). */
export function AddressSheet({
  visible,
  addresses,
  selectedId,
  defaults,
  startInForm,
  onSelect,
  onClose,
}: {
  visible: boolean
  addresses: readonly SavedAddress[]
  selectedId: number | null
  /** Điền sẵn tên, số điện thoại từ hồ sơ */
  defaults: { recipientName: string; phone: string }
  /** Mở thẳng form thêm mới (khi sổ địa chỉ còn trống) */
  startInForm: boolean
  onSelect: (address: SavedAddress) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'list' | 'form'>('list')

  useEffect(() => {
    if (visible) setMode(startInForm ? 'form' : 'list')
  }, [visible, startInForm])

  if (mode === 'form') {
    return (
      <AddressFormSheet
        visible={visible}
        editing={null}
        defaults={defaults}
        isFirst={addresses.length === 0}
        saveLabel="Lưu và dùng"
        backLabel={addresses.length > 0 ? 'Quay lại' : undefined}
        onBack={() => setMode('list')}
        onSaved={(created) => {
          onSelect(created)
          onClose()
        }}
        onClose={onClose}
      />
    )
  }

  return (
    <BottomSheet
      visible={visible}
      title="Địa chỉ nhận hàng"
      subtitle={`${addresses.length} địa chỉ đã lưu`}
      onClose={onClose}
      footer={<Button title="Thêm địa chỉ mới" icon={Plus} variant="outline" onPress={() => setMode('form')} className="flex-1" />}
    >
      {addresses.map((a) => {
        const active = a.id === selectedId
        return (
          <Pressable
            key={a.id}
            onPress={() => {
              onSelect(a)
              onClose()
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            className={cn('flex-row gap-3 rounded-2xl border p-3.5', active ? 'border-leaf-700 bg-leaf-50' : 'border-line bg-white')}
          >
            <View
              className={cn(
                'mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2',
                active ? 'border-leaf-700' : 'border-line-strong',
              )}
            >
              {active && <View className="h-2.5 w-2.5 rounded-full bg-leaf-700" />}
            </View>
            <View className="flex-1 gap-0.5">
              <View className="flex-row flex-wrap items-center gap-1.5">
                <AppText weight="bold" className="text-sm">
                  {a.recipientName}
                </AppText>
                <AppText className="text-sm text-ink-muted">· {a.phone}</AppText>
              </View>
              <AppText className="text-sm leading-relaxed text-ink-muted">{a.address}</AppText>
              <View className="mt-1 flex-row gap-1.5">
                {!!a.label && (
                  <View className="flex-row items-center gap-1 rounded-md bg-paper px-2 py-0.5">
                    <Home size={11} color={colors.inkSubtle} />
                    <AppText className="text-xs text-ink-muted">{a.label}</AppText>
                  </View>
                )}
                {a.isDefault && (
                  <View className="rounded-md border border-leaf-600 px-2 py-0.5">
                    <AppText weight="semibold" className="text-xs text-leaf-700">
                      Mặc định
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        )
      })}
    </BottomSheet>
  )
}
