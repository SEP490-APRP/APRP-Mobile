import { useMemo } from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import { qrPath } from '../utils/crates'

/** Ô trắng quanh mã để máy quét đọc được */
const QUIET = 2

export function QrCode({ value, size, label }: { value: string; size: number; label: string }) {
  const qr = useMemo(() => qrPath(value), [value])
  const side = qr.size + QUIET * 2
  return (
    <Svg width={size} height={size} viewBox={`${-QUIET} ${-QUIET} ${side} ${side}`} accessibilityLabel={label}>
      <Rect x={-QUIET} y={-QUIET} width={side} height={side} fill="#ffffff" />
      <Path d={qr.d} fill="#000000" />
    </Svg>
  )
}
