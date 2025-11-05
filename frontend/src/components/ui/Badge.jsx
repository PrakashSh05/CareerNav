import { motion } from 'framer-motion';

/**
 * Badge component for displaying tags, skills, and status indicators
 */
const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className = '',
  onClick,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors duration-200';
  
  const variants = {
    default: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    primary: 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30',
    secondary: 'bg-gold-500/20 text-gold-400 hover:bg-gold-500/30',
    success: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    outline: 'border border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
  };
  
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  };
  
  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim();

  if (onClick) {
    return (
      <motion.button
        className={classes}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.span
      className={classes}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
