import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Image as ImageIcon,
  Send,
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  useChatMessages,
  useInitConversation,
  useMarkConversationRead,
  useSendMessage,
} from '@/features/chat'
import { chatService } from '@/services/chat.service'
import { soundService } from '@/services/sound.service'
import { uploadService } from '@/services/upload.service'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
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
  const listRef = useRef<FlatList>(null)

  const initConv = useInitConversation()
  const { data: messages = [], refetch: refetchMessages } = useChatMessages(convId ?? 0)
  const sendMessageMutation = useSendMessage()
  const markRead = useMarkConversationRead()

  // Khởi tạo cuộc trò chuyện nếu chưa có convId
  useEffect(() => {
    if (!convId && partnerUserId) {
      initConv.mutate(partnerUserId, {
        onSuccess: (data) => {
          if (data?.id) setConvId(Number(data.id))
        },
      })
    }
  }, [convId, partnerUserId, initConv])

  // Đánh dấu đã đọc khi mở màn hình
  useEffect(() => {
    if (convId) {
      markRead.mutate(convId)
    }
  }, [convId, markRead])

  // Lắng nghe tin nhắn mới qua WebSocket
  useEffect(() => {
    chatService.connect()
    const unsubscribe = chatService.onMessage((msg) => {
      if (Number(msg?.conversationId) === Number(convId)) {
        if (Number(msg?.senderId) !== myUserId) {
          soundService.playMessageChime()
        }
        refetchMessages()
        if (convId) markRead.mutate(convId)
      }
    })
    return () => unsubscribe()
  }, [convId, myUserId, refetchMessages, markRead])

  const handleSend = () => {
    if (!text.trim() || !partnerUserId) return
    const content = text.trim()
    setText('')
    sendMessageMutation.mutate({ receiverId: partnerUserId, content })
  }

  const handlePickImage = async () => {
    if (!partnerUserId) return
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (res.canceled || !res.assets?.[0]?.uri) return

    setSendingImage(true)
    try {
      const asset = res.assets[0]
      const upRes = await uploadService.uploadImage(
        { uri: asset.uri, name: asset.fileName || 'chat.jpg', type: 'image/jpeg' },
        'chat',
      )
      const url = upRes.result?.url
      if (url) {
        sendMessageMutation.mutate({ receiverId: partnerUserId, content: '[Hình ảnh]', attachmentUrl: url })
      }
    } finally {
      setSendingImage(false)
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
          data={messages}
          keyExtractor={(item, idx) => String(item.id || idx)}
          contentContainerClassName="p-4 gap-3"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = Number(item.senderId) === myUserId
            return (
              <View className={cn('flex-row', isMe ? 'justify-end' : 'justify-start')}>
                <View
                  className={cn(
                    'max-w-[78%] rounded-2xl p-3 shadow-xs',
                    isMe
                      ? 'rounded-br-xs bg-leaf-700 text-white'
                      : 'rounded-bl-xs border border-line bg-white',
                  )}
                >
                  {item.mediaUrl && (
                    <Image
                      source={{ uri: item.mediaUrl }}
                      style={{ width: 180, height: 180, borderRadius: 12, marginBottom: 4 }}
                      resizeMode="cover"
                    />
                  )}
                  {!!item.content && item.content !== '[Hình ảnh]' && (
                    <AppText
                      className={cn(
                        'text-xs leading-relaxed',
                        isMe ? 'text-white font-medium' : 'text-ink font-normal',
                      )}
                    >
                      {item.content}
                    </AppText>
                  )}
                  <AppText
                    className={cn(
                      'mt-1 text-[9px] text-right',
                      isMe ? 'text-leaf-200' : 'text-ink-subtle',
                    )}
                  >
                    {fmtTime(item.createdAt)}
                  </AppText>
                </View>
              </View>
            )
          }}
        />

        {/* Khung Soạn Tin Nhắn */}
        <View className="flex-row items-center gap-2 border-t border-line bg-white px-3 py-2">
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
            onPress={handleSend}
            disabled={!text.trim() || sendMessageMutation.isPending}
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full',
              text.trim() ? 'bg-leaf-700 active:bg-leaf-800' : 'bg-paper',
            )}
          >
            <Send size={18} color={text.trim() ? '#ffffff' : colors.inkSubtle} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
