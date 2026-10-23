import { Redirect } from 'expo-router'
import { useAuth } from '@/stores'
import { ROUTES } from '@/utils/constants'

/** Điểm vào: chưa đăng nhập về Đăng nhập, đã đăng nhập vào khu vực theo vai trò. */
export default function Index() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated || !user) return <Redirect href={ROUTES.LOGIN} />
  if (user.role === 'shop') return <Redirect href={ROUTES.SHOP_HOME} />
  if (user.role === 'shipper') return <Redirect href={ROUTES.SHIPPER_HOME} />
  return <Redirect href={ROUTES.BUYER_HOME} />
}
