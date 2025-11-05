import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { VALIDATION_RULES, ANIMATION_VARIANTS } from '../utils/constants'

const Login = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/dashboard'
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm({
    mode: 'onBlur'
  })

  // Clear errors when component mounts or when user starts.

  
  useEffect(() => {
    clearError()
  }, [clearError])

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      clearErrors()
      clearError()
      
      const result = await login(data.email, data.password)
      
      if (result.success) {
        // Navigate to intended page or dashboard
        navigate(from, { replace: true })
      } else {
        // Handle specific error cases
        if (result.error.toLowerCase().includes('email')) {
          setError('email', { message: result.error })
        } else if (result.error.toLowerCase().includes('password')) {
          setError('password', { message: result.error })
        } else {
          setError('root', { message: result.error })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your Career Navigator account"
    >
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        variants={ANIMATION_VARIANTS.fadeIn}
        initial="initial"
        animate="animate"
      >
        {/* Global Error Message */}
        {(error || errors.root) && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">
              {error || errors.root?.message}
            </p>
          </motion.div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              {...register('email', VALIDATION_RULES.EMAIL)}
              type="email"
              placeholder="Enter your email"
              className="pl-10"
              error={errors.email?.message}
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              {...register('password', {
                required: 'Password is required'
              })}
              type="password"
              placeholder="Enter your password"
              className="pl-10"
              error={errors.password?.message}
              autoComplete="current-password"
            />
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-primary-800 text-gray-400">
              Don't have an account?
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <Link
            to="/signup"
            className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
          >
            Create a new account
          </Link>
        </div>
      </motion.form>

      {/* Demo Credentials (for development) */}
      {import.meta.env.DEV && (
        <motion.div
          className="mt-8 p-4 bg-primary-900/50 border border-primary-600 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-xs text-gray-400 mb-2">Demo Credentials:</p>
          <p className="text-xs text-gray-300">
            Email: demo@example.com<br />
            Password: DemoPass123
          </p>
        </motion.div>
      )}
    </AuthLayout>
  )
}

export default Login
