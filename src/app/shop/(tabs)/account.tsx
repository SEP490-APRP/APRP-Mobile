import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  AlertTriangle,
  ArrowDownToLine,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Boxes,
  ChevronRight,
  Clock,
  Headphones,
  Landmark,
  LogOut,
  MessageSquare,
  Package,
  PenLine,
  ShoppingBag,
  Star,
  TicketPercent,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { useLogout } from '@/features/auth'
import { money } from '@/features/product'
import { useMyProfile } from '@/features/profile'
import {
  useShopDisputes,
  useShopOrders,
  useShopReviewReport,
  useShopWallet,
} from '@/features/shop'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

interface MenuItem {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  label: string
  desc: string
  href?: string
  badge?: string | number
  onPress?: () => void
}

export default function ShopAccountTab() {
  const { user } = useAuth()
  const logout = useLogout()
  const profile = useMyProfile()
  const walletQuery = useShopWallet()
  const reviewReport = useShopReviewReport()
  const disputesQuery = useShopDisputes(0, 10, 'PENDING')
  const ordersQuery = useShopOrders({ page: 0, size: 50 })

  const p = profile.data
  const shopName = p?.shopName || p?.fullName || user?.shopName || user?.name || 'Gian hàng của bạn'
  const logo = p?.logoUrl || p?.avatar || user?.avatar
  const verified = p?.status === 'ACTIVE'

  const wallet = walletQuery.data
  const availableBalance = Math.max(0, (wallet?.balance ?? 0) - (wallet?.frozenBalance ?? 0))
  const pendingDisputes = disputesQuery.data?.totalElements ?? 0
  const avgRating = reviewReport.data?.averageRating ?? 4.8
  const totalOrders = ordersQuery.data?.totalElements ?? 0

  const refreshAll = async () => {
    await Promise.all([
      profile.refetch(),
      walletQuery.refetch(),
      reviewReport.refetch(),
      disputesQuery.refetch(),
      ordersQuery.refetch(),
    ])
  }

  // 1. Kinh doanh & Vận hành
  const OPERATION_MENU: MenuItem[] = [
    {
      icon: ShoppingBag,
      iconBg: 'bg-blue-50',
      iconColor: '#2563eb',
      label: 'Đơn hàng của bạn',
      desc: 'Quản lý đơn, chuẩn bị và bàn giao shipper',
      onPress: () => router.navigate('/shop/orders'),
    },
    {
      icon: Package,
      iconBg: 'bg-emerald-50',
      iconColor: '#059669',
      label: 'Kho nông sản & Tin đăng',
      desc: 'Nông sản lẻ, Combo rau củ và Túi mù',
      onPress: () => router.navigate('/shop/products'),
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: '#e11d48',
      label: 'Khiếu nại & Đổi trả',
      desc: 'Yêu cầu hoàn trả nông sản từ người mua',
      badge: pendingDisputes > 0 ? `${pendingDisputes} chờ duyệt` : undefined,
      href: '/shop/disputes',
    },
  ]

  // 2. Tài chính & Hiệu quả
  const FINANCE_MENU: MenuItem[] = [
    {
      icon: Wallet,
      iconBg: 'bg-purple-50',
      iconColor: '#7c3aed',
      label: 'Ví tiền & Quyết toán',
      desc: 'Số dư khả dụng, lịch sử tiền về và rút tiền',
      href: '/shop/wallet',
    },
    {
      icon: BarChart3,
      iconBg: 'bg-amber-50',
      iconColor: '#d97706',
      label: 'Báo cáo doanh thu & Mùa vụ',
      desc: 'Biểu đồ hiệu quả kinh doanh và số lượng giải cứu',
      onPress: () => router.navigate('/shop'),
    },
  ]

  // 3. Chăm sóc khách hàng
  const CUSTOMER_MENU: MenuItem[] = [
    {
      icon: Star,
      iconBg: 'bg-amber-50',
      iconColor: '#eab308',
      label: 'Đánh giá & Phản hồi',
      desc: `Điểm trung bình ${avgRating.toFixed(1)}⭐ từ khách mua`,
      href: '/shop/reviews',
    },
    {
      icon: MessageSquare,
      iconBg: 'bg-sky-50',
      iconColor: '#0284c7',
      label: 'Tin nhắn khách hàng',
      desc: 'Hộp thư tư vấn trực tuyến với người mua',
      href: '/shop/chat',
    },
    {
      icon: Headphones,
      iconBg: 'bg-teal-50',
      iconColor: '#0d9488',
      label: 'Trung tâm hỗ trợ CapNong',
      desc: 'Liên hệ Ban Quản Trị và kỹ thuật hỗ trợ',
      onPress: () =>
        router.push({
          pathname: '/shop/chat/[id]' as any,
          params: { id: '1', partnerName: 'Trung tâm hỗ trợ CapNong', partnerRole: 'ADMIN' },
        }),
    },
  ]

  // 4. Marketing & Nội dung
  const MARKETING_MENU: MenuItem[] = [
    {
      icon: TicketPercent,
      iconBg: 'bg-pink-50',
      iconColor: '#db2777',
      label: 'Mã giảm giá của vườn',
      desc: 'Tạo voucher khuyến mãi kích cầu mua sắm',
      href: '/shop/vouchers',
    },
    {
      icon: BookOpen,
      iconBg: 'bg-lime-50',
      iconColor: '#65a30d',
      label: 'Chuyện nhà vườn',
      desc: 'Viết bài chia sẻ mùa vụ và canh tác sạch',
      href: '/shop/blogs',
    },
    {
      icon: Boxes,
      iconBg: 'bg-orange-50',
      iconColor: '#ea580c',
      label: 'Tạo Combo & Túi mù mới',
      desc: 'Gói nông sản thông minh & giải cứu rau củ',
      href: '/shop/bundle',
    },
  ]

  const renderSection = (title: string, items: MenuItem[]) => (
    <View className="gap-2">
      <AppText weight="extrabold" className="px-1 text-xs text-ink-muted uppercase tracking-wider">
        {title}
      </AppText>
      <View className="overflow-hidden rounded-panel border border-line bg-white">
        {items.map((item, idx) => {
          const Icon = item.icon
          const handlePress = () => {
            if (item.onPress) item.onPress()
            else if (item.href) router.push(item.href as any)
          }

          return (
            <Pressable
              key={item.label}
              onPress={handlePress}
              accessibilityRole="button"
              className={cn(
                'min-h-[64px] flex-row items-center gap-3 px-4 py-3 active:bg-leaf-50',
                idx > 0 && 'border-t border-line',
              )}
            >
              <View className={cn('h-10 w-10 items-center justify-center rounded-xl', item.iconBg)}>
                <Icon size={20} color={item.iconColor} />
              </View>

              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-2">
                  <AppText weight="bold" className="text-sm text-ink">
                    {item.label}
                  </AppText>
                  {!!item.badge && (
                    <View className="rounded-full bg-sale px-2 py-0.5">
                      <AppText weight="extrabold" className="text-[10px] text-white">
                        {item.badge}
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText numberOfLines={1} className="text-xs text-ink-muted">
                  {item.desc}
                </AppText>
              </View>

              <ChevronRight size={17} color={colors.inkSubtle} />
            </Pressable>
          )
        })}
      </View>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={profile.isRefetching || walletQuery.isRefetching}
            onRefresh={refreshAll}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {/* Hero Card Nhà Vườn (phong cách CapNong_Exe2 QuanTab) */}
        <View className="items-center gap-3 rounded-panel bg-leaf-700 p-6 shadow-sm">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-white/60 bg-sun-300 shadow-sm">
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
              <AppText className="text-xs text-leaf-100">Chủ vườn: {p.fullName}</AppText>
            )}
          </View>

          {/* Sub-hero badge info */}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-3 py-1">
              {verified ? <BadgeCheck size={14} color={colors.sun300} /> : <Clock size={14} color={colors.sun300} />}
              <AppText weight="bold" className="text-xs text-sun-300">
                {verified ? 'Gian hàng đã xác thực' : 'Chờ duyệt'}
              </AppText>
            </View>

            <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-3 py-1">
              <Star size={13} color="#fde047" fill="#fde047" />
              <AppText weight="bold" className="text-xs text-white">
                {avgRating.toFixed(1)} · {totalOrders} đơn
              </AppText>
            </View>
          </View>
        </View>

        {/* Quick Wallet Widget (Ví tiền & Rút tiền nhanh) */}
        <Pressable
          onPress={() => router.push('/shop/wallet' as any)}
          className="rounded-panel border border-leaf-200 bg-gradient-to-r from-leaf-50 to-white p-4 active:bg-leaf-100/50 shadow-xs"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-leaf-700">
                <Wallet size={18} color="#ffffff" />
              </View>
              <View>
                <AppText weight="bold" className="text-xs text-ink-muted">
                  Ví tiền gian hàng
                </AppText>
                <AppText weight="extrabold" className="text-xl text-leaf-800">
                  {walletQuery.isLoading ? '...' : money(availableBalance)}
                </AppText>
              </View>
            </View>

            <View className="flex-row items-center gap-1 rounded-xl bg-leaf-700 px-3 py-2">
              <ArrowDownToLine size={15} color="#ffffff" />
              <AppText weight="bold" className="text-xs text-white">
                Vào ví
              </AppText>
            </View>
          </View>
          {(wallet?.frozenBalance ?? 0) > 0 && (
            <View className="mt-2.5 border-t border-leaf-100 pt-2 flex-row justify-between">
              <AppText className="text-[11px] text-ink-subtle">Tạm giữ theo đơn đang giao:</AppText>
              <AppText weight="semibold" className="text-[11px] text-amber-700">
                {money(wallet?.frozenBalance ?? 0)}
              </AppText>
            </View>
          )}
        </Pressable>

        {/* Nút sửa nhanh hồ sơ */}
        <Button
          title="Sửa thông tin hồ sơ gian hàng"
          variant="outline"
          icon={PenLine}
          onPress={() => router.push('/shop/profile-edit')}
        />

        {/* Các Nhóm Chức Năng Phân Hệ */}
        {renderSection('Kinh doanh & Vận hành', OPERATION_MENU)}
        {renderSection('Tài chính & Quyết toán', FINANCE_MENU)}
        {renderSection('Chăm sóc khách hàng', CUSTOMER_MENU)}
        {renderSection('Khuyến mãi & Nội dung', MARKETING_MENU)}

        {/* Thông tin tài khoản ngân hàng liên kết */}
        <View className="gap-2">
          <AppText weight="extrabold" className="px-1 text-xs text-ink-muted uppercase tracking-wider">
            Tài khoản ngân hàng thụ hưởng
          </AppText>
          <View className="rounded-panel border border-line bg-white p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-paper">
                <Landmark size={20} color={colors.leaf700} />
              </View>
              <View className="min-w-0 flex-1">
                <AppText weight="bold" className="text-sm text-ink">
                  {p?.bankName || 'Chưa thiết lập ngân hàng'}
                </AppText>
                <AppText className="text-xs text-ink-muted">
                  {p?.bankAccountNumber || p?.bankAccount || 'Vui lòng cập nhật để rút tiền'}
                </AppText>
              </View>
              <Pressable onPress={() => router.push('/shop/profile-edit')}>
                <AppText weight="bold" className="text-xs text-leaf-700">
                  {p?.bankAccountNumber ? 'Sửa' : 'Thêm'}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Đăng Xuất */}
        <Button
          title="Đăng xuất tài khoản"
          variant="outline"
          icon={LogOut}
          loading={logout.isPending}
          onPress={() => logout.mutate()}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
