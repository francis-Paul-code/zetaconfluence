import { useCallback } from 'react';

import type { Toast, ToastType, ToastPosition } from '../types/toast';
import { useApp } from './useApp';

interface ShowToastOptions {
  title: string;
  subtitle?: string;
  message: string;
  position?: ToastPosition;
  autoClose?: boolean;
  duration?: number;
}

export const useToast = () => {
  const { addToast, removeToast } = useApp();

  const showToast = useCallback(
    (type: ToastType, options: ShowToastOptions) => {
      const toast: Toast = {
        id: `toast-${Date.now()}-${Math.random()}`,
        type,
        ...options,
      };
      addToast(toast);
      return toast.id;
    },
    [addToast]
  );

  const success = useCallback(
    (options: ShowToastOptions) => showToast('success', options),
    [showToast]
  );

  const error = useCallback(
    (options: ShowToastOptions) => showToast('error', options),
    [showToast]
  );

  const warning = useCallback(
    (options: ShowToastOptions) => showToast('warning', options),
    [showToast]
  );

  const info = useCallback(
    (options: ShowToastOptions) => showToast('info', options),
    [showToast]
  );

  return {
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
  };
};
