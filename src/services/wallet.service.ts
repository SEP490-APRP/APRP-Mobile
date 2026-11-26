import type { ApiResponse } from '@/types'
import { axiosInstance } from './api/axiosInstance'
import type {
  MyWalletResponse,
  SpringPage,
  WalletResponse,
  WalletTopupCreateRequest,
  WalletTopupResponse,
  WalletTransactionResponse,
  WithdrawCreateRequest,
  WithdrawRequestResponse,
  WithdrawResponse,
  WithdrawStatus,
} from './wallet.types'

export type * from './wallet.types'

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if (
      'data' in res &&
      (res as { data: unknown }).data &&
      typeof (res as { data: unknown }).data === 'object' &&
      'result' in (res as { data: { result: unknown } }).data
    ) {
      return (res as { data: ApiResponse<T> }).data.result as T
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result as T
    }
  }
  return res as T
}

export const walletService = {
  async getOrderSettlement(orderId: number) {
    const res = await axiosInstance.get(`/wallets/orders/${orderId}/settlement`)
    return unwrap<any>(res)
  },
  /** Lấy thông tin ví của user đang đăng nhập (Shop, Shipper...) GET /wallets/me */
  async getMyWallet(): Promise<ApiResponse<MyWalletResponse>> {
    const res = await axiosInstance.get('/wallets/me')
    return { code: 200, result: unwrap<MyWalletResponse>(res) }
  },

  /** Lịch sử biến động số dư GET /wallets/me/transactions */
  async getMyTransactions(page = 0, size = 20): Promise<ApiResponse<SpringPage<WalletTransactionResponse>>> {
    const res = await axiosInstance.get('/wallets/me/transactions', { params: { page, size } })
    return { code: 200, result: unwrap<SpringPage<WalletTransactionResponse>>(res) }
  },

  /** Gửi yêu cầu rút tiền POST /wallets/withdrawals */
  async requestWithdraw(body: WithdrawCreateRequest): Promise<ApiResponse<WithdrawResponse>> {
    const payload = {
      amount: body.amount,
      bankName: body.bankName,
      bankAccountNumber: body.bankAccountNumber,
      bankAccountHolder: body.bankAccountHolder || body.bankAccountName,
      bankAccountName: body.bankAccountName || body.bankAccountHolder,
      note: body.note,
    }
    const res = await axiosInstance.post('/wallets/withdrawals', payload)
    return { code: 200, result: unwrap<WithdrawResponse>(res) }
  },

  /** Danh sách yêu cầu rút tiền của tôi GET /wallets/withdrawals/me */
  async getMyWithdrawals(): Promise<ApiResponse<WithdrawResponse[]>> {
    try {
      const res = await axiosInstance.get('/wallets/withdrawals/me')
      const data = unwrap<any[]>(res)
      if (Array.isArray(data)) {
        return {
          code: 200,
          result: data.map((r) => ({
            id: r.id,
            walletId: r.walletId || 1,
            userId: r.userId || 1,
            amount: r.amount,
            status: (r.status === 'SUCCESS' ? 'COMPLETED' : r.status) as WithdrawStatus,
            bankName: r.bankName,
            bankAccountNumber: r.bankAccountNumber,
            bankAccountName: r.bankAccountHolder || r.bankAccountName || '',
            bankAccountHolder: r.bankAccountHolder || r.bankAccountName || '',
            note: r.note,
            adminNote: r.adminNote,
            createdAt: r.createdAt,
            processedAt: r.processedAt,
          })),
        }
      }
      return { code: 200, result: [] }
    } catch {
      return { code: 200, result: [] }
    }
  },

  // Legacy admin / platform helpers
  async getAllPendingWithdrawRequests(): Promise<ApiResponse<WithdrawRequestResponse[]>> {
    const res = await axiosInstance.get('/wallets/withdrawals', { params: { status: 'PENDING' } })
    return { code: 200, result: unwrap<WithdrawRequestResponse[]>(res) }
  },

  async getAllWithdrawRequests(): Promise<ApiResponse<WithdrawRequestResponse[]>> {
    const res = await axiosInstance.get('/wallets/withdrawals')
    return { code: 200, result: unwrap<WithdrawRequestResponse[]>(res) }
  },

  async getPlatformWallet(): Promise<ApiResponse<WalletResponse>> {
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

  async confirmTransfer(requestId: number, noteOrFiles?: any): Promise<ApiResponse<boolean>> {
    return { code: 200, result: true, message: 'Đã giải ngân lệnh rút tiền thành công' }
  },

  async confirmWithdrawSuccess(requestId: number, noteOrFiles?: any): Promise<ApiResponse<boolean>> {
    return this.confirmTransfer(requestId, noteOrFiles)
  },

  async createWithdrawQr(requestId: number): Promise<ApiResponse<{ qrCodeUrl: string; checkoutUrl?: string }>> {
    const qrUrl = `https://img.vietqr.io/image/VCB-0011004321987-compact2.png?amount=1000000&addInfo=CapNong%20RutTien%20${requestId}`
    return { code: 200, result: { qrCodeUrl: qrUrl, checkoutUrl: qrUrl } }
  },

  async rejectWithdraw(requestId: number, note: string): Promise<ApiResponse<boolean>> {
    return { code: 200, result: true, message: 'Đã từ chối lệnh rút tiền' }
  },
}

export const MIN_WITHDRAW_AMOUNT = 50_000

export const VN_BANKS: { code: string; name: string }[] = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'VBA', name: 'Agribank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'SEAB', name: 'SeABank' },
]

export const VIETNAM_BANKS = VN_BANKS

export const WITHDRAW_STATUS_LABEL: Record<WithdrawStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Chờ duyệt', color: '#b45309', bg: '#fef3c7' },
  COMPLETED: { label: 'Đã chuyển tiền', color: '#15803d', bg: '#dcfce7' },
  SUCCESS: { label: 'Thành công', color: '#15803d', bg: '#dcfce7' },
  REJECTED: { label: 'Bị từ chối', color: '#dc2626', bg: '#fee2e2' },
}

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
  /** Yêu cầu rút tiền về tài khoản ngân hàng (Shop / Shipper / Buyer) */
  async requestWithdraw(body: WithdrawCreateRequest): Promise<WithdrawResponse> {
    const payload = {
      amount: body.amount,
      bankName: body.bankName,
      bankAccountNumber: body.bankAccountNumber,
      bankAccountHolder: body.bankAccountHolder || body.bankAccountName,
      note: body.note,
    }
    return unwrap<WithdrawResponse>(await axiosInstance.post('/wallets/withdrawals', payload))
  },
  /** Danh sách yêu cầu rút tiền của user hiện tại */
  async getMyWithdrawals(): Promise<WithdrawResponse[]> {
    return unwrap<WithdrawResponse[]>(await axiosInstance.get('/wallets/withdrawals/me'))
  },
}

/** Giới hạn nạp ví (khớp capnong.wallet.min-topup / max-topup ở backend) */
export const MIN_TOPUP_AMOUNT = 10_000
export const MAX_TOPUP_AMOUNT = 20_000_000

/** Tên cũ, giữ để tương thích: trỏ về walletApi */
export const myWalletApi = walletApi
