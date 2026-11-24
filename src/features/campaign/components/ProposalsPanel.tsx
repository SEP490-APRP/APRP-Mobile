import { useMutation, useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as Location from 'expo-location'
import { CheckCircle2, Clock, LocateFixed, Megaphone, Pencil, Send, ShieldCheck, Undo2, UserPlus, Users, X, XCircle } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button, Checkbox, EmptyState, Skeleton, TextField } from '@/components/ui'
import {
  campaignProposalService,
  categoryService,
  type CampaignProposal,
  type CampaignProposalRequest,
  type ProposalMember,
  type ShelfLifeTier,
} from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { useMyProposals, useNearbyShops, useProposalInvites, useRefreshProposals, useSaveProposal } from '../hooks/useCampaignQueries'
import { addDays, fmtDate, formatKg, formatVnd, isoIn, SHELF_LIFE, shelfLabel } from '../utils/campaignFormat'
import { DateField, Notice, NumberField, PhotoPicker, Pill, ProgressBar, SectionTitle, Stat } from './CampaignBits'

const logoIcon = require('../../../../assets/images/logo-icon.png')

const MIN_LEAD_DAYS = 3
const RADII = [5, 10, 20, 30, 50]

const STATUS: Record<CampaignProposal['status'], { label: string; tone: 'leaf' | 'amber' | 'rose' | 'gray' }> = {
  DRAFT: { label: 'Nháp · đang rủ shop', tone: 'leaf' },
  SUBMITTED: { label: 'Đã gửi · chờ CapNong duyệt', tone: 'amber' },
  NEEDS_CHANGES: { label: 'Cần bổ sung', tone: 'amber' },
  APPROVED: { label: 'Đã duyệt thành chiến dịch', tone: 'leaf' },
  REJECTED: { label: 'Bị từ chối', tone: 'rose' },
  WITHDRAWN: { label: 'Đã rút', tone: 'gray' },
}

const MEMBER: Record<ProposalMember['status'], { label: string; tone: 'leaf' | 'amber' | 'gray' }> = {
  PENDING: { label: 'Chờ trả lời', tone: 'amber' },
  ACCEPTED: { label: 'Tham gia', tone: 'leaf' },
  DECLINED: { label: 'Từ chối', tone: 'gray' },
  EXPIRED: { label: 'Hết hạn', tone: 'gray' },
  REMOVED: { label: 'Đã bỏ', tone: 'gray' },
}

type FieldErrors = Partial<Record<string, string>>

/** Lỗi theo từng ô BE trả về (result.fieldErrors) */
function fieldErrorsOf(err: unknown): FieldErrors {
  const data = (err as { data?: { result?: { fieldErrors?: FieldErrors } } } | null)?.data
  return data?.result?.fieldErrors ?? {}
}

const fmtShort = (v?: string | null) => (v ? fmtDate(v).slice(0, 5) : '—')
const fmtRange = (from?: string | null, to?: string | null) => `Từ ${fmtShort(from)} đến ${fmtShort(to)}`

/**
 * Shop đề xuất mở chiến dịch giải cứu (CampaignProposals bản web): soạn đơn, rủ shop lân cận,
 * đủ số kg tối thiểu thì gửi CapNong duyệt; trả lời lời mời của shop khác.
 */
