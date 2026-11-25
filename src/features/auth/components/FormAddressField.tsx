import { useEffect, useState, type Ref } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Pressable, View, type TextInputInstance } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { AppText, TextField, type TextFieldProps } from '@/components/ui'
import { getAddressSuggestions, type AddressSuggestion } from '@/services'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

function AddressFieldInput({
  value,
  onChange,
  onBlur,
  error,
  inputRef,
  ...props
}: Omit<TextFieldProps, 'value' | 'onChangeText' | 'error' | 'onChange' | 'onBlur'> & {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  error?: string
  inputRef?: Ref<TextInputInstance>
}) {
  const [typing, setTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])

  useEffect(() => {
    const trimmed = (value ?? '').trim()
    if (!typing || trimmed.length < 2) {
      setSuggestions([])
      return
    }
    let alive = true
    const t = setTimeout(() => {
      getAddressSuggestions(trimmed).then((list) => {
        if (alive) {
          setSuggestions(list.slice(0, 5))
        }
      })
    }, 400)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [value, typing])

  return (
    <View className="gap-1">
      <TextField
        ref={inputRef}
        value={value}
        onChangeText={(v) => {
          setTyping(true)
          onChange(v)
        }}
        onBlur={() => {
          setTimeout(() => setTyping(false), 200)
          onBlur?.()
        }}
        error={error}
        {...props}
      />
      {typing && suggestions.length > 0 && (
        <View className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {suggestions.map((s, i) => (
            <Pressable
              key={s.placeId || `${s.description}-${i}`}
              onPress={() => {
                setTyping(false)
                setSuggestions([])
                onChange(s.description)
              }}
              accessibilityRole="button"
              className={cn(
                'min-h-[44px] flex-row items-center gap-2 px-3 py-2 active:bg-leaf-50',
                i > 0 && 'border-t border-line',
              )}
            >
              <MapPin size={15} color={colors.inkSubtle} />
              <AppText numberOfLines={2} className="flex-1 text-sm text-ink">
                {s.description}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

/** TextField có tích hợp gợi ý địa chỉ từ Google Places API (tương tự như màn Checkout/AddressForm). */
export function FormAddressField<T extends FieldValues>({
  control,
  name,
  inputRef,
  ...props
}: Omit<TextFieldProps, 'value' | 'onChangeText' | 'error' | 'onChange' | 'onBlur'> & {
  control: Control<T>
  name: Path<T>
  inputRef?: Ref<TextInputInstance>
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <AddressFieldInput
          inputRef={inputRef}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...props}
        />
      )}
    />
  )
}
