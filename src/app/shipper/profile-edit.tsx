import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { IdCard, Bike, Camera, Mail, MapPin, Phone, User } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading, ChoiceChips, ErrorState, TextField } from '@/components/ui'
import { cleanPhone } from '@/features/address'
import { VEHICLE_OPTIONS } from '@/features/auth'
import { BackButton } from '@/features/auth/components'
import { useMyProfile, useUpdateAvatar, useUpdateProfile } from '@/features/profile'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { normalizePlate, ruleOf, vehicleError } from '@/features/auth/constants/vehicleRules'

const PHONE_RE = /^(0|\+84)\d{9,10}$/

export default function ShipperProfileEditScreen() {
  const profile = useMyProfile()
  const update = useUpdateProfile()
  const avatar = useUpdateAvatar()
  const showToast = useUiStore((s) => s.showToast)

  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    vehicleNumber: '',
    vehicleType: 'MOTORBIKE',
    licenseClass: '',
    licenseNumber: '',
  })
  const [errors, setErrors] = useState<{ fullName?: string; phoneNumber?: string; vehicleNumber?: string; licenseClass?: string; licenseNumber?: string }>({})

  const p = profile.data

  useEffect(() => {
    if (p) {
      setForm({
        fullName: p.fullName ?? '',
        phoneNumber: p.phoneNumber || p.phone || '',
        address: p.address ?? '',
        vehicleNumber: p.vehicleNumber || p.licensePlate || '',
        vehicleType: p.vehicleType || 'MOTORBIKE',
        licenseClass: p.licenseClass ?? '',
        licenseNumber: p.license ?? '',
      })
    }
  }, [p])

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (res.canceled || !res.assets[0]) return
    const asset = res.assets[0]
    avatar.mutate(
      {
        uri: asset.uri,
        name: asset.fileName ?? `shipper-avatar-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      },
      {
        onSuccess: () => showToast('Đã cập nhật ảnh đại diện.'),
        onError: (err) => showToast(getErrorMessage(err, 'Không tải được ảnh lên. Vui lòng thử ảnh nhỏ hơn.')),
      },
    )
  }

  const handleSave = () => {
    const nextErrors: typeof errors = {}
    if (form.fullName.trim().length < 2) nextErrors.fullName = 'Vui lòng nhập họ tên'
    if (form.phoneNumber && !PHONE_RE.test(cleanPhone(form.phoneNumber))) {
      nextErrors.phoneNumber = 'Số điện thoại không hợp lệ'
    }
    // Đổi thông tin xe hoặc giấy phép thì cả bộ phải đủ điều kiện
    const vehicleChanged =
      form.vehicleType !== (p?.vehicleType || 'MOTORBIKE') ||
      normalizePlate(form.vehicleNumber) !== normalizePlate(p?.vehicleNumber || p?.licensePlate || '') ||
      form.licenseClass !== (p?.licenseClass ?? '') ||
      form.licenseNumber.trim() !== (p?.license ?? '')
    const vehicle = vehicleChanged ? vehicleError(form) : null
    if (vehicle) nextErrors[vehicle.field as 'vehicleNumber' | 'licenseClass' | 'licenseNumber'] = vehicle.message
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    update.mutate(
      {
        fullName: form.fullName.trim(),
        phoneNumber: cleanPhone(form.phoneNumber),
        address: form.address.trim(),
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        vehicleType: form.vehicleType,
        ...(vehicleChanged ? { licenseClass: form.licenseClass, license: form.licenseNumber.trim() } : {}),
      } as any,
      {
        onSuccess: () => {
          showToast('Đã cập nhật hồ sơ tài xế thành công.')
          router.back()
        },
        onError: (err) => {
          const msg = getErrorMessage(err, 'Không thể lưu thay đổi.')
          showToast(/already|PHONE_EXISTED|đã được sử dụng/i.test(msg) ? 'Số điện thoại đã được tài khoản khác sử dụng.' : msg)
        },
      },
    )
  }

  if (profile.isPending) return <CapNongLoading message="Đang tải thông tin..." />

  if (profile.isError || !p) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
          <BackButton onPress={() => router.back()} />
          <AppText weight="extrabold" className="text-base">
            Chỉnh sửa thông tin
          </AppText>
        </View>
        <View className="flex-1 justify-center p-5">
          <ErrorState description="Không tải được thông tin tài khoản." onRetry={() => void profile.refetch()} />
        </View>
      </SafeAreaView>
    )
  }

  const avatarUrl = p.logoUrl || p.avatar

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-white px-4 py-3">
        <BackButton onPress={() => router.back()} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Chỉnh sửa thông tin tài xế
        </AppText>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-4 p-4 pb-12" showsVerticalScrollIndicator={false}>
          {/* Avatar picker */}
          <View className="items-center py-2">
            <Pressable
              onPress={() => void pickAvatar()}
              disabled={avatar.isPending}
              accessibilityLabel="Đổi ảnh đại diện"
              className="relative h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-leaf-600 bg-leaf-50 active:opacity-80"
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="h-full w-full" contentFit="cover" />
              ) : (
                <AppText weight="bold" className="text-3xl text-leaf-700">
                  {form.fullName ? form.fullName.charAt(0).toUpperCase() : 'S'}
                </AppText>
              )}
              {avatar.isPending ? (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <ActivityIndicator color={colors.white} />
                </View>
              ) : (
                <View className="absolute bottom-0 inset-x-0 items-center bg-black/50 py-1">
                  <Camera size={14} color={colors.white} />
                </View>
              )}
            </Pressable>
            <AppText className="mt-2 text-xs text-ink-muted">Chạm để đổi ảnh đại diện</AppText>
          </View>

          {/* Form inputs */}
          <View className="gap-3 rounded-panel border border-line bg-white p-4">
            <TextField
              label="Họ và tên"
              icon={User}
              value={form.fullName}
              onChangeText={(txt) => setForm((prev) => ({ ...prev, fullName: txt }))}
              placeholder="Nhập họ và tên đầy đủ"
              error={errors.fullName}
            />

            <TextField
              label="Số điện thoại"
              icon={Phone}
              keyboardType="phone-pad"
              value={form.phoneNumber}
              onChangeText={(txt) => setForm((prev) => ({ ...prev, phoneNumber: txt }))}
              placeholder="0912 345 678"
              error={errors.phoneNumber}
            />

            <View className="gap-1">
              <TextField
                label="Email đăng ký (không thể đổi)"
                icon={Mail}
                value={p.email}
                editable={false}
              />
              <AppText className="text-[11px] text-ink-muted px-1">
                Email dùng để đăng nhập và nhận thông báo quan trọng.
              </AppText>
            </View>

            <ChoiceChips
              label="Loại xe"
              options={VEHICLE_OPTIONS}
              value={form.vehicleType}
              onChange={(v) => setForm((prev) => ({ ...prev, vehicleType: v }))}
            />
            <AppText className="px-1 text-[11px] text-ink-muted">
              Chỉ tài xế có xe từ 300 kg trở lên (ba gác, bán tải, xe tải) nhận được chuyến chở hàng ra hub và tiền cước chuyến.
            </AppText>

            <TextField
              label="Biển số xe giao hàng"
              icon={Bike}
              value={form.vehicleNumber}
              onChangeText={(txt) => setForm((prev) => ({ ...prev, vehicleNumber: txt.toUpperCase() }))}
              placeholder={`VD: ${ruleOf(form.vehicleType).plateExample}`}
              autoCapitalize="characters"
              error={errors.vehicleNumber}
            />

            <ChoiceChips
              label="Hạng giấy phép lái xe"
              options={ruleOf(form.vehicleType).licenses.map((l) => ({ value: l, label: `Hạng ${l}` }))}
              value={form.licenseClass}
              onChange={(v) => setForm((prev) => ({ ...prev, licenseClass: v }))}
            />
            {!!errors.licenseClass && <AppText className="px-1 text-xs text-sale">{errors.licenseClass}</AppText>}

            <TextField
              label="Số giấy phép lái xe (12 số)"
              icon={IdCard}
              value={form.licenseNumber}
              onChangeText={(txt) => setForm((prev) => ({ ...prev, licenseNumber: txt.replace(/\D/g, '') }))}
              keyboardType="number-pad"
              maxLength={12}
              error={errors.licenseNumber}
            />

            <TextField
              label="Địa chỉ thường trú / Khu vực hoạt động"
              icon={MapPin}
              value={form.address}
              onChangeText={(txt) => setForm((prev) => ({ ...prev, address: txt }))}
              placeholder="Khu vực hoạt động chính của bạn"
            />
          </View>

          <Button
            title="Lưu thay đổi"
            loading={update.isPending}
            onPress={handleSave}
            className="min-h-[48px] mt-2"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

