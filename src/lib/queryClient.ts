import NetInfo from '@react-native-community/netinfo'
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query'
import { AppState, Platform } from 'react-native'

/**
 * Giữ cấu hình của bản web (staleTime 30s, thử lại 1 lần, không tự tải lại khi quay lại).
 * Trên mobile, "focus" nghĩa là app trở lại foreground, nên vẫn tắt refetch theo focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** react-query không tự biết trạng thái mạng/foreground trên React Native; nối vào đây. */
export function setupReactQueryForMobile(): () => void {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
  )
  const sub = AppState.addEventListener('change', (status) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active')
  })
  return () => sub.remove()
}
