/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  type FC,
  type HTMLInputTypeAttribute,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface IDropField {
  type: HTMLInputTypeAttribute;
  formValues?: any;
  value: (_: any) => any;
  key: string;
  options?: {
    name: string;
    data: any;
    value: string;
    renderLabel?: (data: any) => React.ReactNode;
  }[];
  placeholder?: string;
  maxLength?: number;
}

const DropField: FC<IDropField> = ({
  type,
  key,
  value,
  formValues,
  maxLength,
  options,
  placeholder,
}) => {
  const formValue = formValues[key];
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(formValue || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options?.find((opt) => opt.value === formValue);

  useEffect(() => {
    setInputValue(formValue || '');
  }, [formValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    value((prev: any) => ({ ...prev, [key]: newValue }));
  };

  const handleOptionSelect = (optionValue: string) => {
    setInputValue(optionValue);
    value((prev: any) => ({ ...prev, [key]: optionValue }));
    setIsOpen(false);
  };

  return (
    <div className="w-full h-full flex items-center relative" ref={dropdownRef}>
      <div className="w-full relative">
        <input
          type={type}
          name={key}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          maxLength={maxLength}
          onFocus={() => setIsOpen(true)}
          className="w-full p-3 pr-10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:outline-none"
          required
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
        >
          <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && options && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                formValue === option.value ? 'bg-primary/10 dark:bg-primary/20' : ''
              }`}
            >
              {option.renderLabel ? option.renderLabel(option.data) : option.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropField;
