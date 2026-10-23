import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { Camera, Home, Mail, Phone, User } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading, ChoiceChips, ErrorState, TextField } from '@/components/ui'
import { cleanPhone } from '@/features/address'
import { BackButton } from '@/features/auth/components'
import { useMyProfile, useUpdateAvatar, useUpdateProfile, type ProfileUpdate } from '@/features/profile'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'

const DIETS = [
  { value: 'NON_VEGETARIAN', label: 'Ăn mặn' },
  { value: 'VEGETARIAN', label: 'Ăn chay' },
  { value: 'VEGAN', label: 'Thuần chay' },
]
const PHONE_RE = /^(0|\+84)\d{9,10}$/

type Diet = NonNullable<ProfileUpdate['dietPreference']>

/** Hồ sơ cá nhân, chuyển từ tab "Tài khoản" của ProfilePage bản web. */
export default function ProfileScreen() {
  const profile = useMyProfile()
  const update = useUpdateProfile()
  const avatar = useUpdateAvatar()
  const showToast = useUiStore((s) => s.showToast)
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', address: '', dietPreference: 'NON_VEGETARIAN' as Diet })
  const [errors, setErrors] = useState<{ fullName?: string; phoneNumber?: string }>({})

  const p = profile.data
  useEffect(() => {
    if (p)
      setForm({
        fullName: p.fullName ?? '',
        phoneNumber: p.phoneNumber || p.phone || '',
        address: p.address ?? '',
        dietPreference: p.dietPreference ?? 'NON_VEGETARIAN',
      })
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
      { uri: asset.uri, name: asset.fileName ?? `avatar-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' },
      {
        onSuccess: () => showToast('Đã cập nhật ảnh đại diện.'),
        onError: (err) => showToast(getErrorMessage(err, 'Không tải được ảnh lên. Vui lòng thử ảnh nhỏ hơn.')),
      },
    )
  }

  const save = () => {
    const next: typeof errors = {}
    if (form.fullName.trim().length < 2) next.fullName = 'Vui lòng nhập họ tên'
    if (form.phoneNumber && !PHONE_RE.test(cleanPhone(form.phoneNumber))) next.phoneNumber = 'Số điện thoại không hợp lệ'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    update.mutate(
      { ...form, fullName: form.fullName.trim(), phoneNumber: cleanPhone(form.phoneNumber), address: form.address.trim() },
      {
        onSuccess: () => showToast('Đã lưu thông tin tài khoản.'),
        onError: (err) => {
          const msg = getErrorMessage(err, 'Không thể lưu thay đổi.')
          showToast(/already|PHONE_EXISTED|đã được sử dụng/i.test(msg) ? 'Số điện thoại đã được tài khoản khác sử dụng.' : msg)
        },
      },
    )
  }

  const header = (
    <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer/account'))} />
      <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
        Hồ sơ cá nhân
      </AppText>
    </View>
  )

  if (profile.isPending) return <CapNongLoading message="Đang tải hồ sơ" />
  if (profile.isError || !p) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        <View className="flex-1 justify-center p-5">
          <ErrorState description="Không tải được thông tin tài khoản." onRetry={() => void profile.refetch()} />
        </View>
      </SafeAreaView>
    )
  }

  const photo = p.logoUrl || p.avatar
  const set = (key: 'fullName' | 'phoneNumber' | 'address') => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 p-4 pb-8">
          <View className="items-center gap-2 py-2">
            <Pressable
              onPress={() => void pickAvatar()}
              disabled={avatar.isPending}
              accessibilityRole="button"
              accessibilityLabel="Đổi ảnh đại diện"
            >
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-leaf-700">
                {photo ? (
                  <Image source={{ uri: photo }} style={{ width: 96, height: 96 }} contentFit="cover" />
                ) : (
                  <AppText weight="extrabold" className="text-3xl text-white">
                    {(form.fullName || 'C').charAt(0).toUpperCase()}
                  </AppText>
                )}
                {avatar.isPending && (
                  <View className="absolute inset-0 items-center justify-center bg-black/40">
                    <ActivityIndicator color={colors.white} />
                  </View>
                )}
              </View>
              <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-leaf-700">
                <Camera size={15} color={colors.white} />
              </View>
            </Pressable>
            <AppText className="text-xs text-ink-muted">Chạm để đổi ảnh đại diện</AppText>
          </View>

          <View className="gap-4 rounded-panel border border-line bg-white p-4">
            <TextField label="Email" icon={Mail} value={p.email} editable={false} />
            <TextField label="Họ và tên" icon={User} value={form.fullName} onChangeText={set('fullName')} error={errors.fullName} autoComplete="name" />
            <TextField
              label="Số điện thoại"
              icon={Phone}
              value={form.phoneNumber}
              onChangeText={set('phoneNumber')}
              error={errors.phoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <TextField label="Địa chỉ" icon={Home} value={form.address} onChangeText={set('address')} multiline />
            <ChoiceChips
              label="Chế độ ăn (để gợi ý combo phù hợp)"
              options={DIETS}
              value={form.dietPreference}
              onChange={(v) => setForm((f) => ({ ...f, dietPreference: v as Diet }))}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View className="border-t border-line bg-white px-4 pt-3">
        <Button title="Lưu thay đổi" loading={update.isPending} onPress={save} />
      </View>
    </SafeAreaView>
  )
}
