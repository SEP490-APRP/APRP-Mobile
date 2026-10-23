import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Bike, ChevronRight, KeyRound, LogOut, Mail, MapPin, Phone, Wallet, type LucideIcon } from 'lucide-react-native'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Skeleton } from '@/components/ui'
import { useLogout } from '@/features/auth'
import { useMyProfile } from '@/features/profile'
import { earningsSummary, useShipperHistory, useShipperStatus } from '@/features/shipper'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const MENU = [
  { icon: Wallet, label: 'Thu nhập và lịch sử', hint: 'Phí giao, chuyến đã chạy theo ngày', href: '/shipper/earnings' },
  { icon: KeyRound, label: 'Đổi mật khẩu', hint: 'Bảo vệ tài khoản tài xế', href: '/shipper/password' },
] as const

/** Hồ sơ tài xế, chuyển từ thẻ "Hồ sơ cá nhân" trong pages/shipper/Dashboard.tsx, thêm số chuyến và lối vào thu nhập. */
export default function ShipperAccount() {
  const { user } = useAuth()
  const profile = useMyProfile()
  const status = useShipperStatus()
  const history = useShipperHistory()
  const logout = useLogout()
  const p = profile.data
  const name = p?.fullName || user?.name || 'Tài xế'
  const avatar = p?.logoUrl || p?.avatar || user?.avatar
  const online = status.data?.online
  const total = earningsSummary(history.data ?? [])

  const stats = [
    { label: 'Chuyến giao xong', value: history.data ? String(total.delivered) : '…' },
    { label: 'Tỉ lệ thành công', value: total.successRate != null ? `${total.successRate}%` : '—' },
    { label: 'Đánh giá', value: p?.ratingAverage != null ? `${p.ratingAverage.toFixed(1)}★` : '—' },
  ]

  const rows: { icon: LucideIcon; label: string; value?: string }[] = [
    { icon: Mail, label: 'Email', value: p?.email || user?.email },
    { icon: Phone, label: 'Số điện thoại', value: p?.phoneNumber || p?.phone },
    { icon: Bike, label: 'Biển số xe', value: p?.vehicleNumber || p?.licensePlate },
    { icon: MapPin, label: 'Khu vực', value: p?.address },
  ]

  const refresh = () => {
    void profile.refetch()
    void history.refetch()
    void status.refetch()
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-5 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={profile.isRefetching || history.isRefetching}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        <View className="items-center gap-3 rounded-panel bg-leaf-700 p-6">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-white/60 bg-sun-300">
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 80, height: 80 }} contentFit="cover" />
            ) : (
              <AppText weight="extrabold" className="text-3xl text-leaf-800">
                {name.charAt(0).toUpperCase()}
              </AppText>
            )}
          </View>
          <View className="items-center gap-1">
            <AppText weight="extrabold" numberOfLines={2} className="text-center text-xl text-white">
              {name}
            </AppText>
            <AppText className="text-sm text-leaf-100">Tài xế CapNong</AppText>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
            <View className={cn('h-2 w-2 rounded-full', online ? 'bg-sun-300' : 'bg-white/50')} />
            <AppText weight="bold" className={cn('text-xs', online ? 'text-sun-300' : 'text-leaf-100')}>
              {online ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
            </AppText>
          </View>
        </View>

        <View className="flex-row rounded-panel border border-line bg-white py-4">
          {stats.map((s, i) => (
            <View key={s.label} className={cn('flex-1 items-center gap-0.5 px-1', i > 0 && 'border-l border-line')}>
              <AppText weight="extrabold" className="text-xl text-leaf-700">
                {s.value}
              </AppText>
              <AppText className="text-center text-xs text-ink-muted">{s.label}</AppText>
            </View>
          ))}
        </View>

        <View className="rounded-panel border border-line bg-white">
          {MENU.map(({ icon: Icon, label, hint, href }, i) => (
            <Pressable
              key={href}
              onPress={() => router.push(href)}
              accessibilityRole="button"
              className={cn(
                'min-h-[64px] flex-row items-center gap-3 px-4 py-3 active:bg-leaf-50',
                i > 0 && 'border-t border-line',
              )}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-leaf-50">
                <Icon size={19} color={colors.leaf700} />
              </View>
              <View className="min-w-0 flex-1">
                <AppText weight="bold" className="text-base">
                  {label}
                </AppText>
                <AppText className="text-xs text-ink-muted">{hint}</AppText>
              </View>
              <ChevronRight size={18} color={colors.inkSubtle} />
            </Pressable>
          ))}
        </View>

        {profile.isPending ? (
          <Skeleton className="h-60 rounded-panel" />
        ) : (
          <View className="rounded-panel border border-line bg-white">
            {rows.map(({ icon: Icon, label, value }, i) => (
              <View
                key={label}
                className={cn('min-h-[60px] flex-row items-center gap-3 px-4 py-3', i > 0 && 'border-t border-line')}
              >
                <Icon size={18} color={colors.leaf700} />
                <View className="min-w-0 flex-1">
                  <AppText className="text-xs text-ink-muted">{label}</AppText>
                  <AppText weight="semibold" className={cn('text-sm', value ? 'text-ink' : 'text-ink-subtle')}>
                    {value || 'Chưa cập nhật'}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}

        <Button
          title="Đăng xuất"
          variant="outline"
          icon={LogOut}
          loading={logout.isPending}
          onPress={() => logout.mutate()}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
