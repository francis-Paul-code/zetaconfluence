import React from 'react';

import { useApp } from '../hooks/useApp';
import NotificationToast from './NotificationToast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          subtitle={toast.subtitle}
          message={toast.message}
          position={toast.position}
          autoClose={toast.autoClose}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
