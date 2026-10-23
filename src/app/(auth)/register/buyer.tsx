import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Mail, MapPin, Phone, User } from 'lucide-react-native'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import type { z } from 'zod'
import { Banner, Button, Screen } from '@/components/ui'
import { DIET_OPTIONS, REGISTER_DEFAULTS, buyerRegisterSchema } from '@/features/auth'
import { AuthHeader, BackButton, FormChoiceChips, FormTextField } from '@/features/auth/components'
import { useRegisterSubmit } from '@/features/auth/hooks/useRegisterSubmit'

type BuyerValues = z.input<typeof buyerRegisterSchema>

export default function BuyerRegisterScreen() {
  const { submit, error, success, isPending } = useRegisterSubmit('buyer')
  const { control, handleSubmit } = useForm<BuyerValues>({
    resolver: zodResolver(buyerRegisterSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      buyerAddress: '',
      dietPreference: REGISTER_DEFAULTS.dietPreference,
      password: '',
      confirmPassword: '',
    },
  })

  return (
    <Screen loading={isPending && 'Đang tạo tài khoản'}>
      <BackButton />
      <AuthHeader title="Đăng ký Khách Mua" subtitle="Thông tin cá nhân và địa chỉ nhận hàng" />
      <View className="gap-4">
        <Banner tone="error" message={error} />
        <Banner tone="success" message={success} />

        <FormTextField control={control} name="fullName" label="Họ và tên" icon={User} placeholder="Nguyễn Văn A" autoComplete="name" />
        <FormTextField control={control} name="phone" label="Số điện thoại" icon={Phone} placeholder="0901234567" keyboardType="phone-pad" autoComplete="tel" />
        <FormTextField control={control} name="email" label="Email (nhận mã OTP)" icon={Mail} placeholder="ban@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <FormTextField control={control} name="buyerAddress" label="Địa chỉ nhận hàng" icon={MapPin} placeholder="Số nhà, đường, phường, quận/huyện, tỉnh" multiline />
        <FormChoiceChips control={control} name="dietPreference" label="Chế độ ăn" options={DIET_OPTIONS} />
        <FormTextField control={control} name="password" label="Mật khẩu" icon={Lock} password placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" />
        <FormTextField control={control} name="confirmPassword" label="Xác nhận mật khẩu" icon={Lock} password placeholder="Nhập lại mật khẩu" autoComplete="new-password" />

        <Button title="Đăng ký" loading={isPending} disabled={!!success} onPress={() => void handleSubmit(submit)()} className="mt-2" />
      </View>
    </Screen>
  )
}
