import { useEffect, useState } from 'react'
import { AppText, BottomSheet, Button } from '@/components/ui'
import type { SavedAddress } from '@/types/address.types'
import { getErrorMessage } from '@/utils/errors'
import { useCreateAddress, useUpdateAddress } from '../hooks/useAddressQueries'
import {
  draftFromAddress,
  toAddressRequest,
  validateAddressDraft,
  type AddressDraft,
  type AddressErrors,
} from '../utils/addressDraft'
import { AddressForm } from './AddressForm'

/**
 * Tấm thêm / sửa địa chỉ. `editing` có giá trị là sửa, không thì thêm mới với tên, số điện thoại
 * điền sẵn từ hồ sơ.
 */
export function AddressFormSheet({
  visible,
  editing,
  defaults,
  isFirst,
  saveLabel = 'Lưu địa chỉ',
  backLabel,
  onBack,
  onSaved,
  onClose,
}: {
  visible: boolean
  editing: SavedAddress | null
  defaults: { recipientName: string; phone: string }
  /** Sổ còn trống: địa chỉ này bắt buộc là mặc định */
  isFirst: boolean
  saveLabel?: string
  /** Nút phụ bên trái (VD "Quay lại" danh sách) */
  backLabel?: string
  onBack?: () => void
  onSaved: (address: SavedAddress) => void
  onClose: () => void
}) {
  const create = useCreateAddress()
  const update = useUpdateAddress()
  const [draft, setDraft] = useState<AddressDraft>({ label: 'Nhà', recipientName: '', phone: '', address: '', isDefault: false })
  const [errors, setErrors] = useState<AddressErrors>({})

  useEffect(() => {
    if (!visible) return
    setDraft(editing ? draftFromAddress(editing) : { label: 'Nhà', ...defaults, address: '', isDefault: isFirst })
    setErrors({})
    create.reset()
    update.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing])

  const mutation = editing ? update : create
  const save = () => {
    const next = validateAddressDraft(draft)
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const data = { ...toAddressRequest(draft), isDefault: draft.isDefault || isFirst }
    const done = { onSuccess: (saved: SavedAddress) => onSaved(saved) }
    if (editing) update.mutate({ id: editing.id, data }, done)
    else create.mutate(data, done)
  }

  return (
    <BottomSheet
      visible={visible}
      title={editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
      onClose={onClose}
      footer={
        <>
          {backLabel && onBack && <Button title={backLabel} variant="outline" onPress={onBack} className="flex-1" />}
          <Button title={saveLabel} loading={mutation.isPending} onPress={save} className="flex-[2]" />
        </>
      }
    >
      <AddressForm draft={draft} errors={errors} onChange={setDraft} lockDefault={isFirst} />
      {mutation.isError && (
        <AppText className="text-sm text-sale">{getErrorMessage(mutation.error, 'Không thể lưu địa chỉ.')}</AppText>
      )}
    </BottomSheet>
  )
}
