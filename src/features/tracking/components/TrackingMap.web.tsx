import { useEffect, useRef } from 'react'
import { MAP_HTML, type MapEvent, type MapState } from './mapHtml'

type Props = {
  state: MapState
  onEvent?: (event: MapEvent) => void
}

/** Bản web: cùng trang Leaflet nhưng đặt trong iframe, trao đổi bằng postMessage. */
export function TrackingMap({ state, onEvent }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const ready = useRef(false)
  const latest = useRef(state)
  latest.current = state
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      const msg = (e.data as { capnongMap?: MapEvent })?.capnongMap
      if (!msg) return
      if (msg.type === 'ready') {
        ready.current = true
        frame.current?.contentWindow?.postMessage(latest.current, '*')
      }
      onEventRef.current?.(msg)
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [])

  useEffect(() => {
    if (ready.current) frame.current?.contentWindow?.postMessage(state, '*')
  }, [state])

  return (
    <iframe
      ref={frame}
      title="Bản đồ theo dõi shipper"
      srcDoc={MAP_HTML}
      style={{ flex: 1, width: '100%', height: '100%', border: 0, backgroundColor: '#eef2ea' }}
    />
  )
}
