import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  id: string;
  name: string;
}

interface SelectProps {
  options: (SelectOption & Record<string, any>)[];
  value: string;
  onChange: (value: string) => void;
  renderOption?: (option: SelectOption&Record<string,any>) => React.ReactNode; // custom renderer
  placeholder?: string;
}

export default function Select({
  options,
  value,
  onChange,
  renderOption,
  placeholder = 'Select an option',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.id === value);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-fit" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-auto min-w-55 px-3 py-2 flex items-center justify-between border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 "
      >
        {selected ? (
          <div className="flex items-center gap-2 w-auto flex-1">
            {renderOption ? renderOption(selected) : selected.name}
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <span className="ml-2">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-fit min-w-55 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-70 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                opt.id === value ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              {renderOption ? renderOption(opt) : opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
