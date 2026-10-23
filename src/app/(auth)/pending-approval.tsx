import { router, useLocalSearchParams } from 'expo-router'
import { CheckCircle2, Clock } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText, Button, Screen } from '@/components/ui'
import { ROLE_LABEL, type RegisterRole } from '@/features/auth'
import { colors } from '@/theme/colors'

/** Nhà Vườn / Tài Xế chờ Admin duyệt hồ sơ (mode "kyc_pending" của AuthPage bản web). */
export default function PendingApprovalScreen() {
  const { email, role = 'shop' } = useLocalSearchParams<{ email?: string; role?: RegisterRole }>()
  const isShop = role === 'shop'

  const steps = [
    { label: isShop ? 'Thông tin chủ vườn' : 'Thông tin tài xế', status: 'Đã tiếp nhận', done: true },
    { label: isShop ? 'Xác thực gian hàng' : 'Xác minh tài xế', status: 'Đang thẩm định', done: false },
  ]

  return (
    <Screen className="justify-center">
      <View className="items-center">
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-full border-4 border-sun-300 bg-sun-100">
          <Clock size={36} color={colors.leaf700} />
        </View>
        <AppText weight="extrabold" className="text-center text-2xl text-ink">
          Hồ sơ {ROLE_LABEL[role]} đang chờ duyệt
        </AppText>
        <AppText className="mt-2 text-center text-sm leading-5 text-ink-muted">
          CapNong sẽ kiểm tra và kích hoạt tài khoản trong vòng{' '}
          <AppText weight="bold" className="text-sm text-ink">
            24h – 48h
          </AppText>{' '}
          làm việc. Kết quả được gửi về {email || 'email của bạn'}.
        </AppText>
      </View>

      <View className="mt-6 gap-3 rounded-panel border border-line bg-white p-4">
        {steps.map((step) => (
          <View key={step.label} className="flex-row items-center gap-3">
            {step.done ? (
              <CheckCircle2 size={20} color={colors.leaf700} />
            ) : (
              <Clock size={20} color={colors.inkSubtle} />
            )}
            <AppText weight="semibold" className="flex-1 text-sm text-ink">
              {step.label}
            </AppText>
            <AppText className={step.done ? 'text-caption text-leaf-700' : 'text-caption text-ink-subtle'}>
              {step.status}
            </AppText>
          </View>
        ))}
      </View>

      <Button
        title="Về màn đăng nhập"
        variant="outline"
        className="mt-6"
        onPress={() => router.replace({ pathname: '/login', params: email ? { email } : {} })}
      />
    </Screen>
  )
}
