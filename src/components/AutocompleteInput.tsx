import React, { useState, useEffect, useRef } from 'react';
import { Search, Package } from 'lucide-react';

interface AutocompleteInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: any) => void;
  suggestions: any[];
  displayField: string;
  searchFields: string[];
  className?: string;
  showIcon?: boolean;
}

const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(({
  placeholder,
  value,
  onChange,
  onSelect,
  suggestions,
  displayField,
  searchFields,
  className = '',
  showIcon = true
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const filtered = suggestions.filter(item =>
        searchFields.some(field => {
          const fieldValue = item[field];
          return fieldValue && typeof fieldValue === 'string' && 
                 fieldValue.toLowerCase().includes(value.toLowerCase());
        })
      ).slice(0, 8); // Limit to 8 suggestions
      
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
      setFilteredSuggestions([]);
    }
  }, [value, suggestions, searchFields]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          handleSelect(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (item: any) => {
    onSelect(item);
    onChange(item[displayField]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    // Delay closing to allow click on suggestions
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <div className="relative">
        {showIcon && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        )}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && setIsOpen(filteredSuggestions.length > 0)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full ${showIcon ? 'pl-10' : 'pl-4'} pr-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base mobile-optimized ${className}`}
          autoComplete="off"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div 
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 lg:max-h-64 overflow-y-auto"
        >
          {filteredSuggestions.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => handleSelect(item)}
              className={`px-3 lg:px-4 py-2 lg:py-3 cursor-pointer border-b border-gray-100 last:border-b-0 touch-target ${
                index === selectedIndex 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Package className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm lg:text-base">{item[displayField]}</p>
                  {item.category && (
                    <p className="text-sm text-gray-500">{item.category} - {item.brand}</p>
                  )}
                  {item.sellingPrice && (
                    <p className="text-sm text-blue-600 font-semibold">₦{item.sellingPrice.toLocaleString()}</p>
                  )}
                  {item.stock !== undefined && (
                    <p className="text-xs text-gray-500">Stock: {item.stock}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

AutocompleteInput.displayName = 'AutocompleteInput';

export default AutocompleteInput;