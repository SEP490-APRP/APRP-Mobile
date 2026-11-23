import { router } from 'expo-router'
import { Image } from 'expo-image'
import { Trash2 } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, ConfirmDialog } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  ChatbotInput,
  ChatbotMessageItem,
  ChatbotSuggestions,
  ChatbotTyping,
  currentChatbotRole,
  homeRoute,
  useChatbotStore,
  type ChatbotMessage,
} from '@/features/chatbot'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'

const logo = require('../../../assets/images/logo-icon.png')

const renderMessage = ({ item }: { item: ChatbotMessage }) => <ChatbotMessageItem message={item} />

/** Trợ lý CapNong Copilot, chuyển từ ChatbotWindow bản web; luồng back và xác nhận xoá theo ChatBotScreen của app cũ. */
export default function ChatbotScreen() {
  const messages = useChatbotStore((s) => s.messages)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const clearHistory = useChatbotStore((s) => s.clearHistory)
  const setScreenOpen = useChatbotStore((s) => s.setScreenOpen)
  const showToast = useUiStore((s) => s.showToast)
  const listRef = useRef<FlatList<ChatbotMessage>>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    setScreenOpen(true)
    return () => setScreenOpen(false)
  }, [setScreenOpen])

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearHistory()
      setConfirmClear(false)
    } catch (err) {
      setConfirmClear(false)
      showToast(getErrorMessage(err, 'Không thể xóa đoạn hội thoại. Vui lòng thử lại.'))
    } finally {
      setClearing(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center gap-2 border-b border-line bg-white px-3 py-2">
          <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace(homeRoute[currentChatbotRole()]))} />
          <View className="h-9 w-9 items-center justify-center rounded-full border border-leaf-200 bg-white p-0.5">
            <Image source={logo} contentFit="contain" style={{ width: '100%', height: '100%' }} />
          </View>
          <View className="flex-1">
            <AppText accessibilityRole="header" weight="extrabold" className="text-base">
              CapNong Copilot
            </AppText>
            <AppText className="text-caption text-ink-muted">{isLoading ? 'Đang trả lời...' : 'Đang hoạt động'}</AppText>
          </View>
          <Pressable
            onPress={() => setConfirmClear(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Xóa đoạn hội thoại"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-leaf-50"
          >
            <Trash2 size={20} color={colors.inkMuted} />
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-4 p-3"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isLoading ? <ChatbotTyping /> : undefined}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <ChatbotSuggestions />
        <ChatbotInput />
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={confirmClear}
        title="Xóa lịch sử chat?"
        message="Toàn bộ cuộc trò chuyện sẽ bị xóa và không thể khôi phục."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        destructive
        loading={clearing}
        onConfirm={() => void handleClear()}
        onCancel={() => setConfirmClear(false)}
      />
    </SafeAreaView>
  )
}
