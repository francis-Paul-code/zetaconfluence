import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import type { ChatMessage, ChatState } from '../types/chat';
import { AppContext, type IAppContext } from './AppContext';

const CHAT_STORAGE_KEY = 'zetaconfluence_chat_history';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [chat, setChat] = useState<ChatState>(() => {
    // Load chat history from localStorage on init
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          messages: parsed.messages || [],
          isOpen: false,
          isLoading: false,
        };
      } catch {
        return {
          messages: [],
          isOpen: false,
          isLoading: false,
        };
      }
    }
    return {
      messages: [],
      isOpen: false,
      isLoading: false,
    };
  });

  useEffect(() => {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ messages: chat.messages })
    );
    if(chat.messages[chat?.messages?.length - 1 ]?.role === 'assistant'){
      playNotificationSound()
    }
  }, [chat.messages]);

   const playNotificationSound = () => {
    const audio = new Audio('/sounds/interface-start.wav');
    audio.volume = 0.1;
    audio.play().catch((e) => {
      console.warn('Autoplay prevented:', e);
    });
  };

  const addMessage = useCallback((message: ChatMessage) => {
    setChat((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const toggleChat = useCallback(() => {
    setChat((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setChat((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const clearChat = useCallback(() => {
    setChat({
      messages: [],
      isOpen: false,
      isLoading: false,
    });
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }, []);

  const contextValue: IAppContext = useMemo(
    () => ({
      chat,
      addMessage,
      toggleChat,
      setLoading,
      clearChat,
    }),
    [chat, addMessage, toggleChat, setLoading, clearChat]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
