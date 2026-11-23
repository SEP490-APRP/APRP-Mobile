export interface StockShortageItem {
  itemType: 'PRODUCT' | 'MYSTERY_BOX' | 'BUILD_COMBO' | 'GENERAL'
  id?: number
  itemName: string
  imageUrl?: string
  requestedQuantity?: number
  availableQuantity?: number
}

export function parseStockShortages(err: any): StockShortageItem[] {
  // 1. Đọc từ trường result cấu trúc do Backend trả về
  const resultData = err?.data?.result ?? err?.response?.data?.result
  if (Array.isArray(resultData) && resultData.length > 0) {
    return resultData.map((item: any) => ({
      itemType: (item.itemType as any) || 'GENERAL',
      id: item.id,
      itemName: item.itemName || item.name || 'Mặt hàng',
      imageUrl: item.imageUrl,
      requestedQuantity: typeof item.requestedQuantity === 'number' ? item.requestedQuantity : undefined,
      availableQuantity: typeof item.availableQuantity === 'number' ? item.availableQuantity : 0,
    }))
  }

  // 2. Parse từ chuỗi message của Backend
  const message: string =
    err?.data?.message ||
    err?.response?.data?.message ||
    err?.message ||
    ''

  const items: StockShortageItem[] = []
  const lines = message.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Mẫu bullet: • [Loại] "Tên": Kho còn X, bạn đặt Y
    const bulletMatch = line.match(/^•\s*\[(.*?)\]\s*"([^"]+)"(?::\s*Kho còn\s*(\d+))?,?\s*(?:bạn đặt\s*(\d+))?/i)
    if (bulletMatch) {
      const typeStr = bulletMatch[1].toLowerCase()
      let itemType: StockShortageItem['itemType'] = 'GENERAL'
      if (typeStr.includes('hộp bí ẩn') || typeStr.includes('mystery')) itemType = 'MYSTERY_BOX'
      else if (typeStr.includes('combo')) itemType = 'BUILD_COMBO'
      else if (typeStr.includes('sản phẩm')) itemType = 'PRODUCT'

      items.push({
        itemType,
        itemName: bulletMatch[2],
        availableQuantity: bulletMatch[3] !== undefined ? parseInt(bulletMatch[3], 10) : undefined,
        requestedQuantity: bulletMatch[4] !== undefined ? parseInt(bulletMatch[4], 10) : undefined,
      })
      continue
    }

    // Mẫu 1 dòng đơn: Sản phẩm "Tên" trong kho chỉ còn X (bạn đặt Y)...
    const singleMatch = line.match(
      /^(Sản phẩm|Hộp bí ẩn|Gói Combo)\s*"([^"]+)"\s*trong kho chỉ còn\s*(\d+)\s*\(bạn đặt\s*(\d+)\)/i,
    )
    if (singleMatch) {
      const typeStr = singleMatch[1].toLowerCase()
      let itemType: StockShortageItem['itemType'] = 'GENERAL'
      if (typeStr.includes('hộp bí ẩn') || typeStr.includes('mystery')) itemType = 'MYSTERY_BOX'
      else if (typeStr.includes('combo')) itemType = 'BUILD_COMBO'
      else if (typeStr.includes('sản phẩm')) itemType = 'PRODUCT'

      items.push({
        itemType,
        itemName: singleMatch[2],
        availableQuantity: parseInt(singleMatch[3], 10),
        requestedQuantity: parseInt(singleMatch[4], 10),
      })
    }
  }

  return items
}

export function isStockShortageError(err: any): boolean {
  const code = err?.data?.code ?? err?.response?.data?.code
  if (code === 5015 || code === 8002) return true
  const msg = (err?.data?.message || err?.response?.data?.message || err?.message || '').toLowerCase()
  return (
    msg.includes('kho') ||
    msg.includes('stock') ||
    msg.includes('không đủ số lượng') ||
    msg.includes('hết hàng') ||
    msg.includes('hộp bí ẩn') ||
    msg.includes('combo')
  )
}

