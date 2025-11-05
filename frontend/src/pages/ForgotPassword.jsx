import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail } from 'lucide-react'
import AuthLayout from '../components/layout/AuthLayout'
import { ANIMATION_VARIANTS } from '../utils/constants'

const ForgotPassword = () => {
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Password reset functionality coming soon"
    >
      <motion.div
        className="text-center space-y-6"
        variants={ANIMATION_VARIANTS.fadeIn}
        initial="initial"
        animate="animate"
      >
        {/* Coming Soon Icon */}
        <motion.div
          className="w-16 h-16 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Mail className="w-8 h-8 text-accent-400" />
        </motion.div>

        {/* Coming Soon Message */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-white">
            Password Reset Coming Soon
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            We're working on implementing password reset functionality. 
            For now, please contact support if you need help accessing your account.
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-primary-900/50 border border-primary-600 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            Need immediate help?<br />
            <span className="text-accent-400">Contact us at support@careernavigator.com</span>
          </p>
        </div>

        {/* Back to Login */}
        <Link
          to="/login"
          className="inline-flex items-center space-x-2 text-accent-400 hover:text-accent-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
      </motion.div>
    </AuthLayout>
  )
}

export default ForgotPassword
