import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Code,
  ExternalLink,
  GraduationCap,
  LogOut,
  MapPin,
  PieChart,
  Save,
  Settings,
  Target,
  TrendingUp,
  User,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import SkillsModal from '../components/ui/SkillsModal'
import { useAuth } from '../hooks/useAuth'
import marketService from '../services/marketService'
import skillsService, { normalizeUserSkills } from '../services/skillsService'
import TrendingSkillsChart from '../components/charts/TrendingSkillsChart'
import SkillGapChart from '../components/charts/SkillGapChart'
import { COMMON_ROLES, COMMON_SKILLS, EXPERIENCE_LEVELS, ANIMATION_VARIANTS } from '../utils/constants'

const GAP_ANALYSIS_MAX_RETRIES = 6
const GAP_ANALYSIS_RETRY_DELAY_MS = 5000

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout, loading, updateProfile } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false)
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false)
  const [formState, setFormState] = useState({
    full_name: user?.full_name || '',
    experience_level: user?.experience_level || '',
    location: user?.location || '',
  })
  const [skillsState, setSkillsState] = useState([])
  const [rolesState, setRolesState] = useState([])
  const [editingRoles, setEditingRoles] = useState([]) // Temporary state for editing
  const [skillInput, setSkillInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [trendingData, setTrendingData] = useState(null)
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [trendingError, setTrendingError] = useState(null)
  const [gapAnalysisData, setGapAnalysisData] = useState({})
  const [gapAnalysisLoading, setGapAnalysisLoading] = useState(false)
  const [gapAnalysisError, setGapAnalysisError] = useState(null)
  const [marketScore, setMarketScore] = useState('--')

  useEffect(() => {
    setFormState({
      full_name: user?.full_name || '',
      experience_level: user?.experience_level || '',
      location: user?.location || '',
    })
    setSkillsState(normalizeUserSkills(user?.skills || []))
    setRolesState(user?.target_roles || [])
  }, [user])

  const handleProfileSave = async () => {
    setSaving(true)
    const result = await updateProfile({
      full_name: formState.full_name,
      experience_level: formState.experience_level || null,
      location: formState.location || null,
    })
    setSaving(false)
    if (result.success) {
      setIsEditProfileOpen(false)
    }
  }

  const handleSkillsSave = async () => {
    setSaving(true)
    const result = await updateProfile({ skills: skillsState })
    setSaving(false)
    if (result.success) {
      setIsSkillsModalOpen(false)
    }
  }

  const handleRolesSave = async () => {
    setSaving(true)
    const result = await updateProfile({ target_roles: editingRoles })
    setSaving(false)
    if (result.success) {
      setRolesState(editingRoles) // Update actual state only on success
      setIsRolesModalOpen(false)
      setRoleInput('')
    }
  }

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value) return

    const normalizedValue = normalizeUserSkills([value])[0] || value
    setSkillsState(prev => {
      const newSkills = [...prev, normalizedValue]
      return normalizeUserSkills(newSkills) // Ensure all skills are normalized
    })
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setSkillsState(prev => prev.filter(item => item !== skill))
  }

  const addRole = (roleToAdd) => {
    const value = (roleToAdd ?? roleInput).trim()
    if (!value) return
    setEditingRoles(prev => (prev.includes(value) ? prev : [...prev, value]))
    setRoleInput('')
  }

  const removeRole = (role) => {
    setEditingRoles(prev => prev.filter(item => item !== role))
  }

  const handleRolesModalOpen = () => {
    setEditingRoles([...rolesState]) // Copy current roles to temp state
    setIsRolesModalOpen(true)
  }

  const handleRolesModalClose = () => {
    setEditingRoles([]) // Discard changes
    setRoleInput('')
    setIsRolesModalOpen(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    navigate('/')
  }
  
  // Load trending market data
  useEffect(() => {
    const loadTrendingData = async () => {
      try {
        setTrendingLoading(true)
        setTrendingError(null)
        
        const result = await marketService.getTrendingData({ days: 30, skills_limit: 10 })
        
        if (result.success) {
          setTrendingData(result.data)
          // Calculate market score based on total jobs analyzed
          const score = result.data.total_jobs_analyzed > 0 
            ? Math.min(Math.round(result.data.total_jobs_analyzed / 10), 100)
            : 0
          setMarketScore(score)
        } else {
          setTrendingError(result.error || 'Failed to load market data')
        }
      } catch (error) {
        console.error('Error loading trending data:', error)
        setTrendingError('Failed to load market data')
      } finally {
        setTrendingLoading(false)
      }
    }
    
    loadTrendingData()
  }, [])
  
  // Load skill gap analysis for user's target roles
  const targetRolesKey = useMemo(() => (user?.target_roles || []).join('|'), [user?.target_roles])
  const primaryRole = user?.target_roles?.[0] || null

  useEffect(() => {
    let isCancelled = false

    const loadGapAnalysis = async () => {
      if (!user?.target_roles || user.target_roles.length === 0) {
        setGapAnalysisData({})
        setGapAnalysisError(null)
        setGapAnalysisLoading(false)
        return
      }

      setGapAnalysisLoading(true)
      setGapAnalysisError(null)

      for (let attempt = 0; attempt < GAP_ANALYSIS_MAX_RETRIES; attempt += 1) {
        if (isCancelled) {
          return
        }

        try {
          const analysisResults = await Promise.all(
            user.target_roles.map(async (role) => {
              const result = await skillsService.getSkillGapAnalysis(role, { days: 90 })
              return { role, result }
            })
          )

          if (isCancelled) {
            return
          }

          const successfulAnalyses = analysisResults.filter(({ result }) => result.success)

          if (successfulAnalyses.length > 0) {
            const newGapData = successfulAnalyses.reduce((acc, { role, result }) => {
              acc[role] = result.data
              return acc
            }, {})

            setGapAnalysisData(newGapData)
            setGapAnalysisError(null)
            setGapAnalysisLoading(false)
            return
          }

          if (attempt === GAP_ANALYSIS_MAX_RETRIES - 1) {
            const firstResult = analysisResults[0]?.result
            if (firstResult?.error?.detail) {
              const errorDetail = firstResult.error.detail
              if (typeof errorDetail === 'object' && errorDetail.message) {
                setGapAnalysisError({
                  message: errorDetail.message,
                  suggestions: errorDetail.suggestions || [],
                  alternatives: errorDetail.alternatives || []
                })
              } else {
                setGapAnalysisError({ message: errorDetail })
              }
            } else if (firstResult?.error) {
              setGapAnalysisError({ message: firstResult.error })
            } else {
              setGapAnalysisError({ message: 'No skill gap data available for your target roles yet. Please try again shortly.' })
            }

            setGapAnalysisData({})
            setGapAnalysisLoading(false)
            return
          }
        } catch (error) {
          console.error('Error loading gap analysis:', error)

          if (attempt === GAP_ANALYSIS_MAX_RETRIES - 1) {
            if (!isCancelled) {
              setGapAnalysisError({
                message: 'Failed to load skill gap analysis. Please check your internet connection and try again.'
              })
              setGapAnalysisData({})
              setGapAnalysisLoading(false)
            }
            return
          }
        }

        await new Promise((resolve) => setTimeout(resolve, GAP_ANALYSIS_RETRY_DELAY_MS))
      }
    }

    if (user) {
      loadGapAnalysis()
    }

    return () => {
      isCancelled = true
    }
  }, [user, targetRolesKey])
  
  const handleViewDetailedReport = () => {
    navigate('/skill-gap-report')
  }

  const getExperienceLevelLabel = (level) => {
    const experienceLevel = EXPERIENCE_LEVELS.find(exp => exp.value === level)
    return experienceLevel ? experienceLevel.label : level
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-950">
      {/* Header */}
      <header className="bg-primary-900 border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gradient">Career Navigator</h1>
              </div>
            </div>

            {/* Profile Overview in Navbar */}
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{user?.full_name || 'User'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">{user?.location || 'Not set'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">{user?.experience_level ? getExperienceLevelLabel(user.experience_level) : 'Not set'}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditProfileOpen(true)}
                className="text-gray-400 hover:text-white flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                loading={isLoggingOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          className="mb-12"
          variants={ANIMATION_VARIANTS.fadeIn}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-4xl font-bold text-white mb-3">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
          </h2>
          <p className="text-lg text-gray-400">
            Ready to advance your career? Let's explore your opportunities.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          variants={ANIMATION_VARIANTS.fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <Card hover className="p-8 bg-primary-800">
            <div className="flex items-center">
              <div className="p-2 bg-accent-500/10 rounded-lg">
                <Target className="w-6 h-6 text-accent-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Target Roles</p>
                <p className="text-2xl font-bold text-white">
                  {user?.target_roles?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card hover className="p-8 bg-primary-800">
            <div className="flex items-center">
              <div className="p-2 bg-highlight-500/10 rounded-lg">
                <Briefcase className="w-6 h-6 text-highlight-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Skills</p>
                <p className="text-2xl font-bold text-white">
                  {user?.skills?.length ? normalizeUserSkills(user.skills).length : 0}
                </p>
              </div>
            </div>
          </Card>

          <Card hover className="p-8 bg-primary-800">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Market Score</p>
                <p className="text-2xl font-bold text-white">
                  {trendingLoading ? '--' : marketScore}
                </p>
              </div>
            </div>
          </Card>

          <Card hover className="p-8 bg-primary-800">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Coverage</p>
                <p className="text-2xl font-bold text-white">
                  {(() => {
                    const coverage = Object.values(gapAnalysisData)[0]?.coverage_percentage
                    return gapAnalysisLoading ? '--' : (coverage != null ? `${coverage.toFixed(0)}%` : '--')
                  })()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Access Navigation */}
        <motion.div
          className="mb-12"
          variants={ANIMATION_VARIANTS.fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-white mb-6">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              className="bg-gradient-to-r from-teal-500/10 to-teal-600/10 border border-teal-500/20 rounded-lg p-6 cursor-pointer hover:border-teal-500/40 transition-all duration-200"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/learning-roadmap')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <GraduationCap className="w-6 h-6 text-teal-400" />
                    <h4 className="text-lg font-semibold text-white">Learning Roadmap</h4>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Get personalized learning paths based on your skill gaps
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-teal-400" />
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-gold-500/10 to-gold-600/10 border border-gold-500/20 rounded-lg p-6 cursor-pointer hover:border-gold-500/40 transition-all duration-200"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/project-recommendations')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <Code className="w-6 h-6 text-gold-400" />
                    <h4 className="text-lg font-semibold text-white">Project Ideas</h4>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Discover projects that match your skills and interests
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gold-400" />
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6 cursor-pointer hover:border-blue-500/40 transition-all duration-200"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/skill-gap-report')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                    <h4 className="text-lg font-semibold text-white">Skill Analysis</h4>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Detailed analysis of your skill gaps and market demand
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-400" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Skills Section - Full Width */}
        <motion.div
          className="mb-8"
          variants={ANIMATION_VARIANTS.slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <Card className="p-8 bg-primary-800">
              <Card.Header className="p-0 pb-6">
                <Card.Title className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Briefcase className="w-6 h-6 mr-3 text-highlight-500" />
                    <span className="text-xl font-bold">Your Skills</span>
                  </span>
                  <Button variant="ghost" size="md" onClick={() => setIsSkillsModalOpen(true)} className="hover:bg-primary-700">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Card.Title>
              </Card.Header>
              
              {user?.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {normalizeUserSkills(user.skills).map((skill, index) => (
                    <motion.span
                      key={skill}
                      className="px-4 py-2 bg-accent-500/10 text-accent-400 rounded-lg text-sm font-medium border border-accent-500/20 hover:bg-accent-500/20 transition-colors"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No skills added yet</p>
                  <Button variant="outline" size="sm" onClick={() => setIsSkillsModalOpen(true)}>
                    Add Skills
                  </Button>
                </div>
              )}
          </Card>
        </motion.div>

        {/* Target Roles Section - Full Width */}
        <motion.div
          className="mb-12"
          variants={ANIMATION_VARIANTS.slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <Card className="p-8 bg-primary-800">
              <Card.Header className="p-0 pb-6">
                <Card.Title className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Target className="w-6 h-6 mr-3 text-highlight-500" />
                    <span className="text-xl font-bold">Target Roles</span>
                  </span>
                  <Button variant="ghost" size="md" onClick={handleRolesModalOpen} className="hover:bg-primary-700">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Card.Title>
              </Card.Header>
              
              {user?.target_roles && user.target_roles.length > 0 ? (
                <div className="space-y-3">
                  {user.target_roles.map((role, index) => (
                    <motion.div
                      key={role}
                      className="flex items-center justify-between p-4 bg-primary-900/50 rounded-lg border border-primary-700 hover:border-primary-600 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="text-white font-semibold text-base">{role}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No target roles selected</p>
                  <Button variant="outline" size="sm" onClick={handleRolesModalOpen}>
                    Add Target Roles
                  </Button>
                </div>
              )}
          </Card>
        </motion.div>

        {/* Market Pulse */}
        <motion.div
          className="mb-12"
          variants={ANIMATION_VARIANTS.slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <Card className="p-8 bg-primary-800">
            <Card.Header className="p-0 pb-6">
              <Card.Title className="flex items-center justify-between">
                <span className="flex items-center">
                  <PieChart className="w-6 h-6 mr-3 text-blue-500" />
                  <span className="text-xl font-bold">Market Pulse</span>
                </span>
                <div className="text-sm text-gray-400 font-medium">
                  {trendingData && `${trendingData.total_jobs_analyzed} jobs analyzed`}
                </div>
              </Card.Title>
            </Card.Header>

            <div className="h-[400px]">
              <TrendingSkillsChart
                data={trendingData?.top_skills || []}
                loading={trendingLoading}
                error={trendingError}
                title="Top Skills in Demand"
                height={400}
              />
            </div>

            {trendingData && trendingData.top_skills?.length > 0 && (
              <div className="mt-6 p-5 bg-primary-900/50 rounded-lg">
                <p className="text-base font-semibold text-gray-300 mb-3">Market Insights</p>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-accent-400 font-medium">Most Demanded:</span>
                    <span className="text-gray-300 font-semibold">
                      {trendingData.top_skills[0]?.skill} ({trendingData.top_skills[0]?.percentage?.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-highlight-400 font-medium">Analysis Period:</span>
                    <span className="text-gray-300 font-semibold">
                      Last {trendingData.window_days} days
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Skill Gap Analysis */}
        <motion.div
          variants={ANIMATION_VARIANTS.slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.7 }}
        >
          {user?.target_roles && user.target_roles.length > 0 ? (
            <Card className="p-8 bg-primary-800">
              <Card.Header className="p-0 pb-6">
                <Card.Title className="flex items-center justify-between">
                  <span className="flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-green-500" />
                    <span className="text-xl font-bold">Skill Gap Analysis</span>
                    {primaryRole && (
                      <span className="ml-3 text-sm text-gray-400">Role: {primaryRole}</span>
                    )}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="md"
                    onClick={handleViewDetailedReport}
                    className="text-accent-400 hover:text-accent-300 hover:bg-primary-700"
                  >
                    <span className="text-sm font-medium">View Report</span>
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Card.Title>
              </Card.Header>

              <div className="h-auto min-h-[500px]">
                {Object.keys(gapAnalysisData).length > 0 ? (
                  <SkillGapChart
                    data={Object.values(gapAnalysisData)[0]}
                    loading={gapAnalysisLoading}
                    error={gapAnalysisError}
                    title="Skills Analysis"
                    role={primaryRole || 'Target Role'}
                    height={Math.max(500, (Object.values(gapAnalysisData)[0]?.required_skills?.length || 10) * 35)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {gapAnalysisLoading ? (
                      <div className="text-center space-y-4">
                        <LoadingSpinner size="lg" />
                        <div>
                          <p className="text-white font-medium">Analyzing your skills...</p>
                          <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
                          <p className="text-gray-500 text-xs mt-1">Analyzing job market data for your target roles</p>
                        </div>
                      </div>
                    ) : gapAnalysisError ? (
                      <div className="text-center max-w-md px-4">
                        <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-400 font-medium mb-2">
                          {typeof gapAnalysisError === 'object' ? gapAnalysisError.message : gapAnalysisError}
                        </p>
                        {typeof gapAnalysisError === 'object' && gapAnalysisError.suggestions && gapAnalysisError.suggestions.length > 0 && (
                          <div className="mt-4 text-left bg-primary-900/50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-300 mb-2">Suggestions:</p>
                            <ul className="text-xs text-gray-400 space-y-1">
                              {gapAnalysisError.suggestions.map((suggestion, idx) => (
                                <li key={idx}>• {suggestion}</li>
                              ))}
                            </ul>
                            {gapAnalysisError.alternatives && gapAnalysisError.alternatives.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-300 mb-2">Try these roles:</p>
                                <div className="flex flex-wrap gap-2">
                                  {gapAnalysisError.alternatives.map((alt, idx) => (
                                    <span key={idx} className="text-xs bg-primary-800 text-accent-400 px-2 py-1 rounded">
                                      {alt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Add target roles to see skill gap analysis</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {Object.values(gapAnalysisData)[0] && (
                <div className="mt-6 p-5 bg-primary-900/50 rounded-lg">
                  <p className="text-base font-semibold text-gray-300 mb-3">Quick Insights</p>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 font-medium">Skills Coverage:</span>
                      <span className="text-gray-300 font-semibold">
                        {Object.values(gapAnalysisData)[0].coverage_percentage?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-medium">Skills to Learn:</span>
                      <span className="text-gray-300 font-semibold">
                        {Object.values(gapAnalysisData)[0].missing_skills?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 font-medium">Jobs Analyzed:</span>
                      <span className="text-gray-300 font-semibold">
                        {Object.values(gapAnalysisData)[0].total_postings_analyzed || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8 bg-primary-800">
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Add target roles to see skill gap analysis</p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </main>

      <Modal
        title="Edit Profile"
        open={isEditProfileOpen}
        onClose={() => !saving && setIsEditProfileOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Full Name</label>
            <Input
              value={formState.full_name}
              onChange={(e) => setFormState(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Academic Level</label>
            <select
              className="w-full bg-primary-800 border border-primary-600 rounded-lg px-3 py-2 text-white"
              value={formState.experience_level || ''}
              onChange={(e) => setFormState(prev => ({ ...prev, experience_level: e.target.value }))}
            >
              <option value="">Select academic level</option>
              <option value="12th Pass Out">12th Pass Out</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Location</label>
            <Input
              value={formState.location || ''}
              onChange={(e) => setFormState(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, Country"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => !saving && setIsEditProfileOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleProfileSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <SkillsModal
        title="Manage Skills"
        open={isSkillsModalOpen}
        onClose={() => !saving && setIsSkillsModalOpen(false)}
        items={skillsState}
        onAdd={addSkill}
        onRemove={removeSkill}
        onSave={handleSkillsSave}
        inputValue={skillInput}
        onInputChange={setSkillInput}
        suggestions={COMMON_SKILLS}
        saving={saving}
      />

      <SkillsModal
        title="Manage Target Roles"
        open={isRolesModalOpen}
        onClose={() => !saving && handleRolesModalClose()}
        items={editingRoles}
        onAdd={addRole}
        onRemove={removeRole}
        onSave={handleRolesSave}
        inputValue={roleInput}
        onInputChange={(value, { fromSuggestion } = {}) => {
          if (fromSuggestion) {
            addRole(value)
          } else {
            setRoleInput(value)
          }
        }}
        suggestions={COMMON_ROLES}
        saving={saving}
        inputPlaceholder="Enter a role (e.g., Frontend Developer)"
      />
    </div>
  )
}

export default Dashboard
