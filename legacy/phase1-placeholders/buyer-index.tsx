import { ShoppingBasket } from 'lucide-react-native'
import { RoleHomePlaceholder } from '@/features/auth/components'

export default function BuyerHome() {
  return (
    <RoleHomePlaceholder
      icon={ShoppingBasket}
      area="Khu vực Khách Mua"
      upcoming={['Khám phá nông sản giải cứu', 'Giỏ hàng và đặt hàng (COD / PayOS)', 'Theo dõi đơn hàng']}
    />
  )
}
