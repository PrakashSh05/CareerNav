import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SearchInput component with debounced search functionality
 */
const SearchInput = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  debounceMs = 300,
  className = '',
  disabled = false,
  autoFocus = false,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== value) {
        onChange?.(searchTerm);
        onSearch?.(searchTerm);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs, onChange, onSearch, value]);

  // Update local state when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange?.('');
    onSearch?.('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.(searchTerm);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon 
            className={`h-5 w-5 transition-colors duration-200 ${
              isFocused ? 'text-accent-500' : 'text-gray-400'
            }`} 
          />
        </div>
        
        <motion.input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full pl-10 pr-10 py-3 
            bg-primary-900 border border-primary-700 rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          `}
          animate={{
            borderColor: isFocused ? '#FEE715' : '#374151'
          }}
          {...props}
        />
        
        {searchTerm && (
          <motion.button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XMarkIcon className="h-5 w-5" />
          </motion.button>
        )}
      </div>
      
      {/* Search suggestions or results count could go here */}
      {searchTerm && (
        <motion.div
          className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-400 px-3"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          {searchTerm.length < 2 ? 'Type at least 2 characters to search' : `Searching for "${searchTerm}"`}
        </motion.div>
      )}
    </div>
  );
};

export default SearchInput;
