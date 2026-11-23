import { router } from 'expo-router'
import { CalendarClock, ClipboardList, Flame, PackageCheck, Truck, type LucideIcon } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { CampaignCard, useCampaignsByPhase } from '@/features/campaign'
import type { CampaignPhase, CampaignResponse } from '@/services'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

type Phase = { phase: CampaignPhase; label: string; icon: LucideIcon; empty: string; featured: string }

const PHASES: Phase[] = [
  { phase: 'ONGOING', label: 'Đang mở đặt trước', icon: Flame, empty: 'Hiện chưa có chiến dịch nào đang mở đặt trước.', featured: 'Sắp chốt · Cần bạn' },
  { phase: 'UPCOMING', label: 'Sắp mở', icon: CalendarClock, empty: 'Chưa có chiến dịch nào đang gom nhà vườn.', featured: 'Sắp mở bán' },
  { phase: 'DELIVERING', label: 'Đang giao', icon: Truck, empty: 'Chưa có chiến dịch nào đang thu hoạch và giao hàng.', featured: 'Đang về tay bạn' },
  { phase: 'DONE', label: 'Đã giải cứu xong', icon: PackageCheck, empty: 'Chưa có chiến dịch nào hoàn thành.', featured: 'Câu chuyện thành công' },
]

const PAGE_SIZE = 10

/** Chiến dịch giải cứu, chuyển từ pages/CampaignsPage.tsx: lọc theo giai đoạn, chiến dịch sắp chốt lên đầu. */
export default function CampaignsScreen() {
  const [current, setCurrent] = useState(PHASES[0])
  const [page, setPage] = useState(0)
  const q = useCampaignsByPhase(current.phase, page, PAGE_SIZE)
  const [refreshing, setRefreshing] = useState(false)

  const list = q.data?.content ?? []
  // Tab đang mở: chiến dịch sắp chốt nhất lên đầu
  const sorted: CampaignResponse[] =
    current.phase === 'ONGOING' ? [...list].sort((a, b) => Date.parse(a.cutoffAt) - Date.parse(b.cutoffAt)) : list

  const refresh = async () => {
    setRefreshing(true)
    await q.refetch()
    setRefreshing(false)
  }

  const header = (
    <View className="gap-4 pb-4">
      <View className="items-center gap-2 rounded-panel bg-leaf-800 px-5 py-6">
        <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
          <Flame size={13} color={colors.sun300} />
          <AppText weight="bold" className="text-xs text-sun-300">
            Mỗi thùng bạn đặt · Một mùa vụ không bị bỏ lại
          </AppText>
        </View>
        <AppText weight="extrabold" className="text-center text-2xl text-white">
          Chiến dịch giải cứu nông sản
        </AppText>
        <AppText className="text-center text-xs leading-relaxed text-white/85">
          Đặt trước thùng nông sản, nhà vườn bán được giá còn bạn nhận hàng tươi tận gốc.
        </AppText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {PHASES.map((p) => (
          <PhaseTab
            key={p.phase}
            item={p}
            active={p.phase === current.phase}
            onPress={() => {
              setPage(0)
              setCurrent(p)
            }}
          />
        ))}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-2">
        <BackButton />
        <AppText weight="extrabold" className="flex-1 text-lg">
          Chiến dịch giải cứu
        </AppText>
        <Pressable
          onPress={() => router.push('/buyer/pre-orders' as never)}
          accessibilityRole="button"
          className="flex-row items-center gap-1.5 rounded-full border border-leaf-700 px-3 py-1.5"
        >
          <ClipboardList size={14} color={colors.leaf700} />
          <AppText weight="bold" className="text-xs text-leaf-700">
            Đơn đặt trước
          </AppText>
        </Pressable>
      </View>
      <FlatList
        data={q.isPending || q.isError ? [] : sorted}
        keyExtractor={(c) => String(c.campaignId)}
        contentContainerClassName="px-4 pb-10"
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />}
        renderItem={({ item, index }) => (
          <CampaignCard
            c={item}
            featuredBadge={page === 0 && index === 0 ? current.featured : undefined}
            onPress={() => router.push(`/buyer/campaign/${item.campaignId}` as never)}
          />
        )}
        ListEmptyComponent={
          q.isPending ? (
            <View className="gap-4">
              <Skeleton className="h-80 rounded-panel" />
              <Skeleton className="h-80 rounded-panel" />
            </View>
          ) : q.isError ? (
            <ErrorState title="Chưa tải được danh sách chiến dịch" onRetry={() => void q.refetch()} />
          ) : (
            <EmptyState
              title={current.empty}
              description="Khi một vùng trồng cần giải cứu, chiến dịch sẽ xuất hiện ở đây."
              action={<Button title="Mua nông sản tươi" variant="outline" onPress={() => router.navigate('/buyer/fresh')} />}
            />
          )
        }
        ListFooterComponent={
          q.data && q.data.totalPages > 1 ? (
            <View className="mt-6 flex-row items-center justify-center gap-3">
              <Button title="Trang trước" variant="outline" disabled={q.data.first} onPress={() => setPage((p) => Math.max(0, p - 1))} />
              <AppText weight="bold" className="text-sm">
                {q.data.page + 1} / {q.data.totalPages}
              </AppText>
              <Button title="Trang sau" variant="outline" disabled={q.data.last} onPress={() => setPage((p) => p + 1)} />
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  )
}

function PhaseTab({ item, active, onPress }: { item: Phase; active: boolean; onPress: () => void }) {
  const { data } = useCampaignsByPhase(item.phase, 0, 1)
  const Icon = item.icon
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className={cn('flex-row items-center gap-1.5 rounded-full border px-3.5 py-2', active ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white')}
    >
      <Icon size={14} color={active ? colors.sun300 : colors.leaf700} />
      <AppText weight="extrabold" className={cn('text-[13px]', active ? 'text-white' : 'text-ink')}>
        {item.label}
      </AppText>
      {data?.totalElements != null && (
        <View className={cn('min-w-5 rounded-full px-1.5', active ? 'bg-white/20' : 'bg-paper')}>
          <AppText weight="extrabold" className={cn('text-center text-[11px]', active ? 'text-white' : 'text-ink-muted')}>
            {data.totalElements}
          </AppText>
        </View>
      )}
    </Pressable>
  )
}
