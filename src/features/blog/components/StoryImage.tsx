import { Image } from 'expo-image'
import { useState } from 'react'

const FALLBACK = require('../../../../assets/images/hero-farmer.jpg')

/** Ảnh bìa bài viết; thiếu link hoặc lỗi tải thì dùng ảnh nhà vườn mặc định. */
export function StoryImage({ uri, alt }: { uri?: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <Image
      source={uri && !failed ? { uri } : FALLBACK}
      onError={() => setFailed(true)}
      accessibilityLabel={alt}
      contentFit="cover"
      transition={150}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
