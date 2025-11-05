import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

/**
 * FilterDropdown component for single and multi-select filtering
 */
const FilterDropdown = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  multiple = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const isSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const getDisplayText = () => {
    if (multiple) {
      const selectedCount = Array.isArray(value) ? value.length : 0;
      if (selectedCount === 0) return placeholder;
      if (selectedCount === 1) return value[0];
      return `${selectedCount} selected`;
    }
    return value || placeholder;
  };

  const hasSelection = multiple 
    ? Array.isArray(value) && value.length > 0 
    : value !== null && value !== undefined && value !== '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <motion.button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left
          bg-primary-900 border border-primary-700 rounded-lg
          text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          flex items-center justify-between
          ${hasSelection ? 'text-white' : 'text-gray-400'}
        `}
        whileHover={!disabled ? { borderColor: '#FEE715' } : {}}
        {...props}
      >
        <span className="truncate">{getDisplayText()}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-primary-900 border border-primary-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-gray-400 text-sm">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                const selected = isSelected(optionValue);

                return (
                  <motion.button
                    key={optionValue}
                    type="button"
                    onClick={() => handleOptionClick(optionValue)}
                    className={`
                      w-full px-4 py-3 text-left text-sm
                      hover:bg-primary-800 transition-colors duration-200
                      flex items-center justify-between
                      ${selected ? 'bg-accent-500/20 text-accent-300' : 'text-gray-300'}
                    `}
                    whileHover={{ backgroundColor: 'rgba(55,65,81,0.8)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>{optionLabel}</span>
                    {selected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <CheckIcon className="h-4 w-4 text-accent-400" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterDropdown;
