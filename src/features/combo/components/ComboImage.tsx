import { Image } from 'expo-image'
import { useState } from 'react'
import type { ComboKind } from '../utils/comboCards'

const FALLBACK = {
  MYSTERY_BOX: require('../../../../assets/images/combo-mystery.jpg'),
  BUILD_COMBO: require('../../../../assets/images/combo-green.jpg'),
} as const

/** Ảnh combo / túi mù; thiếu link hoặc lỗi tải thì dùng ảnh minh hoạ theo loại, như bản web. */
export function ComboImage({ uri, kind, alt }: { uri?: string; kind: ComboKind; alt: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <Image
      source={uri && !failed ? { uri } : FALLBACK[kind]}
      onError={() => setFailed(true)}
      accessibilityLabel={alt}
      contentFit="cover"
      transition={150}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
