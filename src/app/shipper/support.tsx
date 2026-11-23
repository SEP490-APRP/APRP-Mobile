import { router } from 'expo-router'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Headphones,
  HelpCircle,
  MessageCircle,
  Phone,
  ShieldAlert,
} from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { colors } from '@/theme/colors'

const HOTLINE = '1900636888'
const HOTLINE_DISPLAY = '1900 636 888 (24/7)'

const FAQ_ITEMS = [
  {
    q: 'Xe bị hỏng hóc hoặc gặp tai nạn trên đường giao?',
    a: 'Bạn vui lòng tấp xe vào lề đường an toàn. Bật tab "Đang giao", chọn "Báo thất bại" -> chọn lý do "Khác" và ghi chú "Xe gặp sự cố kỹ thuật". Sau đó gọi ngay hotline 1900 636 888 để đội ngũ CapNong điều phối tài xế khác đến tiếp nhận kiện hàng.',
  },
  {
    q: 'Khách hàng không nghe máy hoặc thuê bao không liên lạc được?',
    a: 'Theo quy định của sàn, bạn cần thực hiện tối thiểu 3 cuộc gọi cách nhau ít nhất 3 phút. Nếu khách vẫn không bắt máy, bấm "Báo thất bại" -> chọn "Không liên lạc được" (hệ thống sẽ tự đếm số cuộc gọi), sau đó mang hàng bàn giao lại cho nhà vườn.',
  },
  {
    q: 'Tiền ký quỹ COD được hoàn lại vào ví khi nào?',
    a: 'Ngay khi bạn xác nhận giao hàng thành công hoặc báo giao thất bại (hàng hoàn kho), số tiền ký quỹ sẽ được hệ thống tự động giải phóng và cộng lại ngay lập tức vào Số dư khả dụng của bạn.',
  },
  {
    q: 'Khách hàng yêu cầu đổi địa chỉ giao hàng xa hơn?',
    a: 'Nếu địa chỉ mới cách xa hơn 1km so với đơn gốc, bạn có quyền từ chối hoặc thỏa thuận phụ phí ship trực tiếp với khách hàng. Nếu khách không đồng ý, bạn có thể bấm "Báo thất bại" với lý do "Sai địa chỉ".',
  },
]

export default function ShipperSupportScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const callHotline = () => {
    void Linking.openURL(`tel:${HOTLINE}`)
  }

  const toggleFaq = (idx: number) => {
    setOpenFaq((curr) => (curr === idx ? null : idx))
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-2 border-b border-line bg-white px-4 py-3">
        <BackButton onPress={() => router.back()} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Trung tâm hỗ trợ tài xế
        </AppText>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-12" showsVerticalScrollIndicator={false}>
        {/* Banner tổng đài khẩn cấp */}
        <View className="rounded-panel border border-emerald-300 bg-emerald-50 p-4">
          <View className="flex-row items-center gap-2.5">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-leaf-700">
              <Headphones size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <AppText weight="extrabold" className="text-base text-leaf-900">
                Tổng đài hỗ trợ 24/7
              </AppText>
              <AppText className="text-xs text-leaf-700">
                Tiếp nhận sự cố giao hàng, tranh chấp và ứng cứu khẩn cấp
              </AppText>
            </View>
          </View>

          <Button
            title={`Gọi ngay ${HOTLINE_DISPLAY}`}
            icon={Phone}
            onPress={callHotline}
            className="mt-3 min-h-[46px] bg-leaf-700 active:bg-leaf-800"
          />
        </View>

        {/* Các kênh liên hệ nhanh */}
        <View className="rounded-panel border border-line bg-white">
          <Pressable
            onPress={() => router.push('/shipper/messages' as any)}
            className="flex-row items-center gap-3 p-4 border-b border-line active:bg-slate-50"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-leaf-50">
              <MessageCircle size={18} color={colors.leaf700} />
            </View>
            <View className="flex-1">
              <AppText weight="bold" className="text-sm">
                Chat với Quản trị viên
              </AppText>
              <AppText className="text-xs text-ink-muted">
                Gửi ảnh hóa đơn, khiếu nại cước hoặc phản ánh khách hàng
              </AppText>
            </View>
            <ChevronRight size={18} color={colors.inkSubtle} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/shipper/wallet' as any)}
            className="flex-row items-center gap-3 p-4 active:bg-slate-50"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <ShieldAlert size={18} color="#d97706" />
            </View>
            <View className="flex-1">
              <AppText weight="bold" className="text-sm">
                Đối soát cước & tiền COD
              </AppText>
              <AppText className="text-xs text-ink-muted">
                Kiểm tra biến động ví, tiền ký quỹ và lệnh rút tiền
              </AppText>
            </View>
            <ChevronRight size={18} color={colors.inkSubtle} />
          </Pressable>
        </View>

        {/* Hướng dẫn xử lý sự cố thường gặp */}
        <View className="rounded-panel border border-line bg-white p-4 gap-2">
          <View className="flex-row items-center gap-2 mb-1">
            <HelpCircle size={18} color={colors.leaf700} />
            <AppText weight="bold" className="text-sm uppercase tracking-wide text-ink-muted">
              Hướng dẫn xử lý sự cố trên đường
            </AppText>
          </View>

          <View className="divide-y divide-line">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <View key={idx} className="py-2.5">
                  <Pressable
                    onPress={() => toggleFaq(idx)}
                    className="flex-row items-center justify-between gap-2"
                  >
                    <AppText weight="bold" className="flex-1 text-sm text-ink leading-snug">
                      {item.q}
                    </AppText>
                    {isOpen ? (
                      <ChevronUp size={16} color={colors.leaf700} />
                    ) : (
                      <ChevronDown size={16} color={colors.inkMuted} />
                    )}
                  </Pressable>
                  {isOpen && (
                    <View className="mt-2 rounded-lg bg-slate-50 p-3">
                      <AppText className="text-xs text-ink leading-relaxed">
                        {item.a}
                      </AppText>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
