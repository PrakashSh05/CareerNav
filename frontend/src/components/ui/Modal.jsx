import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'
import { X } from 'lucide-react'

const Modal = ({
  title,
  description,
  open,
  onClose,
  children,
  footer,
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-md rounded-2xl border border-primary-600 bg-primary-900 p-6 shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-400">{description}</p>
                )}
              </div>

              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-400 hover:text-white"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4 text-gray-200">{children}</div>

            {footer && (
              <div className="mt-6 flex items-center justify-end space-x-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal
