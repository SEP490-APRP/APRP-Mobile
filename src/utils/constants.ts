/* ===== Application Constants ===== */

import { ENV } from './env'

/** API base URL from environment variables */
export const API_BASE_URL = ENV.API_URL

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 20, 50, 100],
} as const

/** Local storage keys */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'capnong-user',
  THEME: 'theme',
  CART: 'capnong-cart',
  TOKEN: 'capnong-token',
  FARMER_TOUR_DONE: 'capnong_farmer_tour_done',
} as const

/** Route paths (Expo Router) */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  OTP_VERIFICATION: '/verify-otp',
  PENDING_APPROVAL: '/pending-approval',
  BUYER_HOME: '/buyer',
  SHOP_HOME: '/shop',
  SHIPPER_HOME: '/shipper',
} as const
