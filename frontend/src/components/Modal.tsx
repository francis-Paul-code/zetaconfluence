import { type ReactNode, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className: string;
  children: ReactNode;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  className = '',
  children,
}: ModalProps) => {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1000]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`relative p-8 w-[90%] max-w-[400px] rounded-2xl bg-white dark:bg-background_dark-tint border border-[#f0f0f0] dark:border-[#3f3f3f] text-black dark:text-white  ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-semibold mt-0 mb-6">
          {title}
        </h2>
        {children}
        <button
          className="absolute right-4 top-4 flex items-center justify-center w-7 h-7 p-2 rounded-full cursor-pointer transition-opacity duration-200 bg-[#e2e2e2] border border-[#d6d6d6] dark:bg-[#3f3f3f] dark:border-[#3f3f3f] hover:opacity-80"
          onClick={onClose}
          aria-label="Close modal"
        >
          <IoClose />
        </button>
      </div>
    </div>
  );
};
