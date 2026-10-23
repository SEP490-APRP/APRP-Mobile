import React, { createContext, useContext, useState, useCallback } from 'react';

// TODO: implement ChatBotContext
const ChatBotContext = createContext(null);

export function ChatBotProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text) => {
    // TODO: call chatbotService.sendMessage(text)
    throw new Error('ChatBotContext.sendMessage — TODO');
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatBotContext.Provider value={{ messages, loading, sendMessage, clearHistory }}>
      {children}
    </ChatBotContext.Provider>
  );
}

export function useChatBot() {
  const ctx = useContext(ChatBotContext);
  if (!ctx) throw new Error('useChatBot must be used within ChatBotProvider');
  return ctx;
}
