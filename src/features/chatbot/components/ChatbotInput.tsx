import { Send } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'
import { useChatbotStore } from '../stores/useChatbotStore'
import { canSendMessage, charactersLeft, MAX_MESSAGE_LENGTH } from '../utils/chatbotMessage'

/** Vẫn cho gõ khi bot đang trả lời: khoá ô nhập sẽ làm mất bàn phím, chỉ khoá nút gửi. */
export function ChatbotInput() {
  const [text, setText] = useState('')
  const sendMessage = useChatbotStore((s) => s.sendMessage)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const canSend = canSendMessage(text, isLoading)
  const left = charactersLeft(text)

  const handleSend = () => {
    if (!canSend) return
    void sendMessage(text)
    setText('')
  }

  return (
    <View className="gap-1 border-t border-line bg-white px-3 py-2.5">
      <View className="flex-row items-end gap-2">
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Hỏi về nông sản, hoặc gõ 'Mua 2kg cà chua'..."
          placeholderTextColor={colors.inkSubtle}
          accessibilityLabel="Nhập tin nhắn cho trợ lý"
          className="max-h-28 min-h-11 flex-1 rounded-card border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink"
          style={{ fontFamily: fontFamily.regular }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Gửi tin nhắn"
          accessibilityState={{ disabled: !canSend, busy: isLoading }}
          className={cn('h-11 w-11 items-center justify-center rounded-card bg-leaf-700 active:bg-leaf-800', !canSend && 'opacity-50')}
        >
          {isLoading ? <ActivityIndicator color={colors.white} /> : <Send size={18} color={colors.white} />}
        </Pressable>
      </View>
      {left !== null && (
        <AppText className={cn('text-right text-caption', left < 20 ? 'text-sale' : 'text-ink-subtle')}>
          {left} ký tự còn lại
        </AppText>
      )}
    </View>
  )
}
