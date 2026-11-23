import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Gavel,
  MapPin,
  Package,
  Phone,
  User,
} from 'lucide-react-native'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Checkbox, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { money } from '@/features/product'
import {
  useShopDisputeDetail,
  useShopRespondDispute,
} from '@/features/shop'
import { DISPUTE_STATUS_CONFIG } from '../disputes'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

export default function ShopDisputeDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const id = Number(rawId) || 0
  const showToast = useUiStore((s) => s.showToast)

  const { data: dispute, isLoading, isError, refetch } = useShopDisputeDetail(id)
  const respondMutation = useShopRespondDispute()

  // Form state
  const [decision, setDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT')
  const [isReturnGoods, setIsReturnGoods] = useState(false)
  const [shippingPaymentMethod, setShippingPaymentMethod] = useState<'WALLET' | 'COD'>('WALLET')
  const [responseText, setResponseText] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/disputes' as any))

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      showToast(decision === 'ACCEPT' ? 'Vui lòng nhập lời nhắn gửi khách hàng' : 'Vui lòng nhập lý do từ chối khiếu nại')
      return
    }

    try {
      await respondMutation.mutateAsync({
        id,
        data: {
          accept: decision === 'ACCEPT',
          shopResponse: responseText.trim(),
          isReturnGoods: decision === 'ACCEPT' ? isReturnGoods : false,
          shippingPaymentMethod: decision === 'ACCEPT' && isReturnGoods ? shippingPaymentMethod : undefined,
        },
      })
      showToast(
        decision === 'ACCEPT'
          ? 'Đã duyệt yêu cầu hoàn tiền cho khách.'
          : 'Đã từ chối yêu cầu và gửi hồ sơ đến Admin phân xử.',
      )
      refetch()
    } catch (err) {
      showToast(getErrorMessage(err, 'Lỗi khi gửi phản hồi khiếu nại'))
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-3 pb-3 pt-2">
          <BackButton onPress={goBack} />
        </View>
        <View className="gap-4 p-4">
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-40 rounded-panel" />
          <Skeleton className="h-32 rounded-panel" />
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !dispute) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-3 pb-3 pt-2">
          <BackButton onPress={goBack} />
        </View>
        <ErrorState title="Không tìm thấy thông tin khiếu nại" onRetry={refetch} />
      </SafeAreaView>
    )
  }

  const cfg = DISPUTE_STATUS_CONFIG[dispute.status] ?? {
    label: dispute.status,
    text: colors.inkMuted,
    bg: '#f3f4f6',
    dot: '#9ca3af',
  }

  const isPending = dispute.status === 'PENDING'

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-line bg-paper px-3 pb-3 pt-2">
        <View className="flex-row items-center gap-2">
          <BackButton onPress={goBack} />
          <AppText weight="extrabold" className="text-base text-ink">
            Khiếu Nại #{dispute.id}
          </AppText>
        </View>
        <View style={{ backgroundColor: cfg.bg }} className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1">
          <View style={{ backgroundColor: cfg.dot }} className="h-2 w-2 rounded-full" />
          <AppText weight="bold" style={{ color: cfg.text }} className="text-xs">
            {cfg.label}
          </AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="p-4 gap-4 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.leaf700}
              colors={[colors.leaf700]}
            />
          }
        >
          {/* Thông tin đơn hàng & hoàn tiền */}
          <View className="rounded-panel border border-line bg-white p-4">
            <View className="flex-row items-center justify-between border-b border-line pb-3">
              <View>
                <AppText weight="extrabold" className="text-base text-ink">
                  Đơn hàng #{dispute.orderId}
                </AppText>
                <AppText className="mt-0.5 text-xs text-ink-subtle">
                  Tạo ngày: {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString('vi-VN') : ''}
                </AppText>
              </View>
              <View className="items-end">
                <AppText className="text-xs text-ink-muted">Số tiền hoàn</AppText>
                <AppText weight="extrabold" className="text-lg text-sale">
                  {money(dispute.refundAmount)}
                </AppText>
              </View>
            </View>

            {/* Sản phẩm */}
            <View className="mt-3 flex-row items-center gap-3">
              {dispute.productImage ? (
                <Image
                  source={{ uri: dispute.productImage }}
                  style={{ width: 56, height: 56, borderRadius: 12 }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-14 w-14 items-center justify-center rounded-xl bg-paper">
                  <Package size={24} color={colors.inkSubtle} />
                </View>
              )}
              <View className="min-w-0 flex-1">
                <AppText weight="bold" className="text-sm text-ink">
                  {dispute.productName}
                </AppText>
                {!!dispute.quantity && (
                  <AppText className="mt-0.5 text-xs text-ink-muted">
                    Số lượng: x{dispute.quantity}
                  </AppText>
                )}
              </View>
            </View>

            {/* Thông tin người mua */}
            <View className="mt-3.5 rounded-xl bg-paper p-3 gap-1">
              <View className="flex-row items-center gap-2">
                <User size={14} color={colors.inkMuted} />
                <AppText weight="bold" className="text-xs text-ink">
                  {dispute.buyerName || 'Khách hàng'}
                </AppText>
              </View>
              {!!dispute.buyerPhone && (
                <View className="flex-row items-center gap-2">
                  <Phone size={14} color={colors.inkMuted} />
                  <AppText className="text-xs text-ink-muted">{dispute.buyerPhone}</AppText>
                </View>
              )}
              {!!dispute.buyerAddress && (
                <View className="flex-row items-center gap-2">
                  <MapPin size={14} color={colors.inkMuted} />
                  <AppText numberOfLines={1} className="text-xs text-ink-muted">{dispute.buyerAddress}</AppText>
                </View>
              )}
            </View>
          </View>

          {/* Lý do khiếu nại & Bằng chứng */}
          <View className="rounded-panel border border-line bg-white p-4">
            <AppText weight="bold" className="text-sm text-ink">
              Lý do khiếu nại từ người mua
            </AppText>
            <View className="mt-2 rounded-xl bg-paper p-3">
              <AppText className="text-sm leading-relaxed text-ink">
                {dispute.reason || 'Khách hàng không ghi chú lý do chi tiết.'}
              </AppText>
            </View>

            {/* Ảnh bằng chứng */}
            {dispute.evidence || (dispute.evidenceUrls && dispute.evidenceUrls.length > 0) ? (
              <View className="mt-3">
                <AppText weight="bold" className="text-xs text-ink-muted uppercase">
                  Hình ảnh / Video bằng chứng
                </AppText>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {(dispute.evidenceUrls || [dispute.evidence]).filter(Boolean).map((uri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: uri as string }}
                      style={{ width: 100, height: 100, borderRadius: 12 }}
                      contentFit="cover"
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Phản hồi đã có (nếu không còn PENDING) */}
          {!isPending && (
            <View className="rounded-panel border border-line bg-white p-4">
              <AppText weight="bold" className="text-sm text-ink">
                Lịch sử xử lý khiếu nại
              </AppText>
              {!!dispute.shopResponse && (
                <View className="mt-2 rounded-xl bg-leaf-50 p-3">
                  <AppText weight="bold" className="text-xs text-leaf-800">
                    Phản hồi từ Nhà vườn:
                  </AppText>
                  <AppText className="mt-1 text-xs text-leaf-900 leading-relaxed">
                    {dispute.shopResponse}
                  </AppText>
                </View>
              )}
              {!!dispute.adminRemark && (
                <View className="mt-2 rounded-xl bg-indigo-50 p-3">
                  <AppText weight="bold" className="text-xs text-indigo-800">
                    Quyết định từ Admin CapNong:
                  </AppText>
                  <AppText className="mt-1 text-xs text-indigo-900 leading-relaxed">
                    {dispute.adminRemark}
                  </AppText>
                </View>
              )}
            </View>
          )}

          {/* Khung Xử Lý Khiếu Nại (Dành cho trạng thái PENDING) */}
          {isPending && (
            <View className="rounded-panel border-2 border-leaf-700 bg-white p-4 gap-3.5 shadow-sm">
              <View className="flex-row items-center gap-2">
                <Gavel size={18} color={colors.leaf700} />
                <AppText weight="extrabold" className="text-base text-ink">
                  Quyết Định Của Gian Hàng
                </AppText>
              </View>

              {/* Lựa chọn Đồng ý vs Từ chối */}
              <View className="flex-row rounded-xl border border-line bg-paper p-1">
                <Pressable
                  onPress={() => setDecision('ACCEPT')}
                  className={cn(
                    'flex-1 items-center justify-center rounded-lg py-2.5',
                    decision === 'ACCEPT' && 'bg-leaf-700 shadow-sm',
                  )}
                >
                  <AppText
                    weight="bold"
                    className={cn('text-xs', decision === 'ACCEPT' ? 'text-white' : 'text-ink-muted')}
                  >
                    Đồng ý hoàn tiền
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => setDecision('REJECT')}
                  className={cn(
                    'flex-1 items-center justify-center rounded-lg py-2.5',
                    decision === 'REJECT' && 'bg-sale shadow-sm',
                  )}
                >
                  <AppText
                    weight="bold"
                    className={cn('text-xs', decision === 'REJECT' ? 'text-white' : 'text-ink-muted')}
                  >
                    Từ chối khiếu nại
                  </AppText>
                </Pressable>
              </View>

              {decision === 'ACCEPT' ? (
                <View className="gap-3">
                  <View className="flex-row items-center gap-2">
                    <Checkbox
                      checked={isReturnGoods}
                      onChange={() => setIsReturnGoods(!isReturnGoods)}
                      label="Yêu cầu thu hồi lại nông sản"
                    />
                    <AppText className="text-xs text-ink flex-1">
                      Yêu cầu thu hồi lại nông sản (shipper sẽ đến nhận hàng trả)
                    </AppText>
                  </View>

                  {isReturnGoods && (
                    <View className="rounded-xl bg-paper p-3 gap-2">
                      <AppText weight="bold" className="text-xs text-ink">
                        Hình thức chi trả phí ship hoàn:
                      </AppText>
                      <View className="flex-row gap-4">
                        <Pressable
                          onPress={() => setShippingPaymentMethod('WALLET')}
                          className="flex-row items-center gap-1.5"
                        >
                          <View
                            className={cn(
                              'h-4 w-4 rounded-full border items-center justify-center',
                              shippingPaymentMethod === 'WALLET' ? 'border-leaf-700' : 'border-line',
                            )}
                          >
                            {shippingPaymentMethod === 'WALLET' && (
                              <View className="h-2 w-2 rounded-full bg-leaf-700" />
                            )}
                          </View>
                          <AppText className="text-xs text-ink">Trừ vào ví shop</AppText>
                        </Pressable>

                        <Pressable
                          onPress={() => setShippingPaymentMethod('COD')}
                          className="flex-row items-center gap-1.5"
                        >
                          <View
                            className={cn(
                              'h-4 w-4 rounded-full border items-center justify-center',
                              shippingPaymentMethod === 'COD' ? 'border-leaf-700' : 'border-line',
                            )}
                          >
                            {shippingPaymentMethod === 'COD' && (
                              <View className="h-2 w-2 rounded-full bg-leaf-700" />
                            )}
                          </View>
                          <AppText className="text-xs text-ink">Thanh toán COD</AppText>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  <View>
                    <AppText weight="bold" className="text-xs text-ink">
                      Lời nhắn gửi khách hàng:
                    </AppText>
                    <TextInput
                      value={responseText}
                      onChangeText={setResponseText}
                      placeholder="VD: Nhà vườn xin lỗi vì sơ suất dập nát do vận chuyển. Chúng tôi đồng ý hoàn tiền cho bạn."
                      multiline
                      numberOfLines={3}
                      className="mt-1.5 min-h-[70px] rounded-xl border border-line p-3 text-xs text-ink"
                      style={{ fontFamily: fontFamily.regular, textAlignVertical: 'top' }}
                    />
                  </View>

                  <Button
                    title="Xác nhận duyệt hoàn tiền"
                    loading={respondMutation.isPending}
                    onPress={handleSubmitResponse}
                  />
                </View>
              ) : (
                <View className="gap-3">
                  <View className="rounded-xl bg-red-50 p-3">
                    <AppText className="text-xs text-red-800 leading-relaxed">
                      Lưu ý: Khi từ chối, đơn khiếu nại sẽ được chuyển sang Ban Quản Trị CapNong để đối soát video đóng gói và kiểm hàng.
                    </AppText>
                  </View>

                  <View>
                    <AppText weight="bold" className="text-xs text-ink">
                      Lý do từ chối (bắt buộc):
                    </AppText>
                    <TextInput
                      value={responseText}
                      onChangeText={setResponseText}
                      placeholder="VD: Nông sản lúc bàn giao shipper đảm bảo tươi nguyên, đã có ảnh checklist đóng gói kèm theo."
                      multiline
                      numberOfLines={3}
                      className="mt-1.5 min-h-[70px] rounded-xl border border-line p-3 text-xs text-ink"
                      style={{ fontFamily: fontFamily.regular, textAlignVertical: 'top' }}
                    />
                  </View>

                  <Button
                    title="Gửi từ chối lên Admin phân xử"
                    variant="danger"
                    loading={respondMutation.isPending}
                    onPress={handleSubmitResponse}
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
