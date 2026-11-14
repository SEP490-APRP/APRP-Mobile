import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, Layers, RotateCcw, ShoppingBag, ShoppingCart, Sparkles, Wallet, Zap } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { money } from '@/features/product'
import type {
  AiCartPreview,
  AiCheckoutDraft,
  AiItemOption,
  AiNavigationAction,
  BudgetComboDto,
  FlashRescueDto,
  ReorderDto,
} from '@/services/chatbot.types'
import { colors } from '@/theme/colors'
import { openChatbotUrl } from '../../chatbotLinks'
import { useChatbotStore } from '../../stores/useChatbotStore'
import { itemPrice } from '../../utils/chatbotCards'
import { CardText, CardTitle, ChatAction, ChatCard, ChatItemRow, Chip, InfoRow, ItemImage } from './CardParts'

export function ItemOptionsCard({ items }: { items: AiItemOption[] }) {
  return (
    <View className="gap-2">
      {items.map((item) => (
        <ChatItemRow key={`${item.itemType}-${item.itemId}`} item={item} />
      ))}
    </View>
  )
}

export function CartUpdatedCard({ cart, selectedProduct }: { cart?: AiCartPreview; selectedProduct?: AiItemOption }) {
  return (
    <ChatCard tone="leaf">
      <CardTitle icon={CheckCircle2} title="Cập nhật giỏ hàng thành công" />
      {!!selectedProduct && (
        <View className="flex-row items-center gap-2.5">
          <ItemImage uri={selectedProduct.imageUrl} size={44} />
          <View className="flex-1">
            <AppText weight="semibold" numberOfLines={2} className="text-sm">
              {selectedProduct.name}
            </AppText>
            <AppText className="text-caption text-ink-muted">{money(itemPrice(selectedProduct).current)}</AppText>
          </View>
        </View>
      )}
      {!!cart && <InfoRow strong label="Tổng giá trị giỏ hàng:" value={money(cart.totalAmount ?? 0)} />}
      <View className="flex-row gap-2">
        <ChatAction label="Xem giỏ hàng" icon={ShoppingBag} variant="outline" className="flex-1" onPress={() => openChatbotUrl('/cart')} />
        <ChatAction label="Thanh toán" icon={ArrowRight} className="flex-1" onPress={() => openChatbotUrl('/checkout')} />
      </View>
    </ChatCard>
  )
}

export function CheckoutDraftCard({ checkout }: { checkout: AiCheckoutDraft }) {
  return (
    <ChatCard tone="leaf">
      <CardTitle icon={CreditCard} title="Đơn hàng đã sẵn sàng" right={<AppText weight="bold" className="text-sm">{money(checkout.totalAmount ?? 0)}</AppText>} />
      <CardText muted>Bạn có thể áp dụng mã giảm giá và chọn địa chỉ giao nhận hàng ở bước thanh toán.</CardText>
      <ChatAction label="Tiến hành đặt hàng ngay" icon={ArrowRight} onPress={() => openChatbotUrl(checkout.checkoutUrl || '/checkout')} />
    </ChatCard>
  )
}

export function NavigationCard({ navigation }: { navigation: AiNavigationAction }) {
  return (
    <ChatAction
      label={navigation.label || 'Xem ngay'}
      icon={ArrowRight}
      className="self-start"
      onPress={() => openChatbotUrl(navigation.url)}
    />
  )
}

/** Nút thêm cả danh sách; kết quả (kể cả món lỗi) hiện thành tin nhắn của bot. */
function AddAllAction({ items, label, busyLabel }: { items: AiItemOption[]; label: string; busyLabel: string }) {
  const addMultipleToCart = useChatbotStore((s) => s.addMultipleToCart)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const [adding, setAdding] = useState(false)
  const handlePress = async () => {
    setAdding(true)
    await addMultipleToCart(items)
    setAdding(false)
  }
  return (
    <ChatAction
      label={adding ? busyLabel : label}
      icon={ShoppingCart}
      loading={adding}
      disabled={isLoading}
      onPress={() => void handlePress()}
    />
  )
}

