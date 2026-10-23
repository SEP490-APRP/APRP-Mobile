import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  setDefaultSavedAddress,
  updateSavedAddress,
} from '@/services'
import type { SavedAddress, SavedAddressRequest } from '@/types/address.types'

export const addressKeys = { all: ['addresses'] as const }

export function useSavedAddresses() {
  return useQuery({ queryKey: addressKeys.all, queryFn: getSavedAddresses })
}

/** Địa chỉ mặc định mới làm các địa chỉ khác thôi mặc định. */
const withDefault = (list: SavedAddress[], saved: SavedAddress) =>
  saved.isDefault ? list.map((a) => (a.id === saved.id ? a : { ...a, isDefault: false })) : list

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SavedAddressRequest) => createSavedAddress(data),
    onSuccess: (created) =>
      queryClient.setQueryData<SavedAddress[]>(addressKeys.all, (prev = []) => withDefault([created, ...prev], created)),
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SavedAddressRequest }) => updateSavedAddress(id, data),
    onSuccess: (updated) =>
      queryClient.setQueryData<SavedAddress[]>(addressKeys.all, (prev = []) =>
        withDefault(
          prev.map((a) => (a.id === updated.id ? updated : a)),
          updated,
        ),
      ),
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSavedAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => setDefaultSavedAddress(id),
    onSuccess: (_res, id) =>
      queryClient.setQueryData<SavedAddress[]>(addressKeys.all, (prev = []) => prev.map((a) => ({ ...a, isDefault: a.id === id }))),
  })
}
