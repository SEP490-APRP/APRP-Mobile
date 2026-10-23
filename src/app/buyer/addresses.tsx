import { router } from 'expo-router'
import { Home, MapPin, Pencil, Plus, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { AddressFormSheet, useDeleteAddress, useSavedAddresses, useSetDefaultAddress } from '@/features/address'
import { BackButton } from '@/features/auth/components'
import { useAuth, useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { SavedAddress } from '@/types/address.types'
import { getErrorMessage } from '@/utils/errors'

const MAX_ADDRESSES = 10

/** Sổ địa chỉ nhận hàng, chuyển từ tab "Sổ địa chỉ" của ProfilePage bản web. */
export default function AddressesScreen() {
  const { user } = useAuth()
  const showToast = useUiStore((s) => s.showToast)
  const query = useSavedAddresses()
  const addresses = query.data ?? []
  const remove = useDeleteAddress()
  const setDefault = useSetDefaultAddress()
  const [form, setForm] = useState<{ editing: SavedAddress | null } | null>(null)
  const [deleting, setDeleting] = useState<SavedAddress | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    await query.refetch()
    setRefreshing(false)
  }

  const confirmDelete = () => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => showToast('Đã xoá địa chỉ.'),
      onError: (err) => showToast(getErrorMessage(err, 'Không thể xoá địa chỉ.')),
      onSettled: () => setDeleting(null),
    })
  }

  const makeDefault = (a: SavedAddress) =>
    setDefault.mutate(a.id, {
      onSuccess: () => showToast('Đã đặt làm địa chỉ mặc định.'),
      onError: (err) => showToast(getErrorMessage(err, 'Không thể đặt mặc định.')),
    })

  const full = addresses.length >= MAX_ADDRESSES

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer/account'))} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Sổ địa chỉ
        </AppText>
        <AppText className="pr-2 text-xs text-ink-muted">
          {addresses.length}/{MAX_ADDRESSES}
        </AppText>
      </View>

      <ScrollView
        contentContainerClassName="gap-3 p-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
        }
      >
        {query.isPending ? (
          <>
            <Skeleton className="h-32 w-full rounded-panel" />
            <Skeleton className="h-32 w-full rounded-panel" />
          </>
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : addresses.length === 0 ? (
          <EmptyState
            icon={<MapPin size={30} color={colors.leaf600} />}
            title="Chưa có địa chỉ nào"
            description="Thêm địa chỉ để đặt hàng nhanh hơn và tính phí giao chính xác."
          />
        ) : (
          addresses.map((a) => (
            <View key={a.id} className="gap-3 rounded-panel border border-line bg-white p-4">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-leaf-50">
                  <Home size={18} color={colors.leaf700} />
                </View>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <AppText weight="bold" className="text-sm">
                      {a.label || 'Địa chỉ'}
                    </AppText>
                    {a.isDefault && (
                      <View className="rounded-md border border-leaf-600 px-2 py-0.5">
                        <AppText weight="semibold" className="text-xs text-leaf-700">
                          Mặc định
                        </AppText>
                      </View>
                    )}
                  </View>
                  <AppText className="text-sm">
                    {a.recipientName} · {a.phone}
                  </AppText>
                  <AppText className="text-sm leading-relaxed text-ink-muted">{a.address}</AppText>
                </View>
              </View>
              <View className="flex-row items-center gap-2 border-t border-line pt-2">
                {!a.isDefault && (
                  <Pressable
                    onPress={() => makeDefault(a)}
                    accessibilityRole="button"
                    className="min-h-[40px] flex-1 justify-center"
                  >
                    <AppText weight="semibold" className="text-sm text-leaf-700">
                      Đặt làm mặc định
                    </AppText>
                  </Pressable>
                )}
                {a.isDefault && <View className="flex-1" />}
                <IconAction icon={Pencil} label="Sửa địa chỉ" onPress={() => setForm({ editing: a })} />
                <IconAction icon={Trash2} label="Xoá địa chỉ" onPress={() => setDeleting(a)} />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View className="border-t border-line bg-white px-4 pt-3">
        <Button
          title={full ? `Tối đa ${MAX_ADDRESSES} địa chỉ` : 'Thêm địa chỉ mới'}
          icon={Plus}
          disabled={full}
          onPress={() => setForm({ editing: null })}
        />
      </View>

      <AddressFormSheet
        visible={!!form}
        editing={form?.editing ?? null}
        defaults={{ recipientName: user?.fullName || user?.name || '', phone: user?.phoneNumber || user?.phone || '' }}
        isFirst={addresses.length === 0}
        onSaved={() => {
          showToast(form?.editing ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.')
          setForm(null)
        }}
        onClose={() => setForm(null)}
      />
      <ConfirmDialog
        visible={!!deleting}
        title="Xoá địa chỉ này?"
        message={deleting?.address}
        confirmLabel="Xoá"
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </SafeAreaView>
  )
}

function IconAction({ icon: Icon, label, onPress }: { icon: typeof Pencil; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-xl border border-line active:bg-paper"
    >
      <Icon size={17} color={colors.inkMuted} />
    </Pressable>
  )
}