export function BudgetComboCard({ combo }: { combo: BudgetComboDto }) {
  const items = combo.items ?? []
  const isComboList = items.some((i) => i.itemType === 'COMBO' || i.itemType === 'BUILD_COMBO')
  return (
    <ChatCard tone="leaf">
      <CardTitle
        icon={isComboList ? Layers : Wallet}
        title={combo.title}
        subtitle={`Ngân sách: ${money(combo.targetBudget ?? 0)}`}
        right={<AppText weight="bold" className="text-sm">{isComboList ? 'Đóng gói sẵn' : money(combo.actualTotal ?? 0)}</AppText>}
      />
      <CardText muted>{combo.description}</CardText>
      {items.map((item) => (
        <ChatItemRow key={`${item.itemType}-${item.itemId}`} item={item} />
      ))}
      {isComboList ? (
        <ChatAction label="Khám phá thêm kho Combo & Túi mù" icon={Sparkles} variant="outline" onPress={() => openChatbotUrl('/combo-tui-mu')} />
      ) : (
        items.length > 0 && (
          <AddAllAction
            items={items}
            label={`Thêm toàn bộ combo (${money(combo.actualTotal ?? 0)})`}
            busyLabel="Đang thêm toàn bộ vào giỏ..."
          />
        )
      )}
    </ChatCard>
  )
}

export function ReorderCard({ reorder }: { reorder: ReorderDto }) {
  const items = reorder.items ?? []
  const available = items.filter((i) => !i.isOutOfStock)
  const someOut = available.length < items.length
  return (
    <ChatCard tone="soil">
      <CardTitle
        icon={RotateCcw}
        title={reorder.orderId > 0 ? `Đơn hàng #${reorder.orderId}` : 'Mua lại nhanh'}
        subtitle={[reorder.shopName || 'Nhà vườn', reorder.orderDate].filter(Boolean).join(' • ')}
        right={<AppText weight="bold" className="text-sm">{money(reorder.totalAmount ?? 0)}</AppText>}
      />
      {!!reorder.stockWarning && (
        <View className="flex-row gap-1.5">
          <AlertCircle size={15} color={colors.soil600} />
          <AppText className="flex-1 text-caption text-soil-700">{reorder.stockWarning}</AppText>
        </View>
      )}
      {items.map((item) => (
        <ChatItemRow
          key={`${item.itemType}-${item.itemId}`}
          item={item}
          quantity={item.orderQuantity || 1}
          addLabel="+ Thêm"
          hint={
            <View className="flex-row items-center gap-1.5">
              <AppText className="text-caption text-ink-muted">x{item.orderQuantity || 1}</AppText>
              {item.isOutOfStock ? <Chip tone="danger" label="Hết hàng" /> : <Chip label="Còn hàng" />}
            </View>
          }
        />
      ))}
      {available.length > 0 ? (
        <AddAllAction
          items={available}
          label={someOut ? `Xác nhận thêm ${available.length} món còn hàng vào giỏ` : `Xác nhận thêm cả ${items.length} món vào giỏ`}
          busyLabel="Đang thêm vào giỏ..."
        />
      ) : (
        <>
          <CardText muted>Tất cả nông sản trong đơn này hiện đã hết hàng hoặc hết mùa vụ.</CardText>
          <ChatAction label="Khám phá nông sản tươi khác" icon={ArrowRight} variant="outline" onPress={() => openChatbotUrl('/san-pham')} />
        </>
      )}
    </ChatCard>
  )
}

export function FlashRescueCard({ rescue }: { rescue: FlashRescueDto }) {
  const items = rescue.items ?? []
  return (
    <ChatCard tone="danger">
      <CardTitle
        icon={Zap}
        danger
        title={rescue.title}
        right={<Chip tone="danger" label={`Giảm đến ${rescue.discountRate}%`} />}
      />
      <CardText>{rescue.description}</CardText>
      {items.map((item) => (
        <ChatItemRow key={`${item.itemType}-${item.itemId}`} item={item} addLabel="Cứu" />
      ))}
      {items.length > 1 && (
        <AddAllAction items={items} label={`Giải cứu cả ${items.length} món này`} busyLabel="Đang thêm..." />
      )}
    </ChatCard>
  )
}

