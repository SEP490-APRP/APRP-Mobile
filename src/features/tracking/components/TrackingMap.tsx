import { useEffect, useRef, type ComponentType, type Ref } from 'react'
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview'
import { MAP_HTML, type MapEvent, type MapState } from './mapHtml'

type WebViewHandle = { injectJavaScript: (script: string) => void }

// Kiểu props của react-native-webview 14 gộp props iOS/Android/Windows thành `never`
// với typings RN 0.88, nên khai báo lại phần props màn hình này dùng.
const WebView = RNWebView as unknown as ComponentType<{
  ref?: Ref<WebViewHandle>
  originWhitelist: string[]
  source: { html: string; baseUrl?: string }
  onMessage: (e: WebViewMessageEvent) => void
  onError?: () => void
  javaScriptEnabled?: boolean
  domStorageEnabled?: boolean
  scrollEnabled?: boolean
  overScrollMode?: 'always' | 'content' | 'never'
  setSupportMultipleWindows?: boolean
  style?: object
}>

type Props = {
  state: MapState
  onEvent?: (event: MapEvent) => void
}

/** Bản đồ Leaflet trong WebView; mỗi lần state đổi thì đẩy xuống trang qua injectJavaScript. */
export function TrackingMap({ state, onEvent }: Props) {
  const ref = useRef<WebViewHandle>(null)
  const ready = useRef(false)
  const latest = useRef(state)
  latest.current = state

  const push = (s: MapState) => {
    if (!ready.current) return
    ref.current?.injectJavaScript(`window.__capnong && window.__capnong(${JSON.stringify(s)}); true;`)
  }

  useEffect(() => {
    push(state)
  }, [state])

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: MapEvent
    try {
      msg = JSON.parse(e.nativeEvent.data) as MapEvent
    } catch {
      return
    }
    if (msg.type === 'ready') {
      ready.current = true
      push(latest.current)
    }
    onEvent?.(msg)
  }

  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html: MAP_HTML, baseUrl: 'https://capnong.local/' }}
      onMessage={onMessage}
      onError={() => onEvent?.({ type: 'error', message: 'Không mở được bản đồ' })}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      overScrollMode="never"
      setSupportMultipleWindows={false}
      style={{ flex: 1, backgroundColor: '#eef2ea' }}
    />
  )
}
