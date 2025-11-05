import api from './api';
import { API_ENDPOINTS, DIFFICULTY_LEVELS } from '../utils/constants';

/**
 * Project Service - Handles all project-related API calls
 */
class ProjectService {
  /**
   * Get personalized project recommendations for the authenticated user
   * @param {Object} params - Query parameters
   * @param {string} [params.difficulty] - Filter by difficulty level
   * @param {Array<string>} [params.skill_focus] - Focus on specific skills
   * @param {number} [params.limit=10] - Maximum number of projects to return
   * @returns {Promise<Object>} Project recommendations response
   */
  async getProjectRecommendations(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.difficulty && Object.values(DIFFICULTY_LEVELS).includes(params.difficulty)) {
        queryParams.append('difficulty', params.difficulty);
      }
      
      if (params.skill_focus && Array.isArray(params.skill_focus)) {
        params.skill_focus.forEach(skill => {
          queryParams.append('skill_focus', skill);
        });
      }
      
      if (params.target_role) {
        queryParams.append('target_role', params.target_role);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      const url = `${API_ENDPOINTS.PROJECTS.RECOMMENDATIONS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      
      return this.transformRecommendationsResponse(response.data);
    } catch (error) {
      console.error('Error fetching project recommendations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get projects that help build specific skills
   * @param {Array<string>} skills - Skills to focus on building
   * @param {Object} params - Additional parameters
   * @param {string} [params.difficulty] - Filter by difficulty level
   * @param {number} [params.limit=10] - Maximum number of projects to return
   * @returns {Promise<Array>} List of skill-building projects
   */
  async getSkillBuildingProjects(skills, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add skills as multiple query parameters
      skills.forEach(skill => {
        queryParams.append('skills', skill);
      });
      
      if (params.difficulty && Object.values(DIFFICULTY_LEVELS).includes(params.difficulty)) {
        queryParams.append('difficulty', params.difficulty);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      const url = `${API_ENDPOINTS.PROJECTS.SKILL_BUILDING}?${queryParams.toString()}`;
      const response = await api.get(url);
      
      return response.data.map(project => this.transformProject(project));
    } catch (error) {
      console.error('Error fetching skill-building projects:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search projects by query
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @param {Array<string>} [filters.skills] - Filter by required skills
   * @param {string} [filters.difficulty] - Filter by difficulty level
   * @param {number} [filters.limit=20] - Maximum results to return
   * @param {number} [filters.offset=0] - Number of results to skip
   * @returns {Promise<Object>} Search results with projects and metadata
   */
  async searchProjects(query, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      
      if (filters.skills && Array.isArray(filters.skills)) {
        filters.skills.forEach(skill => {
          queryParams.append('skills', skill);
        });
      }
      
      if (filters.difficulty && Object.values(DIFFICULTY_LEVELS).includes(filters.difficulty)) {
        queryParams.append('difficulty', filters.difficulty);
      }
      
      if (filters.limit) {
        queryParams.append('limit', filters.limit);
      }
      
      if (filters.offset) {
        queryParams.append('offset', filters.offset);
      }
      
      const url = `${API_ENDPOINTS.PROJECTS.SEARCH}?${queryParams.toString()}`;
      const response = await api.get(url);
      
      return {
        ...response.data,
        projects: response.data.projects.map(project => this.transformProject(project))
      };
    } catch (error) {
      console.error('Error searching projects:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get all available projects with optional filtering
   * @param {Object} filters - Filter parameters
   * @param {string} [filters.difficulty] - Filter by difficulty level
   * @param {number} [filters.limit=50] - Maximum results to return
   * @param {number} [filters.offset=0] - Number of results to skip
   * @returns {Promise<Array>} List of all projects
   */
  async getAllProjects(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.difficulty && Object.values(DIFFICULTY_LEVELS).includes(filters.difficulty)) {
        queryParams.append('difficulty', filters.difficulty);
      }
      
      if (filters.limit) {
        queryParams.append('limit', filters.limit);
      }
      
      if (filters.offset) {
        queryParams.append('offset', filters.offset);
      }
      
      const url = `${API_ENDPOINTS.PROJECTS.ALL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map(project => this.transformProject(project));
    } catch (error) {
      console.error('Error fetching all projects:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Transform recommendations response for frontend consumption
   * @param {Object} recommendations - Raw recommendations data from API
   * @returns {Object} Transformed recommendations data
   */
  transformRecommendationsResponse(recommendations) {
    return {
      ...recommendations,
      projects: recommendations.projects?.map(project => this.transformProject(project)) || []
    };
  }

  /**
   * Transform project for frontend consumption
   * @param {Object} project - Raw project data from API
   * @returns {Object} Transformed project data
   */
  transformProject(project) {
    return {
      ...project,
      // Add frontend-specific transformations
      difficultyColor: this.getDifficultyColor(project.difficulty),
      difficultyIcon: this.getDifficultyIcon(project.difficulty),
      skillMatchColor: this.getSkillMatchColor(project.skill_match_percentage),
      estimatedWeeks: this.parseEstimatedTime(project.estimated_time),
      skillTags: project.skills?.map(skill => ({
        name: skill,
        isUserSkill: false // This will be set by components based on user data
      })) || []
    };
  }

  /**
   * Get color for difficulty level
   * @param {string} difficulty - Difficulty level
   * @returns {string} Tailwind color class
   */
  getDifficultyColor(difficulty) {
    const colorMap = {
      'Beginner': 'text-green-400',
      'Intermediate': 'text-yellow-400',
      'Advanced': 'text-red-400'
    };
    return colorMap[difficulty] || 'text-gray-400';
  }

  /**
   * Get icon for difficulty level
   * @param {string} difficulty - Difficulty level
   * @returns {string} Emoji icon
   */
  getDifficultyIcon(difficulty) {
    const iconMap = {
      'Beginner': '🟢',
      'Intermediate': '🟡',
      'Advanced': '🔴'
    };
    return iconMap[difficulty] || '⚪';
  }

  /**
   * Get color for skill match percentage
   * @param {number} percentage - Skill match percentage
   * @returns {string} Tailwind color class
   */
  getSkillMatchColor(percentage) {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  }

  /**
   * Parse estimated time string to extract weeks
   * @param {string} timeString - Time string like "1-2 weeks"
   * @returns {Object} Parsed time information
   */
  parseEstimatedTime(timeString) {
    if (!timeString) return { min: 0, max: 0, unit: 'weeks' };
    
    const match = timeString.match(/(\d+)(?:-(\d+))?\s*(\w+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      const unit = match[3];
      return { min, max, unit, display: timeString };
    }
    
    return { min: 0, max: 0, unit: 'weeks', display: timeString };
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - Error object
   * @returns {Error} Processed error
   */
  handleError(error) {
    if (error.response?.status === 401) {
      // Handle authentication errors
      return new Error('Please log in to access project recommendations');
    } else if (error.response?.status === 403) {
      return new Error('You do not have permission to access this resource');
    } else if (error.response?.status >= 500) {
      return new Error('Server error. Please try again later.');
    } else if (error.response?.data?.detail) {
      return new Error(error.response.data.detail);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}

// Create and export a singleton instance
const projectService = new ProjectService();
export default projectService;
