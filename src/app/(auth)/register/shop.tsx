import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, IdCard, Lock, Mail, MapPin, Phone, Store, User } from 'lucide-react-native'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import type { z } from 'zod'
import { AppText, Banner, Button, Screen } from '@/components/ui'
import {
  FARMING_OPTIONS,
  REGION_OPTIONS,
  REGISTER_DEFAULTS,
  shopAccountSchema,
  shopKycSchema,
} from '@/features/auth'
import { AuthHeader, BackButton, FormChoiceChips, FormTextField } from '@/features/auth/components'
import { useRegisterSubmit } from '@/features/auth/hooks/useRegisterSubmit'
import { cn } from '@/utils/helpers'

type AccountValues = z.input<typeof shopAccountSchema>
type KycValues = z.input<typeof shopKycSchema>

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <View className="mb-5 flex-row items-center gap-2">
      {(['Thông tin chủ vườn', 'Hồ sơ gian hàng'] as const).map((label, i) => (
        <View key={label} className="flex-1 gap-1.5">
          <View className={cn('h-1.5 rounded-full', i < step ? 'bg-leaf-700' : 'bg-line')} />
          <AppText
            weight={i + 1 === step ? 'bold' : 'regular'}
            className={cn('text-caption', i + 1 === step ? 'text-leaf-700' : 'text-ink-subtle')}
          >
            {i + 1}. {label}
          </AppText>
        </View>
      ))}
    </View>
  )
}

/** Đăng ký Nhà Vườn 2 bước, giữ dữ liệu bước 1 khi quay lại (shopRegisterStep của bản web). */
export default function ShopRegisterScreen() {
  const [step, setStep] = useState<1 | 2>(1)
  const { submit, error, success, isPending } = useRegisterSubmit('shop')

  const account = useForm<AccountValues>({
    resolver: zodResolver(shopAccountSchema),
    defaultValues: { fullName: '', phone: '', email: '', cccd: '', password: '', confirmPassword: '' },
  })
  const kyc = useForm<KycValues>({
    resolver: zodResolver(shopKycSchema),
    defaultValues: {
      shopName: '',
      shopAddress: '',
      shopRegion: REGISTER_DEFAULTS.shopRegion,
      shopFarmingType: REGISTER_DEFAULTS.shopFarmingType,
      shopDescription: '',
    },
  })

  const goStep2 = () => void account.handleSubmit(() => setStep(2))()
  const finish = () =>
    void kyc.handleSubmit((kycValues) =>
      submit({ ...account.getValues(), ...kycValues }),
    )()

  return (
    <Screen loading={isPending && 'Đang gửi hồ sơ'}>
      <BackButton onPress={step === 2 ? () => setStep(1) : undefined} />
      <AuthHeader
        title="Đăng ký Nhà Vườn"
        subtitle="Hồ sơ sẽ được Ban Quản Trị duyệt trong 24h – 48h làm việc"
      />
      <StepIndicator step={step} />

      <View className="gap-4">
        <Banner tone="error" message={error} />
        <Banner tone="success" message={success} />

        {step === 1 ? (
          <>
            <FormTextField control={account.control} name="fullName" label="Họ tên chủ nông hộ / người đại diện" icon={User} placeholder="Nguyễn Văn A" autoComplete="name" />
            <FormTextField control={account.control} name="phone" label="Số điện thoại" icon={Phone} placeholder="0901234567" keyboardType="phone-pad" autoComplete="tel" />
            <FormTextField control={account.control} name="email" label="Email (nhận mã OTP)" icon={Mail} placeholder="ban@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <FormTextField control={account.control} name="cccd" label="Số CCCD chủ nông hộ (12 số)" icon={IdCard} placeholder="079xxxxxxxxx" keyboardType="number-pad" maxLength={12} />
            <FormTextField control={account.control} name="password" label="Mật khẩu" icon={Lock} password placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" />
            <FormTextField control={account.control} name="confirmPassword" label="Xác nhận mật khẩu" icon={Lock} password placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
            <Button title="Tiếp tục" onPress={goStep2} className="mt-2" />
          </>
        ) : (
          <>
            <FormTextField control={kyc.control} name="shopName" label="Tên nhà vườn / gian hàng" icon={Store} placeholder="VD: Vườn rau Cầu Đất" />
            <FormTextField control={kyc.control} name="shopAddress" label="Địa chỉ nông trại / kho xuất hàng" icon={MapPin} placeholder="Cầu Đất, TP. Đà Lạt, Lâm Đồng" multiline />
            <FormChoiceChips control={kyc.control} name="shopRegion" label="Vùng trồng" options={REGION_OPTIONS} />
            <FormChoiceChips control={kyc.control} name="shopFarmingType" label="Phương thức canh tác" options={FARMING_OPTIONS} />
            <FormTextField control={kyc.control} name="shopDescription" label="Giới thiệu gian hàng (không bắt buộc)" icon={FileText} placeholder="Loại nông sản, mùa vụ, câu chuyện nhà vườn..." multiline />
            <Button title="Gửi hồ sơ đăng ký" loading={isPending} disabled={!!success} onPress={finish} className="mt-2" />
          </>
        )}
      </View>
    </Screen>
  )
}
