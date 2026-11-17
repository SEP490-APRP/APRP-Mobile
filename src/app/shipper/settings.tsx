import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import {
  Bell,
  ChevronRight,
  Info,
  KeyRound,
  Shield,
  Smartphone,
  Trash2,
  Volume2,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { colors } from '@/theme/colors'

const SHIPPER_SETTINGS_KEY = 'capnong_shipper_settings'

export default function ShipperSettingsScreen() {
  const [vibration, setVibration] = useState(true)
  const [sound, setSound] = useState(true)
  const [newOrderNotif, setNewOrderNotif] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(SHIPPER_SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed.vibration != null) setVibration(parsed.vibration)
          if (parsed.sound != null) setSound(parsed.sound)
          if (parsed.newOrderNotif != null) setNewOrderNotif(parsed.newOrderNotif)
        } catch {}
      }
    })
  }, [])

  const saveSetting = async (key: string, val: boolean) => {
    const updated = { vibration, sound, newOrderNotif, [key]: val }
    await AsyncStorage.setItem(SHIPPER_SETTINGS_KEY, JSON.stringify(updated))
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Yêu cầu hủy tài khoản tài xế',
      'Bạn có chắc chắn muốn gửi yêu cầu hủy tài khoản? Bạn cần tất toán hết số dư ví COD và hoàn tất các đơn đang giao trước khi tài khoản được khóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi yêu cầu',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Đã gửi yêu cầu',
              'Ban quản trị sàn CapNong đã tiếp nhận yêu cầu đóng tài khoản và sẽ liên hệ hỗ trợ bạn trong 24h làm việc.',
            )
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-2 border-b border-line bg-white px-4 py-3">
        <BackButton onPress={() => router.back()} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Cài đặt ứng dụng
        </AppText>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-12" showsVerticalScrollIndicator={false}>
        {/* Thông báo & Rung nhận đơn */}
        <View className="overflow-hidden rounded-panel border border-line bg-white">
          <View className="border-b border-line px-4 py-3 bg-slate-50">
            <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
              Chuông & Rung nhận đơn
            </AppText>
          </View>

          <View className="flex-row items-center justify-between p-4 border-b border-line">
            <View className="flex-row items-center gap-3 flex-1 pr-3">
              <Smartphone size={20} color={colors.leaf700} />
              <View className="flex-1">
                <AppText weight="bold" className="text-sm">
                  Rung khi có đơn mới
                </AppText>
                <AppText className="text-xs text-ink-muted">
                  Rung thiết bị khi nhận thông báo mời giao hàng
                </AppText>
              </View>
            </View>
            <Switch
              value={vibration}
              onValueChange={(val) => {
                setVibration(val)
                void saveSetting('vibration', val)
              }}
              trackColor={{ false: '#cbd5e1', true: colors.leaf700 }}
            />
          </View>

          <View className="flex-row items-center justify-between p-4 border-b border-line">
            <View className="flex-row items-center gap-3 flex-1 pr-3">
              <Volume2 size={20} color={colors.leaf700} />
              <View className="flex-1">
                <AppText weight="bold" className="text-sm">
                  Âm thanh thông báo
                </AppText>
                <AppText className="text-xs text-ink-muted">
                  Phát chuông cảnh báo khi có đơn mới cần giao
                </AppText>
              </View>
            </View>
            <Switch
              value={sound}
              onValueChange={(val) => {
                setSound(val)
                void saveSetting('sound', val)
              }}
              trackColor={{ false: '#cbd5e1', true: colors.leaf700 }}
            />
          </View>

          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3 flex-1 pr-3">
              <Bell size={20} color={colors.leaf700} />
              <View className="flex-1">
                <AppText weight="bold" className="text-sm">
                  Thông báo hệ thống
                </AppText>
                <AppText className="text-xs text-ink-muted">
                  Nhận tin nhắn điều phối, hoàn tất đơn và ví tiền
                </AppText>
              </View>
            </View>
            <Switch
              value={newOrderNotif}
              onValueChange={(val) => {
                setNewOrderNotif(val)
                void saveSetting('newOrderNotif', val)
              }}
              trackColor={{ false: '#cbd5e1', true: colors.leaf700 }}
            />
          </View>
        </View>

        {/* Bảo mật & Tài khoản */}
        <View className="overflow-hidden rounded-panel border border-line bg-white">
          <View className="border-b border-line px-4 py-3 bg-slate-50">
            <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
              Tài khoản & Bảo mật
            </AppText>
          </View>

          <Pressable
            onPress={() => router.push('/shipper/password' as any)}
            className="flex-row items-center justify-between p-4 border-b border-line active:bg-slate-50"
          >
            <View className="flex-row items-center gap-3">
              <KeyRound size={20} color={colors.leaf700} />
              <AppText weight="bold" className="text-sm">
                Đổi mật khẩu tài khoản
              </AppText>
            </View>
            <ChevronRight size={18} color={colors.inkSubtle} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/shipper/verification' as any)}
            className="flex-row items-center justify-between p-4 active:bg-slate-50"
          >
            <View className="flex-row items-center gap-3">
              <Shield size={20} color={colors.leaf700} />
              <AppText weight="bold" className="text-sm">
                Trạng thái xác minh tài xế
              </AppText>
            </View>
            <ChevronRight size={18} color={colors.inkSubtle} />
          </Pressable>
        </View>

        {/* Thông tin phần mềm */}
        <View className="overflow-hidden rounded-panel border border-line bg-white p-4 gap-2">
          <View className="flex-row items-center gap-2">
            <Info size={18} color={colors.inkMuted} />
            <AppText weight="bold" className="text-sm">
              Thông tin ứng dụng
            </AppText>
          </View>
          <View className="flex-row justify-between pt-1">
            <AppText className="text-xs text-ink-muted">Phiên bản</AppText>
            <AppText weight="semibold" className="text-xs text-ink">
              CapNong Driver v1.0.0
            </AppText>
          </View>
          <View className="flex-row justify-between">
            <AppText className="text-xs text-ink-muted">Nền tảng</AppText>
            <AppText weight="semibold" className="text-xs text-ink">
              React Native / Expo
            </AppText>
          </View>
        </View>

        {/* Xóa tài khoản */}
        <Pressable
          onPress={handleDeleteAccount}
          className="flex-row items-center justify-center gap-2 rounded-panel border border-sale/40 bg-sale-soft p-3.5 active:bg-rose-100"
        >
          <Trash2 size={16} color={colors.sale} />
          <AppText weight="bold" className="text-sm text-sale">
            Yêu cầu đóng / khóa tài khoản tài xế
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
