import { router, useLocalSearchParams } from 'expo-router'
import { Mail, Pencil, RefreshCw, ShieldCheck } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, Banner, Button, OtpInput, Screen, TextField } from '@/components/ui'
import type { OtpInputHandle } from '@/components/ui/OtpInput'
import { useCountdown, useResendOtp, useVerifyOtp, type RegisterRole } from '@/features/auth'
import { AuthHeader, BackButton } from '@/features/auth/components'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'

const RESEND_SECONDS = 60

/** Port của OtpVerificationPage.tsx: 6 số, gửi lại sau 60 giây, sửa email tại chỗ. */
export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ email?: string; role?: RegisterRole }>()
  const [email, setEmail] = useState(params.email ?? '')
  const [editingEmail, setEditingEmail] = useState(!params.email)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const otpRef = useRef<OtpInputHandle>(null)

  const verify = useVerifyOtp()
  const resend = useResendOtp()
  const countdown = useCountdown(RESEND_SECONDS)

  const submit = (code = otp) => {
    setError('')
    setSuccess('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email của bạn')
      setEditingEmail(true)
      return
    }
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP')
      return
    }
    verify.mutate(
      { email: trimmedEmail, otp: code },
      {
        onSuccess: (response) => {
          // Nhà Vườn / Tài Xế (hoặc BE trả PENDING) phải chờ Admin duyệt trước khi đăng nhập.
          const needsApproval =
            response.result?.status === 'PENDING' ||
            params.role === 'shop' ||
            params.role === 'shipper'
          if (needsApproval) {
            setSuccess('Xác thực OTP thành công! Hồ sơ của bạn đã được chuyển tới Ban Quản Trị.')
            setTimeout(
              () =>
                router.replace({
                  pathname: '/pending-approval',
                  params: { email: trimmedEmail, role: params.role ?? 'shop' },
                }),
              1500,
            )
          } else {
            setSuccess('Xác thực tài khoản thành công! Đang chuyển đến màn hình đăng nhập...')
            setTimeout(
              () => router.replace({ pathname: '/login', params: { email: trimmedEmail } }),
              1500,
            )
          }
        },
        onError: (err) => {
          setError(getErrorMessage(err, 'Mã OTP không hợp lệ hoặc đã hết hạn.'))
          setOtp('')
          otpRef.current?.focus()
        },
      },
    )
  }

  const handleResend = () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Vui lòng nhập email trước khi yêu cầu gửi lại mã OTP')
      setEditingEmail(true)
      return
    }
    setError('')
    setSuccess('')
    resend.mutate(trimmedEmail, {
      onSuccess: () => {
        setSuccess('Mã OTP mới đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.')
        setOtp('')
        countdown.restart()
        otpRef.current?.focus()
      },
      onError: (err) =>
        setError(getErrorMessage(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.')),
    })
  }

  return (
    <Screen loading={verify.isPending && 'Đang xác thực mã OTP'}>
      <BackButton onPress={() => router.replace('/login')} />
      <AuthHeader title="Xác thực tài khoản" subtitle="Mã bảo mật 6 chữ số đã được gửi tới" />

      <View className="gap-5">
        {editingEmail ? (
          <TextField
            label="Email đăng ký"
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            placeholder="ban@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={() => email.trim() && setEditingEmail(false)}
          />
        ) : (
          <Pressable
            onPress={() => setEditingEmail(true)}
            accessibilityRole="button"
            accessibilityLabel="Đổi email"
            className="-mt-3 flex-row items-center justify-center gap-2 self-center rounded-card border border-line bg-leaf-50 px-3 py-1.5"
          >
            <AppText weight="bold" className="text-sm text-ink" numberOfLines={1}>
              {email}
            </AppText>
            <Pencil size={14} color={colors.leaf700} />
          </Pressable>
        )}

        <Banner tone="error" message={error} />
        <Banner tone="success" message={success} />

        <OtpInput
          ref={otpRef}
          value={otp}
          onChange={setOtp}
          onComplete={(code) => submit(code)}
          error={!!error}
          editable={!verify.isPending}
        />

        <View className="flex-row items-center justify-center">
          <AppText className="text-sm text-ink-muted">Chưa nhận được mã? </AppText>
          {countdown.done ? (
            <Pressable
              onPress={handleResend}
              disabled={resend.isPending}
              accessibilityRole="button"
              className="flex-row items-center gap-1"
            >
              <RefreshCw size={14} color={colors.leaf700} />
              <AppText weight="bold" className="text-sm text-leaf-700">
                {resend.isPending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
              </AppText>
            </Pressable>
          ) : (
            <AppText className="text-sm text-ink-subtle">
              Gửi lại sau{' '}
              <AppText weight="bold" className="text-sm text-leaf-700">
                {countdown.seconds}s
              </AppText>
            </AppText>
          )}
        </View>

        <Button
          title="Xác thực kích hoạt"
          icon={ShieldCheck}
          loading={verify.isPending}
          disabled={otp.length !== 6 || !!success}
          onPress={() => submit()}
        />
      </View>
    </Screen>
  )
}
