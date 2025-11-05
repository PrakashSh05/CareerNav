import { motion } from 'framer-motion'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'accent', 
  overlay = false,
  text = '',
  className = '' 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  const colors = {
    accent: 'border-accent-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  }
  
  const spinnerClasses = `${sizes[size]} border-2 ${colors[color]} rounded-full ${className}`
  
  const spinner = (
    <motion.div
      className={spinnerClasses}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  )
  
  if (overlay) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex flex-col items-center space-y-4 bg-primary-800 p-8 rounded-xl border border-primary-700"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {spinner}
          {text && (
            <p className="text-gray-300 text-sm font-medium">{text}</p>
          )}
        </motion.div>
      </motion.div>
    )
  }
  
  if (text) {
    return (
      <div className="flex items-center space-x-3">
        {spinner}
        <span className="text-gray-300 text-sm font-medium">{text}</span>
      </div>
    )
  }
  
  return spinner
}

// Skeleton loader component
const Skeleton = ({ className = '', width, height }) => {
  const classes = `bg-primary-700 rounded shimmer ${className}`
  const style = {
    width: width || '100%',
    height: height || '1rem'
  }
  
  return <div className={classes} style={style} />
}

// Pulse loader for cards
const CardSkeleton = () => (
  <div className="bg-primary-800 border border-primary-700 rounded-xl p-6 space-y-4">
    <Skeleton height="1.5rem" width="60%" />
    <Skeleton height="1rem" width="100%" />
    <Skeleton height="1rem" width="80%" />
    <div className="flex space-x-2 pt-2">
      <Skeleton height="2rem" width="4rem" />
      <Skeleton height="2rem" width="4rem" />
    </div>
  </div>
)

LoadingSpinner.Skeleton = Skeleton
LoadingSpinner.CardSkeleton = CardSkeleton

export default LoadingSpinner
