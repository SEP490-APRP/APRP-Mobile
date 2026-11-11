import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import {
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
} from 'expo-audio'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Image as ImageIcon,
  Mic,
  Pause,
  Play,
  Send,
  Trash,
  X,
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  Vibration,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  useChatMessages,
  useDeleteMessage,
  useInitConversation,
  useSendMessage,
} from '@/features/chat'
import { chatService } from '@/services/chat.service'
import { soundService } from '@/services/sound.service'
import { uploadService } from '@/services/upload.service'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { ChatMessage } from '@/types/chat'
import { cn } from '@/utils/helpers'

const fmtTime = (iso?: string) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

const sortChronological = (msgs: ChatMessage[]) => {
  return [...msgs].sort((a, b) => {
    const timeA = new Date(a.sentAt || a.createdAt || 0).getTime()
    const timeB = new Date(b.sentAt || b.createdAt || 0).getTime()
    return timeA - timeB
  })
}

export default function ShopChatDetailScreen() {
  const params = useLocalSearchParams<{
    id: string
    conversationId?: string
    partnerName?: string
    partnerAvatar?: string
    partnerRole?: string
  }>()

  const partnerUserId = Number(params.id)
  const [convId, setConvId] = useState<number | null>(
    params.conversationId ? Number(params.conversationId) : null,
  )

  const { user } = useAuth()
  const myUserId = Number(user?.id ?? 0)

  const [text, setText] = useState('')
  const [sendingImage, setSendingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [activeActionMsg, setActiveActionMsg] = useState<ChatMessage | null>(null)
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const listRef = useRef<FlatList>(null)

  // Voice recording & playback state
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null)
  const activePlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null)

  const initConv = useInitConversation()
  const { data: serverMessages = [], refetch: refetchMessages } = useChatMessages(convId ?? 0)
  const sendMessageMutation = useSendMessage()
  const deleteMessageMutation = useDeleteMessage()

  const markedConvIdRef = useRef<number | null>(null)
  const initAttemptedRef = useRef(false)

  // Đồng bộ tin nhắn từ máy chủ với danh sách cục bộ (sắp xếp tăng dần theo thời gian)
  useEffect(() => {
    if (serverMessages && serverMessages.length > 0) {
      setLocalMessages(sortChronological(serverMessages))
    }
  }, [serverMessages])

  // Khởi tạo cuộc trò chuyện nếu chưa có convId
  useEffect(() => {
    if (!convId && partnerUserId && !initAttemptedRef.current) {
      initAttemptedRef.current = true
      initConv.mutate(partnerUserId, {
        onSuccess: (data) => {
          if (data?.id) setConvId(Number(data.id))
        },
      })
    }
  }, [convId, partnerUserId])

  // Đánh dấu đã đọc khi mở màn hình (chỉ 1 lần duy nhất cho mỗi convId)
  useEffect(() => {
    if (convId && markedConvIdRef.current !== convId) {
      markedConvIdRef.current = convId
      chatService.markAsRead(convId).catch(() => {})
    }
  }, [convId])

  // Lắng nghe tin nhắn mới & tín hiệu xóa/thu hồi tin nhắn qua WebSocket
  useEffect(() => {
    chatService.connect()
    const unsubMsg = chatService.onMessage((msg) => {
      if (Number(msg?.conversationId) === Number(convId)) {
        if (Number(msg?.senderId) !== myUserId) {
          soundService.playMessageChime()
          if (convId) {
            chatService.markAsRead(convId).catch(() => {})
          }
        }
        refetchMessages()
      }
    })

    const unsubNotif = chatService.onNotification((notif) => {
      if (notif?.type === 'DELETE_MESSAGE') {
        const deletedId = Number(notif.messageId)
        if (deletedId) {
          setLocalMessages((prev) =>
            prev.filter((m) => {
              const mNum = typeof m.id === 'number' ? m.id : Number(String(m.id).replace(/\D/g, ''))
              return mNum !== deletedId && String(m.id) !== String(deletedId)
            })
          )
        }
      }
    })

    return () => {
      unsubMsg()
      unsubNotif()
    }
  }, [convId, myUserId, refetchMessages])

  // Thao tác xóa / thu hồi tin nhắn
  const handlePromptDelete = (msg: ChatMessage) => {
    try {
      Vibration.vibrate(40)
    } catch {}

    Alert.alert(
      'Thu hồi tin nhắn',
      'Bạn có chắc chắn muốn thu hồi tin nhắn này? Tin nhắn sẽ được xóa ở cả hai phía hội thoại.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thu hồi',
          style: 'destructive',
          onPress: () => {
            const rawId = String(msg.id)
            const isTemp = rawId.startsWith('temp_')

            // Xóa ngay lập tức trên UI (optimistic)
            setLocalMessages((prev) => prev.filter((m) => String(m.id) !== rawId))

            if (!isTemp) {
              const numId = typeof msg.id === 'number' ? msg.id : Number(rawId.replace(/\D/g, ''))
              if (numId) {
                deleteMessageMutation.mutate(
                  { messageId: numId, conversationId: convId ?? undefined },
                  {
                    onError: (err: any) => {
                      Alert.alert(
                        'Lỗi',
                        err?.response?.data?.message || 'Không thể thu hồi tin nhắn. Vui lòng thử lại.',
                      )
                    },
                  },
                )
              }
            }
          },
        },
      ],
    )
  }

  // Dọn dẹp trình phát và bộ ghi âm khi thoát màn hình
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (activePlayerRef.current) {
        try {
          activePlayerRef.current.pause()
        } catch {}
      }
    }
  }, [])

  const handleSendText = () => {
    if (!text.trim() || !partnerUserId) return
    const content = text.trim()
    setText('')

    // Thêm tin nhắn văn bản lạc quan
    const optimisticMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversationId: convId ?? 0,
      senderId: myUserId,
      receiverId: partnerUserId,
      content,
      type: 'TEXT',
      sentAt: new Date().toISOString(),
      isRead: false,
    }
    setLocalMessages((prev) => sortChronological([...prev, optimisticMsg]))

    sendMessageMutation.mutate({ receiverId: partnerUserId, content, type: 'TEXT' })
  }

  // Chọn 1 hoặc nhiều ảnh cùng lúc (tối đa 5 ảnh)
  const handlePickImage = async () => {
    if (!partnerUserId) return
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    })
    if (res.canceled || !res.assets || res.assets.length === 0) return

    // 1. Thêm tin nhắn lạc quan cho từng ảnh đã chọn
    const newOptimisticMsgs: ChatMessage[] = res.assets.map((asset, i) => ({
      id: `temp_img_${Date.now()}_${i}`,
      conversationId: convId ?? 0,
      senderId: myUserId,
      receiverId: partnerUserId,
      content: '[Hình ảnh]',
      type: 'IMAGE',
      attachmentUrl: asset.uri,
      sentAt: new Date(Date.now() + i * 50).toISOString(),
      isRead: false,
    }))
    setLocalMessages((prev) => sortChronological([...prev, ...newOptimisticMsgs]))
    setSendingImage(true)

    try {
      // 2. Upload song song tất cả ảnh lên Cloudinary
      const uploadPromises = res.assets.map(async (asset) => {
        const upRes = await uploadService.uploadMedia(
          {
            uri: asset.uri,
            name: asset.fileName || `chat_img_${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          },
          'chat',
        )
        return upRes.result?.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)

      // 3. Gửi từng tin nhắn ảnh vào hệ thống
      for (const url of uploadedUrls) {
        if (url) {
          await sendMessageMutation.mutateAsync({
            receiverId: partnerUserId,
            content: '[Hình ảnh]',
            type: 'IMAGE',
            attachmentUrl: url,
          })
        }
      }
      await refetchMessages()
    } catch (err) {
      console.warn('Lỗi khi gửi ảnh chat:', err)
      Alert.alert('Lỗi gửi ảnh', 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại.')
    } finally {
      setSendingImage(false)
    }
  }

  // Bắt đầu ghi âm tin nhắn thoại
  const handleStartRecord = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Quyền ghi âm', 'Vui lòng cấp quyền truy cập micro trong Cài đặt để gửi tin nhắn thoại.')
        return
      }
      try {
        Vibration.vibrate(50)
      } catch {}
      await recorder.prepareToRecordAsync()
      recorder.record()
      setIsRecording(true)
      setRecordSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1)
      }, 1000)
    } catch (err) {
      console.warn('Lỗi khi bật ghi âm:', err)
    }
  }

  // Dừng ghi âm và gửi tin nhắn thoại
  const handleStopRecordAndSend = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current)
      await recorder.stop()
      setIsRecording(false)

      const uri = recorder.uri
      if (!uri || !partnerUserId) return

      // Thêm tin nhắn thoại lạc quan
      const tempId = `temp_voice_${Date.now()}`
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversationId: convId ?? 0,
        senderId: myUserId,
        receiverId: partnerUserId,
        content: '[Tin nhắn thoại]',
        type: 'VOICE',
        attachmentUrl: uri,
        sentAt: new Date().toISOString(),
        isRead: false,
      }
      setLocalMessages((prev) => sortChronological([...prev, optimisticMsg]))

      // Tải tệp âm thanh lên Cloudinary
      const upRes = await uploadService.uploadMedia(
        {
          uri,
          name: `voice_${Date.now()}.m4a`,
          type: 'audio/m4a',
        },
        'chat',
      )
      const url = upRes.result?.url
      if (url) {
        await sendMessageMutation.mutateAsync({
          receiverId: partnerUserId,
          content: '[Tin nhắn thoại]',
          type: 'VOICE',
          attachmentUrl: url,
        })
        await refetchMessages()
      }
    } catch (err) {
      console.warn('Lỗi gửi tin nhắn thoại:', err)
      Alert.alert('Lỗi thoại', 'Không thể gửi tin nhắn thoại. Vui lòng thử lại.')
    }
  }

  // Huỷ bỏ đoạn ghi âm hiện tại
  const handleCancelRecord = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      await recorder.stop()
    } catch {}
    setIsRecording(false)
    setRecordSeconds(0)
  }

  // Phát / Tạm dừng tin nhắn thoại
  const togglePlayVoice = async (url: string) => {
    try {
      if (playingAudioUrl === url) {
        activePlayerRef.current?.pause()
        setPlayingAudioUrl(null)
        return
      }

      if (activePlayerRef.current) {
        try {
          activePlayerRef.current.pause()
        } catch {}
      }

      const p = createAudioPlayer(url)
      activePlayerRef.current = p
      setPlayingAudioUrl(url)
      p.play()
    } catch {
      setPlayingAudioUrl(null)
    }
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/chat' as any))

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-line bg-paper px-3 pb-3 pt-2">
        <View className="flex-row items-center gap-2 flex-1 min-w-0">
          <BackButton onPress={goBack} />
          {params.partnerAvatar ? (
            <Image
              source={{ uri: params.partnerAvatar }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
              contentFit="cover"
            />
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-full bg-sun-200">
              <AppText weight="bold" className="text-sm text-sun-900">
                {(params.partnerName || 'K').charAt(0).toUpperCase()}
              </AppText>
            </View>
          )}
          <View className="min-w-0 flex-1">
            <AppText weight="extrabold" numberOfLines={1} className="text-sm text-ink">
              {params.partnerName || 'Khách hàng'}
            </AppText>
            <AppText className="text-[10px] text-leaf-700">Đang hoạt động</AppText>
          </View>
        </View>
      </View>

      {/* Danh sách tin nhắn */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        className="flex-1"
      >
        <FlatList
          ref={listRef}
          data={localMessages}
          keyExtractor={(item, idx) => String(item.id || idx)}
          contentContainerClassName="p-4 gap-3"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = Number(item.senderId) === myUserId
            const mediaUrl = item.attachmentUrl || (item as any).mediaUrl || (item as any).imageUrl
            const isVoice =
              item.type === 'VOICE' ||
              (!!mediaUrl &&
                (mediaUrl.endsWith('.m4a') ||
                  mediaUrl.endsWith('.mp3') ||
                  mediaUrl.endsWith('.wav') ||
                  mediaUrl.endsWith('.aac') ||
                  mediaUrl.endsWith('.ogg')))
            const isImage = !isVoice && (item.type === 'IMAGE' || Boolean(mediaUrl))
            const hasText =
              !!item.content &&
              item.content !== '[Hình ảnh]' &&
              item.content !== '[Tin nhắn thoại]'

            return (
              <View className={cn('flex-row', isMe ? 'justify-end' : 'justify-start')}>
                <Pressable
                  onLongPress={() => {
                    if (isMe) {
                      try {
                        Vibration.vibrate(25)
                      } catch {}
                      setActiveActionMsg(item)
                    }
                  }}
                  delayLongPress={200}
                  className={cn(
                    'max-w-[82%] rounded-2xl shadow-xs overflow-hidden active:opacity-90',
                    isImage && !hasText ? 'p-1.5' : 'p-3',
                    isMe
                      ? 'rounded-br-xs bg-leaf-700'
                      : 'rounded-bl-xs border border-line bg-white',
                  )}
                >
                  {/* 1. Tin nhắn thoại (Voice note player) */}
                  {isVoice && !!mediaUrl && (
                    <Pressable
                      onPress={() => togglePlayVoice(mediaUrl)}
                      className="flex-row items-center gap-3 py-1 px-1 active:opacity-85"
                    >
                      <View
                        className={cn(
                          'h-9 w-9 items-center justify-center rounded-full',
                          isMe ? 'bg-white/20' : 'bg-leaf-700/10',
                        )}
                      >
                        {playingAudioUrl === mediaUrl ? (
                          <Pause size={17} color={isMe ? '#ffffff' : colors.leaf700} />
                        ) : (
                          <Play
                            size={17}
                            color={isMe ? '#ffffff' : colors.leaf700}
                            style={{ marginLeft: 2 }}
                          />
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1 h-5">
                          {[10, 16, 22, 14, 18, 12, 20, 9, 15, 22, 16, 11].map((h, i) => (
                            <View
                              key={i}
                              style={{
                                height:
                                  playingAudioUrl === mediaUrl
                                    ? Math.max(5, h * (i % 2 === 0 ? 1.2 : 0.8))
                                    : h,
                                width: 3,
                                borderRadius: 2,
                                backgroundColor: isMe ? '#ffffff' : colors.leaf700,
                                opacity: isMe ? 0.85 : 0.7,
                              }}
                            />
                          ))}
                        </View>
                        <AppText
                          className={cn(
                            'text-[10px] mt-0.5',
                            isMe ? 'text-white/80' : 'text-ink-subtle',
                          )}
                        >
                          {playingAudioUrl === mediaUrl ? 'Đang phát...' : 'Tin nhắn thoại'}
                        </AppText>
                      </View>
                    </Pressable>
                  )}

                  {/* 2. Hình ảnh đính kèm (sử dụng expo-image sắc nét) */}
                  {isImage && !!mediaUrl && (
                    <Pressable
                      onPress={() => setPreviewImage(mediaUrl)}
                      className="overflow-hidden rounded-xl active:opacity-90"
                    >
                      <Image
                        source={{ uri: mediaUrl }}
                        style={{ width: 220, height: 180, borderRadius: 12, backgroundColor: '#f1f5f9' }}
                        contentFit="cover"
                        transition={200}
                      />
                    </Pressable>
                  )}

                  {/* 3. Nội dung văn bản */}
                  {hasText && (
                    <AppText
                      className={cn(
                        'text-xs leading-relaxed',
                        (mediaUrl || isVoice) && 'mt-1.5',
                        isMe ? 'text-white font-medium' : 'text-ink font-normal',
                      )}
                    >
                      {item.content}
                    </AppText>
                  )}

                  {/* 4. Thời gian */}
                  <AppText
                    className={cn(
                      'mt-1 text-[9px] text-right',
                      isMe ? 'text-leaf-200' : 'text-ink-subtle',
                    )}
                  >
                    {fmtTime(item.sentAt || item.createdAt)}
                  </AppText>
                </Pressable>
              </View>
            )
          }}
        />

        {/* Khung Soạn Tin Nhắn & Thanh Ghi Âm */}
        <View className="border-t border-line bg-white px-3 py-2">
          {isRecording ? (
            /* Thanh ghi âm đang hoạt động */
            <View className="flex-row items-center justify-between rounded-2xl bg-red-50 border border-red-200 px-3.5 py-2">
              <View className="flex-row items-center gap-2">
                <View className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <AppText weight="bold" className="text-xs text-red-600">
                  Đang ghi âm... {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:
                  {String(recordSeconds % 60).padStart(2, '0')}
                </AppText>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleCancelRecord}
                  className="flex-row items-center gap-1 rounded-lg bg-white border border-red-200 px-2.5 py-1 active:bg-red-100"
                >
                  <Trash size={14} color="#dc2626" />
                  <AppText weight="bold" className="text-[11px] text-red-600">Huỷ</AppText>
                </Pressable>
                <Pressable
                  onPress={handleStopRecordAndSend}
                  className="rounded-lg bg-leaf-700 px-3 py-1 active:bg-leaf-800"
                >
                  <AppText weight="bold" className="text-[11px] text-white">Gửi thoại</AppText>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Thanh nhập liệu bình thường */
            <View className="flex-row items-center gap-2">
              {/* Nút gửi ảnh */}
              <Pressable
                onPress={handlePickImage}
                disabled={sendingImage}
                className="h-10 w-10 items-center justify-center rounded-full bg-paper active:bg-leaf-50"
              >
                {sendingImage ? (
                  <ActivityIndicator size="small" color={colors.leaf700} />
                ) : (
                  <ImageIcon size={20} color={colors.leaf700} />
                )}
              </Pressable>

              {/* Nút bắt đầu ghi âm */}
              <Pressable
                onPress={handleStartRecord}
                className="h-10 w-10 items-center justify-center rounded-full bg-paper active:bg-leaf-50"
              >
                <Mic size={20} color={colors.leaf700} />
              </Pressable>

              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Nhập tin nhắn tư vấn khách hàng..."
                placeholderTextColor={colors.inkSubtle}
                multiline
                className="max-h-24 min-h-[40px] flex-1 rounded-2xl bg-paper px-3.5 py-2 text-xs text-ink"
                style={{ fontFamily: fontFamily.regular }}
              />

              <Pressable
                onPress={handleSendText}
                disabled={!text.trim() || sendMessageMutation.isPending}
                className={cn(
                  'h-10 w-10 items-center justify-center rounded-full',
                  text.trim() ? 'bg-leaf-700 active:bg-leaf-800' : 'bg-paper',
                )}
              >
                <Send size={18} color={text.trim() ? '#ffffff' : colors.inkSubtle} />
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Modal Xem Ảnh Toàn Màn Hình */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View className="flex-1 bg-black/95 items-center justify-center p-4">
          <Pressable
            onPress={() => setPreviewImage(null)}
            className="absolute top-12 right-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <X size={22} color="#ffffff" />
          </Pressable>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: '100%', height: '80%' }}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>

      {/* Modal Tùy chọn tin nhắn phong cách Facebook/Messenger */}
      <Modal
        visible={Boolean(activeActionMsg)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveActionMsg(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/45"
          onPress={() => setActiveActionMsg(null)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-5 pb-8 pt-3 shadow-2xl"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Thanh kéo gạch ngang nhỏ kiểu iOS/Messenger */}
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-lineStrong" />

            <AppText weight="bold" className="mb-1 text-center text-sm text-ink">
              Tùy chọn tin nhắn
            </AppText>
            {activeActionMsg?.content &&
            activeActionMsg.content !== '[Hình ảnh]' &&
            activeActionMsg.content !== '[Tin nhắn thoại]' ? (
              <AppText numberOfLines={2} className="mb-4 px-4 text-center text-xs text-ink-muted">
                "{activeActionMsg.content}"
              </AppText>
            ) : (
              <View className="mb-3" />
            )}

            <View className="gap-2.5">
              {/* Nút Thu hồi tin nhắn nổi bật với icon thùng rác màu đỏ */}
              <Pressable
                onPress={() => {
                  if (activeActionMsg) {
                    const toDelete = activeActionMsg
                    setActiveActionMsg(null)
                    handlePromptDelete(toDelete)
                  }
                }}
                className="flex-row items-center gap-3.5 rounded-2xl bg-rose-50 p-3.5 active:bg-rose-100"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                  <Trash size={20} color={colors.sale} />
                </View>
                <View className="flex-1">
                  <AppText weight="bold" className="text-sm text-rose-600">
                    Thu hồi tin nhắn
                  </AppText>
                  <AppText className="text-[11px] text-rose-500/80">
                    Xóa tin nhắn này ở cả hai phía cuộc trò chuyện
                  </AppText>
                </View>
              </Pressable>

              {/* Nút Đóng / Hủy */}
              <Pressable
                onPress={() => setActiveActionMsg(null)}
                className="mt-1 items-center rounded-2xl border border-line py-3.5 active:bg-paper"
              >
                <AppText weight="medium" className="text-sm text-ink-muted">
                  Hủy
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
