import {
  AlertTriangle,
  Apple,
  ArrowRight,
  Award,
  BookmarkPlus,
  Briefcase,
  Calendar,
  Carrot,
  Check,
  ChefHat,
  Clock,
  Copy,
  ExternalLink,
  Headphones,
  HeartPulse,
  Leaf,
  Lightbulb,
  MessageCircle,
  Package,
  Phone,
  Share2,
  ShieldAlert,
  ShoppingBag,
  Store,
  ThermometerSnowflake,
  Ticket,
  TreePine,
} from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, ChoiceChips } from '@/components/ui'
import { getErrorCode } from '@/features/auth/utils/authErrors'
import { useCollectVoucher } from '@/features/checkout'
import { money } from '@/features/product'
import type {
  GreenImpactDto,
  HumanHandoverDto,
  MealPlanBridgeDto,
  MysteryBoxQaDto,
  PreservationTipDto,
  RecipeSuggestionDto,
  RoleGuidanceDto,
  SeasonalCalendarDto,
  ShippingTipDto,
  VoucherItemDto,
} from '@/services/chatbot.types'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { callPhone, copyText, openChatbotItem, openChatbotUrl, openExternalLink, openMessages } from '../../chatbotLinks'
import { useChatbotStore } from '../../stores/useChatbotStore'
import { greenImpactSummary, guidanceLines, isFreeshipVoucher, seasonalBadge, seasonalMonth } from '../../utils/chatbotCards'
import { CardText, CardTitle, ChatAction, ChatCard, ChatItemRow, Chip, InfoRow } from './CardParts'

/** Mã lỗi BE khi lưu voucher (ErrorCode 90xx). */
const VOUCHER_INVALID = 9003
const VOUCHER_OUT_OF_STOCK = 9004
const VOUCHER_LIMIT_REACHED = 9005

