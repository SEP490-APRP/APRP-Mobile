import { router } from 'expo-router'
import { ClipboardList, Lightbulb, Megaphone, Sprout, XCircle, type LucideIcon } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { AppText, BottomSheet, Button, EmptyState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  CallCard,
  invitesFromNotifications,
  openingText,
  registrationOpen,
  markInviteDeclined,
  Notice,
  ProposalsPanel,
  readDeclinedInvites,
  RegisterLotSheet,
  RegistrationCard,
  useCampaignInviteNotifications,
  useMyRegistrations,
  useOpenFarmCalls,
  useProposalInvites,
  type CampaignInvite,
} from '@/features/campaign'
import { fmtDate, formatKg, formatVnd } from '@/features/campaign/utils/campaignFormat'
import { notificationService, type CampaignResponse, type FarmRegistrationResponse } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

type View_ = 'calls' | 'mine' | 'propose'

/** Kênh Nhà Vườn › Chiến dịch giải cứu (pages/farmer/Campaigns.tsx): lời kêu gọi, lô của tôi, đề xuất chiến dịch */
export default function ShopCampaignsScreen() {
  const qc = useQueryClient()
  const showToast = useUiStore((s) => s.showToast)
  const [view, setView] = useState<View_>('calls')
  const [registering, setRegistering] = useState<CampaignResponse | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const calls = useOpenFarmCalls()
  const mine = useMyRegistrations()
  const invites = useProposalInvites()
  const notis = useCampaignInviteNotifications()
  const [declined, setDeclined] = useState<Set<number>>(new Set())
  const [invitePopup, setInvitePopup] = useState(false)
  const [popupShown, setPopupShown] = useState(false)

  useEffect(() => {
    void readDeclinedInvites().then(setDeclined)
  }, [])

  const pendingProposalInvites = (invites.data ?? []).filter((p) => p.myInvite?.status === 'PENDING')

  // Một shop có thể góp nhiều lô vào cùng chiến dịch
  const myByCampaign = useMemo(() => {
    const m = new Map<number, FarmRegistrationResponse[]>()
    for (const r of [...(mine.data ?? [])].reverse()) m.set(r.campaignId, [...(m.get(r.campaignId) ?? []), r])
    return m
  }, [mine.data])

  // Lời mời góp hàng của CapNong: chỉ chiến dịch đang mở, shop chưa góp và chưa từ chối
  const adminInvites = useMemo(
    () =>
      invitesFromNotifications(notis.data ?? [], calls.data ?? []).filter(
        (i) => !declined.has(i.notiId) && !myByCampaign.has(i.campaign.campaignId),
      ),
    [notis.data, calls.data, declined, myByCampaign],
  )
  const invitedIds = new Set(adminInvites.map((i) => i.campaign.campaignId))

  // Tự bật popup một lần mỗi lần mở màn khi có lời mời
  useEffect(() => {
    if (!popupShown && adminInvites.length > 0) {
      setInvitePopup(true)
      setPopupShown(true)
    }
  }, [adminInvites.length, popupShown])

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([calls.refetch(), mine.refetch(), invites.refetch(), notis.refetch()])
    setRefreshing(false)
  }

  const decline = async (inv: CampaignInvite) => {
    await markInviteDeclined(inv.notiId)
    setDeclined((s) => new Set(s).add(inv.notiId))
    try {
      await notificationService.markAsRead(inv.notiId)
    } catch {
      // không chặn việc từ chối
    }
    void qc.invalidateQueries({ queryKey: ['notifications'] })
    showToast('Đã từ chối lời mời góp hàng.')
  }

  const tabs: { id: View_; icon: LucideIcon; title: string; desc: string; n: number | null; alert: number }[] = [
    { id: 'calls', icon: Megaphone, title: 'Đang kêu gọi', desc: 'Chiến dịch đang cần hàng', n: calls.data?.length ?? 0, alert: adminInvites.length },
    { id: 'mine', icon: ClipboardList, title: 'Lô của tôi', desc: 'Duyệt, cân hàng, chi trả', n: mine.data?.length ?? 0, alert: 0 },
    { id: 'propose', icon: Lightbulb, title: 'Đề xuất', desc: 'Tự đề xuất, rủ shop', n: null, alert: pendingProposalInvites.length },
  ]

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-2">
        <BackButton />
        <AppText weight="extrabold" className="flex-1 text-lg">
          Chiến dịch giải cứu
        </AppText>
      </View>
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />}
      >
        <View className="flex-row gap-2">
          {tabs.map(({ id, icon: Icon, title, desc, n, alert }) => {
            const on = view === id
            return (
              <Pressable
                key={id}
                onPress={() => setView(id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                className={cn('flex-1 gap-1.5 rounded-2xl border-2 p-3', on ? 'border-leaf-700 bg-leaf-50' : 'border-line bg-white')}
              >
                <View className="flex-row items-center justify-between">
                  <View className={cn('h-8 w-8 items-center justify-center rounded-xl', on ? 'bg-leaf-700' : 'bg-leaf-50')}>
                    <Icon size={16} color={on ? colors.white : colors.leaf700} />
                  </View>
                  {alert > 0 ? (
                    <View className="min-w-5 rounded-full bg-orange-600 px-1.5">
                      <AppText weight="extrabold" className="text-center text-[11px] text-white">
                        {alert}
                      </AppText>
                    </View>
                  ) : n != null ? (
                    <AppText weight="bold" className="text-xs text-leaf-700">
                      {n}
                    </AppText>
                  ) : null}
                </View>
                <AppText weight="extrabold" className="text-[13px]">
                  {title}
                </AppText>
                <AppText className="text-[11px] leading-snug text-ink-subtle">{desc}</AppText>
              </Pressable>
            )
          })}
        </View>

        {adminInvites.length > 0 && view !== 'propose' && (
          <Pressable onPress={() => setInvitePopup(true)} className="flex-row items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3">
            <Megaphone size={18} color="#b45309" />
            <AppText className="flex-1 text-xs text-amber-900">
              <AppText weight="bold" className="text-xs text-amber-900">
                CapNong mời bạn góp hàng cho {adminInvites.length} chiến dịch.{' '}
              </AppText>
              Bấm để xem và trả lời.
            </AppText>
          </Pressable>
        )}
        {view !== 'propose' && pendingProposalInvites.length > 0 && (
          <Pressable onPress={() => setView('propose')} className="flex-row items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3">
            <Lightbulb size={18} color="#b45309" />
            <AppText className="flex-1 text-xs text-amber-900">
              {pendingProposalInvites[0].initiatorShopName} rủ bạn góp hàng giải cứu {pendingProposalInvites[0].productName}
              {pendingProposalInvites.length > 1 ? ` và ${pendingProposalInvites.length - 1} lời mời khác` : ''}. Bấm để trả lời.
            </AppText>
          </Pressable>
        )}

        {view === 'propose' ? (
          <ProposalsPanel />
        ) : view === 'calls' ? (
          calls.isPending ? (
            <Skeleton className="h-96 rounded-panel" />
          ) : calls.isError ? (
            <Notice tone="rose">{getErrorMessage(calls.error, 'Chưa tải được danh sách chiến dịch.')}</Notice>
          ) : !calls.data?.length ? (
            <EmptyState title="Chưa có lời kêu gọi" description="CapNong sẽ gửi thông báo khi có chiến dịch mới cần nhà vườn góp hàng." />
          ) : (
            calls.data.map((c) => (
              <CallCard
                key={c.campaignId}
                c={c}
                mine={myByCampaign.get(c.campaignId) ?? []}
                invited={invitedIds.has(c.campaignId)}
                onRegister={() => setRegistering(c)}
              />
            ))
          )
        ) : mine.isPending ? (
          <Skeleton className="h-60 rounded-panel" />
        ) : !mine.data?.length ? (
          <EmptyState title="Bạn chưa đăng ký chiến dịch nào" description="Xem mục Đang kêu gọi để góp lô hàng đang dư." />
        ) : (
          mine.data.map((r) => <RegistrationCard key={r.registrationId} r={r} />)
        )}
      </ScrollView>

      {registering && (
        <RegisterLotSheet
          c={registering}
          visible
          onClose={() => setRegistering(null)}
          onDone={() => {
            setRegistering(null)
            setView('mine')
          }}
        />
      )}
      <AdminInviteSheet
        invites={invitePopup ? adminInvites : []}
        onClose={() => setInvitePopup(false)}
        onRegister={(c) => {
          setInvitePopup(false)
          setView('calls')
          setRegistering(c)
        }}
        onDecline={(inv) => void decline(inv)}
      />
    </SafeAreaView>
  )
}