export function ProposalsPanel() {
  const mine = useMyProposals()
  const invites = useProposalInvites()
  const refresh = useRefreshProposals()
  const showToast = useUiStore((s) => s.showToast)
  const [editing, setEditing] = useState<CampaignProposal | 'new' | null>(null)
  const [inviting, setInviting] = useState<CampaignProposal | null>(null)

  const open = (mine.data ?? []).find((p) => ['DRAFT', 'SUBMITTED', 'NEEDS_CHANGES'].includes(p.status))
  const pendingInvites = (invites.data ?? []).filter((p) => p.myInvite?.status === 'PENDING')
  const answered = (invites.data ?? []).filter((p) => p.myInvite && p.myInvite.status !== 'PENDING')

  const done = (msg?: string) => {
    void refresh()
    if (msg) showToast(msg)
  }

  return (
    <View className="gap-5">
      <View className="gap-2 rounded-panel border border-leaf-100 bg-leaf-50 p-4">
        <View className="flex-row items-center gap-2">
          <Megaphone size={18} color="#ea580c" />
          <AppText weight="extrabold" className="flex-1 text-base">
            Vườn bạn đang dư hàng? Đề xuất CapNong mở chiến dịch
          </AppText>
        </View>
        <AppText className="text-xs leading-relaxed text-ink-muted">
          1. Soạn đơn: nông sản, ảnh vườn, ngày thu hoạch, điểm tập kết.{'\n'}2. Rủ shop lân cận đã xác minh cùng góp hàng (không bắt buộc).{'\n'}3. Đủ
          tổng {formatKg(200)} dự kiến thì gửi CapNong duyệt.{'\n'}4. Khi chiến dịch đăng lời kêu gọi, mọi shop đăng ký số kg như bình thường.
        </AppText>
        <Button title="Tạo đề xuất" icon={Pencil} disabled={!!open} onPress={() => setEditing('new')} />
        {!!open && <AppText className="text-[11px] text-ink-subtle">Mỗi shop chỉ có 1 đơn đề xuất đang mở.</AppText>}
      </View>

      {pendingInvites.length > 0 && (
        <View className="gap-3">
          <SectionTitle icon={Users} title={`Lời mời đang chờ bạn (${pendingInvites.length})`} />
          {pendingInvites.map((p) => (
            <InviteCard key={p.proposalId} p={p} onDone={done} />
          ))}
        </View>
      )}

      <View className="gap-3">
        <SectionTitle title={`Đề xuất của tôi${mine.data ? ` (${mine.data.length})` : ''}`} />
        {mine.isPending ? (
          <Skeleton className="h-48 rounded-panel" />
        ) : mine.isError ? (
          <Notice tone="rose">{getErrorMessage(mine.error, 'Chưa tải được đơn đề xuất.')}</Notice>
        ) : !mine.data?.length ? (
          <EmptyState title="Chưa có đơn đề xuất" description="Bấm “Tạo đề xuất” khi vườn có hàng dư cần giải cứu." />
        ) : (
          mine.data.map((p) => <ProposalCard key={p.proposalId} p={p} onEdit={() => setEditing(p)} onInvite={() => setInviting(p)} onChanged={done} />)
        )}
      </View>

      {answered.length > 0 && (
        <View className="gap-3">
          <SectionTitle title="Đề xuất tôi đã trả lời" />
          {answered.map((p) => (
            <InviteCard key={p.proposalId} p={p} onDone={done} />
          ))}
        </View>
      )}

      <ProposalFormSheet
        p={editing === 'new' ? null : editing}
        visible={editing != null}
        onClose={() => setEditing(null)}
        onSaved={(saved, created) => {
          setEditing(null)
          done(created ? 'Đã lưu đề xuất. Rủ shop lân cận hoặc gửi CapNong duyệt luôn.' : 'Đã lưu thay đổi.')
          if (created && saved.siteLatitude != null) setInviting(saved)
        }}
      />
      <NearbyShopsSheet
        p={inviting}
        onClose={() => setInviting(null)}
        onDone={(msg) => {
          setInviting(null)
          done(msg)
        }}
      />
    </View>
  )
}

