import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Platform, Pressable, TextInput, View, type TextInputInstance } from 'react-native'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import { AppText } from './AppText'

export const OTP_LENGTH = 6

export type OtpInputHandle = { focus: () => void; clear: () => void }

/**
 * 6 ô OTP. Thực chất là MỘT TextInput ẩn phía sau 6 ô hiển thị, nên dán cả mã,
 * tự điền từ SMS/email (iOS oneTimeCode, Android sms-otp) và Backspace đều hoạt động
 * tự nhiên — thay cho 6 thẻ <input> + xử lý paste/arrow-key thủ công của bản web.
 */
export const OtpInput = forwardRef<
  OtpInputHandle,
  {
    value: string
    onChange: (value: string) => void
    onComplete?: (value: string) => void
    error?: boolean
    editable?: boolean
  }
>(function OtpInput({ value, onChange, onComplete, error = false, editable = true }, ref) {
  const inputRef = useRef<TextInputInstance>(null)
  const [focused, setFocused] = useState(false)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => onChange(''),
  }))

  const handleChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH)
    onChange(digits)
    if (digits.length === OTP_LENGTH) onComplete?.(digits)
  }

  const activeIndex = Math.min(value.length, OTP_LENGTH - 1)

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="Nhập mã OTP 6 số">
      <View className="flex-row justify-between gap-2">
        {Array.from({ length: OTP_LENGTH }, (_, i) => {
          const digit = value[i] ?? ''
          const isActive = focused && i === activeIndex
          return (
            <View
              key={i}
              className={cn(
                'h-14 flex-1 items-center justify-center rounded-card border-2',
                error
                  ? 'border-sale bg-sale-soft'
                  : digit
                    ? 'border-leaf-700 bg-leaf-50'
                    : isActive
                      ? 'border-leaf-700 bg-white'
                      : 'border-line-strong bg-white',
              )}
            >
              <AppText weight="extrabold" className="text-2xl text-leaf-800">
                {digit}
              </AppText>
            </View>
          )
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        editable={editable}
        maxLength={OTP_LENGTH}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        caretHidden
        // Ẩn nhưng vẫn nhận bàn phím; phủ toàn khối để chạm đâu cũng focus.
        className="absolute inset-0 opacity-0"
        style={{ fontFamily: fontFamily.regular }}
      />
    </Pressable>
  )
})
