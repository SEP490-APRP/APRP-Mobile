import { zodResolver } from '@hookform/resolvers/zod'
import { Bike, IdCard, Lock, Mail, MapPin, Phone, User } from 'lucide-react-native'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import type { z } from 'zod'
import { Banner, Button, Screen } from '@/components/ui'
import { REGISTER_DEFAULTS, VEHICLE_OPTIONS, shipperRegisterSchema } from '@/features/auth'
import { AuthHeader, BackButton, FormChoiceChips, FormTextField } from '@/features/auth/components'
import { useRegisterSubmit } from '@/features/auth/hooks/useRegisterSubmit'

type ShipperValues = z.input<typeof shipperRegisterSchema>

export default function ShipperRegisterScreen() {
  const { submit, error, success, isPending } = useRegisterSubmit('shipper')
  const { control, handleSubmit } = useForm<ShipperValues>({
    resolver: zodResolver(shipperRegisterSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      cccd: '',
      vehicleNumber: '',
      shipperArea: '',
      shipperVehicle: REGISTER_DEFAULTS.shipperVehicle,
      password: '',
      confirmPassword: '',
    },
  })

  return (
    <Screen loading={isPending && 'Đang tạo tài khoản'}>
      <BackButton />
      <AuthHeader
        title="Đăng ký Tài Xế"
        subtitle="Hồ sơ sẽ được Ban Quản Trị duyệt sau khi bạn xác thực OTP"
      />
      <View className="gap-4">
        <Banner tone="error" message={error} />
        <Banner tone="success" message={success} />

        <FormTextField control={control} name="fullName" label="Họ và tên tài xế" icon={User} placeholder="Nguyễn Văn A" autoComplete="name" />
        <FormTextField control={control} name="phone" label="Số điện thoại" icon={Phone} placeholder="0901234567" keyboardType="phone-pad" autoComplete="tel" />
        <FormTextField control={control} name="email" label="Email (nhận mã OTP)" icon={Mail} placeholder="ban@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <FormTextField control={control} name="cccd" label="Số CCCD (12 số)" icon={IdCard} placeholder="079xxxxxxxxx" keyboardType="number-pad" maxLength={12} />
        <FormChoiceChips control={control} name="shipperVehicle" label="Loại phương tiện" options={VEHICLE_OPTIONS} />
        <FormTextField control={control} name="vehicleNumber" label="Biển số xe" icon={Bike} placeholder="59-A1 123.45" autoCapitalize="characters" />
        <FormTextField control={control} name="shipperArea" label="Khu vực hoạt động" icon={MapPin} placeholder="VD: Quận 7, TP. Hồ Chí Minh" />
        <FormTextField control={control} name="password" label="Mật khẩu" icon={Lock} password placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" />
        <FormTextField control={control} name="confirmPassword" label="Xác nhận mật khẩu" icon={Lock} password placeholder="Nhập lại mật khẩu" autoComplete="new-password" />

        <Button title="Đăng ký Tài Xế" loading={isPending} disabled={!!success} onPress={() => void handleSubmit(submit)()} className="mt-2" />
      </View>
    </Screen>
  )
}
