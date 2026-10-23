import { router } from 'expo-router'
import { useState } from 'react'
import { REGISTER_DEFAULTS, type RegisterValues } from '../schemas/auth.schemas'
import { ROLE_LABEL, type RegisterRole } from '../constants/options'
import { registerErrorMessage } from '../utils/authErrors'
import { useRegister } from './useAuthMutations'

/** Gửi form đăng ký theo vai trò rồi sang màn OTP (giống handleRegisterSubmit bản web). */
export function useRegisterSubmit(role: RegisterRole) {
  const register = useRegister(role)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = (values: Partial<RegisterValues>) => {
    setError('')
    setSuccess('')
    // Bỏ field undefined để không ghi đè giá trị mặc định (vùng trồng, loại xe...).
    const defined = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined))
    const full: RegisterValues = { ...REGISTER_DEFAULTS, ...defined }
    register.mutate(full, {
      onSuccess: () => {
        setSuccess(
          role === 'buyer'
            ? 'Đăng ký tài khoản thành công! Mã OTP đã được gửi đến email của bạn.'
            : `Đăng ký ${ROLE_LABEL[role]} thành công! Mã OTP đã được gửi đến email của bạn.`,
        )
        setTimeout(
          () =>
            router.push({ pathname: '/verify-otp', params: { email: full.email.trim(), role } }),
          1000,
        )
      },
      onError: (err) =>
        setError(
          registerErrorMessage(
            err,
            `Đăng ký ${ROLE_LABEL[role]} thất bại. Vui lòng kiểm tra lại thông tin.`,
          ),
        ),
    })
  }

  return { submit, error, success, isPending: register.isPending }
}
