import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Download,
  Filter,
  Target,
  TrendingUp,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { SkillGapChart } from '../components/charts'
import { useAuth } from '../hooks/useAuth'
import skillsService from '../services/skillsService'
import { ANIMATION_VARIANTS } from '../utils/constants'

const SkillGapReport = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // State management
  const [selectedRole, setSelectedRole] = useState('')
  const [analysisData, setAnalysisData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysisParams, setAnalysisParams] = useState({
    days: 30,
    threshold: 0.25
  })

  // Initialize with first target role
  useEffect(() => {
    if (user?.target_roles && user.target_roles.length > 0 && !selectedRole) {
      setSelectedRole(user.target_roles[0])
    }
  }, [user, selectedRole])

  // Load analysis data when role or params change
  useEffect(() => {
    if (selectedRole) {
      loadAnalysisData()
    }
  }, [selectedRole, analysisParams])

  const loadAnalysisData = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await skillsService.getSkillGapAnalysis(selectedRole, analysisParams)

      if (result.success) {
        setAnalysisData({
          [selectedRole]: result.data
        })
      } else {
        // Enhanced error handling with structured error details
        const errorDetail = result.error?.detail || result.error
        if (typeof errorDetail === 'object' && errorDetail.message) {
          setError({
            message: errorDetail.message,
            suggestions: errorDetail.suggestions || [],
            alternatives: errorDetail.alternatives || []
          })
        } else {
          setError({ message: errorDetail || 'Failed to load skill gap analysis' })
        }
      }
    } catch (err) {
      console.error('Error loading analysis:', err)
      setError({ 
        message: 'Failed to load skill gap analysis. Please check your internet connection and try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (role) => {
    setSelectedRole(role)
  }

  const handleParamChange = (param, value) => {
    setAnalysisParams(prev => ({
      ...prev,
      [param]: value
    }))
  }

  const handleExportReport = () => {
    // TODO: Implement export functionality
    console.log('Export report for:', selectedRole)
  }

  const currentAnalysis = analysisData[selectedRole]
  const summary = currentAnalysis ? skillsService.calculateGapSummary(currentAnalysis) : null
  const recommendations = currentAnalysis ? skillsService.generateLearningRecommendations(currentAnalysis, 5) : []

  // Redirect if user has no target roles
  if (user && (!user.target_roles || user.target_roles.length === 0)) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Target Roles</h2>
          <p className="text-gray-400 mb-6">
            You need to set target roles before viewing skill gap analysis.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-[#FEE715]" />
              <h1 className="text-3xl font-bold text-white">Skill Gap Analysis Report</h1>
            </div>
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-md font-semibold text-gray-200 border border-primary-700 hover:border-[#FEE715]/50 hover:text-white hover:bg-[#101820] transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </motion.button>
          </div>
          <p className="text-gray-400">
            Understand your strengths and close the gaps for {selectedRole || 'your target role'}.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="mb-8"
          variants={ANIMATION_VARIANTS.fadeIn}
          initial="initial"
          animate="animate"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Role Selector */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Target Role
              </h3>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full bg-primary-800 border border-primary-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                {user?.target_roles?.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </Card>

            {/* Time Window */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Analysis Period
              </h3>
              <select
                value={analysisParams.days}
                onChange={(e) => handleParamChange('days', parseInt(e.target.value))}
                className="w-full bg-primary-800 border border-primary-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </Card>

            {/* Threshold */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Skill Threshold
              </h3>
              <select
                value={analysisParams.threshold}
                onChange={(e) => handleParamChange('threshold', parseFloat(e.target.value))}
                className="w-full bg-primary-800 border border-primary-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value={0.1}>10% of jobs</option>
                <option value={0.25}>25% of jobs</option>
                <option value={0.5}>50% of jobs</option>
                <option value={0.75}>75% of jobs</option>
              </select>
            </Card>
          </div>
        </motion.div>

        {/* Summary Cards */}
        {summary && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            variants={ANIMATION_VARIANTS.fadeIn}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-accent-400 mb-2">
                {summary.coveragePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Skills Coverage</div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {summary.skillsHave}
              </div>
              <div className="text-sm text-gray-400">Skills You Have</div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">
                {summary.skillsMissing}
              </div>
              <div className="text-sm text-gray-400">Skills to Learn</div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-gray-300 mb-2">
                {summary.totalSkills}
              </div>
              <div className="text-sm text-gray-400">Total Required</div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Chart */}
          <motion.div
            className="xl:col-span-2"
            variants={ANIMATION_VARIANTS.slideUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <Card.Header className="p-0 pb-4">
                <Card.Title className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
                  Detailed Skills Analysis - {selectedRole}
                </Card.Title>
              </Card.Header>

              <div className="h-[600px]">
                <SkillGapChart
                  data={currentAnalysis}
                  loading={loading}
                  error={error}
                  title="Skills Breakdown"
                  role={selectedRole}
                  height={600}
                />
              </div>

              {currentAnalysis && (
                <div className="mt-6 p-4 bg-primary-900/50 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Analysis Details:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-blue-400">Jobs Analyzed:</span>
                      <span className="ml-2 text-gray-300">
                        {currentAnalysis.total_postings_analyzed}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-400">Time Period:</span>
                      <span className="ml-2 text-gray-300">
                        Last {analysisParams.days} days
                      </span>
                    </div>
                    <div>
                      <span className="text-yellow-400">Skill Threshold:</span>
                      <span className="ml-2 text-gray-300">
                        {(analysisParams.threshold * 100).toFixed(0)}% of jobs
                      </span>
                    </div>
                    <div>
                      <span className="text-green-400">Match Rate:</span>
                      <span className="ml-2 text-gray-300">
                        {currentAnalysis.skill_match_count}/{currentAnalysis.total_required_skills}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Learning Recommendations */}
          <motion.div
            className="xl:col-span-1"
            variants={ANIMATION_VARIANTS.slideUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <Card.Header className="p-0 pb-4">
                <Card.Title className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                  Learning Recommendations
                </Card.Title>
              </Card.Header>

              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={rec.skill}
                      className="p-4 bg-primary-900/50 rounded-lg border border-primary-700"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{rec.skill}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          rec.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                          rec.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{rec.reason}</p>
                      <p className="text-xs text-gray-300">{rec.suggestedAction}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    Great! You have all the key skills for this role.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Bottom Skill Highlights */}
        {(summary?.topMissingSkills?.length || summary?.strongestSkills?.length) && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8"
            variants={ANIMATION_VARIANTS.slideUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.7 }}
          >
            {summary?.topMissingSkills && summary.topMissingSkills.length > 0 && (
              <Card className="p-6 h-full">
                <Card.Header className="p-0 pb-4">
                  <Card.Title className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
                    High-Demand Missing Skills
                  </Card.Title>
                </Card.Header>

                <div className="space-y-3">
                  {summary.topMissingSkills.map((skill) => (
                    <div key={skill.name} className="flex items-center justify-between">
                      <span className="text-white text-sm">{skill.name}</span>
                      <span className="text-xs text-gray-400">
                        {skill.demand.toFixed(1)}% demand
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {summary?.strongestSkills && summary.strongestSkills.length > 0 && (
              <Card className="p-6 h-full">
                <Card.Header className="p-0 pb-4">
                  <Card.Title className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Your Strongest Skills
                  </Card.Title>
                </Card.Header>

                <div className="space-y-3">
                  {summary.strongestSkills.map((skill) => (
                    <div key={skill.name} className="flex items-center justify-between">
                      <span className="text-white text-sm">{skill.name}</span>
                      <span className="text-xs text-gray-400">
                        {skill.demand.toFixed(1)}% demand
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SkillGapReport
