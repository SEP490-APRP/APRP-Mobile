import type { Ref } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import type { TextInputInstance } from 'react-native'
import { TextField, type TextFieldProps } from '@/components/ui'

/** TextField nối với react-hook-form: lỗi zod hiện ngay dưới từng ô. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  inputRef,
  ...props
}: Omit<TextFieldProps, 'value' | 'onChangeText' | 'error'> & {
  control: Control<T>
  name: Path<T>
  /** Ref để chuyển focus sang ô này khi bấm "Tiếp" trên bàn phím */
  inputRef?: Ref<TextInputInstance>
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <TextField
          ref={inputRef}
          value={value ?? ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...props}
        />
      )}
    />
  )
}
