import { api, handleApiResponse } from './api'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Market Analysis Service
 * 
 * Provides functions to interact with market analysis endpoints
 * for trending skills and location data.
 */

/**
 * Get trending market data including skills and locations
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.days - Number of days to analyze (default: 30)
 * @param {number} params.skills_limit - Maximum trending skills to return (default: 15)
 * @param {number} params.locations_limit - Maximum trending locations to return (default: 10)
 * @returns {Promise<Object>} API response with trending data
 * 
 * @example
 * const result = await getTrendingData({ days: 30, skills_limit: 10 })
 * if (result.success) {
 *   console.log('Top skills:', result.data.top_skills)
 *   console.log('Top locations:', result.data.top_locations)
 * }
 */
export const getTrendingData = async (params = {}) => {
  return handleApiResponse(async () => {
    const queryParams = new URLSearchParams()
    
    // Add query parameters if provided
    if (params.days !== undefined) {
      queryParams.append('days', params.days)
    }
    if (params.skills_limit !== undefined) {
      queryParams.append('skills_limit', params.skills_limit)
    }
    if (params.locations_limit !== undefined) {
      queryParams.append('locations_limit', params.locations_limit)
    }
    
    const queryString = queryParams.toString()
    const url = `${API_ENDPOINTS.MARKET.TRENDING}${queryString ? `?${queryString}` : ''}`
    
    return api.get(url)
  })
}

/**
 * Get trending skills data only
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.days - Number of days to analyze (default: 30)
 * @param {number} params.limit - Maximum skills to return (default: 15)
 * @returns {Promise<Object>} API response with trending skills
 */
export const getTrendingSkills = async (params = {}) => {
  const result = await getTrendingData({
    days: params.days,
    skills_limit: params.limit,
    locations_limit: 1 // Minimize locations data
  })
  
  if (result.success) {
    return {
      ...result,
      data: {
        ...result.data,
        top_skills: result.data.top_skills
      }
    }
  }
  
  return result
}

/**
 * Get trending locations data only
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.days - Number of days to analyze (default: 30)
 * @param {number} params.limit - Maximum locations to return (default: 10)
 * @returns {Promise<Object>} API response with trending locations
 */
export const getTrendingLocations = async (params = {}) => {
  const result = await getTrendingData({
    days: params.days,
    skills_limit: 1, // Minimize skills data
    locations_limit: params.limit
  })
  
  if (result.success) {
    return {
      ...result,
      data: {
        ...result.data,
        top_locations: result.data.top_locations
      }
    }
  }
  
  return result
}

/**
 * Transform trending data for chart consumption
 * 
 * @param {Array} trendingData - Array of trending items with count/percentage
 * @param {string} labelKey - Key to use for labels (default: 'skill')
 * @param {string} valueKey - Key to use for values (default: 'count')
 * @returns {Object} Chart-ready data object
 */
export const transformDataForChart = (trendingData, labelKey = 'skill', valueKey = 'count') => {
  if (!Array.isArray(trendingData) || trendingData.length === 0) {
    return {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1
      }]
    }
  }
  
  // Color palette for charts (dark theme compatible)
  const colors = [
    '#4FD1C5', // Teal
    '#F6E05E', // Gold
    '#68D391', // Green
    '#63B3ED', // Blue
    '#F687B3', // Pink
    '#FBB6CE', // Light Pink
    '#9F7AEA', // Purple
    '#FEB2B2', // Light Red
    '#C6F6D5', // Light Green
    '#BEE3F8', // Light Blue
    '#FEEBC8', // Light Orange
    '#E9D8FD', // Light Purple
    '#FED7D7', // Very Light Red
    '#C6F6D5', // Very Light Green
    '#DBEAFE'  // Very Light Blue
  ]
  
  const labels = trendingData.map(item => item[labelKey])
  const data = trendingData.map(item => item[valueKey])
  const backgroundColor = trendingData.map((_, index) => colors[index % colors.length])
  const borderColor = backgroundColor.map(color => color)
  
  return {
    labels,
    datasets: [{
      data,
      backgroundColor,
      borderColor,
      borderWidth: 1
    }]
  }
}

// Default export for convenience
export default {
  getTrendingData,
  getTrendingSkills,
  getTrendingLocations,
  transformDataForChart
}
