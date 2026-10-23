import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { Lock, LogIn, Mail } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { View, type TextInputInstance } from 'react-native'
import { AppText, Banner, Button, Screen } from '@/components/ui'
import { AuthHeader, FormTextField } from '@/features/auth/components'
import {
  isNotVerifiedError,
  loginErrorMessage,
  mobileLoginSchema,
  useLogin,
  type LoginValues,
} from '@/features/auth'

export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const passwordRef = useRef<TextInputInstance>(null)
  const [error, setError] = useState('')
  const login = useLogin()

  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(mobileLoginSchema),
    defaultValues: { identifier: params.email ?? '', password: '' },
  })

  const onSubmit = () =>
    void handleSubmit(({ identifier, password }) => {
    setError('')
    login.mutate(
      { email: identifier, password },
      {
        // Thành công: store có user, route guard ở _layout tự chuyển vào khu vực theo vai trò.
        onError: (err) => {
          setError(loginErrorMessage(err))
          if (isNotVerifiedError(err)) {
            setTimeout(
              () => router.push({ pathname: '/verify-otp', params: { email: identifier.trim() } }),
              1200,
            )
          }
        },
      },
    )
  })()

  return (
    <Screen className="justify-center" loading={login.isPending && 'Đang đăng nhập'}>
      <AuthHeader
        title="Đăng nhập CapNong"
        subtitle="Kết nối trực tiếp nhà vườn và người mua, cùng giải cứu nông sản Việt"
      />

      <View className="gap-4">
        <Banner tone="error" message={error} />

        {/* /auth/login chỉ nhận email nên ô này ghi rõ Email (bản web ghi "Email hoặc SĐT"). */}
        <FormTextField
          control={control}
          name="identifier"
          label="Email"
          icon={Mail}
          placeholder="ban@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <FormTextField
          control={control}
          name="password"
          label="Mật khẩu"
          icon={Lock}
          inputRef={passwordRef}
          password
          placeholder="Nhập mật khẩu"
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />

        <Button title="Đăng nhập" icon={LogIn} loading={login.isPending} onPress={onSubmit} className="mt-2" />

        <View className="mt-4 flex-row justify-center">
          <AppText className="text-sm text-ink-muted">Chưa có tài khoản? </AppText>
          <Link href="/register" asChild>
            <AppText weight="bold" className="text-sm text-leaf-700" accessibilityRole="link">
              Đăng ký ngay
            </AppText>
          </Link>
        </View>
      </View>
    </Screen>
  )
}
