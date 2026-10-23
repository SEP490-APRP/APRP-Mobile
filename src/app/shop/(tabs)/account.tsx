import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  BadgeCheck,
  BookOpen,
  ChevronRight,
  Clock,
  Landmark,
  LogOut,
  Mail,
  MapPin,
  PenLine,
  Phone,
  TicketPercent,
  type LucideIcon,
} from 'lucide-react-native'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { useLogout } from '@/features/auth'
import { useMyProfile } from '@/features/profile'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'

const TOOLS = [
  { icon: TicketPercent, label: 'Mã giảm giá', hint: 'Tạo, tạm dừng mã ưu đãi của vườn', href: '/shop/vouchers' },
  { icon: BookOpen, label: 'Chuyện nhà vườn', hint: 'Viết bài kể chuyện mùa vụ cho khách', href: '/shop/blogs' },
] as const

/** Tab Gian hàng: thẻ gian hàng, thông tin liên hệ và đăng xuất (phần hồ sơ ở chân sidebar bản web). */
export default function ShopAccountTab() {
  const { user } = useAuth()
  const logout = useLogout()
  const profile = useMyProfile()
  const p = profile.data
  const shopName = p?.shopName || p?.fullName || user?.shopName || user?.name || 'Gian hàng của bạn'
  const logo = p?.logoUrl || p?.avatar || user?.avatar
  const verified = p?.status === 'ACTIVE'
  const bank = [p?.bankName, p?.bankAccountNumber || p?.bankAccount].filter(Boolean).join(' · ')

  const rows: { icon: LucideIcon; label: string; value?: string }[] = [
    { icon: Mail, label: 'Email', value: p?.email || user?.email },
    { icon: Phone, label: 'Số điện thoại', value: p?.phoneNumber || p?.phone || user?.phone },
    { icon: MapPin, label: 'Địa chỉ vườn', value: p?.address || user?.address },
    { icon: Landmark, label: 'Tài khoản nhận tiền', value: bank },
  ]

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
        <View className="items-center gap-3 rounded-panel bg-leaf-700 p-6">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-white/60 bg-sun-300">
            {logo ? (
              <Image source={{ uri: logo }} style={{ width: 80, height: 80 }} contentFit="cover" />
            ) : (
              <AppText weight="extrabold" className="text-3xl text-leaf-800">
                {shopName.charAt(0).toUpperCase()}
              </AppText>
            )}
          </View>
          <View className="items-center gap-1">
            <AppText weight="extrabold" numberOfLines={2} className="text-center text-xl text-white">
              {shopName}
            </AppText>
            {!!p?.fullName && p.fullName !== shopName && (
              <AppText className="text-sm text-leaf-100">Chủ vườn: {p.fullName}</AppText>
            )}
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
            {verified ? <BadgeCheck size={14} color={colors.sun300} /> : <Clock size={14} color={colors.sun300} />}
            <AppText weight="bold" className="text-xs text-sun-300">
              {verified ? 'Gian hàng đã xác thực' : 'Hồ sơ đang chờ xác thực'}
            </AppText>
          </View>
        </View>

        <Button
          title="Sửa hồ sơ gian hàng"
          variant="outline"
          icon={PenLine}
          onPress={() => router.push('/shop/profile-edit')}
        />

        <View className="rounded-panel border border-line bg-white">
          {TOOLS.map(({ icon: Icon, label, hint, href }, i) => (
            <Pressable
              key={href}
              onPress={() => router.push(href)}
              accessibilityRole="button"
              className={`min-h-[64px] flex-row items-center gap-3 px-4 py-3 active:bg-leaf-50 ${i > 0 ? 'border-t border-line' : ''}`}
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

        {!!p?.description && (
          <View className="gap-1.5 rounded-panel border border-line bg-white p-4">
            <AppText weight="bold" className="text-sm">
              Giới thiệu
            </AppText>
            <AppText className="text-sm leading-relaxed text-ink-muted">{p.description}</AppText>
          </View>
        )}

        <View className="rounded-panel border border-line bg-white">
          {rows.map(({ icon: Icon, label, value }, i) => (
            <View
              key={label}
              className={`min-h-[60px] flex-row items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line' : ''}`}
            >
              <Icon size={18} color={colors.leaf700} />
              <View className="min-w-0 flex-1">
                <AppText className="text-xs text-ink-muted">{label}</AppText>
                <AppText weight="semibold" className={`text-sm ${value ? 'text-ink' : 'text-ink-subtle'}`}>
                  {value || 'Chưa cập nhật'}
                </AppText>
              </View>
            </View>
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
