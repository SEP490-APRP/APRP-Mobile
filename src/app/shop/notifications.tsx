import { Screen } from '@/components/ui'
import { NotificationsView } from '@/features/notifications/NotificationsView'

export default function ShopNotificationsScreen() {
  return (
    <Screen scroll={false} className="p-0">
      <NotificationsView />
    </Screen>
  )
}

