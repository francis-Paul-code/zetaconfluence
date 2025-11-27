import { type ReactNode, useEffect, useRef, useState } from 'react';

export interface DropdownOption<T = unknown> {
  id: string | number;
  label: string;
  value: T;
  icon?: ReactNode;
  disabled?: boolean;
  colorHex?: string;
}

interface DropdownProps<T = unknown> {
  options: DropdownOption<T>[];
  selectedOption?: DropdownOption<T>;
  onSelect?: (option: DropdownOption<T>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  renderTrigger?: (
    selectedOption: DropdownOption<T> | undefined,
    placeholder: string,
    isOpen: boolean
  ) => ReactNode;
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => ReactNode;
}

export const Dropdown = <T,>({
  options,
  selectedOption,
  onSelect,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  optionClassName = '',
  renderTrigger,
  renderOption,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0) {
          handleSelect(options[focusedIndex]);
        }
        break;
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option: DropdownOption<T>) => {
    if (!option.disabled) {
      onSelect?.(option);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Tailwind-based trigger content
  const defaultTriggerContent = (
    <>
      <div className="flex items-center gap-2 md:gap-3 w-full">
        {selectedOption?.colorHex ? (
          <div
            className="flex items-center justify-center rounded-full min-w-[40px] min-h-[40px] md:min-w-[48px] md:min-h-[48px] overflow-hidden"
            style={{ backgroundColor: selectedOption.colorHex }}
          />
        ) : (
          <div className="flex items-center justify-center rounded-full min-w-[40px] min-h-[40px] md:min-w-[48px] md:min-h-[48px] overflow-hidden border-4 md:border-8 border-gray-200 dark:border-[#283442]" />
        )}
        <span className="flex-1 text-left font-normal text-[28px] md:text-[40px] leading-none whitespace-nowrap">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div
          className={`transition-transform duration-200 flex items-center justify-center ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <svg
            className="w-6 h-6 md:w-[30px] md:h-[30px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 30 30"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.25063 9.92407L15.0006 18.6741L23.7506 9.92407L25.0765 11.2499L15.6635 20.6628C15.2974 21.0289 14.7038 21.0289 14.3377 20.6628L4.9248 11.2499L6.25063 9.92407Z"
              fill="#696E75"
            />
          </svg>
        </div>
      </div>
    </>
  );

  // Tailwind-based option content
  const defaultOptionContent = (
    option: DropdownOption<T>,
    isSelected: boolean
  ) => (
    <>
      {option.colorHex && (
        <div
          className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] rounded-full overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: option.colorHex }}
        />
      )}
      <span className="flex-1 text-left text-[28px] md:text-[36px] font-normal leading-none whitespace-nowrap">
        {option.label}
      </span>
      {isSelected && (
        <div className="flex items-center justify-center w-6 h-6 md:w-10 md:h-10 text-blue-400 dark:text-[#283442]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M33.4333 11.6667L15.8828 29.2172C15.3946 29.7054 14.6032 29.7054 14.115 29.2172L6.56445 21.6667L8.33222 19.8989L14.9989 26.5656L31.6656 9.89893L33.4333 11.6667Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}
    </>
  );

  return (
    <div
      className={`inline-block relative w-[336px] md:w-[480px] ${className}`}
      ref={dropdownRef}
    >
      <button
        className={`flex items-center justify-between w-full font-medium text-base md:text-lg rounded-full border border-gray-300 dark:border-[#171f29] px-4 py-2 md:px-5 md:py-3 bg-white dark:bg-[#171f29] transition-colors duration-200 ${triggerClassName} ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${isOpen ? 'invisible' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {renderTrigger
          ? renderTrigger(selectedOption, placeholder, isOpen)
          : defaultTriggerContent}
      </button>

      {isOpen && (
        <div
          className={`absolute top-0 left-0 right-0 rounded-[32px] md:rounded-[48px] py-2 w-full overflow-y-auto z-[1000] bg-white dark:bg-[#26303d] shadow-lg ${dropdownClassName}`}
          role="listbox"
          aria-label={placeholder}
        >
          {options.map((option, index) => {
            const isSelected = selectedOption?.id === option.id;
            const isFirst = index === 0;
            return (
              <div key={option.id}>
                {!isFirst && (
                  <div className="flex flex-col justify-center h-0.5 bg-gradient-to-r from-white via-gray-200 to-white dark:from-[#26303d] dark:via-[#171f29] dark:to-[#26303d]" />
                )}
                <button
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  className={`flex items-center gap-3 md:gap-4 w-full rounded-lg px-3 py-2 md:px-4 md:py-3 mb-1 last:mb-0 transition-all duration-200 text-base md:text-lg ${
                    isSelected ? 'bg-blue-50 dark:bg-[#283442]' : ''
                  } ${
                    option.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  } ${optionClassName}`}
                  onClick={() => handleSelect(option)}
                  type="button"
                  disabled={option.disabled}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {renderOption
                    ? renderOption(option, isSelected)
                    : defaultOptionContent(option, isSelected)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
