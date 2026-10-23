export interface SavedAddress {
  id: number
  label?: string // e.g., "Nhà", "Công ty", "Nhà bố mẹ"
  recipientName: string
  phone: string
  address: string
  latitude?: number
  longitude?: number
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SavedAddressRequest {
  label?: string
  recipientName: string
  phone: string
  address: string
  latitude?: number
  longitude?: number
  isDefault?: boolean
}
