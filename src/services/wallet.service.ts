import type { ApiResponse } from '@/types'
import type {
  MyWalletResponse,
  SpringPage,
  WalletResponse,
  WalletTopupCreateRequest,
  WalletTopupResponse,
  WalletTransactionResponse,
  WithdrawRequestResponse,
} from './wallet.types'
import { axiosInstance } from './api/axiosInstance'
import { unwrap } from './api/apiUtils'
import { mockWithdrawRequests } from '@/mocks/wallet.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './wallet.types'

export const walletService = freshResponses({
  async getAllPendingWithdrawRequests(): Promise<ApiResponse<WithdrawRequestResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: mockWithdrawRequests.filter((r) => r.status === 'PENDING') }
  },

  async getAllWithdrawRequests(): Promise<ApiResponse<WithdrawRequestResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: [...mockWithdrawRequests] }
  },

  async getPlatformWallet(): Promise<ApiResponse<WalletResponse>> {
    await new Promise((r) => setTimeout(r, 200))
    return {
      code: 200,
      result: {
        id: 1,
        balance: 185450000,
        totalBalance: 209750000,
        frozenBalance: 24300000,
        totalWithdrawn: 420500000,
        totalDeposited: 630250000,
        commissionEarned: 31512500,
      },
    }
  },

  async confirmTransfer(
    requestId: number,
    noteOrFiles?: any,
    files?: any,
  ): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 350))
    const target = mockWithdrawRequests.find((r) => r.id === requestId)
    if (target) {
      target.status = 'SUCCESS'
      if (typeof noteOrFiles === 'string') {
        target.adminNote = noteOrFiles
      }
      target.processedAt = new Date().toISOString()
    }
    return { code: 200, result: true, message: 'Đã giải ngân lệnh rút tiền thành công' }
  },

  async confirmWithdrawSuccess(
    requestId: number,
    noteOrFiles?: any,
    files?: any,
  ): Promise<ApiResponse<boolean>> {
    return this.confirmTransfer(requestId, noteOrFiles, files)
  },

  async createWithdrawQr(
    requestId: number,
  ): Promise<ApiResponse<{ qrCodeUrl: string; checkoutUrl?: string }>> {
    await new Promise((r) => setTimeout(r, 200))
    const target = mockWithdrawRequests.find((r) => r.id === requestId)
    const amount = target?.amount || 1000000
    const qrUrl = `https://img.vietqr.io/image/VCB-0011004321987-compact2.png?amount=${amount}&addInfo=CapNong%20RutTien%20${requestId}`
    return {
      code: 200,
      result: {
        qrCodeUrl: qrUrl,
        checkoutUrl: qrUrl,
      },
    }
  },

  async rejectWithdraw(
    requestId: number,
    note: string,
    _files?: File[],
  ): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 350))
    const target = mockWithdrawRequests.find((r) => r.id === requestId)
    if (target) {
      target.status = 'REJECTED'
      target.note = note
      target.adminNote = note
      target.processedAt = new Date().toISOString()
    }
    return { code: 200, result: true, message: 'Đã từ chối lệnh rút tiền' }
  },
})

/** Ví và nạp ví thật từ backend (WalletController). Chép từ walletApi của APRP-FE, giữ endpoint */
export const walletApi = {
  /** Ví của người đang đăng nhập (Shipper / Shop) */
  async getMyWallet(): Promise<MyWalletResponse> {
    return unwrap<MyWalletResponse>(await axiosInstance.get('/wallets/me'))
  },
  async getMyTransactions(page = 0, size = 20): Promise<SpringPage<WalletTransactionResponse>> {
    return unwrap<SpringPage<WalletTransactionResponse>>(
      await axiosInstance.get('/wallets/me/transactions', { params: { page, size } }),
    )
  },
  /** Tạo link PayOS nạp tiền vào ví */
  async createTopup(body: WalletTopupCreateRequest): Promise<WalletTopupResponse> {
    return unwrap<WalletTopupResponse>(await axiosInstance.post('/wallets/topups', body))
  },
  async getMyTopups(): Promise<WalletTopupResponse[]> {
    return unwrap<WalletTopupResponse[]>(await axiosInstance.get('/wallets/topups/me'))
  },
  /** Quay lại từ PayOS: BE hỏi PayOS và cộng ví nếu đã trả (gọi nhiều lần an toàn) */
  async confirmTopup(orderCode: string): Promise<WalletTopupResponse> {
    return unwrap<WalletTopupResponse>(await axiosInstance.post(`/wallets/topups/${orderCode}/confirm`))
  },
}

/** Giới hạn nạp ví (khớp capnong.wallet.min-topup / max-topup ở backend) */
export const MIN_TOPUP_AMOUNT = 10_000
export const MAX_TOPUP_AMOUNT = 20_000_000