function ProposalCard({ p, onEdit, onInvite, onChanged }: { p: CampaignProposal; onEdit: () => void; onInvite: () => void; onChanged: (msg?: string) => void }) {
  const st = STATUS[p.status]
  const editable = p.status === 'DRAFT' || p.status === 'NEEDS_CHANGES'
  const isOpen = editable || p.status === 'SUBMITTED'
  const minKg = Number(p.minSubmitKg || 200)
  const total = Number(p.totalEstimatedKg)
  const enough = total >= minKg
  const closed = p.status === 'REJECTED' || p.status === 'WITHDRAWN'
  const submit = useMutation({ mutationFn: () => campaignProposalService.submit(p.proposalId), onSuccess: () => onChanged('Đã gửi đề xuất. CapNong sẽ xem xét và phản hồi.') })
  const withdraw = useMutation({ mutationFn: () => campaignProposalService.withdraw(p.proposalId), onSuccess: () => onChanged('Đã rút đơn đề xuất.') })
  const remove = useMutation({ mutationFn: (shopId: number) => campaignProposalService.removeMember(p.proposalId, shopId), onSuccess: () => onChanged() })
  const err = submit.error || withdraw.error || remove.error
  const fieldErrs = Object.values(fieldErrorsOf(err))
  const members = p.members.filter((m) => m.status !== 'REMOVED')

  return (
    <View className={cn('overflow-hidden rounded-panel border bg-white', closed ? 'border-line opacity-80' : 'border-leaf-100')}>
      <View className="h-36 bg-leaf-50">
        <Image source={p.photoUrls[0] ? { uri: p.photoUrls[0] } : logoIcon} style={{ width: '100%', height: '100%' }} contentFit={p.photoUrls[0] ? 'cover' : 'contain'} />
      </View>
      <View className="gap-3 p-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <Pill tone={st.tone} text={st.label} />
          {!!p.categoryName && <Pill tone="leaf" text={p.categoryName} />}
          <AppText className="ml-auto text-[11px] text-ink-subtle">{p.code}</AppText>
        </View>
        <AppText weight="extrabold" className="text-lg">
          {p.productName || 'Chưa đặt tên nông sản'}
        </AppText>
        <View className="flex-row flex-wrap gap-y-2">
          <Stat className="min-w-[48%]" label="Thu hoạch" value={fmtRange(p.harvestFrom, p.harvestTo)} />
          <Stat className="min-w-[48%]" label="Mở bán chiến dịch" value={p.proposedOpenDate ? fmtRange(p.proposedOpenDate, p.proposedCloseDate) : 'Chưa chọn'} />
          <Stat className="min-w-[48%]" label="Giá mong muốn" value={p.desiredPricePerKg != null ? `${formatVnd(p.desiredPricePerKg)}/kg` : 'Chưa nhập'} />
          <Stat className="min-w-[48%]" label="Độ bền sau chốt" value={shelfLabel(p.shelfLifeTier)} />
        </View>
        <AppText className="text-xs text-ink-muted">{p.siteName ? `${p.siteName} · ${p.siteAddress ?? ''}` : 'Chưa chọn điểm tập kết'}</AppText>
        {(p.status === 'NEEDS_CHANGES' || p.status === 'REJECTED') && !!p.adminNote && (
          <Notice tone={p.status === 'REJECTED' ? 'rose' : 'amber'}>CapNong ghi chú: {p.adminNote}</Notice>
        )}
        {p.status === 'APPROVED' && (
          <Notice tone="leaf">
            Đã duyệt thành chiến dịch {p.campaignCode}. Khi CapNong đăng lời kêu gọi, bạn vào mục “Đang kêu gọi” để đăng ký số kg như bình thường.
          </Notice>
        )}

        <View className="gap-2 rounded-2xl bg-paper p-3">
          <View className="flex-row items-end justify-between">
            <AppText className="text-xs text-ink-muted">
              {p.acceptedShopCount} shop tham gia · {p.pendingInviteCount} chờ trả lời
            </AppText>
            <AppText weight="extrabold" className="text-lg">
              {formatKg(total)}
              <AppText className="text-xs text-ink-subtle"> / {formatKg(minKg)}</AppText>
            </AppText>
          </View>
          <ProgressBar pct={(total / minKg) * 100} />
          <AppText weight="bold" className={cn('text-[11px]', enough ? 'text-leaf-700' : 'text-amber-700')}>
            {enough ? 'Đủ số kg tối thiểu để gửi duyệt' : `Còn thiếu ${formatKg(minKg - total)} để gửi duyệt`}
          </AppText>
          {members.map((m) => (
            <MemberRow key={m.memberId} m={m} onRemove={editable && m.role === 'INVITED' ? () => remove.mutate(m.shopId) : undefined} />
          ))}
        </View>

        {err &&
          (fieldErrs.length > 0 ? (
            <Notice tone="rose">Còn thiếu trước khi gửi duyệt: {fieldErrs.join('; ')}</Notice>
          ) : (
            <Notice tone="rose">{getErrorMessage(err, 'Thao tác chưa thành công.')}</Notice>
          ))}

        {isOpen && (
          <View className="flex-row flex-wrap gap-2">
            <Button title="Rút đơn" variant="ghost" icon={Undo2} loading={withdraw.isPending} onPress={() => withdraw.mutate()} />
            {editable && <Button title="Sửa" variant="outline" icon={Pencil} onPress={onEdit} />}
            {editable && <Button title="Rủ shop" variant="outline" icon={UserPlus} disabled={p.siteLatitude == null} onPress={onInvite} />}
            {editable && <Button title="Gửi CapNong duyệt" icon={Send} disabled={!enough} loading={submit.isPending} onPress={() => submit.mutate()} />}
          </View>
        )}
      </View>
    </View>
  )
}

function MemberRow({ m, onRemove }: { m: ProposalMember; onRemove?: () => void }) {
  const st = MEMBER[m.status]
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-white px-3 py-2">
      <Image source={m.logoUrl ? { uri: m.logoUrl } : logoIcon} style={{ width: 36, height: 36, borderRadius: 18 }} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1">
          <AppText weight="bold" numberOfLines={1} className="text-sm">
            {m.shopName}
          </AppText>
          {m.verified && <ShieldCheck size={13} color={colors.leaf600} />}
        </View>
        <AppText className="text-[11px] text-ink-subtle">
          {[m.role === 'INITIATOR' ? 'Khởi xướng' : null, m.distanceKm != null ? `~${m.distanceKm} km` : null, m.phone].filter(Boolean).join(' · ')}
        </AppText>
      </View>
      <View className="items-end gap-1">
        {m.estimatedKg != null && (
          <AppText weight="extrabold" className="text-sm">
            {formatKg(m.estimatedKg)}
          </AppText>
        )}
        <Pill tone={st.tone} text={st.label} />
      </View>
      {onRemove && (
        <Pressable onPress={onRemove} accessibilityLabel={`Bỏ ${m.shopName}`} hitSlop={8}>
          <X size={14} color={colors.inkSubtle} />
        </Pressable>
      )}
    </View>
  )
}

