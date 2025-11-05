import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-accent-500 rounded-full mb-4"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Compass className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Career Navigator
          </h1>
          
          <p className="text-gray-400 text-sm">
            Your AI-powered career guidance platform
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          className="bg-primary-800/80 backdrop-blur-sm border border-primary-700 rounded-2xl p-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {title && (
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
              {subtitle && (
                <p className="text-gray-400 text-sm">{subtitle}</p>
              )}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {children}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-500 text-xs">
            © 2024 Career Navigator. All rights reserved.
          </p>
        </motion.div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-highlight-500/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  )
}

export default AuthLayout
