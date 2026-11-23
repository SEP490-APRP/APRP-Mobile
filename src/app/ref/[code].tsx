import { router, useLocalSearchParams } from 'expo-router'
import { AlertCircle, ArrowRight, LogIn, ShoppingBag, Store, UserCheck } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading } from '@/components/ui'
import { referralService, savePendingReferral, type ReferralResolveResponse } from '@/services/referral.service'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'

export default function ReferralDeepLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { isAuthenticated, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolveData, setResolveData] = useState<ReferralResolveResponse | null>(null)

  useEffect(() => {
    if (!code) {
      setError('Mã giới thiệu không hợp lệ')
      setLoading(false)
      return
    }

    let isMounted = true

    const processLink = async () => {
      // 1. Lưu pending referral vào AsyncStorage
      await savePendingReferral(code)

      // 2. Ghi nhận lượt click ngầm
      void referralService.trackClick(code).catch(() => {})

      try {
        // 3. Phân giải link
        const data = await referralService.resolveLink(code)
        if (!isMounted) return
        setResolveData(data)
        setLoading(false)

        // 4. Nếu người mua đã đăng nhập, tự động claim attribution và chuyển thẳng đến sản phẩm
        if (isAuthenticated && user?.role === 'buyer') {
          void referralService.claimReferral(code).catch(() => {})
          if (data.targetType === 'PRODUCT') {
            router.replace({ pathname: '/buyer/product/[id]', params: { id: String(data.targetId) } })
          } else if (data.targetType === 'BUILD_COMBO' || data.targetType === 'MYSTERY_BOX') {
            router.replace({ pathname: '/buyer/combo/[id]', params: { id: String(data.targetId), kind: data.targetType } })
          } else {
            router.replace({ pathname: '/buyer/shop/[id]', params: { id: String(data.targetId) } })
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return
        const msg = (err as { message?: string })?.message || 'Liên kết không tồn tại hoặc đã hết hạn'
        setError(msg)
        setLoading(false)
      }
    }

    void processLink()

    return () => {
      isMounted = false
    }
  }, [code, isAuthenticated, user])

  if (loading) {
    return <CapNongLoading message="Đang mở liên kết giới thiệu..." />
  }

  if (error || !resolveData) {
    return (
      <SafeAreaView className="flex-1 bg-paper items-center justify-center p-6">
        <View className="w-full max-w-sm rounded-3xl border border-red-200 bg-red-50 p-6 items-center">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-red-100 mb-3">
            <AlertCircle size={28} color={colors.sale} />
          </View>
          <AppText weight="extrabold" className="text-lg text-center text-ink">
            Liên kết không khả dụng
          </AppText>
          <AppText className="mt-1.5 text-xs text-center text-ink-muted">
            {error || 'Không tìm thấy thông tin chia sẻ'}
          </AppText>
          <Button
            title="Về trang chủ"
            className="mt-6 w-full"
            onPress={() => router.replace(isAuthenticated ? '/buyer' : '/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    )
  }

  const navigateToTarget = () => {
    if (resolveData.targetType === 'PRODUCT') {
      router.replace({ pathname: '/buyer/product/[id]', params: { id: String(resolveData.targetId) } })
    } else if (resolveData.targetType === 'BUILD_COMBO' || resolveData.targetType === 'MYSTERY_BOX') {
      router.replace({ pathname: '/buyer/combo/[id]', params: { id: String(resolveData.targetId), kind: resolveData.targetType } })
    } else {
      router.replace({ pathname: '/buyer/shop/[id]', params: { id: String(resolveData.targetId) } })
    }
  }

  const navigateToLogin = () => {
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView className="flex-1 bg-paper items-center justify-center p-6">
      <View className="w-full max-w-sm overflow-hidden rounded-3xl border border-line bg-white shadow-lg">
        {/* Header */}
        <View className="bg-leaf-700 p-5 items-center">
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/20 px-3 py-1">
            <UserCheck size={14} color="#ffffff" />
            <AppText weight="bold" className="text-xs text-white">
              Nông sản được giới thiệu
            </AppText>
          </View>
          <AppText weight="extrabold" className="mt-2 text-lg text-white text-center">
            {resolveData.targetType === 'PRODUCT'
              ? 'Sản phẩm chia sẻ'
              : resolveData.targetType === 'BUILD_COMBO'
                ? 'Combo nông sản chia sẻ'
                : resolveData.targetType === 'MYSTERY_BOX'
                  ? 'Túi mù may mắn chia sẻ'
                  : 'Gian hàng chia sẻ'}
          </AppText>
          <AppText className="text-xs text-white/90 text-center">
            Từ người bạn: <AppText weight="bold" className="text-white">{resolveData.referrerName}</AppText>
          </AppText>
        </View>

        {/* Target Details */}
        <View className="p-5 gap-4">
          <View className="flex-row gap-3 rounded-2xl border border-line bg-paper p-3">
            {resolveData.imageUrl ? (
              <Image
                source={{ uri: resolveData.imageUrl }}
                className="h-20 w-20 rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <View className="h-20 w-20 items-center justify-center rounded-xl bg-leaf-50">
                {resolveData.targetType === 'PRODUCT' ? (
                  <ShoppingBag size={28} color={colors.leaf700} />
                ) : (
                  <Store size={28} color={colors.leaf700} />
                )}
              </View>
            )}
            <View className="flex-1 justify-center">
              <AppText weight="semibold" className="text-[10px] uppercase text-leaf-700">
                {resolveData.targetType === 'PRODUCT' ? 'Nông sản an lành' : 'Gian hàng'}
              </AppText>
              <AppText weight="bold" numberOfLines={2} className="text-sm text-ink">
                {resolveData.targetName}
              </AppText>
              <AppText className="mt-1 text-xs text-ink-muted">
                Mã: <AppText weight="bold" className="text-leaf-700">{resolveData.referralCode}</AppText>
              </AppText>
            </View>
          </View>

          {/* Action buttons */}
          <View className="gap-2.5">
            <Button
              title="Đăng nhập để nhận ưu đãi"
              icon={LogIn}
              onPress={navigateToLogin}
            />
            <Button
              title="Xem sản phẩm ngay"
              variant="outline"
              icon={ArrowRight}
              onPress={navigateToTarget}
            />
          </View>

          <AppText className="text-center text-[11px] text-ink-muted">
            Mua hàng qua liên kết giúp bạn nhận nông sản tận vườn và đồng hành cùng người giới thiệu!
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  )
}
