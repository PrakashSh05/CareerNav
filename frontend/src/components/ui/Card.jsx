import { motion } from 'framer-motion'
import { forwardRef } from 'react'

const Card = forwardRef(({ 
  children, 
  className = '', 
  variant = 'default',
  hover = false,
  ...props 
}, ref) => {
  const baseClasses = 'rounded-xl shadow-lg transition-all duration-200'
  
  const variants = {
    default: 'bg-primary-800 border border-primary-700',
    elevated: 'bg-primary-800 border border-primary-600 shadow-xl',
    gradient: 'bg-gradient-to-br from-primary-800 to-primary-900 border border-primary-600',
    glass: 'bg-primary-800/50 backdrop-blur-sm border border-primary-600/50',
  }
  
  const classes = `${baseClasses} ${variants[variant]} ${className}`
  
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: hover ? { y: -2, scale: 1.01 } : {}
  }
  
  return (
    <motion.div
      ref={ref}
      className={classes}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

Card.displayName = 'Card'

// Card components for composition
const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 pb-0 ${className}`}>
    {children}
  </div>
)

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
)

const CardFooter = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-white ${className}`}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-400 mt-1 ${className}`}>
    {children}
  </p>
)

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter
Card.Title = CardTitle
Card.Description = CardDescription

export default Card