function InviteCard({ p, onDone }: { p: CampaignProposal; onDone: (msg: string) => void }) {
  const inv = p.myInvite!
  const [kg, setKg] = useState(inv.estimatedKg != null ? String(inv.estimatedKg) : '')
  const accept = useMutation({ mutationFn: () => campaignProposalService.acceptInvite(inv.memberId, Number(kg)), onSuccess: () => onDone('Đã nhận lời tham gia đề xuất.') })
  const decline = useMutation({ mutationFn: () => campaignProposalService.declineInvite(inv.memberId), onSuccess: () => onDone('Đã từ chối lời mời.') })
  const canReply = (p.status === 'DRAFT' || p.status === 'NEEDS_CHANGES') && ['PENDING', 'ACCEPTED', 'DECLINED'].includes(inv.status)
  const hoursLeft = inv.expiresAt ? Math.max(0, Math.round((new Date(inv.expiresAt).getTime() - Date.now()) / 3_600_000)) : null
  const pending = inv.status === 'PENDING'
  const mapUrl = p.siteLatitude != null && p.siteLongitude != null ? `https://www.google.com/maps/search/?api=1&query=${p.siteLatitude},${p.siteLongitude}` : null

  return (
    <View className={cn('overflow-hidden rounded-panel border bg-white', pending ? 'border-amber-300' : 'border-line')}>
      <View className="flex-row items-center gap-3 border-b border-line bg-amber-50/60 px-4 py-3">
        <Image source={p.initiatorLogoUrl ? { uri: p.initiatorLogoUrl } : logoIcon} style={{ width: 36, height: 36, borderRadius: 18 }} />
        <AppText className="flex-1 text-xs text-ink-muted">
          <AppText weight="bold" className="text-xs">
            {p.initiatorShopName}
          </AppText>{' '}
          rủ bạn cùng đề xuất CapNong mở chiến dịch{inv.distanceKm != null ? ` · cách vườn bạn ~${inv.distanceKm} km` : ''}
        </AppText>
        <Pill tone={MEMBER[inv.status].tone} text={MEMBER[inv.status].label} />
      </View>
      <View className="gap-3 p-4">
        <AppText weight="extrabold" className="text-lg">
          Giải cứu {p.productName}
        </AppText>
        {!!p.story && (
          <AppText numberOfLines={4} className="text-sm leading-relaxed text-ink-muted">
            {p.story}
          </AppText>
        )}
        {!!inv.message && <Notice tone="leaf">“{inv.message}”</Notice>}
        {p.photoUrls.length > 0 && (
          <View className="flex-row gap-2">
            {p.photoUrls.slice(0, 4).map((u) => (
              <Image key={u} source={{ uri: u }} style={{ width: 64, height: 64, borderRadius: 12 }} contentFit="cover" />
            ))}
          </View>
        )}
        <View className="flex-row flex-wrap gap-y-2">
          <Stat className="min-w-[48%]" label="Thu hoạch" value={fmtRange(p.harvestFrom, p.harvestTo)} />
          <Stat className="min-w-[48%]" label="Mở bán" value={p.proposedOpenDate ? fmtRange(p.proposedOpenDate, p.proposedCloseDate) : '—'} />
          <Stat className="min-w-[48%]" label="Giá mong muốn" value={p.desiredPricePerKg != null ? `${formatVnd(p.desiredPricePerKg)}/kg` : '—'} />
          <Stat className="min-w-[48%]" label="Dự kiến" value={`${formatKg(p.totalEstimatedKg)} / ${formatKg(p.minSubmitKg)}`} />
        </View>
        <AppText className="text-xs text-ink-muted" onPress={mapUrl ? () => void Linking.openURL(mapUrl) : undefined}>
          {p.siteName} · {p.siteAddress}
          {mapUrl ? '  (xem bản đồ)' : ''}
        </AppText>
        {canReply && (
          <View className="gap-2 rounded-2xl bg-paper p-3">
            <NumberField label="Bạn góp khoảng bao nhiêu kg?" suffix="kg" value={kg} onChange={setKg} placeholder="vd 150" />
            <View className="flex-row flex-wrap gap-2">
              <Button
                title={inv.status === 'ACCEPTED' ? 'Cập nhật số kg' : 'Tham gia'}
                icon={CheckCircle2}
                disabled={!(Number(kg) > 0)}
                loading={accept.isPending}
                onPress={() => accept.mutate()}
              />
              {inv.status !== 'DECLINED' && <Button title="Từ chối" variant="ghost" icon={XCircle} loading={decline.isPending} onPress={() => decline.mutate()} />}
            </View>
            {pending && hoursLeft != null && (
              <View className="flex-row items-center gap-1">
                <Clock size={12} color="#b45309" />
                <AppText className="text-[11px] text-amber-700">Còn {hoursLeft} giờ để trả lời</AppText>
              </View>
            )}
            <AppText className="text-[11px] text-ink-subtle">Số kg chỉ là dự kiến, không ràng buộc.</AppText>
          </View>
        )}
        {(accept.error || decline.error) && <Notice tone="rose">{getErrorMessage(accept.error || decline.error, 'Chưa trả lời được.')}</Notice>}
      </View>
    </View>
  )
}

