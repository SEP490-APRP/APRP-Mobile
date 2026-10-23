import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular'
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium'
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold'
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold'
import { BeVietnamPro_800ExtraBold } from '@expo-google-fonts/be-vietnam-pro/800ExtraBold'

/** Chỉ nạp các độ đậm app dùng, tránh nhúng cả 18 file font. */
export const appFonts = {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
}

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold'

/** React Native không tự đổi file font theo fontWeight, nên mỗi độ đậm là một fontFamily riêng. */
export const fontFamily: Record<FontWeight, keyof typeof appFonts> = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
}
