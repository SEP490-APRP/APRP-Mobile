import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { createAudioPlayer } from 'expo-audio'
import { useLocalSearchParams } from 'expo-router'
import {
  Camera,
  Headphones,
  Image as ImageIcon,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Send,
  Tag,
  Trash2,
  Video as VideoIcon,
  X,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { BackButton } from '@/features/auth/components/BackButton'
import {
  useChatMessages,
  useDeleteMessage,
  useInitConversation,
  useSendMessage,
} from '@/features/chat'
import { chatService } from '@/services/chat.service'
import { productService } from '@/services/product.service'
import type { ProductResponse } from '@/services/product.types'
import { soundService } from '@/services/sound.service'
import { uploadService } from '@/services/upload.service'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
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

const fmtDateLabel = (iso?: string) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(Date.now() - 86400000)
    if (d.toDateString() === today.toDateString()) return 'Hôm nay'
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua'
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return ''
  }
}

/**
 * Sắp xếp tin nhắn theo thứ tự thời gian tăng dần (cũ ở trên, mới ở dưới)
 */
const sortChronological = (msgs: ChatMessage[]): ChatMessage[] => {
  return [...msgs].sort((a, b) => {
    const timeA = new Date(a.sentAt || a.createdAt || 0).getTime()
    const timeB = new Date(b.sentAt || b.createdAt || 0).getTime()
    if (timeA !== timeB) return timeA - timeB
    const idA = typeof a.id === 'number' ? a.id : Number(String(a.id).replace(/\D/g, '')) || 0
    const idB = typeof b.id === 'number' ? b.id : Number(String(b.id).replace(/\D/g, '')) || 0
    return idA - idB
  })
}

