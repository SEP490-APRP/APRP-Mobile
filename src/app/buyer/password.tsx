import { router } from 'expo-router'
import { KeyRound, Lock, ShieldCheck } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { AppText, Button, Screen, TextField } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useChangePassword } from '@/features/profile'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'

/** Đổi mật khẩu, chuyển từ tab "Bảo mật" của ProfilePage bản web. */
export default function PasswordScreen() {
  const change = useChangePassword()
  const showToast = useUiStore((s) => s.showToast)
  const [form, setForm] = useState({ oldPassword: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  const submit = () => {
    const next: Partial<typeof form> = {}
    if (!form.oldPassword) next.oldPassword = 'Nhập mật khẩu hiện tại'
    if (form.password.length < 8) next.password = 'Mật khẩu mới tối thiểu 8 ký tự'
    else if (form.password === form.oldPassword) next.password = 'Mật khẩu mới phải khác mật khẩu cũ'
    if (form.confirm !== form.password) next.confirm = 'Mật khẩu xác nhận không khớp'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    change.mutate(
      { oldPassword: form.oldPassword, password: form.password },
      {
        onSuccess: () => {
          showToast('Đổi mật khẩu thành công.')
          router.back()
        },
        onError: (err) => setErrors({ oldPassword: getErrorMessage(err, 'Mật khẩu hiện tại không đúng.') }),
      },
    )
  }

  return (
    <Screen loading={change.isPending && 'Đang đổi mật khẩu'}>
      <View className="-mt-2 mb-2 flex-row items-center gap-2">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <AppText accessibilityRole="header" weight="extrabold" className="text-base">
          Đổi mật khẩu
        </AppText>
      </View>
      <View className="mb-5 flex-row gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5">
        <ShieldCheck size={18} color={colors.leaf700} />
        <AppText className="flex-1 text-xs leading-relaxed text-ink-muted">
          Dùng ít nhất 8 ký tự, nên có chữ hoa, số và ký tự đặc biệt. Không dùng lại mật khẩu của tài khoản khác.
        </AppText>
      </View>
      <View className="gap-4">
        <TextField
          label="Mật khẩu hiện tại"
          icon={Lock}
          password
          value={form.oldPassword}
          onChangeText={set('oldPassword')}
          error={errors.oldPassword}
          autoComplete="current-password"
        />
        <TextField
          label="Mật khẩu mới"
          icon={KeyRound}
          password
          value={form.password}
          onChangeText={set('password')}
          error={errors.password}
          autoComplete="new-password"
        />
        <TextField
          label="Nhập lại mật khẩu mới"
          icon={KeyRound}
          password
          value={form.confirm}
          onChangeText={set('confirm')}
          error={errors.confirm}
          autoComplete="new-password"
        />
        <Button title="Cập nhật mật khẩu" onPress={submit} className="mt-2" />
      </View>
    </Screen>
  )
}
