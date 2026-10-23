import axiosInstance from '@/services/api/axiosInstance'
import type { SavedAddress, SavedAddressRequest } from '@/types/address.types'

interface ApiResponse<T> {
  code: number
  message?: string
  result: T
}

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if ('data' in res && (res as { data: unknown }).data && typeof (res as { data: unknown }).data === 'object' && 'result' in (res as { data: { result: unknown } }).data) {
      return ((res as { data: ApiResponse<T> }).data).result
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result
    }
  }
  return res as T
}

export async function getSavedAddresses(): Promise<SavedAddress[]> {
  try {
    const res = await axiosInstance.get('/addresses')
    return unwrap<SavedAddress[]>(res) || []
  } catch (error) {
    console.error('Lỗi lấy danh sách địa chỉ:', error)
    return []
  }
}

export async function createSavedAddress(data: SavedAddressRequest): Promise<SavedAddress> {
  const res = await axiosInstance.post('/addresses', data)
  return unwrap<SavedAddress>(res)
}

export async function updateSavedAddress(id: number, data: SavedAddressRequest): Promise<SavedAddress> {
  const res = await axiosInstance.put(`/addresses/${id}`, data)
  return unwrap<SavedAddress>(res)
}

export async function deleteSavedAddress(id: number): Promise<void> {
  await axiosInstance.delete(`/addresses/${id}`)
}

export async function setDefaultSavedAddress(id: number): Promise<SavedAddress> {
  const res = await axiosInstance.patch(`/addresses/${id}/default`)
  return unwrap<SavedAddress>(res)
}