export default function BuyerChatDetailScreen() {
  const params = useLocalSearchParams<{
    id: string
    receiverId: string
    name?: string
    role?: string
    avatar?: string
    productId?: string
  }>()

  const { user } = useAuth()
  const currentUserId = Number(user?.id ?? 0)
  const otherUserId = Number(params.receiverId || 0)

  const [conversationId, setConversationId] = useState<number>(() => {
    const num = Number(params.id)
    return num > 0 ? num : 0
  })

  const [inputText, setInputText] = useState('')
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [pinnedProduct, setPinnedProduct] = useState<ProductResponse | null>(null)
  const [productDismissed, setProductDismissed] = useState(false)
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [activeActionMsg, setActiveActionMsg] = useState<ChatMessage | null>(null)
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null)
  const activePlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null)

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

  // Dọn dẹp player khi unmount
  useEffect(() => {
    return () => {
      if (activePlayerRef.current) {
        try {
          activePlayerRef.current.pause()
        } catch {}
      }
    }
  }, [])

  const flatListRef = useRef<FlatList>(null)
  const typingTimeoutRef = useRef<any>(null)

  const { data: serverMessages, isLoading } = useChatMessages(conversationId)
  const sendMessageMutation = useSendMessage()
  const initConvMutation = useInitConversation()
  const deleteMessageMutation = useDeleteMessage()

  const markedConvIdRef = useRef<number | null>(null)

  // 1. Tải thông tin sản phẩm ghim nếu có productId
  useEffect(() => {
    if (params.productId) {
      productService
        .getById(Number(params.productId))
        .then((res) => {
          if (res?.result) setPinnedProduct(res.result)
        })
        .catch(() => {})
    }
  }, [params.productId])

  // 2. Khởi tạo cuộc trò chuyện nếu chưa có conversationId hợp lệ
  useEffect(() => {
    if (conversationId <= 0 && otherUserId > 0) {
      initConvMutation.mutate(otherUserId, {
        onSuccess: (conv) => {
          if (conv?.id) {
            setConversationId(Number(conv.id))
          }
        },
      })
    }
  }, [conversationId, otherUserId])

  // Đánh dấu đã đọc khi vào cuộc trò chuyện (chỉ 1 lần duy nhất)
  useEffect(() => {
    if (conversationId > 0 && markedConvIdRef.current !== conversationId) {
      markedConvIdRef.current = conversationId
      chatService.markAsRead(conversationId).catch(() => {})
    }
  }, [conversationId])

  // 3. Đồng bộ server messages vào local messages và sắp xếp tăng dần
  useEffect(() => {
    if (serverMessages) {
      setLocalMessages(sortChronological(serverMessages))
    }
  }, [serverMessages])

  // 4. Kết nối WebSocket STOMP và lắng nghe tin nhắn trực tiếp
  useEffect(() => {
    chatService.connect()

    const unsubMsg = chatService.onMessage((newMsg) => {
      // Nhận nếu tin nhắn thuộc cuộc trò chuyện này
      const isForThisChat =
        Number(newMsg.senderId) === otherUserId ||
        (Number(newMsg.conversationId) > 0 && Number(newMsg.conversationId) === conversationId)

      if (isForThisChat) {
        // Chuông rung thông báo nếu là tin nhắn từ shop/đối tác
        if (Number(newMsg.senderId) !== currentUserId) {
          soundService.playMessageChime()
        }

        setLocalMessages((prev) => {
          const filtered = prev.filter(
            (m) =>
              String(m.id) !== String(newMsg.id) &&
              !(
                String(m.id).startsWith('temp_') &&
                m.content === newMsg.content &&
                Number(m.senderId) === Number(newMsg.senderId)
              )
          )
          return sortChronological([...filtered, newMsg])
        })

        if (conversationId > 0) {
          chatService.markAsRead(conversationId).catch(() => {})
        }
      }
    })

    const unsubNotif = chatService.onNotification((notif) => {
      // Nhận tín hiệu xóa / thu hồi tin nhắn
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

    const unsubTyping = chatService.onTyping((data) => {
      if (Number(data.senderId) === otherUserId) {
        setPartnerTyping(data.isTyping)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3500)
        }
      }
    })

    return () => {
      unsubMsg()
      unsubNotif()
      unsubTyping()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [otherUserId, conversationId, currentUserId])

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
                  { messageId: numId, conversationId },
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

  // Cuộn xuống cuối khi có tin nhắn mới
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [localMessages.length, scrollToBottom])

  // Xử lý gửi tin nhắn Text
  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? inputText).trim()
    if (!textToSend || otherUserId <= 0) return

    if (!customText) setInputText('')
    chatService.sendTyping(otherUserId, false)

    const optimisticMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      receiverId: otherUserId,
      content: textToSend,
      type: 'TEXT',
      sentAt: new Date().toISOString(),
      isRead: false,
    }
    setLocalMessages((prev) => sortChronological([...prev, optimisticMsg]))
    scrollToBottom()

    sendMessageMutation.mutate({
      receiverId: otherUserId,
      content: textToSend,
      type: 'TEXT',
    })
  }

  // Xử lý gửi Media (Ảnh / Video)
  const handleSendMedia = async (type: 'camera' | 'library') => {
    setActionMenuOpen(false)
    try {
      let result: ImagePicker.ImagePickerResult
      if (type === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync()
        if (perm.status !== 'granted') {
          Alert.alert('Quyền máy ảnh', 'CapNong cần quyền mở máy ảnh để chụp hình hoặc quay video.')
          return
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images', 'videos'],
          quality: 0.85,
        })
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (perm.status !== 'granted') {
          Alert.alert('Quyền thư viện', 'CapNong cần quyền truy cập bộ sưu tập để gửi ảnh hoặc video.')
          return
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsMultipleSelection: true,
          selectionLimit: 5,
          quality: 0.85,
        })
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingMedia(true)

        // 1. Tạo tin nhắn lạc quan cho tất cả các tệp được chọn
        const newOptimisticMsgs: ChatMessage[] = result.assets.map((asset, i) => {
          const isVideo = asset.type === 'video' || (asset.fileName && asset.fileName.endsWith('.mp4'))
          return {
            id: `temp_${Date.now()}_${i}`,
            conversationId,
            senderId: currentUserId,
            receiverId: otherUserId,
            content: isVideo ? '[Video]' : '[Hình ảnh]',
            type: isVideo ? 'VIDEO' : 'IMAGE',
            attachmentUrl: asset.uri,
            sentAt: new Date(Date.now() + i * 50).toISOString(),
            isRead: false,
          }
        })
        setLocalMessages((prev) => sortChronological([...prev, ...newOptimisticMsgs]))
        scrollToBottom()

        // 2. Upload song song lên Cloudinary
        const uploadPromises = result.assets.map(async (asset) => {
          const isVideo = asset.type === 'video' || (asset.fileName && asset.fileName.endsWith('.mp4'))
          const uploadRes = await uploadService.uploadMedia(
            {
              uri: asset.uri,
              name: asset.fileName ?? (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`),
              type: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
            },
            'chat',
          )
          return {
            url: uploadRes.result?.url,
            isVideo,
          }
        })

        const uploadedResults = await Promise.all(uploadPromises)

        // 3. Gửi lần lượt từng tin nhắn
        for (const item of uploadedResults) {
          if (item.url) {
            const msgType = item.isVideo ? 'VIDEO' : 'IMAGE'
            const content = item.isVideo ? '[Video]' : '[Hình ảnh]'
            await sendMessageMutation.mutateAsync({
              receiverId: otherUserId,
              content,
              type: msgType,
              attachmentUrl: item.url,
            })
          }
        }
      }
    } catch (err: any) {
      console.warn('Media upload error:', err)
      Alert.alert('Lỗi gửi file', 'Không thể gửi tập tin media. Vui lòng thử lại.')
    } finally {
      setIsUploadingMedia(false)
    }
  }

  // Xử lý gõ phím
  const handleInputChange = (text: string) => {
    setInputText(text)
    if (otherUserId > 0) {
      chatService.sendTyping(otherUserId, text.length > 0)
    }
  }

  // Gửi hỏi về sản phẩm ghim
  const handleInquireProduct = () => {
    if (!pinnedProduct) return
    const msg = `Xin chào! Mình muốn hỏi về sản phẩm: "${pinnedProduct.productName || pinnedProduct.name}" (giá: ${pinnedProduct.sellingPrice?.toLocaleString('vi-VN')} đ/${pinnedProduct.unit || 'kg'}).`
    handleSend(msg)
    setProductDismissed(true)
  }

  // Nhóm tin nhắn theo ngày
  const groupedMessages = useMemo(() => {
    const items: Array<{ type: 'date'; label: string } | { type: 'message'; data: ChatMessage }> = []
    let lastDateLabel = ''

    localMessages.forEach((msg) => {
      const dateLabel = fmtDateLabel(msg.sentAt || msg.createdAt)
      if (dateLabel && dateLabel !== lastDateLabel) {
        items.push({ type: 'date', label: dateLabel })
        lastDateLabel = dateLabel
      }
      items.push({ type: 'message', data: msg })
    })

    return items
  }, [localMessages])

  const partnerName = params.name || 'Người dùng CapNong'
  const isSupport = otherUserId === 1

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {/* Header cuộc trò chuyện */}
      <View className="flex-row items-center gap-3 border-b border-line bg-paper px-3 pb-2.5 pt-1.5">
        <BackButton />

        <View className="relative">
          <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-leaf-100">
            {isSupport ? (
              <Headphones size={20} color={colors.leaf700} />
            ) : params.avatar ? (
              <Image source={{ uri: params.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="cover" />
            ) : (
              <AppText weight="bold" className="text-sm text-leaf-800">
                {partnerName.charAt(0).toUpperCase()}
              </AppText>
            )}
          </View>
          <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-leaf-500" />
        </View>

        <View className="flex-1 min-w-0">
          <AppText weight="extrabold" numberOfLines={1} className="text-sm">
            {partnerName}
          </AppText>
          <AppText className="text-[11px] text-leaf-700">
            {partnerTyping ? 'Đang soạn tin...' : isSupport ? 'Hỗ trợ khách hàng' : 'Đang hoạt động'}
          </AppText>
        </View>
      </View>

      {/* Thẻ ghim sản phẩm (nếu mở từ Product Detail) */}
      {!!pinnedProduct && !productDismissed && (
        <View className="flex-row items-center gap-3 border-b border-leaf-200 bg-leaf-50/80 px-4 py-2.5">
          <View className="h-12 w-12 overflow-hidden rounded-xl border border-leaf-200 bg-white">
            {pinnedProduct.imageUrl ? (
              <Image source={{ uri: pinnedProduct.imageUrl }} className="h-full w-full" contentFit="cover" />
            ) : (
              <View className="h-full w-full items-center justify-center bg-leaf-100">
                <Tag size={16} color={colors.leaf700} />
              </View>
            )}
          </View>

          <View className="flex-1 min-w-0">
            <AppText weight="bold" numberOfLines={1} className="text-xs text-ink">
              {pinnedProduct.productName || pinnedProduct.name}
            </AppText>
            <AppText weight="extrabold" className="text-xs text-leaf-800">
              {pinnedProduct.sellingPrice?.toLocaleString('vi-VN')} đ{' '}
              <AppText className="text-[11px] font-normal text-ink-muted">/{pinnedProduct.unit || 'kg'}</AppText>
            </AppText>
          </View>

          <Pressable
            onPress={handleInquireProduct}
            className="rounded-xl bg-leaf-700 px-3 py-1.5 active:bg-leaf-800"
          >
            <AppText weight="bold" className="text-xs text-white">
              Gửi hỏi Shop
            </AppText>
          </Pressable>

          <Pressable onPress={() => setProductDismissed(true)} hitSlop={8} className="p-1">
            <X size={15} color={colors.inkSubtle} />
          </Pressable>
        </View>
      )}

      {/* Khung chat KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-paper"
      >
        {isLoading && localMessages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.leaf700} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupedMessages}
            keyExtractor={(item, index) =>
              item.type === 'date' ? `date_${item.label}_${index}` : `msg_${item.data.id}_${index}`
            }
            contentContainerClassName="p-4 gap-2.5 pb-6"
            onContentSizeChange={scrollToBottom}
            renderItem={({ item }) => {
              if (item.type === 'date') {
                return (
                  <View className="my-2 items-center">
                    <View className="rounded-full bg-line px-3 py-0.5">
                      <AppText className="text-[11px] text-ink-muted">{item.label}</AppText>
                    </View>
                  </View>
                )
              }

              const msg = item.data
              const isMine = Number(msg.senderId) === currentUserId
              const isVoice =
                msg.type === 'VOICE' ||
                Boolean(
                  msg.attachmentUrl &&
                    (msg.attachmentUrl.endsWith('.m4a') ||
                      msg.attachmentUrl.endsWith('.mp3') ||
                      msg.attachmentUrl.endsWith('.wav')),
                )
              const isVideo =
                !isVoice &&
                (msg.type === 'VIDEO' ||
                  Boolean(
                    msg.attachmentUrl &&
                      (msg.attachmentUrl.endsWith('.mp4') || msg.attachmentUrl.endsWith('.mov')),
                  ))
              const isImage = !isVoice && !isVideo && (msg.type === 'IMAGE' || Boolean(msg.attachmentUrl))

              return (
                <View
                  className={cn(
                    'max-w-[82%] gap-1',
                    isMine ? 'self-end items-end' : 'self-start items-start',
                  )}
                >
                  <Pressable
                    onLongPress={() => {
                      if (isMine) {
                        try {
                          Vibration.vibrate(25)
                        } catch {}
                        setActiveActionMsg(msg)
                      }
                    }}
                    delayLongPress={200}
                    className={cn(
                      'rounded-2xl shadow-2xs overflow-hidden active:opacity-90',
                      isMine
                        ? 'rounded-br-xs bg-leaf-700'
                        : 'rounded-bl-xs border border-line bg-white',
                      !isImage && !isVideo ? 'px-4 py-2.5' : 'p-1',
                    )}
                  >
                    {/* 0. Tin nhắn thoại (Voice note) */}
                    {isVoice && msg.attachmentUrl && (
                      <Pressable
                        onPress={() => togglePlayVoice(msg.attachmentUrl!)}
                        className="flex-row items-center gap-3 py-1 px-1 active:opacity-85"
                      >
                        <View
                          className={cn(
                            'h-9 w-9 items-center justify-center rounded-full',
                            isMine ? 'bg-white/20' : 'bg-leaf-700/10',
                          )}
                        >
                          {playingAudioUrl === msg.attachmentUrl ? (
                            <Pause size={17} color={isMine ? '#ffffff' : colors.leaf700} />
                          ) : (
                            <Play
                              size={17}
                              color={isMine ? '#ffffff' : colors.leaf700}
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
                                    playingAudioUrl === msg.attachmentUrl
                                      ? Math.max(5, h * (i % 2 === 0 ? 1.2 : 0.8))
                                      : h,
                                  width: 3,
                                  borderRadius: 2,
                                  backgroundColor: isMine ? '#ffffff' : colors.leaf700,
                                  opacity: isMine ? 0.85 : 0.7,
                                }}
                              />
                            ))}
                          </View>
                          <AppText
                            className={cn(
                              'text-[10px] mt-0.5',
                              isMine ? 'text-white/80' : 'text-ink-subtle',
                            )}
                          >
                            {playingAudioUrl === msg.attachmentUrl ? 'Đang phát...' : 'Tin nhắn thoại'}
                          </AppText>
                        </View>
                      </Pressable>
                    )}

                    {/* 1. Hình ảnh */}
                    {isImage && msg.attachmentUrl && (
                      <Pressable
                        onPress={() => setPreviewImage(msg.attachmentUrl!)}
                        onLongPress={() => {
                          if (isMine) {
                            try {
                              Vibration.vibrate(25)
                            } catch {}
                            setActiveActionMsg(msg)
                          }
                        }}
                        delayLongPress={200}
                        className="active:opacity-90"
                      >
                        <Image
                          source={{ uri: msg.attachmentUrl }}
                          style={{ width: 220, height: 180, borderRadius: 12, backgroundColor: '#f1f5f9' }}
                          contentFit="cover"
                          transition={200}
                        />
                      </Pressable>
                    )}

                    {/* 2. Video */}
                    {isVideo && msg.attachmentUrl && (
                      <Pressable
                        onPress={() => setPreviewImage(msg.attachmentUrl!)}
                        onLongPress={() => {
                          if (isMine) {
                            try {
                              Vibration.vibrate(25)
                            } catch {}
                            setActiveActionMsg(msg)
                          }
                        }}
                        delayLongPress={200}
                        className="relative h-44 w-56 items-center justify-center rounded-xl bg-black/80"
                      >
                        <VideoIcon size={32} color="#ffffff" />
                        <View className="absolute inset-0 items-center justify-center">
                          <View className="h-10 w-10 items-center justify-center rounded-full bg-leaf-700/90 shadow-md">
                            <Play size={18} color="#ffffff" />
                          </View>
                        </View>
                        <AppText className="absolute bottom-2 left-2 text-[10px] text-white/80">Video</AppText>
                      </Pressable>
                    )}

                    {/* 3. Text Content */}
                    {msg.content && msg.content !== '[Hình ảnh]' && msg.content !== '[Video]' && (
                      <AppText
                        className={cn(
                          'text-sm leading-relaxed',
                          isImage || isVideo ? 'px-2 pt-1.5 pb-1' : '',
                          isMine ? 'text-white' : 'text-ink',
                        )}
                      >
                        {msg.content}
                      </AppText>
                    )}
                  </Pressable>

                  {/* Thanh thời gian & Dấu ba chấm tùy chọn tin nhắn như Facebook/Messenger */}
                  <View className="flex-row items-center gap-1.5 px-1">
                    <AppText className="text-[10px] text-ink-subtle">
                      {fmtTime(msg.sentAt || msg.createdAt)}
                    </AppText>
                    {isMine && (
                      <Pressable
                        hitSlop={10}
                        onPress={() => {
                          try {
                            Vibration.vibrate(25)
                          } catch {}
                          setActiveActionMsg(msg)
                        }}
                        className="h-5 w-5 items-center justify-center rounded-full active:bg-line/70"
                      >
                        <MoreHorizontal size={14} color={colors.inkSubtle} />
                      </Pressable>
                    )}
                  </View>
                </View>
              )
            }}
          />
        )}

        {/* Loading khi đang upload media */}
        {isUploadingMedia && (
          <View className="flex-row items-center gap-2 border-t border-line bg-leaf-50 px-4 py-2">
            <ActivityIndicator size="small" color={colors.leaf700} />
            <AppText className="text-xs text-leaf-800">Đang tải tệp lên máy chủ...</AppText>
          </View>
        )}

        {/* Menu chọn tệp đính kèm */}
        {actionMenuOpen && (
          <View className="flex-row items-center justify-around border-t border-line bg-white py-3">
            <Pressable
              onPress={() => handleSendMedia('camera')}
              className="items-center gap-1.5 active:opacity-75"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-leaf-100">
                <Camera size={22} color={colors.leaf700} />
              </View>
              <AppText weight="medium" className="text-[11px] text-ink">
                Máy ảnh
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => handleSendMedia('library')}
              className="items-center gap-1.5 active:opacity-75"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                <ImageIcon size={22} color="#2563eb" />
              </View>
              <AppText weight="medium" className="text-[11px] text-ink">
                Ảnh / Video
              </AppText>
            </Pressable>
          </View>
        )}

        {/* Thanh nhập tin nhắn dưới cùng */}
        <View className="flex-row items-center gap-2 border-t border-line bg-white px-3 py-2">
          {/* Nút mở menu gửi ảnh / video */}
          <Pressable
            onPress={() => setActionMenuOpen((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="Đính kèm tệp"
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full active:bg-paper',
              actionMenuOpen ? 'bg-leaf-100' : 'bg-paper',
            )}
          >
            <Plus size={20} color={colors.leaf700} />
          </Pressable>

          <TextInput
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.inkSubtle}
            multiline
            maxLength={1000}
            className="max-h-24 min-h-[42px] flex-1 rounded-2xl border border-line bg-paper px-3.5 py-2 text-sm text-ink"
            style={{ fontFamily: 'BeVietnamPro_400Regular' }}
          />

          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            className={cn(
              'h-11 w-11 items-center justify-center rounded-2xl',
              inputText.trim() ? 'bg-leaf-700 active:bg-leaf-800' : 'bg-line/60',
            )}
          >
            <Send size={18} color={inputText.trim() ? '#ffffff' : colors.inkSubtle} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Modal xem trước ảnh toàn màn hình */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View className="flex-1 items-center justify-center bg-black/95">
          <SafeAreaView className="absolute top-0 right-0 p-4">
            <Pressable
              onPress={() => setPreviewImage(null)}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
            >
              <X size={20} color="#ffffff" />
            </Pressable>
          </SafeAreaView>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: '90%', height: '70%' }}
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
            activeActionMsg.content !== '[Video]' ? (
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
                  <Trash2 size={20} color={colors.sale} />
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
