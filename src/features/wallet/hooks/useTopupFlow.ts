import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { useUiStore } from '@/stores'
import { getErrorMessage } from '@/utils/errors'
import { parsePayosReturn } from '@/features/checkout/utils/payosReturn'
import { useConfirmTopup, useCreateTopup } from './useWalletQueries'

const RETURN_PATH = '/shipper/wallet'

/**
 * Nạp ví: tạo link PayOS, mở trong trình duyệt của app (như checkout), quay lại thì hỏi BE xác nhận.
 * Người dùng đóng trình duyệt giữa chừng vẫn hỏi lại (có thể đã chuyển khoản bằng app ngân hàng).
 */
export function useTopupFlow() {
  const create = useCreateTopup()
  const confirm = useConfirmTopup()
  const showToast = useUiStore((s) => s.showToast)

  const start = async (amount: number): Promise<boolean> => {
    const returnUrl = Linking.createURL(RETURN_PATH)
    try {
      const topup = await create.mutateAsync({ amount, returnUrl, cancelUrl: returnUrl })
      if (!topup.checkoutUrl) return false
      if (Platform.OS === 'web') {
        window.location.assign(topup.checkoutUrl)
        return true
      }
      const result = await WebBrowser.openAuthSessionAsync(topup.checkoutUrl, returnUrl)
      const back = result.type === 'success' ? parsePayosReturn(result.url) : { orderCode: topup.orderCode, cancelled: false }
      const checked = await confirm.mutateAsync(back.orderCode ?? topup.orderCode)
      if (checked.status === 'PAID') showToast('Đã nạp tiền vào ví.')
      else if (checked.status === 'CANCELLED' || back.cancelled) showToast('Đã huỷ nạp tiền, ví không thay đổi.')
      else showToast('Đang chờ PayOS xác nhận. Kéo xuống để tải lại sau ít phút.')
      return checked.status === 'PAID'
    } catch (err) {
      showToast(getErrorMessage(err, 'Không nạp được tiền. Vui lòng thử lại.'))
      return false
    }
  }

  return { start, isPending: create.isPending || confirm.isPending }
}
