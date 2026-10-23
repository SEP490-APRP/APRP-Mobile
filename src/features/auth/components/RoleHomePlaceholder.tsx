import { LogOut, type LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText, Button, Screen } from '@/components/ui'
import { useLogout } from '@/features/auth'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'

/**
 * Trang chủ tạm cho từng vai trò ở giai đoạn 1, để kiểm tra đăng nhập vào đúng khu vực.
 * Các giai đoạn sau thay bằng tabs theo danh sách màn hình trong README.
 */
export function RoleHomePlaceholder({
  icon: Icon,
  area,
  upcoming,
}: {
  icon: LucideIcon
  area: string
  upcoming: string[]
}) {
  const { user } = useAuth()
  const logout = useLogout()
  return (
    <Screen>
      <View className="rounded-panel bg-leaf-700 p-5">
        <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-sun-300">
          <Icon size={24} color={colors.leaf800} />
        </View>
        <AppText className="text-sm text-leaf-100">Xin chào,</AppText>
        <AppText weight="extrabold" className="text-2xl text-white">
          {user?.name}
        </AppText>
        <AppText className="mt-1 text-sm text-sun-300">{user?.detail ?? area}</AppText>
      </View>

      <View className="mt-5 gap-2 rounded-panel border border-line bg-white p-4">
        <AppText weight="bold" className="text-base text-ink">
          {area} · sắp có trong bản tiếp theo
        </AppText>
        {upcoming.map((item) => (
          <AppText key={item} className="text-sm text-ink-muted">
            • {item}
          </AppText>
        ))}
      </View>

      <Button
        title="Đăng xuất"
        variant="outline"
        icon={LogOut}
        loading={logout.isPending}
        onPress={() => logout.mutate()}
        className="mt-6"
      />
    </Screen>
  )
}
