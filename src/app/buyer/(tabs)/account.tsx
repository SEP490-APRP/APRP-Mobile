import { Image } from 'expo-image'
import { router, type Href } from 'expo-router'
import {
  BookOpen,
  ChevronRight,
  CircleCheckBig,
  Clock,
  CreditCard,
  KeyRound,
  LogOut,
  MapPin,
  Sprout,
  Ticket,
  Truck,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { useLogout } from '@/features/auth'
import type { OrderTab } from '@/features/order'
import { rescueTier, useMyProfile } from '@/features/profile'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'

const ORDER_SHORTCUTS: { tab: OrderTab; icon: LucideIcon; label: string }[] = [
  { tab: 'AWAITING_PAYMENT', icon: CreditCard, label: 'Chờ thanh toán' },
  { tab: 'PENDING', icon: Clock, label: 'Chờ xác nhận' },
  { tab: 'SHIPPING', icon: Truck, label: 'Đang giao' },
  { tab: 'COMPLETED', icon: CircleCheckBig, label: 'Hoàn thành' },
]

const MENU: { icon: LucideIcon; label: string; href: Href }[] = [
  { icon: UserRound, label: 'Hồ sơ cá nhân', href: '/buyer/profile' },
  { icon: MapPin, label: 'Sổ địa chỉ', href: '/buyer/addresses' },
  { icon: Ticket, label: 'Kho voucher của tôi', href: '/buyer/vouchers' },
  { icon: BookOpen, label: 'Chuyện nhà nông', href: '/buyer/stories' },
  { icon: KeyRound, label: 'Đổi mật khẩu', href: '/buyer/password' },
]

/** Tab Tài khoản: thẻ hồ sơ kèm danh hiệu giải cứu, lối tắt đơn hàng và các mục cài đặt. */
export default function AccountTab() {
  const { user } = useAuth()
  const logout = useLogout()
  const profile = useMyProfile()
  const p = profile.data
  const name = p?.fullName || user?.name || 'Thành viên CapNong'
  const avatar = p?.logoUrl || p?.avatar || user?.avatar
  const kg = Number(p?.totalRescuedWeight ?? 0)
  const tier = rescueTier(kg)

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-5 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={profile.isRefetching}
            onRefresh={() => void profile.refetch()}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {/* Thẻ hồ sơ */}
        <Pressable
          onPress={() => router.push('/buyer/profile')}
          accessibilityRole="button"
          accessibilityLabel="Xem hồ sơ cá nhân"
          className="gap-4 rounded-panel bg-leaf-700 p-5"
        >
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/60 bg-sun-300">
              {avatar ? (
                <Image source={{ uri: avatar }} style={{ width: 64, height: 64 }} contentFit="cover" />
              ) : (
                <AppText weight="extrabold" className="text-2xl text-leaf-800">
                  {name.charAt(0).toUpperCase()}
                </AppText>
              )}
            </View>
            <View className="min-w-0 flex-1">
              <AppText weight="extrabold" numberOfLines={1} className="text-xl text-white">
                {name}
              </AppText>
              <AppText numberOfLines={1} className="text-sm text-leaf-100">
                {p?.email || user?.email}
              </AppText>
              <View className="mt-1.5 self-start rounded-full bg-white/15 px-2.5 py-0.5">
                <AppText weight="bold" className="text-xs text-sun-300">
                  {tier.emoji} {tier.title}
                </AppText>
              </View>
            </View>
            <ChevronRight size={20} color={colors.white} />
          </View>
          <View className="gap-1.5 rounded-2xl bg-white/10 p-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Sprout size={14} color={colors.sun300} />
                <AppText weight="semibold" className="text-xs text-leaf-100">
                  Đã giải cứu {kg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} kg nông sản
                </AppText>
              </View>
              <AppText weight="bold" className="text-xs text-white">
                {tier.progress}%
              </AppText>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-white/20">
              <View className="h-full rounded-full bg-sun-300" style={{ width: `${tier.progress}%` }} />
            </View>
            <AppText className="text-xs text-leaf-100">
              {tier.progress >= 100 && kg >= 50 ? tier.next : `Hạng kế tiếp: ${tier.next}`}
            </AppText>
          </View>
        </Pressable>

        {/* Lối tắt đơn hàng */}
        <View className="rounded-panel border border-line bg-white p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <AppText weight="bold" className="text-base">
              Đơn hàng của tôi
            </AppText>
            <Pressable onPress={() => router.navigate('/buyer/orders')} accessibilityRole="link" hitSlop={8}>
              <AppText weight="semibold" className="text-sm text-leaf-700">
                Xem tất cả
              </AppText>
            </Pressable>
          </View>
          <View className="flex-row">
            {ORDER_SHORTCUTS.map(({ tab, icon: Icon, label }) => (
              <Pressable
                key={tab}
                onPress={() => router.navigate({ pathname: '/buyer/orders', params: { tab } })}
                accessibilityRole="button"
                className="flex-1 items-center gap-1.5 rounded-xl py-2 active:bg-leaf-50"
              >
                <Icon size={24} color={colors.leaf700} />
                <AppText className="text-center text-xs text-ink-muted">{label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Cài đặt */}
        <View className="overflow-hidden rounded-panel border border-line bg-white">
          {MENU.map(({ icon: Icon, label, href }, i) => (
            <Pressable
              key={label}
              onPress={() => router.push(href)}
              accessibilityRole="button"
              className={`min-h-[56px] flex-row items-center gap-3 px-4 active:bg-paper ${i > 0 ? 'border-t border-line' : ''}`}
            >
              <Icon size={20} color={colors.leaf700} />
              <AppText className="flex-1 text-sm">{label}</AppText>
              <ChevronRight size={16} color={colors.inkSubtle} />
            </Pressable>
          ))}
        </View>

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