function ProposalFormSheet({
  p,
  visible,
  onClose,
  onSaved,
}: {
  p: CampaignProposal | null
  visible: boolean
  onClose: () => void
  onSaved: (p: CampaignProposal, created: boolean) => void
}) {
  const categories = useQuery({ queryKey: ['categories', 'server'], queryFn: async () => (await categoryService.getAll()).result ?? [], staleTime: 300_000 })
  const save = useSaveProposal()
  const blank = () => {
    const myKg = p?.members.find((m) => m.role === 'INITIATOR')?.estimatedKg
    return {
      categoryId: p?.categoryId ? String(p.categoryId) : '',
      productName: p?.productName ?? '',
      story: p?.story ?? '',
      estimatedKg: myKg != null ? String(myKg) : '',
      harvestFrom: p?.harvestFrom ?? isoIn(MIN_LEAD_DAYS + 2),
      harvestTo: p?.harvestTo ?? isoIn(MIN_LEAD_DAYS + 6),
      openDate: p?.proposedOpenDate ?? isoIn(MIN_LEAD_DAYS + 7),
      closeDate: p?.proposedCloseDate ?? isoIn(MIN_LEAD_DAYS + 10),
      shelf: (p?.shelfLifeTier ?? 'DAYS_3_4') as ShelfLifeTier,
      desired: p?.desiredPricePerKg != null ? String(p.desiredPricePerKg) : '',
      market: p?.marketPricePerKg != null ? String(p.marketPricePerKg) : '',
      siteName: p?.siteName ?? '',
      siteAddress: p?.siteAddress ?? '',
      lat: p?.siteLatitude ?? null,
      lng: p?.siteLongitude ?? null,
    }
  }
  const [f, setF] = useState(blank)
  const [photos, setPhotos] = useState<string[]>(p?.photoUrls ?? [])
  const [tried, setTried] = useState(false)
  const [locating, setLocating] = useState(false)
  const showToast = useUiStore((s) => s.showToast)

  useEffect(() => {
    if (!visible) return
    setF(blank())
    setPhotos(p?.photoUrls ?? [])
    setTried(false)
    save.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, p])

  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  const minHarvest = isoIn(MIN_LEAD_DAYS)
  const tomorrow = isoIn(1)
  const check: FieldErrors = {}
  if (!f.categoryId) check.categoryId = 'Chọn danh mục'
  if (!f.productName.trim()) check.productName = 'Nhập tên nông sản'
  if (!f.story.trim()) check.story = 'Kể ngắn vì sao cần giải cứu'
  if (photos.length === 0) check.photoUrls = 'Thêm ít nhất 1 ảnh'
  if (f.harvestFrom < minHarvest) check.harvestFrom = `Phải từ ${fmtDate(minHarvest)} (cách hôm nay ít nhất ${MIN_LEAD_DAYS} ngày)`
  if (f.harvestTo < f.harvestFrom) check.harvestTo = 'Không được trước ngày bắt đầu thu hoạch'
  if (f.openDate < tomorrow) check.proposedOpenDate = 'Ngày mở phải từ ngày mai trở đi'
  else if (f.openDate <= f.harvestTo) check.proposedOpenDate = `Phải sau ngày thu hoạch xong (${fmtDate(f.harvestTo)})`
  if (f.closeDate <= f.openDate) check.proposedCloseDate = 'Phải sau ngày mở chiến dịch'
  if (!(Number(f.desired) > 0)) check.desiredPricePerKg = 'Nhập giá mong muốn'
  if (!f.siteName.trim()) check.siteName = 'Nhập tên điểm tập kết'
  if (f.lat == null || f.lng == null || !f.siteAddress.trim()) check.site = 'Nhập địa chỉ và ghim vị trí điểm tập kết'
  const serverErrors = fieldErrorsOf(save.error)
  const errorOf = (k: string) => serverErrors[k] ?? (tried ? check[k] : undefined)
  const missing = Object.keys(check).length
  const shelfMax = SHELF_LIFE.find((s) => s.id === f.shelf)?.max ?? 4

  const locate = async () => {
    setLocating(true)
    try {
      const perm = await Location.requestForegroundPermissionsAsync()
      if (perm.status !== 'granted') return showToast('Cần quyền vị trí để ghim điểm tập kết. Bật trong Cài đặt của máy nhé.')
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setF((s) => ({ ...s, lat: pos.coords.latitude, lng: pos.coords.longitude }))
      if (!f.siteAddress.trim()) {
        const [place] = await Location.reverseGeocodeAsync(pos.coords).catch(() => [])
        const text = place ? [place.streetNumber, place.street, place.district, place.subregion, place.region].filter(Boolean).join(', ') : ''
        if (text) setF((s) => ({ ...s, siteAddress: text }))
      }
    } catch (e) {
      showToast(getErrorMessage(e, 'Chưa lấy được vị trí hiện tại.'))
    } finally {
      setLocating(false)
    }
  }

  const doSave = async () => {
    const body: CampaignProposalRequest = {
      categoryId: f.categoryId ? Number(f.categoryId) : null,
      productName: f.productName,
      photoUrls: photos,
      story: f.story,
      estimatedKg: f.estimatedKg ? Number(f.estimatedKg) : null,
      harvestFrom: f.harvestFrom || null,
      harvestTo: f.harvestTo || null,
      proposedOpenDate: f.openDate || null,
      proposedCloseDate: f.closeDate || null,
      shelfLifeTier: f.shelf,
      desiredPricePerKg: f.desired ? Number(f.desired) : null,
      marketPricePerKg: f.market ? Number(f.market) : null,
      siteName: f.siteName,
      siteAddress: f.siteAddress,
      siteLatitude: f.lat,
      siteLongitude: f.lng,
    }
    try {
      const saved = await save.mutateAsync({ id: p?.proposalId, body })
      onSaved(saved, !p)
    } catch {
      // lỗi hiện dưới form
    }
  }

  const submit = () => {
    setTried(true)
    if (missing > 0) return
    void doSave()
  }

  return (
    <BottomSheet
      visible={visible}
      title={p ? `Sửa đề xuất ${p.code}` : 'Đề xuất mở chiến dịch'}
      onClose={() => !save.isPending && onClose()}
      footer={<Button className="flex-1" title={p ? 'Lưu thay đổi' : 'Lưu và qua bước rủ shop'} loading={save.isPending} onPress={submit} />}
    >
      <View className="gap-4">
        <Notice tone="leaf">
          Có thể lưu nháp khi chưa đủ thông tin. Muốn gửi duyệt cần đủ ảnh, câu chuyện, ngày thu hoạch (từ {fmtDate(minHarvest)}), giá mong muốn và
          điểm tập kết.
        </Notice>
        <View className="gap-1.5">
          <AppText weight="semibold" className="text-sm">
            Danh mục
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {(categories.data ?? []).map((cat) => {
              const id = String(cat.categoryId)
              const on = f.categoryId === id
              return (
                <Pressable
                  key={id}
                  onPress={() => set('categoryId')(id)}
                  className={cn('rounded-full border px-3 py-1.5', on ? 'border-leaf-700 bg-leaf-50' : 'border-line')}
                >
                  <AppText weight="semibold" className={cn('text-xs', on ? 'text-leaf-700' : 'text-ink')}>
                    {cat.name}
                  </AppText>
                </Pressable>
              )
            })}
          </View>
          {!!errorOf('categoryId') && <AppText className="text-xs text-sale">{errorOf('categoryId')}</AppText>}
        </View>
        <TextField label="Nông sản cần giải cứu" value={f.productName} onChangeText={set('productName')} placeholder="vd Thanh long ruột đỏ" error={errorOf('productName')} />
        <TextField
          label="Câu chuyện (vì sao cần giải cứu)"
          value={f.story}
          onChangeText={set('story')}
          multiline
          placeholder="Thương lái bỏ, giá rớt còn 3.000đ/kg, vườn sắp chín rộ…"
          error={errorOf('story')}
        />
        <View className="gap-1.5">
          <AppText weight="semibold" className="text-sm">
            Ảnh vườn / nông sản (1 – 5 ảnh)
          </AppText>
          <PhotoPicker urls={photos} onChange={setPhotos} folder="campaigns" error={errorOf('photoUrls')} />
        </View>
        <NumberField label="Vườn bạn dư khoảng" suffix="kg" value={f.estimatedKg} onChange={set('estimatedKg')} />
        <View className="gap-1.5">
          <AppText weight="semibold" className="text-sm">
            Độ bền sau khi kết thúc chiến dịch
          </AppText>
          <View className="flex-row gap-2">
            {SHELF_LIFE.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => set('shelf')(s.id)}
                className={cn('flex-1 items-center rounded-2xl border py-2.5', f.shelf === s.id ? 'border-leaf-700 bg-leaf-50' : 'border-line')}
              >
                <AppText weight="bold" className="text-xs">
                  {s.label}
                </AppText>
              </Pressable>
            ))}
          </View>
          <AppText className="text-[11px] text-ink-subtle">Hàng còn tươi tới khoảng {fmtDate(addDays(f.closeDate, shelfMax))}</AppText>
        </View>
        <DateField label="Thu hoạch từ ngày" value={f.harvestFrom} onChange={set('harvestFrom')} min={minHarvest} error={errorOf('harvestFrom')} />
        <DateField label="Thu hoạch đến ngày" value={f.harvestTo} onChange={set('harvestTo')} min={f.harvestFrom} error={errorOf('harvestTo')} />
        <DateField
          label="Đề xuất ngày mở chiến dịch"
          value={f.openDate}
          onChange={set('openDate')}
          min={addDays(f.harvestTo, 1)}
          hint="Ngày bắt đầu nhận đặt trước, sau ngày thu hoạch xong"
          error={errorOf('proposedOpenDate')}
        />
        <DateField
          label="Đề xuất ngày kết thúc chiến dịch"
          value={f.closeDate}
          onChange={set('closeDate')}
          min={addDays(f.openDate, 1)}
          error={errorOf('proposedCloseDate')}
        />
        <NumberField label="Giá mong muốn" suffix="đ/kg" value={f.desired} onChange={set('desired')} error={errorOf('desiredPricePerKg')} />
        <NumberField label="Giá thương lái đang trả" suffix="đ/kg" value={f.market} onChange={set('market')} />
        <TextField label="Tên điểm tập kết dự kiến" value={f.siteName} onChangeText={set('siteName')} placeholder="vd Sân HTX Hàm Thuận Nam" error={errorOf('siteName')} />
        <TextField label="Địa chỉ điểm tập kết" value={f.siteAddress} onChangeText={set('siteAddress')} multiline />
        <View className="gap-1.5">
          <Button
            title={f.lat != null ? 'Ghim lại theo vị trí hiện tại' : 'Ghim vị trí hiện tại làm điểm tập kết'}
            variant="outline"
            icon={LocateFixed}
            loading={locating}
            onPress={() => void locate()}
          />
          <AppText className="text-[11px] text-ink-subtle">
            {f.lat != null ? `Đã ghim: ${f.lat.toFixed(5)}, ${f.lng?.toFixed(5)}` : 'Đứng tại điểm tập kết rồi bấm ghim để shop lân cận tìm thấy.'}
          </AppText>
          {!!errorOf('site') && <AppText className="text-xs text-sale">{errorOf('site')}</AppText>}
        </View>
        {save.isError && Object.keys(serverErrors).length === 0 && <Notice tone="rose">{getErrorMessage(save.error, 'Chưa lưu được đề xuất.')}</Notice>}
        {tried && missing > 0 && Object.keys(serverErrors).length === 0 && (
          <View className="gap-2 rounded-2xl bg-amber-50 p-3">
            <AppText className="text-xs text-amber-800">Còn {missing} ô cần bổ sung (đánh dấu đỏ ở trên). Đủ thông tin mới gửi duyệt được.</AppText>
            <Button title="Vẫn lưu nháp" variant="outline" loading={save.isPending} onPress={() => void doSave()} />
          </View>
        )}
      </View>
    </BottomSheet>
  )
}

