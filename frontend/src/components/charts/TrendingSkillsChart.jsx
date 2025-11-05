import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import LoadingSpinner from '../ui/LoadingSpinner'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title)

/**
 * TrendingSkillsChart Component
 * 
 * Displays trending skills data in an interactive doughnut chart
 * with dark theme styling and smooth animations.
 */
const TrendingSkillsChart = ({ 
  data, 
  loading = false, 
  error = null,
  title = "Trending Skills",
  height = 400 
}) => {
  const chartRef = useRef(null)

  // Chart configuration
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        color: '#F7FAFC', // Light text for dark theme
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      legend: {
        position: 'right',
        labels: {
          color: '#E2E8F0', // Light gray text
          font: {
            size: 12
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#2D3748', // Dark background
        titleColor: '#F7FAFC',
        bodyColor: '#E2E8F0',
        borderColor: '#4FD1C5',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const skill = context.label
            const count = context.parsed
            const percentage = context.dataset.percentages?.[context.dataIndex] || 0
            return `${skill}: ${count} jobs (${percentage.toFixed(1)}%)`
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  // Transform data for chart
  const chartData = React.useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
          percentages: []
        }]
      }
    }

    // Color palette optimized for dark theme
    const colors = [
      '#4FD1C5', // Primary teal
      '#F6E05E', // Gold
      '#68D391', // Green
      '#63B3ED', // Blue
      '#F687B3', // Pink
      '#9F7AEA', // Purple
      '#FBB6CE', // Light pink
      '#FEB2B2', // Light red
      '#C6F6D5', // Light green
      '#BEE3F8', // Light blue
      '#FEEBC8', // Light orange
      '#E9D8FD', // Light purple
      '#FED7D7', // Very light red
      '#DBEAFE', // Very light blue
      '#F0FFF4'  // Very light green
    ]

    const labels = data.map(item => item.skill)
    const counts = data.map(item => item.count)
    const percentages = data.map(item => item.percentage)
    const backgroundColor = data.map((_, index) => colors[index % colors.length])
    const borderColor = backgroundColor.map(color => color)

    return {
      labels,
      datasets: [{
        data: counts,
        backgroundColor,
        borderColor,
        borderWidth: 2,
        percentages,
        hoverBorderWidth: 3,
        hoverOffset: 8
      }]
    }
  }, [data])

  // Error state
  if (error) {
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
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Unable to Load Chart</h3>
        <p className="text-gray-400 text-sm max-w-md">
          {typeof error === 'string' ? error : 'There was an error loading the trending skills data. Please try again later.'}
        </p>
      </motion.div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center"
        style={{ height }}
      >
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 mt-4">Loading trending skills...</p>
      </motion.div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 text-center"
        style={{ height }}
      >
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">No Data Available</h3>
        <p className="text-gray-400 text-sm max-w-md">
          There's no trending skills data available for the selected time period. Try adjusting your filters or check back later.
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
      style={{ height }}
    >
      <div className="relative w-full h-full">
        <Doughnut
          ref={chartRef}
          data={chartData}
          options={options}
        />
      </div>
      
      {/* Data summary */}
      {data && data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <p className="text-sm text-gray-400">
            Showing top {data.length} skills from recent job postings
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default TrendingSkillsChart
