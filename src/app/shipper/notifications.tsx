import { Screen } from '@/components/ui'
import { NotificationsView } from '@/features/notifications/NotificationsView'

export default function ShipperNotificationsScreen() {
  return (
    <Screen scroll={false} className="p-0">
      <NotificationsView />
    </Screen>
  )
}

