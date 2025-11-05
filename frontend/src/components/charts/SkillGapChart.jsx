import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import LoadingSpinner from '../ui/LoadingSpinner'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

/**
 * SkillGapChart Component
 * 
 * Displays skill gap analysis in an interactive horizontal bar chart
 * showing required skills vs user's current skills with coverage indicators.
 */
const SkillGapChart = ({ 
  data, 
  loading = false, 
  error = null,
  title = "Skill Gap Analysis",
  height = 400,
  role = "Target Role"
}) => {
  const chartRef = useRef(null)

  // Chart configuration
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
    layout: {
      padding: {
        left: 0,
        right: 20,
        top: 10,
        bottom: 10
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Top Skills in Demand',
        color: '#F7FAFC',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: {
          top: 0,
          bottom: 30
        },
        align: 'center'
      },
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#2D3748',
        titleColor: '#F7FAFC',
        bodyColor: '#E2E8F0',
        borderColor: '#FEE715',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return `Skill: ${context[0].label}`
          },
          label: function(context) {
            const datasetLabel = context.dataset.label
            const value = context.parsed.x
            const skillIndex = context.dataIndex
            const skillData = data?.required_skills?.[skillIndex]
            
            if (datasetLabel === 'Skills You Have' && value > 0) {
              return `✅ You have this skill (${value.toFixed(1)}% demand)`
            } else if (datasetLabel === 'Skills You Need' && value > 0) {
              return `❌ Missing skill (${value.toFixed(1)}% demand)`
            }
            return null
          },
          afterBody: function(context) {
            const skillIndex = context[0].dataIndex
            const skillData = data?.required_skills?.[skillIndex]
            if (skillData) {
              return [`Market demand: ${skillData.required_percentage.toFixed(1)}%`]
            }
            return []
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#6B7280',
          font: {
            size: 10
          },
          callback: function(value) {
            return value + '%'
          },
          stepSize: 10
        },
        grid: {
          color: '#1F2937',
          borderColor: '#374151',
          drawBorder: false
        },
        title: {
          display: false
        }
      },
      y: {
        stacked: false,
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
            weight: '500'
          },
          maxRotation: 0,
          padding: 10,
          autoSkip: false,
          callback: function(value, index) {
            const label = this.getLabelForValue(value)
            // Truncate if too long
            return label.length > 18 ? label.substring(0, 16) + '...' : label
          }
        },
        grid: {
          display: false,
          drawBorder: false
        },
        title: {
          display: false
        },
        offset: true
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  // Transform data for chart
  const chartData = React.useMemo(() => {
    if (!data || !data.required_skills || !Array.isArray(data.required_skills)) {
      return {
        labels: [],
        datasets: []
      }
    }

    // Sort by demand percentage (highest first) but show all skills
    const skills = data.required_skills
      .sort((a, b) => b.required_percentage - a.required_percentage)
    
    const labels = skills.map(skill => skill.skill)
    
    // Separate skills user has vs doesn't have
    const userHasData = skills.map(skill => 
      skill.user_has ? skill.required_percentage : 0
    )
    const userMissingData = skills.map(skill => 
      !skill.user_has ? skill.required_percentage : 0
    )

    return {
      labels,
      datasets: [
        {
          label: 'Skills You Have',
          data: userHasData,
          backgroundColor: '#10b981', // Green
          borderColor: '#10b981',
          borderWidth: 0,
          borderRadius: 5,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        },
        {
          label: 'Skills You Need',
          data: userMissingData,
          backgroundColor: '#F96167', // Coral for all missing skills
          borderColor: '#F96167',
          borderWidth: 0,
          borderRadius: 5,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        }
      ]
    }
  }, [data])

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    if (!data) return null

    return {
      coveragePercentage: data.coverage_percentage || 0,
      skillsHave: data.skill_match_count || 0,
      totalSkills: data.total_required_skills || 0,
      missingSkills: data.missing_skills?.length || 0
    }
  }, [data])

  // Error state with enhanced messaging
  if (error) {
    const errorMessage = typeof error === 'object' ? error.message : error
    const suggestions = typeof error === 'object' && error.suggestions ? error.suggestions : []
    const alternatives = typeof error === 'object' && error.alternatives ? error.alternatives : []

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 text-center"
        style={{ height }}
      >
        <div className="text-red-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Unable to Load Analysis</h3>
        <p className="text-gray-400 text-sm max-w-md mb-4">
          {errorMessage || 'There was an error loading the skill gap analysis. Please try again later.'}
        </p>
        
        {suggestions.length > 0 && (
          <div className="mt-4 text-left bg-primary-900/50 rounded-lg p-4 max-w-lg">
            <p className="text-sm font-medium text-gray-300 mb-2">💡 Suggestions:</p>
            <ul className="text-xs text-gray-400 space-y-1.5">
              {suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
            
            {alternatives.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-300 mb-2">🎯 Try these roles instead:</p>
                <div className="flex flex-wrap gap-2">
                  {alternatives.map((alt, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs bg-primary-800 text-accent-400 px-3 py-1.5 rounded-full font-medium hover:bg-primary-700 transition-colors cursor-pointer"
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    )
  }

  // Enhanced loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center space-y-4"
        style={{ height }}
      >
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-white font-medium">Analyzing Skill Gaps</p>
          <p className="text-gray-400 text-sm mt-2">Comparing your skills with market requirements</p>
          <p className="text-gray-500 text-xs mt-1">This may take a few seconds...</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
          <span>Processing {role} job market data</span>
        </div>
      </motion.div>
    )
  }

  // Empty state
  if (!data || !data.required_skills || data.required_skills.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 text-center"
        style={{ height }}
      >
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">No Analysis Available</h3>
        <p className="text-gray-400 text-sm max-w-md">
          There's insufficient data to perform skill gap analysis for this role. Try selecting a different role or check back later.
        </p>
      </motion.div>
    )
  }

  // Chart component
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full"
        style={{ height }}
      >
        <Bar
          ref={chartRef}
          data={chartData}
          options={options}
        />
      </motion.div>
    </motion.div>
  )
}

export default SkillGapChart
