import { MapPin, Phone, User } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, Checkbox, ChoiceChips, TextField } from '@/components/ui'
import { getAddressSuggestions, type AddressSuggestion } from '@/services'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { ADDRESS_LABELS, type AddressDraft, type AddressErrors } from '../utils/addressDraft'

const LABEL_OPTIONS = ADDRESS_LABELS.map((l) => ({ value: l, label: l }))

/** Gợi ý địa chỉ từ BE (Places), gọi sau khi ngừng gõ 400ms. */
function useAddressSuggestions(input: string, enabled: boolean) {
  const [items, setItems] = useState<AddressSuggestion[]>([])
  useEffect(() => {
    if (!enabled || input.trim().length < 3) {
      setItems([])
      return
    }
    let alive = true
    const t = setTimeout(() => {
      getAddressSuggestions(input).then((list) => alive && setItems(list.slice(0, 5)))
    }, 400)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [input, enabled])
  return items
}

/** Các ô của một địa chỉ nhận hàng, dùng chung cho bước thanh toán và Sổ địa chỉ. */
export function AddressForm({
  draft,
  errors,
  onChange,
  /** Địa chỉ đầu tiên luôn là mặc định nên khoá ô chọn */
  lockDefault = false,
}: {
  draft: AddressDraft
  errors: AddressErrors
  onChange: (next: AddressDraft) => void
  lockDefault?: boolean
}) {
  const [typing, setTyping] = useState(false)
  const suggestions = useAddressSuggestions(draft.address, typing)
  const set = (key: keyof AddressDraft) => (value: string) => onChange({ ...draft, [key]: value })

  return (
    <>
      <ChoiceChips label="Loại địa chỉ" options={LABEL_OPTIONS} value={draft.label} onChange={set('label')} />
      <TextField
        label="Tên người nhận"
        icon={User}
        value={draft.recipientName}
        onChangeText={set('recipientName')}
        error={errors.recipientName}
        autoComplete="name"
      />
      <TextField
        label="Số điện thoại"
        icon={Phone}
        value={draft.phone}
        onChangeText={set('phone')}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <View className="gap-1">
        <TextField
          label="Địa chỉ nhận hàng"
          icon={MapPin}
          value={draft.address}
          onChangeText={(v) => {
            setTyping(true)
            set('address')(v)
          }}
          error={errors.address}
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh"
          multiline
        />
        {suggestions.length > 0 && (
          <View className="overflow-hidden rounded-xl border border-line bg-white">
            {suggestions.map((s, i) => (
              <Pressable
                key={s.placeId}
                onPress={() => {
                  setTyping(false)
                  set('address')(s.description)
                }}
                accessibilityRole="button"
                className={cn('min-h-[44px] flex-row items-center gap-2 px-3 py-2 active:bg-leaf-50', i > 0 && 'border-t border-line')}
              >
                <MapPin size={15} color={colors.inkSubtle} />
                <AppText numberOfLines={2} className="flex-1 text-sm">
                  {s.description}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <View className="-ml-3 flex-row items-center">
        <Checkbox
          checked={draft.isDefault || lockDefault}
          disabled={lockDefault}
          onChange={() => onChange({ ...draft, isDefault: !draft.isDefault })}
          label="Đặt làm địa chỉ mặc định"
        />
        <AppText className="text-sm">Đặt làm địa chỉ mặc định</AppText>
      </View>
    </>
  )
}
