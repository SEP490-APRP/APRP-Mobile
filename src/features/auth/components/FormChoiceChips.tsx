import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { ChoiceChips, type Choice } from '@/components/ui'

export function FormChoiceChips<T extends FieldValues>({
  control,
  name,
  label,
  options,
}: {
  control: Control<T>
  name: Path<T>
  label: string
  options: readonly Choice[]
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <ChoiceChips label={label} options={options} value={value ?? ''} onChange={onChange} />
      )}
    />
  )
}
