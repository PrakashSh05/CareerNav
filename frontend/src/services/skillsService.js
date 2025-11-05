import { api, handleApiResponse } from './api'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Skills Analysis Service
 * 
 * Provides functions to interact with skills analysis endpoints
 * for skill gap analysis and career recommendations.
 */

/**
 * Get skill gap analysis for a specific role
 * 
 * @param {string} role - Target role to analyze (required)
 * @param {Object} params - Query parameters
 * @param {number} params.days - Number of days to analyze job postings (default: 30)
 * @param {number} params.threshold - Minimum percentage of jobs requiring skill (default: 0.25)
 * @returns {Promise<Object>} API response with skill gap analysis
 * 
 * @example
 * const result = await getSkillGapAnalysis('Software Engineer', { days: 30 })
 * if (result.success) {
 *   console.log('Coverage:', result.data.coverage_percentage)
 *   console.log('Missing skills:', result.data.missing_skills)
 * }
 */
export const getSkillGapAnalysis = async (role, params = {}) => {
  if (!role || typeof role !== 'string') {
    return {
      success: false,
      error: 'Role parameter is required and must be a string',
      status: 400
    }
  }

  return handleApiResponse(async () => {
    const queryParams = new URLSearchParams()
    
    // Add required role parameter
    queryParams.append('role', role)
    
    // Add optional query parameters
    if (params.days !== undefined) {
      queryParams.append('days', params.days)
    }
    if (params.threshold !== undefined) {
      queryParams.append('threshold', params.threshold)
    }
    
    const queryString = queryParams.toString()
    const url = `${API_ENDPOINTS.SKILLS.GAP_ANALYSIS}?${queryString}`
    
    return api.get(url)
  })
}

/**
 * Get skill gap analysis for multiple roles
 * 
 * @param {Array<string>} roles - Array of target roles to analyze
 * @param {Object} params - Query parameters for each analysis
 * @returns {Promise<Array>} Array of skill gap analysis results
 */
export const getMultipleSkillGapAnalysis = async (roles, params = {}) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return []
  }

  try {
    // Execute all analyses in parallel
    const analysisPromises = roles.map(role => 
      getSkillGapAnalysis(role, params)
    )
    
    const results = await Promise.all(analysisPromises)
    
    // Filter successful results and add role context
    return results.map((result, index) => ({
      role: roles[index],
      ...result
    }))
  } catch (error) {
    console.error('Error getting multiple skill gap analyses:', error)
    return roles.map(role => ({
      role,
      success: false,
      error: 'Failed to analyze skill gap',
      status: 500
    }))
  }
}

export const transformGapDataForChart = (gapAnalysis) => {
  if (!gapAnalysis || !gapAnalysis.required_skills || !Array.isArray(gapAnalysis.required_skills)) {
    return {
      labels: [],
      datasets: []
    };
  }

  // Sort skills by percentage (descending) and take top 10
  const sortedSkills = [...gapAnalysis.required_skills]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);

  // Format labels to be more readable
  const formatLabel = (text) => {
    if (!text) return '';
    return String(text)
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Use technology_slug if available, otherwise fall back to skill
  const labels = sortedSkills.map(skill => 
    formatLabel(skill.technology_slug || skill.skill || '')
  );
  
  // Separate skills user has vs doesn't have
  const userHasData = sortedSkills.map(skill => skill.user_has ? skill.percentage : 0);
  const userMissingData = sortedSkills.map(skill => !skill.user_has ? skill.percentage : 0);

  return {
    labels,
    datasets: [
      {
        label: 'Skills You Have',
        data: userHasData,
        backgroundColor: '#4FD1C5',
        borderColor: '#38B2AC',
      },
      {
        label: 'Skills to Learn',
        data: userMissingData,
        backgroundColor: '#F6E05E',
        borderColor: '#D69E2E',
      }
    ]
  };
};
/**
 * Calculate skill gap summary statistics
 * 
 * @param {Object} gapAnalysis - Skill gap analysis response data
 * @returns {Object} Summary statistics
 */
