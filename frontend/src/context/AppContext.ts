/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from 'react';

import type { ChatMessage, ChatState } from '../types/chat';

export interface IAppContext {
  user?: any;
  chat: ChatState;
  addMessage: (message: ChatMessage) => void;
  toggleChat: () => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
}

export const AppContext = createContext<IAppContext>({
  chat: {
    messages: [],
    isOpen: false,
    isLoading: false,
  },
  addMessage: () => {},
  toggleChat: () => {},
  setLoading: () => {},
  clearChat: () => {},
});
