import { Sprout } from 'lucide-react-native'
import { RoleHomePlaceholder } from '@/features/auth/components'

export default function ShopHome() {
  return (
    <RoleHomePlaceholder
      icon={Sprout}
      area="Khu vực Nhà Vườn"
      upcoming={['Quản lý gian hàng', 'Đăng bán nông sản kém sắc', 'Đơn hàng và voucher']}
    />
  )
}