function VoucherRow({ voucher }: { voucher: VoucherItemDto }) {
  const showToast = useUiStore((s) => s.showToast)
  const collect = useCollectVoucher()
  const [claimed, setClaimed] = useState(!!voucher.isCollected)
  const outOfStock = !!voucher.isOutOfStock && !claimed
  const isFreeship = isFreeshipVoucher(voucher)

  const handleCollect = () =>
    collect.mutate(voucher.code, {
      onSuccess: () => {
        setClaimed(true)
        showToast(`Đã lưu voucher ${voucher.code} vào kho voucher của bạn!`)
      },
      onError: (err) => {
        const code = getErrorCode(err)
        if (code === VOUCHER_LIMIT_REACHED) {
          setClaimed(true)
          showToast(`Bạn đã có voucher ${voucher.code} trong ví rồi!`)
        } else if (code === VOUCHER_OUT_OF_STOCK) {
          showToast(`Voucher ${voucher.code} đã hết lượt lưu.`)
        } else if (code === VOUCHER_INVALID) {
          showToast(`Voucher ${voucher.code} đã hết hạn hoặc tạm ngừng.`)
        } else {
          showToast(getErrorMessage(err, 'Không thể lưu mã lúc này. Vui lòng thử lại.'))
        }
      },
    })

  return (
    <View className="gap-2 rounded-card border border-line bg-white p-2.5">
      <View className="flex-row flex-wrap items-center gap-1.5">
        <AppText weight="bold" className="text-sm">
          {voucher.code}
        </AppText>
        {claimed && <Chip label="Đã trong ví" />}
        {outOfStock && <Chip tone="danger" label="Hết lượt lưu" />}
        {isFreeship ? <Chip tone="sun" label="Freeship" /> : !voucher.shopName && <Chip label="Toàn sàn" />}
      </View>
      {!!voucher.shopId && !!voucher.shopName && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem cửa hàng ${voucher.shopName}`}
          onPress={() => openChatbotUrl(`/cua-hang/${voucher.shopId}`)}
          className="min-h-8 flex-row items-center gap-1 self-start active:opacity-70"
        >
          <Store size={13} color={colors.leaf700} />
          <AppText weight="medium" className="text-caption text-leaf-700">
            {voucher.shopName}
          </AppText>
        </Pressable>
      )}
      <AppText weight="semibold" className="text-sm">
        {voucher.title}
      </AppText>
      <AppText className="text-caption text-ink-muted">
        {voucher.minOrderValue && voucher.minOrderValue > 0 ? `Đơn tối thiểu: ${money(voucher.minOrderValue)}` : 'Áp dụng mọi đơn'}
        {voucher.expiryDate ? ` • HSD: ${voucher.expiryDate}` : ''}
      </AppText>
      <View className="flex-row gap-2">
        <ChatAction
          label={claimed ? 'Đã lưu' : outOfStock ? 'Hết mã' : 'Lưu mã'}
          icon={claimed ? Check : BookmarkPlus}
          disabled={claimed || outOfStock}
          loading={collect.isPending}
          className="flex-1"
          onPress={handleCollect}
        />
        <ChatAction
          label="Sao chép"
          icon={Copy}
          variant="outline"
          className="flex-1"
          onPress={() => copyText(voucher.code, `Đã sao chép mã ${voucher.code}`)}
        />
      </View>
    </View>
  )
}

export function VoucherListCard({ vouchers }: { vouchers: VoucherItemDto[] }) {
  if (vouchers.length === 0) {
    return (
      <ChatCard>
        <CardText muted>Hiện tại chưa có mã ưu đãi phù hợp. Bạn hãy quay lại sau nhé!</CardText>
      </ChatCard>
    )
  }
  return (
    <View className="gap-2">
      {vouchers.map((voucher) => (
        <VoucherRow key={voucher.code} voucher={voucher} />
      ))}
      <ChatAction label="Xem tất cả tại Kho Voucher" icon={Ticket} variant="outline" onPress={() => openChatbotUrl('/my-vouchers')} />
    </View>
  )
}

export function RecipeCard({ recipe }: { recipe: RecipeSuggestionDto }) {
  const missing = recipe.missingIngredients ?? []
  return (
    <ChatCard tone="soil">
      <CardTitle icon={ChefHat} title={recipe.dishName} subtitle={`Thời gian nấu: ${recipe.cookTime || '15-20 phút'}`} />
      <CardText>{recipe.description}</CardText>
      {missing.length > 0 && (
        <>
          <AppText weight="semibold" className="text-caption">
            Nông sản tươi sạch có sẵn trên sàn để nấu kèm:
          </AppText>
          {missing.map((item) => (
            <ChatItemRow key={`${item.itemType}-${item.itemId}`} item={item} addLabel="Lấy thêm" />
          ))}
        </>
      )}
    </ChatCard>
  )
}

export function MysteryBoxQaCard({ mysteryBox }: { mysteryBox: MysteryBoxQaDto }) {
  const selectOption = useChatbotStore((s) => s.selectOption)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const allergies = mysteryBox.userAllergies ?? []

  // Có nguy cơ dị ứng: khoá nút mua, chỉ gợi ý lựa chọn biết rõ thành phần.
  if (mysteryBox.isAllergyRisk) {
    return (
      <ChatCard tone="danger">
        <CardTitle
          icon={ShieldAlert}
          danger
          title="Cảnh báo dị ứng: Không khuyến khích mua Hộp Bí Ẩn"
          subtitle="Nguy cơ dị nguyên & nhiễm chéo cao"
        />
        <AppText weight="semibold" className="text-sm">
          Phát hiện nguy cơ dị ứng: {mysteryBox.riskAllergen || 'Nấm / Các loại hạt'}
        </AppText>
        <CardText>
          Hộp Bí Ẩn được đóng gói ngẫu nhiên mỗi sáng theo lượng nông sản giải cứu từ nhiều nhà vườn, do đó không thể cam kết loại bỏ 100% các loại củ quả, nấm hoặc hạt gây kích ứng.
        </CardText>
        <AppText weight="semibold" className="text-caption">
          Giải pháp mua sắm an toàn cho bạn:
        </AppText>
        <ChatAction label="Chọn rau củ an toàn (Đơn lẻ)" icon={ArrowRight} variant="outline" onPress={() => openChatbotUrl('/nong-san-tuoi')} />
        <ChatAction label="Xem Combo minh bạch thành phần" icon={ArrowRight} variant="outline" onPress={() => openChatbotUrl('/combo-tui-mu')} />
        <AppText weight="medium" className="text-center text-caption text-sale">
          Nút mua Hộp Bí Ẩn tạm khóa để bảo vệ bạn khỏi nguy cơ dị ứng thực phẩm.
        </AppText>
      </ChatCard>
    )
  }

  const { boxItem } = mysteryBox
  return (
    <ChatCard tone="soil">
      <CardTitle icon={Package} title="Hộp Bí Ẩn Nông Sản Giải Cứu (Mystery Box)" subtitle="Nông sản do nhà vườn chọn và đóng gói sẵn" />
      <CardText>{mysteryBox.seasonalDescription}</CardText>
      {allergies.length > 0 ? (
        <View className="flex-row gap-1.5 rounded-card bg-sun-100 p-2.5">
          <AlertTriangle size={15} color={colors.soil600} />
          <AppText className="flex-1 text-caption text-soil-700">
            Hồ sơ của bạn có ghi nhận dị ứng: {allergies.join(', ')}. Bạn có thể ghi chú cho nhà vườn ở bước thanh toán để shop tránh xếp các loại củ quả này vào hộp nhé!
          </AppText>
        </View>
      ) : (
        !!mysteryBox.note && <CardText muted>{mysteryBox.note}</CardText>
      )}
      {!!boxItem && (
        <>
          <InfoRow strong label={boxItem.name} value={money(boxItem.price ?? 0)} />
          <View className="flex-row gap-2">
            <ChatAction label="Chi tiết" variant="outline" className="flex-1" onPress={() => openChatbotItem(boxItem)} />
            <ChatAction label="Thêm hộp bí ẩn" disabled={isLoading} className="flex-1" onPress={() => void selectOption(boxItem, 1)} />
          </View>
        </>
      )}
    </ChatCard>
  )
}

export function ShippingTipsCard({ tips }: { tips: ShippingTipDto }) {
  const shopNames = tips.shopNames ?? []
  return (
    <ChatCard tone="leaf">
      <CardTitle icon={Lightbulb} title="Mẹo Tối Ưu Phí Giao Hàng" />
      <CardText>{tips.tipMessage}</CardText>
      {tips.hasMultiShops && shopNames.length > 0 && (
        <View className="gap-1.5">
          <AppText weight="semibold" className="text-caption">
            Các nhà vườn trong giỏ của bạn ({tips.shopCount}):
          </AppText>
          <View className="flex-row flex-wrap gap-1.5">
            {shopNames.map((name) => (
              <Chip key={name} label={name} />
            ))}
          </View>
        </View>
      )}
      <View className="flex-row gap-2">
        <ChatAction label="Xem giỏ hàng" icon={ShoppingBag} variant="outline" className="flex-1" onPress={() => openChatbotUrl('/cart')} />
        <ChatAction label="Mã Freeship" icon={Ticket} className="flex-1" onPress={() => openChatbotUrl('/my-vouchers')} />
      </View>
    </ChatCard>
  )
}

export function PreservationTipsCard({ tips }: { tips: PreservationTipDto[] }) {
  const [active, setActive] = useState(tips[0]?.category ?? '')
  const tip = tips.find((t) => t.category === active) ?? tips[0]
  if (!tip) return null
  return (
    <ChatCard tone="leaf">
      <CardTitle icon={ThermometerSnowflake} title="Bí Quyết Bảo Quản Rau Củ Tươi Lâu" />
      <ChoiceChips
        label="Chọn nhóm nông sản"
        options={tips.map((t) => ({ value: t.category, label: t.category }))}
        value={tip.category}
        onChange={setActive}
      />
      {!!tip.storageType && <Chip label={tip.storageType} />}
      <CardText>{tip.tips}</CardText>
    </ChatCard>
  )
}

export function HumanHandoverCard({ handover }: { handover: HumanHandoverDto }) {
  const { hotline, zaloUrl } = handover
  return (
    <ChatCard>
      <CardTitle icon={Headphones} title="Kênh Hỗ Trợ Khách Hàng" />
      <CardText muted>{handover.note || 'Bạn có thể nhắn tin trực tiếp với chủ nhà vườn trong mục Tin nhắn.'}</CardText>
      {handover.triggerP2pChat && <ChatAction label="Mở Tin nhắn" icon={MessageCircle} onPress={openMessages} />}
      {!!hotline && <ChatAction label={`Tổng đài ${hotline}`} icon={Phone} variant="outline" onPress={() => callPhone(hotline)} />}
      {!!zaloUrl && <ChatAction label="Zalo hỗ trợ" icon={ExternalLink} variant="outline" onPress={() => openExternalLink(zaloUrl)} />}
    </ChatCard>
  )
}

export function RoleGuidanceCard({ roleGuidance }: { roleGuidance: RoleGuidanceDto }) {
  const links = roleGuidance.quickLinks ?? []
  return (
    <ChatCard tone="soil">
      <CardTitle icon={Briefcase} title={roleGuidance.title} />
      <View className="gap-1">
        {guidanceLines(roleGuidance.guidance).map(({ text, isStep }) => (
          <View key={text} className="flex-row gap-1.5">
            {isStep && <Check size={14} color={colors.leaf700} />}
            <AppText weight={isStep ? 'medium' : 'regular'} className="flex-1 text-sm">
              {text}
            </AppText>
          </View>
        ))}
      </View>
      {links.map((link, index) => (
        <ChatAction
          key={`${link.url}-${link.label}`}
          label={link.label}
          icon={ArrowRight}
          variant={index === 0 ? 'primary' : 'outline'}
          onPress={() => openChatbotUrl(link.url)}
        />
      ))}
    </ChatCard>
  )
}

/** BE đã bỏ lời mời tới Kế hoạch ăn uống cho client MOBILE vì tính năng này chỉ có trên bản web. */
export function MealPlanBridgeCard({ bridge }: { bridge: MealPlanBridgeDto }) {
  const advice = bridge.healthAdvice || bridge.suggestionSummary
  const meals = bridge.sampleMeals || bridge.sampleDishes || []
  const good = bridge.goodProduce ?? []
  const avoid = bridge.avoidProduce ?? []
  const products = bridge.recommendedProducts || bridge.recommendedProduce || []
  return (
    <ChatCard tone="leaf">
      <CardTitle icon={HeartPulse} title={bridge.conditionName || bridge.topic || 'Tư Vấn Dinh Dưỡng Theo Thể Trạng'} subtitle="Trợ lý dinh dưỡng AI CapNong" />
      {!!advice && <CardText>{advice}</CardText>}
      <CardText muted>
        Nội dung chỉ mang tính tham khảo, không thay thế tư vấn y khoa. Nếu bạn đang điều trị bệnh, hãy hỏi ý kiến bác sĩ trước khi thay đổi chế độ ăn.
      </CardText>
      {meals.length > 0 && (
        <View className="gap-1">
          <AppText weight="semibold" className="text-caption">
            Gợi Ý Thực Đơn Mẫu Trong Ngày:
          </AppText>
          {meals.map((meal) => (
            <AppText key={meal} className="text-caption text-ink-muted">
              • {meal}
            </AppText>
          ))}
        </View>
      )}
      {good.length > 0 && (
        <View className="gap-1">
          <AppText weight="semibold" className="text-caption">
            Nông sản khuyên dùng:
          </AppText>
          <View className="flex-row flex-wrap gap-1.5">
            {good.map((name) => (
              <Chip key={name} label={name} />
            ))}
          </View>
        </View>
      )}
      {avoid.length > 0 && (
        <View className="gap-1">
          <AppText weight="semibold" className="text-caption">
            Nông sản nên hạn chế:
          </AppText>
          <View className="flex-row flex-wrap gap-1.5">
            {avoid.map((name) => (
              <Chip key={name} tone="danger" label={name} />
            ))}
          </View>
        </View>
      )}
      {products.map((item) => (
        <ChatItemRow key={`${item.itemType}-${item.itemId}`} item={item} />
      ))}
    </ChatCard>
  )
}

function ProduceChips({ icon: Icon, title, names }: { icon: typeof Apple; title: string; names: string[] }) {
  const sendMessage = useChatbotStore((s) => s.sendMessage)
  const isLoading = useChatbotStore((s) => s.isLoading)
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-1">
        <Icon size={14} color={colors.leaf700} />
        <AppText weight="semibold" className="text-caption">
          {title} (Bấm để xem & mua)
        </AppText>
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {names.map((name) => (
          <Pressable
            key={name}
            disabled={isLoading}
            onPress={() => void sendMessage(`Tìm mua ${name}`)}
            accessibilityRole="button"
            accessibilityLabel={`Tìm mua ${name}`}
            className="min-h-9 justify-center rounded-full border border-leaf-200 bg-white px-3 active:bg-leaf-100"
          >
            <AppText weight="medium" className="text-caption text-leaf-800">
              {name}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export function SeasonalCalendarCard({ calendar }: { calendar: SeasonalCalendarDto }) {
  const fruits = calendar.inSeasonFruits ?? []
  const vegetables = calendar.inSeasonVegetables || calendar.inSeasonVeggies || []
  const upcoming = calendar.upcomingProduce ?? []
  const note = calendar.note || calendar.healthBenefitNote || calendar.highlights
  return (
    <ChatCard tone="leaf">
      <CardTitle
        icon={Calendar}
        title={`Lịch Nông Sản Mùa Vụ Tháng ${seasonalMonth(calendar)}`}
        subtitle="Mùa nào thức nấy • Tươi ngon nhất • Giá rẻ nhất"
      />
      <Chip tone={calendar.isPastMonth ? 'sun' : 'leaf'} label={seasonalBadge(calendar)} />
      {!!note && <CardText muted>{note}</CardText>}
      {fruits.length > 0 && <ProduceChips icon={Apple} title="Trái cây rộ mùa:" names={fruits} />}
      {vegetables.length > 0 && <ProduceChips icon={Carrot} title="Rau củ chính vụ:" names={vegetables} />}
      {upcoming.length > 0 && (
        <View className="flex-row gap-1.5">
          <Clock size={14} color={colors.inkMuted} />
          <AppText className="flex-1 text-caption text-ink-muted">Sắp vào vụ tới: {upcoming.join(', ')}</AppText>
        </View>
      )}
    </ChatCard>
  )
}

function ImpactStat({ value, label, icon: Icon }: { value: string; label: string; icon?: typeof TreePine }) {
  return (
    <View className="flex-1 items-center gap-0.5 rounded-card bg-white p-2">
      <View className="flex-row items-center gap-1">
        {Icon && <Icon size={14} color={colors.leaf700} />}
        <AppText weight="bold" className="text-sm text-leaf-700">
          {value}
        </AppText>
      </View>
      <AppText className="text-center text-caption text-ink-muted">{label}</AppText>
    </View>
  )
}

export function GreenImpactCard({ impact }: { impact: GreenImpactDto }) {
  const summary = greenImpactSummary(impact)
  return (
    <ChatCard tone="leaf">
      <CardTitle
        icon={Leaf}
        title="Dấu Chân Xanh Của Bạn"
        subtitle={summary.rank}
        right={<Chip label={`${summary.points} điểm`} />}
      />
      <View className="flex-row gap-1.5">
        <ImpactStat value={`${summary.rescuedKg.toFixed(1)} kg`} label="Nông sản giải cứu" />
        <ImpactStat value={`${summary.co2Kg.toFixed(1)} kg`} label="CO₂ giảm thải" icon={Award} />
        <ImpactStat value={String(summary.trees)} label="Cây xanh bảo vệ" icon={TreePine} />
      </View>
      <CardText muted>{summary.shareMessage}</CardText>
      <ChatAction
        label="Sao chép thông điệp sống xanh"
        icon={Share2}
        variant="outline"
        onPress={() => copyText(summary.shareMessage, 'Đã sao chép thông điệp!')}
      />
    </ChatCard>
  )
}
