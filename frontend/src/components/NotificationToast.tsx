import classNames from 'classnames';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { IoAlertCircle, IoCheckmarkCircle, IoClose, IoInformationCircle, IoWarning } from 'react-icons/io5';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface NotificationToastProps {
  type: ToastType;
  title: string;
  subtitle?: string;
  message: string;
  position?: ToastPosition;
  autoClose?: boolean;
  duration?: number;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  title,
  subtitle,
  message,
  position = 'top-right',
  autoClose = true,
  duration = 5000,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!autoClose) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle className="text-white" size={24} />;
      case 'error':
        return <IoAlertCircle className="text-white" size={24} />;
      case 'warning':
        return <IoWarning className="text-white" size={24} />;
      case 'info':
        return <IoInformationCircle className="text-white" size={24} />;
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-700';
      case 'error':
        return 'bg-red-700';
      case 'warning':
        return 'bg-orange-700';
      case 'info':
        return 'bg-blue-700';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return ' bg-green-500';
      case 'error':
        return ' bg-red-500';
      case 'warning':
        return ' bg-orange-500';
      case 'info':
        return ' bg-blue-500';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
    }
  };

  const getAnimationDirection = () => {
    if (position.includes('right')) {
      return { x: 400 };
    }
    return { x: -400 };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={getAnimationDirection()}
        animate={{ x: 0 }}
        exit={getAnimationDirection()}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed ${getPositionClasses()} z-[9999] pointer-events-auto`}
      >
        <div className={"w-[380px] max-w-[calc(100vw-3rem)] rounded-lg shadow-lg overflow-hidden " + getBackgroundColor()}>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
                    aria-label="Close notification"
                  >
                    <IoClose size={20} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {message}
                </p>
              </div>
            </div>
          </div>
          
          {autoClose && (
            <div className="h-1">
              <motion.div
                className={`h-full ${getProgressColor()}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationToast;