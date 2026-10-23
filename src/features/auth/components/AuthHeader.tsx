import { Image, View } from 'react-native'
import { AppText } from '@/components/ui'

const logoIcon = require('../../../../assets/images/logo-icon.png')

export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-6 items-center">
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full border-4 border-leaf-700 bg-white p-2.5">
        <Image
          source={logoIcon}
          style={{ width: 52, height: 52 }}
          resizeMode="contain"
          accessibilityLabel="CapNong"
        />
      </View>
      <AppText weight="extrabold" className="text-center text-2xl text-ink">
        {title}
      </AppText>
      {subtitle ? (
        <AppText className="mt-1.5 text-center text-sm leading-5 text-ink-muted">{subtitle}</AppText>
      ) : null}
    </View>
  )
}