function NearbyShopsSheet({ p, onClose, onDone }: { p: CampaignProposal | null; onClose: () => void; onDone: (msg: string) => void }) {
  const [radius, setRadius] = useState(10)
  const [sameCategory, setSameCategory] = useState(false)
  const [picked, setPicked] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const q = useNearbyShops(p?.proposalId ?? 0, radius, sameCategory, !!p)
  const invite = useMutation({ mutationFn: () => campaignProposalService.invite(p!.proposalId, picked, message), onSuccess: () => onDone(`Đã gửi lời mời tới ${picked.length} shop.`) })
  const submit = useMutation({ mutationFn: () => campaignProposalService.submit(p!.proposalId), onSuccess: () => onDone('Đã gửi đề xuất. CapNong sẽ xem xét và phản hồi.') })

  useEffect(() => {
    if (!p) return
    setPicked([])
    setMessage(`Mình đang đề xuất CapNong mở chiến dịch giải cứu ${p.productName ?? ''}. Vườn bạn có hàng dư thì cùng góp nhé!`)
  }, [p])

  if (!p) return null
  const minKg = Number(p.minSubmitKg || 200)
  const enough = Number(p.totalEstimatedKg) >= minKg
  const toggle = (id: number) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <BottomSheet
      visible
      title="Rủ shop lân cận cùng góp hàng"
      subtitle={`Quanh ${p.siteName ?? 'điểm tập kết'}`}
      onClose={onClose}
      footer={
        <View className="flex-1 gap-2">
          <Button title={`Mời ${picked.length || ''} shop`} icon={Send} disabled={!picked.length} loading={invite.isPending} onPress={() => invite.mutate()} />
          <Button title="Gửi CapNong duyệt luôn" variant="outline" disabled={!enough} loading={submit.isPending} onPress={() => submit.mutate()} />
        </View>
      }
    >
      <View className="gap-3">
        <View className="flex-row flex-wrap items-center gap-2">
          {RADII.map((r) => (
            <Pressable key={r} onPress={() => setRadius(r)} className={cn('rounded-full px-3 py-1.5', radius === r ? 'bg-leaf-700' : 'bg-leaf-50')}>
              <AppText weight="bold" className={cn('text-xs', radius === r ? 'text-white' : 'text-leaf-700')}>
                {r} km
              </AppText>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => setSameCategory((v) => !v)} className="flex-row items-center">
          <Checkbox checked={sameCategory} onChange={() => setSameCategory((v) => !v)} label="Chỉ shop cùng loại" />
          <AppText className="text-sm">Chỉ shop cùng loại</AppText>
        </Pressable>
        {q.isPending ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : q.isError ? (
          <Notice tone="rose">{getErrorMessage(q.error, 'Chưa tải được shop lân cận.')}</Notice>
        ) : !q.data?.length ? (
          <AppText className="py-6 text-center text-sm text-ink-subtle">Chưa có shop đã xác minh nào trong {radius} km. Thử mở rộng bán kính.</AppText>
        ) : (
          q.data.map((s) => {
            const already = !!s.inviteStatus && s.inviteStatus !== 'REMOVED'
            return (
              <Pressable
                key={s.shopId}
                disabled={already}
                onPress={() => toggle(s.shopId)}
                className={cn('flex-row items-center gap-2 border-b border-line py-1', already && 'opacity-60')}
              >
                <Checkbox checked={picked.includes(s.shopId)} onChange={() => toggle(s.shopId)} label={s.shopName} disabled={already} />
                <Image source={s.logoUrl ? { uri: s.logoUrl } : logoIcon} style={{ width: 36, height: 36, borderRadius: 18 }} />
                <View className="min-w-0 flex-1">
                  <AppText weight="bold" numberOfLines={1} className="text-sm">
                    {s.shopName}
                  </AppText>
                  <AppText numberOfLines={1} className="text-[11px] text-ink-subtle">
                    {s.ratingAverage != null ? `★ ${s.ratingAverage.toFixed(1)} · ` : ''}
                    {s.categories.length ? s.categories.join(', ') : 'Chưa đăng sản phẩm'}
                  </AppText>
                </View>
                <AppText weight="extrabold" className="text-xs text-leaf-700">
                  ~{s.distanceKm} km
                </AppText>
                {already && s.inviteStatus && <Pill tone={MEMBER[s.inviteStatus].tone} text={MEMBER[s.inviteStatus].label} />}
              </Pressable>
            )
          })
        )}
        <TextField label="Lời nhắn" value={message} onChangeText={setMessage} maxLength={300} multiline />
        <AppText className="text-[11px] text-ink-subtle">Lời mời hết hạn sau 72 giờ. Tối đa 20 shop mỗi đơn, 30 lời mời mỗi ngày.</AppText>
        {!enough && (
          <AppText className="text-xs text-ink-muted">
            Hiện có {formatKg(Number(p.totalEstimatedKg))}, cần ít nhất {formatKg(minKg)} để gửi duyệt.
          </AppText>
        )}
        {(invite.isError || submit.isError) && <Notice tone="rose">{getErrorMessage(invite.error || submit.error, 'Thao tác chưa thành công.')}</Notice>}
      </View>
    </BottomSheet>
  )
}
