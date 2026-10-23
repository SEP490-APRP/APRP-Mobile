import { z } from 'zod'

/**
 * Validation constants matching Backend requirements
 * - Password: min 8 characters (Backend: @Size(min = 8))
 * - Phone: Vietnamese standard (Backend: @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$"))
 * - CCCD: 12 digits standard (Backend: @Pattern(regexp = "^[0-9]{12}$"))
 */
export const PASSWORD_MIN = 8
export const VIETNAMESE_PHONE_REGEX = /^(0|\+84)[35789][0-9]{8}$/
export const CCCD_REGEX = /^[0-9]{12}$/

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Vui lòng nhập Email hoặc Số điện thoại của bạn'),
  password: z.string().min(6, 'Mật khẩu cần tối thiểu 6 ký tự'),
})
export type LoginValues = z.input<typeof loginSchema>

/** Toàn bộ field của form đăng ký (dùng chung cho nhà vườn, người mua và tài xế). */
export type RegisterValues = {
  fullName: string
  phone: string
  email: string
  cccd: string
  password: string
  confirmPassword: string
  buyerAddress: string
  dietPreference: string
  shipperVehicle: string
  vehicleNumber: string
  shipperArea: string
  shopName: string
  shopAddress: string
  shopRegion: string
  shopFarmingType: string
  shopDescription: string
  shopBankName?: string
  shopBankAccount?: string
  shopBankHolder?: string
  buyerBankName?: string
  buyerBankAccount?: string
  buyerBankHolder?: string
  shipperBankName?: string
  shipperBankAccount?: string
  shipperBankHolder?: string
}

export const REGISTER_DEFAULTS: RegisterValues = {
  fullName: '',
  phone: '',
  email: '',
  cccd: '',
  password: '',
  confirmPassword: '',
  buyerAddress: '',
  dietPreference: 'NON_VEGETARIAN',
  shipperVehicle: 'Xe máy kèm thùng bảo ôn',
  vehicleNumber: '',
  shipperArea: '',
  shopName: '',
  shopAddress: '',
  shopRegion: 'Đà Lạt & Lâm Đồng',
  shopFarmingType: 'Hữu cơ Organic',
  shopDescription: '',
}

const passwordsMatch = (v: { password: string; confirmPassword: string }) =>
  v.password === v.confirmPassword
const MISMATCH = { message: 'Mật khẩu xác nhận không trùng khớp', path: ['confirmPassword'] }

/** Đăng ký người mua (Buyer) - Thông tin cá nhân & Địa chỉ nhận hàng */
export const buyerRegisterSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên của bạn'),
    phone: z
      .string()
      .trim()
      .regex(VIETNAMESE_PHONE_REGEX, 'Số điện thoại không hợp lệ (10 số, đầu 03, 05, 07, 08, 09)'),
    email: z.string().trim().email('Vui lòng nhập địa chỉ email hợp lệ để nhận mã OTP'),
    buyerAddress: z.string().trim().min(1, 'Vui lòng nhập địa chỉ giao nhận hàng của bạn'),
    dietPreference: z.string().optional(),
    password: z.string().min(PASSWORD_MIN, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, MISMATCH)

/** Đăng ký tài xế (Shipper) - Bắt buộc CCCD 12 số, biển số xe và khu vực hoạt động */
export const shipperRegisterSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên tài xế'),
    phone: z
      .string()
      .trim()
      .regex(VIETNAMESE_PHONE_REGEX, 'Số điện thoại không hợp lệ (10 số, đầu 03, 05, 07, 08, 09)'),
    email: z.string().trim().email('Vui lòng nhập địa chỉ email hợp lệ để nhận mã OTP'),
    cccd: z
      .string()
      .trim()
      .regex(CCCD_REGEX, 'Số CCCD tài xế không hợp lệ (yêu cầu đúng 12 chữ số)'),
    vehicleNumber: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập biển số xe vận chuyển (VD: 59-A1 123.45)'),
    shipperArea: z
      .string()
      .trim()
      .min(1, 'Vui lòng cung cấp khu vực hoặc địa chỉ hoạt động giao hàng'),
    shipperVehicle: z.string().optional(),
    password: z.string().min(PASSWORD_MIN, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, MISMATCH)

/** Bước 1 đăng ký nhà vườn: thông tin chủ hộ (bắt buộc CCCD, SĐT, Email, Mật khẩu). */
export const shopAccountSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên chủ nông hộ / người đại diện'),
    phone: z
      .string()
      .trim()
      .regex(VIETNAMESE_PHONE_REGEX, 'Số điện thoại không hợp lệ (10 số, đầu 03, 05, 07, 08, 09)'),
    email: z.string().trim().email('Vui lòng cung cấp email hợp lệ để nhận mã xác thực OTP'),
    cccd: z
      .string()
      .trim()
      .regex(CCCD_REGEX, 'Số CCCD chủ nông hộ không hợp lệ (yêu cầu đúng 12 chữ số)'),
    password: z.string().min(PASSWORD_MIN, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, MISMATCH)

/** Bước 2 đăng ký nhà vườn: hồ sơ gian hàng để duyệt KYC. */
export const shopKycSchema = z.object({
  shopName: z.string().trim().min(1, 'Vui lòng nhập tên nhà vườn hoặc tên gian hàng của bạn'),
  shopAddress: z.string().trim().min(1, 'Vui lòng cung cấp địa chỉ nông trại / kho xuất hàng'),
  shopRegion: z.string().trim().optional(),
  shopFarmingType: z.string().trim().optional(),
  shopDescription: z.string().trim().optional(),
})

/** Đăng ký người dùng cơ bản (hỗ trợ tương thích ngược) */
export const memberRegisterSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên của bạn'),
    phone: z.string().trim(),
    email: z.string().trim(),
    password: z.string().min(PASSWORD_MIN, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.phone !== '' || v.email !== '', {
    message: 'Vui lòng cung cấp số điện thoại hoặc email liên hệ',
    path: ['phone'],
  })
  .refine(passwordsMatch, MISMATCH)

/**
 * Bản mobile: /auth/login chỉ nhận email nên ô đăng nhập chỉ ghi "Email"
 * và kiểm tra đúng định dạng email (loginSchema của web giữ nguyên để đồng bộ).
 */
export const mobileLoginSchema = loginSchema.extend({
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email của bạn')
    .email('Vui lòng nhập địa chỉ email hợp lệ'),
})
