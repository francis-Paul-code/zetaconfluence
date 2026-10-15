/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from 'react';

import type { ChatMessage, ChatState } from '../types/chat';
import type { Toast } from '../types/toast';

export interface IAppContext {
  user?: any;
  chat: ChatState;
  toasts: Toast[];
  addMessage: (message: ChatMessage) => void;
  toggleChat: () => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}

export const AppContext = createContext<IAppContext>({
  chat: {
    messages: [],
    isOpen: false,
    isLoading: false,
  },
  toasts: [],
  addMessage: () => {},
  toggleChat: () => {},
  setLoading: () => {},
  clearChat: () => {},
  addToast: () => {},
  removeToast: () => {},
});
