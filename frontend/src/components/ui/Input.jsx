import { motion } from 'framer-motion'
import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  className = '', 
  placeholder,
  required = false,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  const inputType = type === 'password' && showPassword ? 'text' : type
  
  const baseClasses = 'w-full bg-primary-800 border text-white placeholder-gray-400 rounded-lg px-3 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent'
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : 'border-primary-700'
  const classes = `${baseClasses} ${errorClasses} ${className}`
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <motion.input
          ref={ref}
          type={inputType}
          className={classes}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
