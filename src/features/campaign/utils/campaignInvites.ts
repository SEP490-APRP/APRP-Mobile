import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CampaignResponse, NotificationItem } from '@/services'

/** Lời mời góp hàng CapNong (Admin) gửi qua thông báo (không có bảng riêng) */
export type CampaignInvite = { notiId: number; message: string | null; campaign: CampaignResponse }

const INVITE_TITLE = 'CapNong mời bạn góp hàng cho chiến dịch giải cứu'

/**
 * Đọc lời mời từ thông báo: thông báo mới có type CAMPAIGN_INVITE + referenceId = mã chiến dịch;
 * thông báo cũ chỉ có tiêu đề, nên dò tên chiến dịch trong nội dung. Mỗi chiến dịch giữ lời mời mới nhất.
 */
export function invitesFromNotifications(notis: NotificationItem[], calls: CampaignResponse[]): CampaignInvite[] {
  const out = new Map<number, CampaignInvite>()
  const sorted = [...notis].sort((a, b) => (b.notiId ?? b.id) - (a.notiId ?? a.id))
  for (const n of sorted) {
    if (n.type !== 'CAMPAIGN_INVITE' && n.title !== INVITE_TITLE) continue
    const title = /Chiến dịch "(.+?)" cần/.exec(n.message ?? '')?.[1]
    const c = calls.find((x) => (n.referenceId != null ? x.campaignId === n.referenceId : x.title === title))
    if (!c || out.has(c.campaignId)) continue
    const note = (n.message ?? '').split('Lời nhắn: ')[1]?.trim() || null
    out.set(c.campaignId, { notiId: n.notiId ?? n.id, message: note, campaign: c })
  }
  return [...out.values()]
}

const DECLINED_KEY = 'capnong.campaignInvites.declined'

/** Lời mời đã từ chối lưu trên máy (giống localStorage bản web) */
export async function readDeclinedInvites(): Promise<Set<number>> {
  try {
    const raw = await AsyncStorage.getItem(DECLINED_KEY)
    return new Set(raw ? (JSON.parse(raw) as number[]) : [])
  } catch {
    return new Set()
  }
}

export async function markInviteDeclined(notiId: number) {
  const set = await readDeclinedInvites()
  set.add(notiId)
  try {
    await AsyncStorage.setItem(DECLINED_KEY, JSON.stringify([...set].slice(-300)))
  } catch {
    // Máy chặn lưu: lời mời có thể hiện lại
  }
}
