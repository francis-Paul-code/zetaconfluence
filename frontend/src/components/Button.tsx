import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: 'thin' | 'default';
}

export const Button = ({
  children,
  icon,
  type = 'button',
  className,
  variant = 'default',
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={clsx(
        // Base styles
        'flex items-center justify-center gap-2 rounded-full font-medium text-base leading-none transition-all duration-200',
        // Variant styles
        {
          'px-4 py-3': variant === 'thin',
          'p-4': variant === 'default',
        },
        // Theme styles
        'bg-[var(--button-light)] text-[var(--primary-light)] dark:bg-[var(--button-dark)] dark:text-[var(--primary-dark)]',
        // Disabled styles
        'disabled:cursor-not-allowed disabled:bg-[#e5e8ec] disabled:text-[#696e75] dark:disabled:bg-[#283442] dark:disabled:text-[#a9acb0]',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="flex items-center">{icon}</span>}
        {children}
      </div>
    </button>
  );
};
