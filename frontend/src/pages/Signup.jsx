import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { VALIDATION_RULES, ANIMATION_VARIANTS } from '../utils/constants'
import { getPasswordStrength } from '../utils/validation'

const Signup = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'No password', color: 'gray' })
  const { register: registerUser, error, clearError } = useAuth()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch
  } = useForm({
    mode: 'onBlur'
  })

  const watchPassword = watch('password', '')

  // Update password strength indicator
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(watchPassword))
  }, [watchPassword])

  // Clear errors when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      clearErrors()
      clearError()
      
      // Confirm password validation
      if (data.password !== data.confirmPassword) {
        setError('confirmPassword', { message: 'Passwords do not match' })
        return
      }
      
      const result = await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name
      })
      
      if (result.success) {
        // Navigate to onboarding after successful registration
        navigate('/onboarding', { replace: true })
      } else {
        // Handle validation errors
        if (result.validationErrors && Array.isArray(result.validationErrors)) {
          result.validationErrors.forEach(err => {
            const field = err.loc?.[err.loc.length - 1] // Get the field name
            if (field && ['email', 'password', 'full_name'].includes(field)) {
              setError(field, { message: err.msg })
            }
          })
        } else {
          // Handle general errors
          if (result.error.toLowerCase().includes('email')) {
            setError('email', { message: result.error })
          } else {
            setError('root', { message: result.error })
          }
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const getStrengthColor = (color) => {
    const colors = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      gray: 'bg-gray-500'
    }
    return colors[color] || colors.gray
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Career Navigator and start your journey"
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

        {/* Full Name Field */}
        <div className="space-y-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              {...register('full_name', VALIDATION_RULES.FULL_NAME)}
              type="text"
              placeholder="Enter your full name"
              className="pl-10"
              error={errors.full_name?.message}
              autoComplete="name"
              autoFocus
            />
          </div>
        </div>

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
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              {...register('password', VALIDATION_RULES.PASSWORD)}
              type="password"
              placeholder="Create a password"
              className="pl-10"
              error={errors.password?.message}
              autoComplete="new-password"
            />
          </div>
          
          {/* Password Strength Indicator */}
          {watchPassword && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Password strength:</span>
                <span className={`font-medium ${
                  passwordStrength.color === 'red' ? 'text-red-400' :
                  passwordStrength.color === 'orange' ? 'text-orange-400' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-400' :
                  passwordStrength.color === 'blue' ? 'text-blue-400' :
                  passwordStrength.color === 'green' ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${getStrengthColor(passwordStrength.color)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === watchPassword || 'Passwords do not match'
              })}
              type="password"
              placeholder="Confirm your password"
              className="pl-10"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3">
          <input
            {...register('acceptTerms', {
              required: 'You must accept the terms and conditions'
            })}
            type="checkbox"
            className="mt-1 w-4 h-4 text-accent-500 bg-primary-800 border-primary-600 rounded focus:ring-accent-500 focus:ring-2"
          />
          <div className="text-sm">
            <label className="text-gray-300">
              I agree to the{' '}
              <Link to="/terms" className="text-accent-400 hover:text-accent-300">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-accent-400 hover:text-accent-300">
                Privacy Policy
              </Link>
            </label>
            {errors.acceptTerms && (
              <p className="text-red-400 text-xs mt-1">{errors.acceptTerms.message}</p>
            )}
          </div>
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-primary-800 text-gray-400">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
          >
            Sign in to your account
          </Link>
        </div>
      </motion.form>
    </AuthLayout>
  )
}

export default Signup
