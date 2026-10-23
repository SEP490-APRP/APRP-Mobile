import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Search } from 'lucide-react-native'
import { useState } from 'react'
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText } from '@/components/ui'
import { blogKeys } from '@/features/blog'
import { useAddProductToCart, useCartQuantities } from '@/features/cart'
import { CombosTeaser, HomeCategories, HomeHero, StoriesTeaser, TodayRescue } from '@/features/home'
import { useStorefrontProducts } from '@/features/product'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'

const logoIcon = require('../../../../assets/images/logo-icon.png')

const openFresh = (category?: string) =>
  router.navigate({ pathname: '/buyer/fresh', params: category ? { category } : {} })

/** Trang chủ Khách Mua, chuyển từ pages/Home.tsx (bỏ các khối giới thiệu dài dành cho web). */
export default function BuyerHome() {
  const { user } = useAuth()
  const products = useStorefrontProducts()
  const cart = useCartQuantities()
  const { addProduct, pendingId } = useAddProductToCart()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([products.refetch(), queryClient.invalidateQueries({ queryKey: blogKeys.lists() })])
    setRefreshing(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Đầu trang: lời chào và ô tìm kiếm dẫn sang trang Nông sản */}
      <View className="gap-3 border-b border-line bg-paper px-5 pb-3 pt-2">
        <View className="flex-row items-center gap-3">
          <Image source={logoIcon} style={{ width: 36, height: 36 }} resizeMode="contain" />
          <View className="flex-1">
            <AppText className="text-xs text-ink-muted">Xin chào,</AppText>
            <AppText weight="extrabold" numberOfLines={1} className="text-lg">
              {user?.name ?? 'bạn'}
            </AppText>
          </View>
        </View>
        <Pressable
          onPress={() => openFresh()}
          accessibilityRole="search"
          accessibilityLabel="Tìm nông sản"
          className="h-11 flex-row items-center gap-2 rounded-xl border border-line bg-white px-3"
        >
          <Search size={16} color={colors.inkSubtle} />
          <AppText className="text-sm text-ink-subtle">Tìm theo tên, nhà vườn…</AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-8 px-5 pb-10 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        <HomeHero onShop={() => openFresh()} />
        <View className="gap-4">
          <HomeCategories onPick={openFresh} onSeeAll={() => openFresh()} />
        </View>
        <TodayRescue
          products={products.data ?? []}
          status={products.isPending ? 'loading' : products.isError ? 'error' : 'success'}
          onRetry={() => void products.refetch()}
          onAdd={addProduct}
          cart={cart}
          addingId={pendingId != null ? String(pendingId) : undefined}
          onSeeAll={() => openFresh()}
        />
        <CombosTeaser />
        <StoriesTeaser />
      </ScrollView>
    </SafeAreaView>
  )
}