export const calculateGapSummary = (gapAnalysis) => {
  if (!gapAnalysis) {
    return {
      totalSkills: 0,
      skillsHave: 0,
      skillsMissing: 0,
      coveragePercentage: 0,
      topMissingSkills: [],
      strongestSkills: []
    }
  }

  const requiredSkills = gapAnalysis.required_skills || []
  const skillsHave = requiredSkills.filter(skill => skill.user_has)
  const skillsMissing = requiredSkills.filter(skill => !skill.user_has)
  
  // Sort missing skills by demand (required_percentage)
  const topMissingSkills = skillsMissing
    .sort((a, b) => b.required_percentage - a.required_percentage)
    .slice(0, 5)
    .map(skill => ({
      name: skill.skill,
      demand: skill.required_percentage
    }))
  
  // Sort skills user has by demand
  const strongestSkills = skillsHave
    .sort((a, b) => b.required_percentage - a.required_percentage)
    .slice(0, 5)
    .map(skill => ({
      name: skill.skill,
      demand: skill.required_percentage
    }))

  return {
    totalSkills: requiredSkills.length,
    skillsHave: skillsHave.length,
    skillsMissing: skillsMissing.length,
    coveragePercentage: gapAnalysis.coverage_percentage || 0,
    topMissingSkills,
    strongestSkills
  }
}

/**
 * Generate learning recommendations based on skill gaps
 * 
 * @param {Object} gapAnalysis - Skill gap analysis response data
 * @param {number} maxRecommendations - Maximum number of recommendations (default: 3)
 * @returns {Array} Array of learning recommendations
 */
export const generateLearningRecommendations = (gapAnalysis, maxRecommendations = 3) => {
  if (!gapAnalysis || !gapAnalysis.required_skills) {
    return []
  }

  const missingSkills = gapAnalysis.required_skills
    .filter(skill => !skill.user_has)
    .sort((a, b) => b.required_percentage - a.required_percentage)
    .slice(0, maxRecommendations)

  return missingSkills.map(skill => ({
    skill: skill.skill,
    priority: skill.required_percentage >= 50 ? 'High' : skill.required_percentage >= 25 ? 'Medium' : 'Low',
    demand: skill.required_percentage,
    reason: `Required by ${skill.required_percentage.toFixed(1)}% of ${gapAnalysis.role} positions`,
    suggestedAction: generateSkillAction(skill.skill)
  }))
}

/**
 * Generate suggested learning action for a skill
 * 
 * @param {string} skillName - Name of the skill
 * @returns {string} Suggested learning action
 */
const generateSkillAction = (skillName) => {
  const skill = skillName.toLowerCase()
  
  // Programming languages
  if (['python', 'javascript', 'java', 'typescript', 'go', 'rust'].includes(skill)) {
    return 'Complete online tutorials and build practice projects'
  }
  
  // Frameworks
  if (['react', 'vue', 'angular', 'django', 'flask', 'spring'].includes(skill)) {
    return 'Follow official documentation and create sample applications'
  }
  
  // Cloud platforms
  if (['aws', 'azure', 'gcp', 'google cloud'].includes(skill)) {
    return 'Pursue cloud certification and hands-on labs'
  }
  
  // DevOps tools
  if (['docker', 'kubernetes', 'jenkins', 'terraform'].includes(skill)) {
    return 'Set up local development environment and practice deployments'
  }
  
  // Databases
  if (['sql', 'postgresql', 'mysql', 'mongodb'].includes(skill)) {
    return 'Practice with sample datasets and database design exercises'
  }
  
  // Default recommendation
  return 'Find relevant courses, tutorials, or certification programs'
}

/**
 * Normalize skill names using the same canonical mapping as the backend
 * 
 * @param {string} skillName - The skill name to normalize
 * @returns {string} Canonical skill name
 */
export const normalizeSkillName = (skillName) => {
  if (!skillName || typeof skillName !== 'string') {
    return skillName
  }

  const skill = skillName.toLowerCase().trim()

  // Same canonical mapping as backend
  const canonicalMap = {
    'cpp': 'c++',
    'csharp': 'c#',
    'dotnet': '.net',
    'aspnet': 'asp.net',
    'sqlserver': 'sql server',
    'node-js': 'nodejs',
    'js': 'javascript',
    'ts': 'typescript',
  }

  return canonicalMap[skill] || skill
}

/**
 * Normalize array of user skills for consistent comparison
 * 
 * @param {Array<string>} userSkills - Array of user skill names
 * @returns {Array<string>} Normalized skill names
 */
export const normalizeUserSkills = (userSkills) => {
  if (!Array.isArray(userSkills)) {
    return []
  }

  return userSkills.map(skill => normalizeSkillName(skill)).filter(Boolean)
}

// Default export for convenience
export default {
  getSkillGapAnalysis,
  getMultipleSkillGapAnalysis,
  transformGapDataForChart,
  calculateGapSummary,
  generateLearningRecommendations,
  normalizeSkillName,
  normalizeUserSkills
}
