import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import AuthLayout from '../components/layout/AuthLayout'
import { ANIMATION_VARIANTS } from '../utils/constants'

const Terms = () => {
  return (
    <AuthLayout
      title="Terms of Service"
      subtitle="Legal terms and conditions coming soon"
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
          <FileText className="w-8 h-8 text-accent-400" />
        </motion.div>

        {/* Coming Soon Message */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-white">
            Terms of Service Coming Soon
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            We're currently finalizing our Terms of Service. 
            This page will contain our complete legal terms and conditions once ready.
          </p>
        </div>

        {/* Temporary Notice */}
        <div className="bg-primary-900/50 border border-primary-600 rounded-lg p-4 text-left">
          <h4 className="text-sm font-medium text-white mb-2">Temporary Notice:</h4>
          <p className="text-sm text-gray-300">
            By using Career Navigator, you agree to use the platform responsibly 
            and in accordance with applicable laws. Full terms will be available soon.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-accent-400 hover:text-accent-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
          <Link
            to="/signup"
            className="text-accent-400 hover:text-accent-300 transition-colors"
          >
            Continue to Signup
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  )
}

export default Terms
