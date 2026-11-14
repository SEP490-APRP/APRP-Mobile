import { Image } from 'expo-image'
import { useEffect, useState } from 'react'
import { Animated, View } from 'react-native'
import { AppText } from '@/components/ui'
import { cn } from '@/utils/helpers'
import { splitBold, type ChatbotMessage } from '../utils/chatbotMessage'
import {
  GreenImpactCard,
  HumanHandoverCard,
  MealPlanBridgeCard,
  MysteryBoxQaCard,
  PreservationTipsCard,
  RecipeCard,
  RoleGuidanceCard,
  SeasonalCalendarCard,
  ShippingTipsCard,
  VoucherListCard,
} from './cards/AdvisoryCards'
import {
  OrderCancelCard,
  OrderTrackingCard,
  PaymentAssistanceCard,
  ReturnGuidanceCard,
  UpdateShippingInfoCard,
  WalletInfoCard,
} from './cards/OrderCards'
import {
  BudgetComboCard,
  CartUpdatedCard,
  CheckoutDraftCard,
  FlashRescueCard,
  ItemOptionsCard,
  NavigationCard,
  ReorderCard,
} from './cards/ShoppingCards'

const logo = require('../../../../assets/images/logo-icon.png')

function BotAvatar() {
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full border border-leaf-200 bg-white p-0.5">
      <Image source={logo} contentFit="contain" style={{ width: '100%', height: '100%' }} />
    </View>
  )
}

/** Thẻ tương tác theo dữ liệu BE trả về. Tin nhắn từ lịch sử chỉ có chữ nên không có thẻ. */
function MessageCards({ message: m }: { message: ChatbotMessage }) {
  return (
    <>
      {!!m.itemOptions?.length && <ItemOptionsCard items={m.itemOptions} />}
      {m.responseType === 'PRODUCT_DETAIL' && !!m.selectedProduct && <ItemOptionsCard items={[m.selectedProduct]} />}
      {(m.responseType === 'CART_UPDATED' || !!m.cart) && <CartUpdatedCard cart={m.cart} selectedProduct={m.selectedProduct} />}
      {!!m.checkout && <CheckoutDraftCard checkout={m.checkout} />}
      {!!m.navigation && <NavigationCard navigation={m.navigation} />}
      {!!m.orderTracking && <OrderTrackingCard tracking={m.orderTracking} />}
      {!!m.returnGuidance && <ReturnGuidanceCard guidance={m.returnGuidance} />}
      {!!m.orderCancel && <OrderCancelCard orderCancel={m.orderCancel} />}
      {!!m.budgetCombo && <BudgetComboCard combo={m.budgetCombo} />}
      {!!m.recipe && <RecipeCard recipe={m.recipe} />}
      {!!m.mysteryBoxQa && <MysteryBoxQaCard mysteryBox={m.mysteryBoxQa} />}
      {!!m.vouchers && <VoucherListCard vouchers={m.vouchers} />}
      {!!m.shippingTips && <ShippingTipsCard tips={m.shippingTips} />}
      {!!m.preservationTips?.length && <PreservationTipsCard tips={m.preservationTips} />}
      {!!m.humanHandover && <HumanHandoverCard handover={m.humanHandover} />}
      {!!m.roleGuidance && <RoleGuidanceCard roleGuidance={m.roleGuidance} />}
      {!!m.reorder && <ReorderCard reorder={m.reorder} />}
      {!!m.flashRescue && <FlashRescueCard rescue={m.flashRescue} />}
      {!!m.mealPlanBridge && <MealPlanBridgeCard bridge={m.mealPlanBridge} />}
      {!!m.seasonalCalendar && <SeasonalCalendarCard calendar={m.seasonalCalendar} />}
      {!!m.greenImpact && <GreenImpactCard impact={m.greenImpact} />}
      {!!m.paymentAssistance && <PaymentAssistanceCard payment={m.paymentAssistance} />}
      {!!m.walletInfo && <WalletInfoCard wallet={m.walletInfo} />}
      {!!m.updateShippingInfo && <UpdateShippingInfoCard info={m.updateShippingInfo} />}
    </>
  )
}

function FormattedContent({ content, className }: { content: string; className: string }) {
  return (
    <AppText className={className}>
      {splitBold(content).map((part, index) =>
        part.bold ? (
          <AppText key={index} weight="bold" className={className}>
            {part.text}
          </AppText>
        ) : (
          part.text
        ),
      )}
    </AppText>
  )
}

const formatTime = (date: Date) => date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

/** Một tin nhắn: tin của người dùng canh phải, tin của bot canh trái kèm thẻ tương tác rộng hết khung. */
export function ChatbotMessageItem({ message }: { message: ChatbotMessage }) {
  if (message.sender === 'user') {
    return (
      <View className="items-end gap-1">
        <View className="max-w-[82%] rounded-card rounded-tr-sm bg-leaf-700 px-3.5 py-2.5">
          <AppText className="text-sm leading-relaxed text-white">{message.content}</AppText>
        </View>
        <AppText className="px-1 text-caption text-ink-subtle">{formatTime(message.timestamp)}</AppText>
      </View>
    )
  }

  const isError = message.status === 'error'
  const textClass = cn('text-sm leading-relaxed', isError ? 'text-sale' : 'text-ink')
  return (
    <View className="flex-row gap-2">
      <BotAvatar />
      <View className="flex-1 gap-2">
        {!!message.content && (
          <View
            className={cn(
              'self-start rounded-card rounded-tl-sm border px-3.5 py-2.5',
              isError ? 'border-sale bg-sale-soft' : 'border-line bg-white',
            )}
          >
            <FormattedContent content={message.content} className={textClass} />
          </View>
        )}
        <MessageCards message={message} />
        <AppText className="px-1 text-caption text-ink-subtle">{formatTime(message.timestamp)}</AppText>
      </View>
    </View>
  )
}

function TypingDot({ delay }: { delay: number }) {
  const [offset] = useState(() => new Animated.Value(0))
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(offset, { toValue: -5, duration: 300, useNativeDriver: true }),
        Animated.timing(offset, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [delay, offset])
  return (
    <Animated.View style={{ transform: [{ translateY: offset }] }}>
      <View className="h-2 w-2 rounded-full bg-leaf-500" />
    </Animated.View>
  )
}

export function ChatbotTyping() {
  return (
    <View accessibilityLabel="Trợ lý đang trả lời" className="flex-row gap-2">
      <BotAvatar />
      <View className="flex-row items-center gap-1.5 rounded-card rounded-tl-sm border border-line bg-white px-4 py-3.5">
        <TypingDot delay={0} />
        <TypingDot delay={150} />
        <TypingDot delay={300} />
      </View>
    </View>
  )
}
