import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Camera, FileBadge, Landmark, MapPin, Phone, Save, Store, UserRound } from 'lucide-react-native'
import { useEffect, useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ErrorState, Skeleton, TextField } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useMyProfile, useUpdateShopProfile } from '@/features/profile'
import {
  ImageSourceSheet,
  profileToShopForm,
  SHOP_DESCRIPTION_MAX,
  toShopProfileRequest,
  uploadImageUrl,
  usePickProductImage,
  validateShopProfile,
  type ShopProfileErrors,
  type ShopProfileValues,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { UploadFile } from '@/types/upload.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

type PickTarget = 'logo' | 'license'

/** Sửa hồ sơ gian hàng, chuyển từ EditShopProfileModal bản web. */
export default function EditShopProfile() {
  const profile = useMyProfile()
  const update = useUpdateShopProfile()
  const pick = usePickProductImage()
  const showToast = useUiStore((s) => s.showToast)
  const [v, setV] = useState<ShopProfileValues>(() => profileToShopForm(null))
  const [errors, setErrors] = useState<ShopProfileErrors>({})
  const [files, setFiles] = useState<Partial<Record<PickTarget, UploadFile>>>({})
  const [sheet, setSheet] = useState<PickTarget | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded || !profile.data) return
    setV(profileToShopForm(profile.data))
    setLoaded(true)
  }, [loaded, profile.data])

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/account'))
  const change = (patch: Partial<ShopProfileValues>) => {
    setV((x) => ({ ...x, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      for (const k of Object.keys(patch) as (keyof ShopProfileValues)[]) delete next[k]
      return next
    })
  }

  const save = async () => {
    const next = validateShopProfile(v)
    setErrors(next)
    if (Object.keys(next).length > 0) return showToast('Kiểm tra lại các ô được đánh dấu đỏ nhé.')
    try {
      setUploading(true)
      const logoUrl = files.logo ? await uploadImageUrl(files.logo, 'shops') : v.logoUrl
      const licenseImageUrl = files.license ? await uploadImageUrl(files.license, 'licenses') : v.licenseImageUrl
      setUploading(false)
      await update.mutateAsync(toShopProfileRequest({ ...v, logoUrl, licenseImageUrl }))
      showToast('Đã lưu hồ sơ gian hàng.')
      goBack()
    } catch (err) {
      setUploading(false)
      const msg = getErrorMessage(err, 'Chưa lưu được hồ sơ, thử lại nhé.')
      showToast(/PHONE_EXISTED|already|đã được sử dụng/i.test(msg) ? 'Số điện thoại đã được tài khoản khác dùng.' : msg)
    }
  }

  const header = (
    <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
      <BackButton onPress={goBack} />
      <View className="flex-1">
        <AppText accessibilityRole="header" weight="extrabold" className="text-base">
          Hồ sơ gian hàng
        </AppText>
        <AppText className="text-xs text-ink-muted">Khách thấy những thông tin này ở trang vườn của bạn</AppText>
      </View>
    </View>
  )

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        {profile.isError ? (
          <ErrorState onRetry={() => void profile.refetch()} />
        ) : (
          <View className="gap-4 p-4">
            <Skeleton className="h-28 rounded-panel" />
            <Skeleton className="h-64 rounded-panel" />
          </View>
        )}
      </SafeAreaView>
    )
  }

  const logo = files.logo?.uri ?? v.logoUrl
  const license = files.license?.uri ?? v.licenseImageUrl

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-6 p-4 pb-8" keyboardShouldPersistTaps="handled">
          <View className="items-center gap-2">
            <Pressable
              onPress={() => setSheet('logo')}
              accessibilityRole="button"
              accessibilityLabel="Đổi ảnh đại diện gian hàng"
              className="h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-2 border-leaf-200 bg-sun-300"
            >
              {logo ? (
                <Image source={{ uri: logo }} contentFit="cover" style={{ width: 96, height: 96 }} />
              ) : (
                <AppText weight="extrabold" className="text-4xl text-leaf-800">
                  {(v.shopName || 'V').charAt(0).toUpperCase()}
                </AppText>
              )}
              <View className="absolute bottom-1 right-1 h-8 w-8 items-center justify-center rounded-full bg-leaf-700">
                <Camera size={15} color={colors.white} />
              </View>
            </Pressable>
            <AppText className="text-xs text-ink-muted">Chạm để đổi ảnh đại diện vườn</AppText>
          </View>

          <Section title="Gian hàng">
            <TextField
              label="Tên gian hàng *"
              icon={Store}
              value={v.shopName}
              onChangeText={(shopName) => change({ shopName })}
              placeholder="VD: Vườn cô Ba"
              maxLength={100}
              error={errors.shopName}
            />
            <View className="gap-1.5">
              <View className="flex-row justify-between">
                <AppText weight="semibold" className="text-sm text-ink">
                  Câu chuyện nhà vườn
                </AppText>
                <AppText
                  className={cn(
                    'text-xs',
                    v.description.length > SHOP_DESCRIPTION_MAX ? 'text-sale' : 'text-ink-subtle',
                  )}
                >
                  {v.description.length}/{SHOP_DESCRIPTION_MAX}
                </AppText>
              </View>
              <TextInput
                value={v.description}
                onChangeText={(description) => change({ description })}
                placeholder="Vườn của bạn ở đâu, trồng gì, vì sao bán nông sản giải cứu…"
                placeholderTextColor={colors.inkSubtle}
                accessibilityLabel="Câu chuyện nhà vườn"
                multiline
                textAlignVertical="top"
                className={cn(
                  'min-h-[110px] rounded-card border bg-white px-3.5 py-3 text-base text-ink',
                  errors.description ? 'border-sale' : 'border-line-strong',
                )}
                style={{ fontFamily: fontFamily.regular }}
              />
              {!!errors.description && <AppText className="text-caption text-sale">{errors.description}</AppText>}
            </View>
            <TextField
              label="Thành tựu, giải thưởng"
              value={v.achievement}
              onChangeText={(achievement) => change({ achievement })}
              placeholder="VD: VietGAP 2025, OCOP 3 sao"
            />
          </Section>

          <Section title="Chủ vườn và liên hệ">
            <TextField
              label="Họ tên chủ vườn *"
              icon={UserRound}
              value={v.fullName}
              onChangeText={(fullName) => change({ fullName })}
              error={errors.fullName}
            />
            <TextField
              label="Số điện thoại *"
              icon={Phone}
              value={v.phoneNumber}
              onChangeText={(phoneNumber) => change({ phoneNumber })}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
            />
            <TextField
              label="Địa chỉ vườn"
              icon={MapPin}
              value={v.address}
              onChangeText={(address) => change({ address })}
              placeholder="Thôn, xã, huyện, tỉnh"
            />
          </Section>

          <Section title="Giấy chứng nhận">
            <TextField
              label="Số giấy chứng nhận"
              icon={FileBadge}
              value={v.license}
              onChangeText={(t) => change({ license: t })}
              placeholder="VietGAP, hữu cơ, ATTP…"
            />
            <Pressable
              onPress={() => setSheet('license')}
              accessibilityRole="button"
              accessibilityLabel={license ? 'Đổi ảnh giấy chứng nhận' : 'Thêm ảnh giấy chứng nhận'}
              className={cn(
                'aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-card',
                !license && 'border-2 border-dashed border-leaf-200 bg-white',
              )}
            >
              {license ? (
                <Image source={{ uri: license }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
              ) : (
                <View className="items-center gap-1">
                  <FileBadge size={24} color={colors.leaf700} />
                  <AppText weight="bold" className="text-sm text-leaf-800">
                    Chụp giấy chứng nhận
                  </AppText>
                </View>
              )}
            </Pressable>
          </Section>

          <Section title="Tài khoản nhận tiền">
            <TextField
              label="Ngân hàng"
              icon={Landmark}
              value={v.bankName}
              onChangeText={(bankName) => change({ bankName })}
              placeholder="VD: Vietcombank"
            />
            <TextField
              label="Số tài khoản"
              value={v.bankAccount}
              onChangeText={(bankAccount) => change({ bankAccount })}
              keyboardType="number-pad"
              error={errors.bankAccount}
            />
            <TextField
              label="Chủ tài khoản"
              value={v.bankAccountHolder}
              onChangeText={(t) => change({ bankAccountHolder: t.toUpperCase() })}
              autoCapitalize="characters"
              placeholder="NGUYEN THI BA"
            />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <Button
          title={uploading ? 'Đang tải ảnh…' : 'Lưu hồ sơ'}
          icon={Save}
          loading={uploading || update.isPending}
          onPress={() => void save()}
          className="min-h-[48px]"
        />
      </View>

      <ImageSourceSheet
        visible={sheet != null}
        onClose={() => setSheet(null)}
        title={sheet === 'license' ? 'Ảnh giấy chứng nhận' : 'Ảnh đại diện vườn'}
        subtitle={sheet === 'license' ? 'Chụp rõ, đủ sáng, thấy hết chữ' : 'Logo hoặc ảnh vườn, cắt vuông'}
        onPick={(source) => {
          const target = sheet
          if (!target) return
          void pick(source, target === 'logo' ? [1, 1] : [4, 3]).then((f) => {
            if (f) setFiles((x) => ({ ...x, [target]: f }))
          })
        }}
      />
    </SafeAreaView>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-4">
      <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
        {title}
      </AppText>
      {children}
    </View>
  )
}
