import { zodResolver } from '@hookform/resolvers/zod'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { FileText, IdCard, Lock, Mail, MapPin, Phone, Store, Upload, User, X } from 'lucide-react-native'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ActivityIndicator, Pressable, View } from 'react-native'
import type { z } from 'zod'
import { AppText, Banner, Button, Screen, TextField } from '@/components/ui'
import {
  FARMING_OPTIONS,
  REGION_OPTIONS,
  REGISTER_DEFAULTS,
  shopAccountSchema,
  shopKycSchema,
} from '@/features/auth'
import { AuthHeader, BackButton, FormAddressField, FormChoiceChips, FormTextField } from '@/features/auth/components'
import { useRegisterSubmit } from '@/features/auth/hooks/useRegisterSubmit'
import { uploadService } from '@/services'
import { colors } from '@/theme/colors'
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
  const [customRegion, setCustomRegion] = useState('')
  const [customFarming, setCustomFarming] = useState('')
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [certPreview, setCertPreview] = useState<string>('')
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingCert, setIsUploadingCert] = useState(false)
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

  const currentRegion = kyc.watch('shopRegion')
  const currentFarmingType = kyc.watch('shopFarmingType')

  const pickLogo = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      })
      if (res.canceled || !res.assets[0]) return
      const asset = res.assets[0]
      setIsUploadingLogo(true)
      try {
        const uploadRes = await uploadService.uploadImage(
          {
            uri: asset.uri,
            name: asset.fileName ?? `logo-${Date.now()}.jpg`,
            type: asset.mimeType ?? 'image/jpeg',
          },
          'shops',
        )
        setLogoPreview(uploadRes.result?.url || asset.uri)
      } catch (err) {
        console.warn('Lỗi upload logo lên BE, dùng asset URI:', err)
        setLogoPreview(asset.uri)
      }
    } catch (err) {
      console.warn('Lỗi chọn ảnh logo:', err)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const pickCert = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      })
      if (res.canceled || !res.assets[0]) return
      const asset = res.assets[0]
      setIsUploadingCert(true)
      try {
        const uploadRes = await uploadService.uploadImage(
          {
            uri: asset.uri,
            name: asset.fileName ?? `cert-${Date.now()}.jpg`,
            type: asset.mimeType ?? 'image/jpeg',
          },
          'certificates',
        )
        setCertPreview(uploadRes.result?.url || asset.uri)
      } catch (err) {
        console.warn('Lỗi upload chứng nhận lên BE, dùng asset URI:', err)
        setCertPreview(asset.uri)
      }
    } catch (err) {
      console.warn('Lỗi chọn ảnh chứng nhận:', err)
    } finally {
      setIsUploadingCert(false)
    }
  }

  const goStep2 = () => void account.handleSubmit(() => setStep(2))()
  const finish = () =>
    void kyc.handleSubmit((kycValues) => {
      const finalRegion =
        kycValues.shopRegion === 'Khác' ? customRegion.trim() || 'Khác' : kycValues.shopRegion
      const finalFarming =
        kycValues.shopFarmingType === 'Khác'
          ? customFarming.trim() || 'Khác'
          : kycValues.shopFarmingType
      submit({
        ...account.getValues(),
        ...kycValues,
        shopRegion: finalRegion,
        shopFarmingType: finalFarming,
        logoUrl: logoPreview || undefined,
        licenseImageUrl: certPreview || undefined,
      })
    })()

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
            <FormAddressField control={kyc.control} name="shopAddress" label="Địa chỉ nông trại / kho xuất hàng" icon={MapPin} placeholder="Cầu Đất, TP. Đà Lạt, Lâm Đồng" multiline />
            <FormChoiceChips control={kyc.control} name="shopRegion" label="Vùng trồng" options={REGION_OPTIONS} />
            {currentRegion === 'Khác' && (
              <TextField
                label="Vùng trồng khác"
                icon={MapPin}
                placeholder="Nhập tên khu vực / vùng trồng khác"
                value={customRegion}
                onChangeText={setCustomRegion}
              />
            )}
            <FormChoiceChips control={kyc.control} name="shopFarmingType" label="Phương thức canh tác" options={FARMING_OPTIONS} />
            {currentFarmingType === 'Khác' && (
              <TextField
                label="Phương thức canh tác khác"
                placeholder="Nhập phương thức canh tác khác"
                value={customFarming}
                onChangeText={setCustomFarming}
              />
            )}
            <FormTextField control={kyc.control} name="shopDescription" label="Giới thiệu gian hàng (không bắt buộc)" icon={FileText} placeholder="Loại nông sản, mùa vụ, câu chuyện nhà vườn..." multiline />

            {/* Logo Vườn & Chứng Nhận VietGAP */}
            <View className="flex-row gap-3">
              {/* Logo Vườn */}
              {logoPreview ? (
                <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-leaf-700 bg-leaf-50 p-2.5">
                  <Image source={{ uri: logoPreview }} className="h-10 w-10 rounded-xl" contentFit="cover" />
                  <View className="flex-1 ml-2">
                    <AppText weight="bold" className="text-caption text-leaf-800">
                      Logo vườn
                    </AppText>
                    <Pressable onPress={pickLogo}>
                      <AppText className="text-xs text-leaf-700 underline">Đổi ảnh</AppText>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => setLogoPreview('')} className="p-1">
                    <X size={16} color={colors.inkSubtle} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  disabled={isUploadingLogo}
                  onPress={pickLogo}
                  className="flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-white p-3 active:bg-paper"
                >
                  {isUploadingLogo ? (
                    <ActivityIndicator size="small" color={colors.leaf700} />
                  ) : (
                    <Upload size={18} color={colors.inkSubtle} />
                  )}
                  <AppText weight="bold" className="mt-1 text-caption text-ink-muted">
                    {isUploadingLogo ? 'Đang tải...' : '+ Tải Logo Vườn'}
                  </AppText>
                </Pressable>
              )}

              {/* Chứng Nhận VietGAP */}
              {certPreview ? (
                <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-leaf-700 bg-leaf-50 p-2.5">
                  <Image source={{ uri: certPreview }} className="h-10 w-10 rounded-xl" contentFit="cover" />
                  <View className="flex-1 ml-2">
                    <AppText weight="bold" className="text-caption text-leaf-800">
                      Chứng nhận
                    </AppText>
                    <Pressable onPress={pickCert}>
                      <AppText className="text-xs text-leaf-700 underline">Đổi ảnh</AppText>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => setCertPreview('')} className="p-1">
                    <X size={16} color={colors.inkSubtle} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  disabled={isUploadingCert}
                  onPress={pickCert}
                  className="flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-white p-3 active:bg-paper"
                >
                  {isUploadingCert ? (
                    <ActivityIndicator size="small" color={colors.leaf700} />
                  ) : (
                    <FileText size={18} color={colors.inkSubtle} />
                  )}
                  <AppText weight="bold" className="mt-1 text-caption text-ink-muted">
                    {isUploadingCert ? 'Đang tải...' : '+ Tải Chứng Nhận'}
                  </AppText>
                </Pressable>
              )}
            </View>

            <Button title="Gửi hồ sơ đăng ký" loading={isPending} disabled={!!success} onPress={finish} className="mt-2" />
          </>
        )}
      </View>
    </Screen>
  )
}
