import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ChevronLeft, ChevronRight, Check, Search, X, MapPin, Briefcase, Target, Settings, AlertCircle, RefreshCw } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { ONBOARDING_STEPS, COMMON_SKILLS, COMMON_ROLES, EXPERIENCE_LEVELS } from '../utils/constants'

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState([])
  const [selectedRoles, setSelectedRoles] = useState([])
  const [skillSearch, setSkillSearch] = useState('')
  const [roleSearch, setRoleSearch] = useState('')
  const [customSkill, setCustomSkill] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [activeField, setActiveField] = useState(null)

  const skillSearchInputRef = useRef(null)
  const roleSearchInputRef = useRef(null)
  const customSkillInputRef = useRef(null)
  const customRoleInputRef = useRef(null)
  const locationInputRef = useRef(null)
  
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    defaultValues: {
      experience_level: user?.experience_level || '',
      location: user?.location || ''
    }
  })

  const locationRegister = register('location', { required: 'Location is required' })

  // Initialize with existing user data if available
  useEffect(() => {
    if (user) {
      if (user.skills) setSelectedSkills(user.skills)
      if (user.target_roles) setSelectedRoles(user.target_roles)
      if (user.experience_level) setValue('experience_level', user.experience_level)
      if (user.location) setValue('location', user.location)
    }
  }, [user, setValue])

  // Filter skills and roles based on search
  const filteredSkills = COMMON_SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !selectedSkills.includes(skill)
  )

  const filteredRoles = COMMON_ROLES.filter(role =>
    role.toLowerCase().includes(roleSearch.toLowerCase()) &&
    !selectedRoles.includes(role)
  )

  // Handle skill selection
  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
    clearError() // Clear error when user makes changes
    const wasSearchFocused = activeField === 'skillSearch'
    setSkillSearch('')
    if (wasSearchFocused) {
      requestAnimationFrame(() => {
        if (skillSearchInputRef.current) {
          skillSearchInputRef.current.focus({ preventScroll: true })
        }
      })
    }
  }

  // Handle role selection
  const toggleRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
    clearError() // Clear error when user makes changes
    const wasSearchFocused = activeField === 'roleSearch'
    setRoleSearch('')
    if (wasSearchFocused) {
      requestAnimationFrame(() => {
        if (roleSearchInputRef.current) {
          roleSearchInputRef.current.focus({ preventScroll: true })
        }
      })
    }
  }

  // Add custom skill
  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills(prev => [...prev, customSkill.trim()])
      setCustomSkill('')
      requestAnimationFrame(() => {
        if (customSkillInputRef.current) {
          customSkillInputRef.current.focus({ preventScroll: true })
        }
      })
    }
  }

  const handleCustomSkillKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addCustomSkill()
    }
  }

  const handleCustomSkillChange = (event) => {
    setCustomSkill(event.target.value)
  }

  // Add custom role
  const addCustomRole = () => {
    if (customRole.trim() && !selectedRoles.includes(customRole.trim())) {
      setSelectedRoles(prev => [...prev, customRole.trim()])
      setCustomRole('')
      requestAnimationFrame(() => {
        if (customRoleInputRef.current) {
          customRoleInputRef.current.focus({ preventScroll: true })
        }
      })
    }
  }

  const handleCustomRoleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addCustomRole()
    }
  }

  const handleCustomRoleChange = (event) => {
    setCustomRole(event.target.value)
  }

  useEffect(() => {
    if (activeField === 'customSkill' && customSkillInputRef.current) {
      const input = customSkillInputRef.current
      input.focus({ preventScroll: true })
      const length = input.value.length
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(length, length)
      }
    }
  }, [customSkill, activeField])

  useEffect(() => {
    if (activeField === 'customRole' && customRoleInputRef.current) {
      const input = customRoleInputRef.current
      input.focus({ preventScroll: true })
      const length = input.value.length
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(length, length)
      }
    }
  }, [customRole, activeField])

  useEffect(() => {
    if (activeField === 'skillSearch' && skillSearchInputRef.current) {
      const input = skillSearchInputRef.current
      input.focus({ preventScroll: true })
      const length = input.value.length
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(length, length)
      }
    }
  }, [skillSearch, activeField])

  useEffect(() => {
    if (activeField === 'roleSearch' && roleSearchInputRef.current) {
      const input = roleSearchInputRef.current
      input.focus({ preventScroll: true })
      const length = input.value.length
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(length, length)
      }
    }
  }, [roleSearch, activeField])

  useEffect(() => {
    if (activeField === 'location' && locationInputRef.current) {
      const input = locationInputRef.current
      input.focus({ preventScroll: true })
      const length = input.value.length
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(length, length)
      }
    }
  }, [activeField])

  // Navigation functions
  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Validation for each step
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Skills step
        return selectedSkills.length > 0
      case 1: // Roles step
        return selectedRoles.length > 0
      case 2: // Experience & Location step
        return watch('experience_level') && watch('location')
      default:
        return true
    }
  }

  // Submit onboarding data
  const onSubmit = async (formData) => {
    try {
      setIsLoading(true)
      setSubmitError(null) // Clear previous errors
      
      const profileData = {
        skills: selectedSkills,
        target_roles: selectedRoles,
        experience_level: formData.experience_level,
        location: formData.location
      }
      
      const result = await updateProfile(profileData)
      
      if (result.success) {
        navigate('/dashboard', { replace: true })
      } else {
        setSubmitError(result.error || 'Failed to update profile. Please try again.')
        setRetryCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Onboarding submission error:', error)
      setSubmitError('An unexpected error occurred. Please check your connection and try again.')
      setRetryCount(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  // Retry submission
  const retrySubmission = () => {
    const formData = {
      experience_level: watch('experience_level'),
      location: watch('location')
    }
    onSubmit(formData)
  }

  // Clear error when user makes changes
  const clearError = () => {
    setSubmitError(null)
  }

  // Step components
  const SkillsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🛠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Select Your Skills</h2>
        <p className="text-gray-400">Choose the skills you currently have or want to develop</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search skills..."
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          ref={skillSearchInputRef}
          onFocus={() => setActiveField('skillSearch')}
          onBlur={() => setActiveField((prev) => (prev === 'skillSearch' ? null : prev))}
          className="pl-10"
        />
      </div>

      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Add custom skill..."
          value={customSkill}
          onChange={handleCustomSkillChange}
          onKeyDown={handleCustomSkillKeyDown}
          ref={customSkillInputRef}
          onFocus={() => setActiveField('customSkill')}
          onBlur={() => setActiveField((prev) => (prev === 'customSkill' ? null : prev))}
        />
        <Button type="button" onClick={addCustomSkill} disabled={!customSkill.trim()} variant="outline">
          Add
        </Button>
      </div>

      {selectedSkills.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Selected Skills ({selectedSkills.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent-500 text-white">
                {skill}
                <button type="button" onClick={() => toggleSkill(skill)} className="ml-2 hover:bg-accent-600 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-300">Available Skills</h3>
        <div className="max-h-60 overflow-y-auto space-y-2">
          <div className="flex flex-wrap gap-2">
            {filteredSkills.slice(0, 20).map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                type="button"
                className="px-3 py-1 rounded-full text-sm bg-primary-700 text-gray-300 hover:bg-primary-600 hover:text-white transition-colors"
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const RolesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold text-white mb-2">Target Roles</h2>
        <p className="text-gray-400">What roles are you interested in pursuing?</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search roles..."
          value={roleSearch}
          onChange={(e) => setRoleSearch(e.target.value)}
          ref={roleSearchInputRef}
          onFocus={() => setActiveField('roleSearch')}
          onBlur={() => setActiveField((prev) => (prev === 'roleSearch' ? null : prev))}
          className="pl-10"
        />
      </div>

      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Add custom role..."
          value={customRole}
          onChange={handleCustomRoleChange}
          onKeyDown={handleCustomRoleKeyDown}
          ref={customRoleInputRef}
          onFocus={() => setActiveField('customRole')}
          onBlur={() => setActiveField((prev) => (prev === 'customRole' ? null : prev))}
        />
        <Button type="button" onClick={addCustomRole} disabled={!customRole.trim()} variant="outline">
          Add
        </Button>
      </div>

      {selectedRoles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Selected Roles ({selectedRoles.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map((role) => (
              <span key={role} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-highlight-500 text-primary-900">
                {role}
                <button type="button" onClick={() => toggleRole(role)} className="ml-2 hover:bg-highlight-600 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-300">Available Roles</h3>
        <div className="max-h-60 overflow-y-auto space-y-2">
          <div className="flex flex-wrap gap-2">
            {filteredRoles.slice(0, 20).map((role) => (
              <button
                key={role}
                onClick={() => toggleRole(role)}
                type="button"
                className="px-3 py-1 rounded-full text-sm bg-primary-700 text-gray-300 hover:bg-primary-600 hover:text-white transition-colors"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const ExperienceStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">📍</div>
        <h2 className="text-2xl font-bold text-white mb-2">Experience & Location</h2>
        <p className="text-gray-400">Tell us about your experience level and preferred location</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Experience Level *
          </label>
          <div className="grid grid-cols-1 gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <label
                key={level.value}
                className="flex items-center p-3 border border-primary-700 rounded-lg hover:border-accent-500 cursor-pointer transition-colors"
              >
                <input
                  {...register('experience_level', { required: 'Please select your experience level' })}
                  type="radio"
                  value={level.value}
                  className="w-4 h-4 text-accent-500 bg-primary-800 border-primary-600 focus:ring-accent-500"
                />
                <div className="ml-3">
                  <div className="text-white font-medium">{level.label}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.experience_level && <p className="text-red-400 text-sm">{errors.experience_level.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter your preferred location"
              className="pl-10"
              error={errors.location?.message}
              name={locationRegister.name}
              ref={(node) => {
                locationRegister.ref(node)
                locationInputRef.current = node
              }}
              onChange={(event) => {
                locationRegister.onChange(event)
              }}
              onFocus={() => setActiveField('location')}
              onBlur={(event) => {
                locationRegister.onBlur(event)
                setActiveField((prev) => (prev === 'location' ? null : prev))
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const steps = [SkillsStep, RolesStep, ExperienceStep]
  const CurrentStepComponent = steps[currentStep]

  return (
    <div className="min-h-screen bg-primary-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < ONBOARDING_STEPS.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-accent-500 text-white'
                      : 'bg-primary-700 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded ${
                      index < currentStep ? 'bg-accent-500' : 'bg-primary-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-400 font-medium text-sm mb-1">
                  Setup Failed
                </h4>
                <p className="text-red-300 text-sm mb-3">
                  {submitError}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={retrySubmission}
                    disabled={isLoading}
                    className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="text-gray-400 hover:text-white"
                  >
                    Dismiss
                  </Button>
                </div>
                {retryCount > 1 && (
                  <p className="text-xs text-gray-400 mt-2">
                    If the problem persists, please check your internet connection or contact support.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card className="p-8">
          <CurrentStepComponent />

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-primary-700">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === ONBOARDING_STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={!canProceed() || isLoading}
                loading={isLoading}
                className="flex items-center"
              >
                {isLoading ? 'Completing...' : 'Complete Setup'}
                <Settings className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Onboarding