/** Popup lời mời góp hàng của CapNong (AdminInvitePopup bản web) */
function AdminInviteSheet({
  invites,
  onClose,
  onRegister,
  onDecline,
}: {
  invites: CampaignInvite[]
  onClose: () => void
  onRegister: (c: CampaignResponse) => void
  onDecline: (inv: CampaignInvite) => void
}) {
  const [idx, setIdx] = useState(0)
  if (!invites.length) return null
  const inv = invites[Math.min(idx, invites.length - 1)]
  const c = inv.campaign
  const remaining = Math.max(0, c.targetVolumeKg - Number(c.approvedSurplusKg ?? 0))
  return (
    <BottomSheet
      visible
      title="CapNong mời bạn góp hàng"
      subtitle={invites.length > 1 ? `Lời mời ${idx + 1}/${invites.length}` : undefined}
      onClose={onClose}
      footer={
        <View className="flex-1 flex-row gap-2">
          <Button title="Từ chối" variant="ghost" icon={XCircle} onPress={() => onDecline(inv)} />
          {invites.length > 1 && <Button title="Tiếp" variant="outline" onPress={() => setIdx((idx + 1) % invites.length)} />}
          <Button
            className="flex-1"
            title={registrationOpen(c) ? 'Đăng ký góp hàng' : openingText(c)}
            icon={Sprout}
            disabled={!registrationOpen(c)}
            onPress={() => onRegister(c)}
          />
        </View>
      }
    >
      <View className="gap-3">
        <AppText weight="extrabold" className="text-xl">
          {c.title}
        </AppText>
        {!!inv.message && <Notice tone="leaf">“{inv.message}”</Notice>}
        <View className="flex-row gap-2 rounded-2xl bg-paper p-3">
          <View className="flex-1">
            <AppText className="text-[11px] text-ink-subtle">Giá thu mua</AppText>
            <AppText weight="extrabold" className="text-sm">
              {formatVnd(c.rescuePricePerKg)}/kg
            </AppText>
          </View>
          <View className="flex-1">
            <AppText className="text-[11px] text-ink-subtle">Còn cần gom</AppText>
            <AppText weight="extrabold" className="text-sm">
              {formatKg(remaining)}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText className="text-[11px] text-ink-subtle">Hạn góp hàng</AppText>
            <AppText weight="extrabold" className="text-sm">
              {fmtDate(c.farmCutoffAt ?? c.cutoffAt)}
            </AppText>
          </View>
        </View>
        {!!c.collectionSiteName && (
          <AppText className="text-xs text-ink-muted">
            {c.collectionSiteName}
            {c.collectionSiteAddress ? ` · ${c.collectionSiteAddress}` : ''}
          </AppText>
        )}
        <AppText
          weight="bold"
          className="text-sm text-leaf-700"
          onPress={() => {
            onClose()
            router.push(`/shop/campaign/${c.campaignId}` as never)
          }}
        >
          Đọc bài chiến dịch →
        </AppText>
      </View>
    </BottomSheet>
  )
}
