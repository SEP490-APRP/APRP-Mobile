import { Link, router } from 'expo-router'
import { ShoppingBasket, Sprout, Truck } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText, Screen } from '@/components/ui'
import { AuthHeader, BackButton, RoleCard } from '@/features/auth/components'

/** Bước đầu đăng ký: chọn vai trò (thay cho thanh chọn role trong AuthPage bản web). */
export default function ChooseRoleScreen() {
  return (
    <Screen>
      <BackButton />
      <AuthHeader title="Tạo tài khoản CapNong" subtitle="Bạn tham gia CapNong với vai trò nào?" />
      <View className="gap-3">
        <RoleCard
          icon={ShoppingBasket}
          title="Khách Mua"
          description="Mua nông sản giải cứu giá tốt, giao tận nhà"
          onPress={() => router.push('/register/buyer')}
        />
        <RoleCard
          icon={Sprout}
          title="Nhà Vườn"
          description="Mở gian hàng, bán nông sản kém sắc trực tiếp"
          onPress={() => router.push('/register/shop')}
        />
        <RoleCard
          icon={Truck}
          title="Tài Xế"
          description="Nhận cuốc giao nông sản bảo ôn gần bạn"
          onPress={() => router.push('/register/shipper')}
        />
      </View>
      <View className="mt-8 flex-row justify-center">
        <AppText className="text-sm text-ink-muted">Đã có tài khoản? </AppText>
        <Link href="/login" replace asChild>
          <AppText weight="bold" className="text-sm text-leaf-700" accessibilityRole="link">
            Đăng nhập
          </AppText>
        </Link>
      </View>
    </Screen>
  )
}
