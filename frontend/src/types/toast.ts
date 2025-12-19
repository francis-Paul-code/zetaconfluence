export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  subtitle?: string;
  message: string;
  position?: ToastPosition;
  autoClose?: boolean;
  duration?: number;
}
