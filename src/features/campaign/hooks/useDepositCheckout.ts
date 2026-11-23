import { useQueryClient } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { campaignService, type PreOrderResponse } from '@/services'
import { campaignKeys } from './useCampaignQueries'

const RETURN_PATH = '/buyer/pre-orders'

/**
 * Cọc đơn đặt trước qua PayOS: mở link trong trình duyệt của app, khi người dùng quay lại thì hỏi BE
 * xác nhận cọc (BE hỏi PayOS). Đóng trình duyệt giữa chừng vẫn hỏi lại vì có thể đã chuyển khoản bằng app ngân hàng.
 */
export function useDepositCheckout() {
  const qc = useQueryClient()
  return async (preOrder: Pick<PreOrderResponse, 'preOrderId' | 'checkoutUrl'>): Promise<PreOrderResponse | null> => {
    if (preOrder.checkoutUrl) {
      if (Platform.OS === 'web') {
        window.location.assign(preOrder.checkoutUrl)
        return null
      }
      await WebBrowser.openAuthSessionAsync(preOrder.checkoutUrl, Linking.createURL(RETURN_PATH)).catch(() => null)
    }
    const checked = await campaignService.confirmDepositPayment(preOrder.preOrderId).catch(() => null)
    await qc.invalidateQueries({ queryKey: campaignKeys.myPreOrders() })
    await qc.invalidateQueries({ queryKey: campaignKeys.all })
    return checked
  }
}
