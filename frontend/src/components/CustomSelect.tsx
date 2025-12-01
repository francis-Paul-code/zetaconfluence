/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { type FC, useEffect, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface ICustomSelect {
  name: string;
  value?: any;
  onChange: (value: any) => void;
  options: {
    name: string;
    data: any;
    value: string;
    renderLabel?: (data: any) => React.ReactNode;
  }[];
  placeholder?: string;
  className?: string;
}

const CustomSelect: FC<ICustomSelect> = ({
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={` relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full py-1 px-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:outline-none text-left flex items-center justify-between"
      >
        <span className={selectedOption ? '' : 'text-gray-400'}>
          {selectedOption
            ? selectedOption.renderLabel
              ? selectedOption.renderLabel(selectedOption.data)
              : selectedOption.name
            : placeholder}
        </span>
        <FaChevronDown
          className={`transition-transform text-gray-500 dark:text-gray-400 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                value === option.value ? 'bg-primary/10 dark:bg-primary/20' : ''
              }`}
            >
              {option.renderLabel
                ? option.renderLabel(option.data)
                : option.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
