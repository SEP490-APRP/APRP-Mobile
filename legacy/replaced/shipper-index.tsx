import { Truck } from 'lucide-react-native'
import { RoleHomePlaceholder } from '@/features/auth/components'

export default function ShipperHome() {
  return (
    <RoleHomePlaceholder
      icon={Truck}
      area="Khu vực Tài Xế"
      upcoming={['Nhận cuốc giao nông sản bảo ôn', 'Quét mã nhận hàng', 'Thu nhập và ví']}
    />
  )
}
