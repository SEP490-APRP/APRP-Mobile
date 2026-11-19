import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import {
  Camera,
  CheckCircle2,
  Clock,
  FileCheck,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useMyProfile, useUpdateProfile } from '@/features/profile'
import { uploadService } from '@/services/upload.service'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

export default function ShipperVerificationScreen() {
  const profile = useMyProfile()
  const update = useUpdateProfile()
  const showToast = useUiStore((s) => s.showToast)

  const [licenseImg, setLicenseImg] = useState<string | null>(null)
  const [vehicleDocImg, setVehicleDocImg] = useState<string | null>(null)
  const [uploadingLicense, setUploadingLicense] = useState(false)
  const [uploadingVehicleDoc, setUploadingVehicleDoc] = useState(false)

  const p = profile.data

  // Initialize with current documents if available
  const currentLicense = licenseImg ?? p?.licenseImageUrl ?? null
  const currentVehicleDoc = vehicleDocImg ?? p?.vehicleDocImageUrl ?? null

  const pickDocument = async (kind: 'license' | 'vehicleDoc') => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      })
      if (res.canceled || !res.assets[0]) return
      const asset = res.assets[0]
      const file = {
        uri: asset.uri,
        name: asset.fileName ?? `${kind}-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      }

      if (kind === 'license') {
        setUploadingLicense(true)
        const uploadRes = await uploadService.uploadImage(file, 'driver-docs')
        setUploadingLicense(false)
        if (uploadRes.result?.url) {
          setLicenseImg(uploadRes.result.url)
          showToast('Đã tải ảnh GPLX lên')
        }
      } else {
        setUploadingVehicleDoc(true)
        const uploadRes = await uploadService.uploadImage(file, 'driver-docs')
        setUploadingVehicleDoc(false)
        if (uploadRes.result?.url) {
          setVehicleDocImg(uploadRes.result.url)
          showToast('Đã tải ảnh đăng ký xe lên')
        }
      }
    } catch {
      setUploadingLicense(false)
      setUploadingVehicleDoc(false)
      Alert.alert('Lỗi tải ảnh', 'Không thể tải ảnh giấy tờ lên, vui lòng thử lại.')
    }
  }

  const handleSaveDocuments = () => {
    if (!currentLicense && !currentVehicleDoc) {
      Alert.alert('Chưa có ảnh', 'Vui lòng tải lên ít nhất một loại giấy tờ để gửi xác minh.')
      return
    }

    update.mutate(
      {
        licenseImageUrl: currentLicense ?? undefined,
        vehicleDocImageUrl: currentVehicleDoc ?? undefined,
      } as any,
      {
        onSuccess: () => {
          showToast('Đã gửi thông tin xác minh tài xế.')
          router.back()
        },
        onError: () => {
          Alert.alert('Thất bại', 'Không thể cập nhật giấy tờ xác minh, vui lòng thử lại sau.')
        },
      },
    )
  }

  if (profile.isPending) return <CapNongLoading message="Đang tải thông tin xác minh..." />

  if (profile.isError || !p) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
          <BackButton onPress={() => router.back()} />
          <AppText weight="extrabold" className="text-base">
            Xác minh tài xế
          </AppText>
        </View>
        <View className="flex-1 justify-center p-5">
          <ErrorState description="Không tải được thông tin tài khoản." onRetry={() => void profile.refetch()} />
        </View>
      </SafeAreaView>
    )
  }

  const isApproved = p.status === 'ACTIVE'
  const isPending = p.status === 'PENDING'

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-2 border-b border-line bg-white px-4 py-3">
        <BackButton onPress={() => router.back()} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Xác minh tài xế
        </AppText>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-12" showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View
          className={cn(
            'flex-row items-center gap-3.5 rounded-panel border p-4',
            isApproved
              ? 'border-leaf-300 bg-leaf-50'
              : isPending
              ? 'border-amber-300 bg-amber-50'
              : 'border-rose-300 bg-rose-50',
          )}
        >
          <View
            className={cn(
              'h-11 w-11 items-center justify-center rounded-full',
              isApproved ? 'bg-leaf-700' : isPending ? 'bg-amber-600' : 'bg-rose-600',
            )}
          >
            {isApproved ? (
              <CheckCircle2 size={24} color="#fff" />
            ) : isPending ? (
              <Clock size={24} color="#fff" />
            ) : (
              <XCircle size={24} color="#fff" />
            )}
          </View>
          <View className="min-w-0 flex-1">
            <AppText
              weight="extrabold"
              className={cn(
                'text-base',
                isApproved ? 'text-leaf-800' : isPending ? 'text-amber-800' : 'text-rose-800',
              )}
            >
              {isApproved
                ? 'Tài khoản đã được xác minh'
                : isPending
                ? 'Đang chờ phê duyệt hồ sơ'
                : 'Hồ sơ chưa được duyệt'}
            </AppText>
            <AppText
              className={cn(
                'text-xs mt-0.5',
                isApproved ? 'text-leaf-700' : isPending ? 'text-amber-700' : 'text-rose-700',
              )}
            >
              {isApproved
                ? 'Bạn đã đủ điều kiện nhận đơn giao hàng trên toàn hệ thống CapNong.'
                : isPending
                ? 'Ban quản trị đang xem xét giấy tờ của bạn (tối đa 24h làm việc).'
                : 'Giấy tờ của bạn chưa hợp lệ hoặc mờ nhòe. Vui lòng tải lại ảnh mới.'}
            </AppText>
          </View>
        </View>

        {/* Giấy phép lái xe (GPLX) */}
        <View className="gap-2 rounded-panel border border-line bg-white p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <FileCheck size={18} color={colors.leaf700} />
              <AppText weight="bold" className="text-sm">
                Giấy phép lái xe (GPLX A1 / A2)
              </AppText>
            </View>
            {currentLicense && (
              <View className="rounded bg-leaf-100 px-2 py-0.5">
                <AppText weight="bold" className="text-[10px] text-leaf-800">
                  Đã tải lên
                </AppText>
              </View>
            )}
          </View>
          <AppText className="text-xs text-ink-muted">
            Ảnh chụp mặt trước bằng lái xe còn hạn sử dụng, rõ số và họ tên.
          </AppText>

          <Pressable
            onPress={() => void pickDocument('license')}
            disabled={uploadingLicense}
            className="mt-2 min-h-[160px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-slate-50 active:bg-slate-100"
          >
            {uploadingLicense ? (
              <View className="items-center gap-2">
                <ActivityIndicator color={colors.leaf700} />
                <AppText className="text-xs text-ink-muted">Đang tải ảnh lên...</AppText>
              </View>
            ) : currentLicense ? (
              <View className="relative h-44 w-full">
                <Image source={{ uri: currentLicense }} className="h-full w-full" contentFit="contain" />
                <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md bg-black/60 px-2 py-1">
                  <Camera size={12} color="#fff" />
                  <AppText weight="bold" className="text-[11px] text-white">
                    Chụp lại
                  </AppText>
                </View>
              </View>
            ) : (
              <View className="items-center gap-2 py-6">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-leaf-50">
                  <Upload size={20} color={colors.leaf700} />
                </View>
                <AppText weight="bold" className="text-sm text-leaf-700">
                  Chọn hoặc chụp ảnh GPLX
                </AppText>
                <AppText className="text-[11px] text-ink-muted">Hỗ trợ JPG, PNG (tối đa 10MB)</AppText>
              </View>
            )}
          </Pressable>
        </View>

        {/* Đăng ký xe máy (Cà vẹt xe) */}
        <View className="gap-2 rounded-panel border border-line bg-white p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={18} color={colors.leaf700} />
              <AppText weight="bold" className="text-sm">
                Đăng ký xe máy (Cà vẹt xe)
              </AppText>
            </View>
            {currentVehicleDoc && (
              <View className="rounded bg-leaf-100 px-2 py-0.5">
                <AppText weight="bold" className="text-[10px] text-leaf-800">
                  Đã tải lên
                </AppText>
              </View>
            )}
          </View>
          <AppText className="text-xs text-ink-muted">
            Ảnh chụp mặt trước giấy đăng ký xe trùng khớp với biển số xe đã đăng ký.
          </AppText>

          <Pressable
            onPress={() => void pickDocument('vehicleDoc')}
            disabled={uploadingVehicleDoc}
            className="mt-2 min-h-[160px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-slate-50 active:bg-slate-100"
          >
            {uploadingVehicleDoc ? (
              <View className="items-center gap-2">
                <ActivityIndicator color={colors.leaf700} />
                <AppText className="text-xs text-ink-muted">Đang tải ảnh lên...</AppText>
              </View>
            ) : currentVehicleDoc ? (
              <View className="relative h-44 w-full">
                <Image source={{ uri: currentVehicleDoc }} className="h-full w-full" contentFit="contain" />
                <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md bg-black/60 px-2 py-1">
                  <Camera size={12} color="#fff" />
                  <AppText weight="bold" className="text-[11px] text-white">
                    Chụp lại
                  </AppText>
                </View>
              </View>
            ) : (
              <View className="items-center gap-2 py-6">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-leaf-50">
                  <Upload size={20} color={colors.leaf700} />
                </View>
                <AppText weight="bold" className="text-sm text-leaf-700">
                  Chọn hoặc chụp ảnh Cà vẹt xe
                </AppText>
                <AppText className="text-[11px] text-ink-muted">Hỗ trợ JPG, PNG (tối đa 10MB)</AppText>
              </View>
            )}
          </Pressable>
        </View>

        {/* Nút gửi cập nhật */}
        <Button
          title="Lưu & gửi duyệt giấy tờ"
          loading={update.isPending}
          disabled={uploadingLicense || uploadingVehicleDoc}
          onPress={handleSaveDocuments}
          className="min-h-[48px] mt-2"
        />
      </ScrollView>
    </SafeAreaView>
  )
}
