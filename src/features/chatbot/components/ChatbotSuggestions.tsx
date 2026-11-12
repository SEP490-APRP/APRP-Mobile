import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { currentChatbotRole } from '../chatbotLinks'
import { useChatbotStore } from '../stores/useChatbotStore'
import { CHATBOT_SUGGESTIONS } from '../utils/chatbotMessage'

/** Gợi ý câu hỏi của bản web, thu gọn được như app cũ để nhường chỗ khi màn hình nhỏ. */
export function ChatbotSuggestions() {
  const [expanded, setExpanded] = useState(true)
  const sendMessage = useChatbotStore((s) => s.sendMessage)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const Chevron = expanded ? ChevronDown : ChevronUp

  return (
    <View className="border-t border-line bg-leaf-50">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? 'Thu gọn gợi ý câu hỏi' : 'Mở gợi ý câu hỏi'}
        className="min-h-11 flex-row items-center justify-between px-3"
      >
        <View className="flex-row items-center gap-1.5">
          <Lightbulb size={15} color={colors.leaf700} />
          <AppText weight="semibold" className="text-caption text-leaf-700">
            Gợi ý câu hỏi
          </AppText>
        </View>
        <Chevron size={16} color={colors.inkMuted} />
      </Pressable>
      {expanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-2 px-3 pb-2.5"
        >
          {CHATBOT_SUGGESTIONS[currentChatbotRole()].map((suggestion) => (
            <Pressable
              key={suggestion}
              disabled={isLoading}
              onPress={() => void sendMessage(suggestion)}
              accessibilityRole="button"
              className={cn(
                'min-h-9 justify-center rounded-full border border-leaf-200 bg-white px-3 active:bg-leaf-100',
                isLoading && 'opacity-50',
              )}
            >
              <AppText weight="medium" className="text-caption text-leaf-800">
                {suggestion}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  )
}
