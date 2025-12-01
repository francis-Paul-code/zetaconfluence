import { useCallback } from 'react';

import { sendChatMessage } from '../actions/chat';
import type { ChatMessage } from '../types/chat';
import { useApp } from './useApp';

export const useChat = () => {
  const { chat, addMessage, setLoading } = useApp();

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };
      addMessage(userMessage);
      setLoading(true);
      const newMessage = await sendChatMessage({
        message,
        history: chat.messages,
      });
      addMessage(newMessage);
      setLoading(false);
    },
    [chat.messages, addMessage, setLoading]
  );

  return {
    messages: chat.messages,
    isLoading: chat.isLoading,
    sendMessage,
  };
};
