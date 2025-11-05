import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Learning Service - Handles all learning-related API calls
 */
class LearningService {
  /**
   * Get personalized learning roadmap for the authenticated user
   * @param {Object} params - Query parameters
   * @param {string} [params.target_role] - Specific target role to focus on
   * @param {boolean} [params.include_gap_analysis=true] - Whether to include gap analysis
   * @returns {Promise<Object>} Learning roadmap response
   */
  async getLearningRoadmap(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.target_role) {
        queryParams.append('target_role', params.target_role);
      }
      
      if (params.include_gap_analysis !== undefined) {
        queryParams.append('include_gap_analysis', params.include_gap_analysis);
      }
      
      const url = `${API_ENDPOINTS.LEARNING.ROADMAP}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      
      return this.transformRoadmapResponse(response.data);
    } catch (error) {
      console.error('Error fetching learning roadmap:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get learning resources for specific skills
   * @param {Array<string>} skills - List of skills to get resources for
   * @param {Object} params - Additional parameters
   * @param {string} [params.resource_type] - Filter by resource type
   * @param {string} [params.search] - Search query
   * @returns {Promise<Array>} List of learning resources
   */
  async getResourcesForSkills(skills, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add skills as multiple query parameters
      skills.forEach(skill => {
        queryParams.append('skills', skill);
      });
      
      if (params.resource_type) {
        queryParams.append('resource_type', params.resource_type);
      }
      
      if (params.search) {
        queryParams.append('search', params.search);
      }
      
      const url = `${API_ENDPOINTS.LEARNING.RESOURCES}?${queryParams.toString()}`;
      const response = await api.get(url);
      
      return response.data.map(resource => this.transformResource(resource));
    } catch (error) {
      console.error('Error fetching resources for skills:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search learning resources by query
   * @param {string} query - Search query
   * @param {Object} params - Search parameters
   * @param {string} [params.resource_type] - Filter by resource type
   * @param {number} [params.limit=20] - Maximum results to return
   * @param {number} [params.offset=0] - Number of results to skip
   * @returns {Promise<Object>} Search results with resources and metadata
   */
  async searchResources(query, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      
      if (params.resource_type) {
        queryParams.append('resource_type', params.resource_type);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.offset) {
        queryParams.append('offset', params.offset);
      }
      
      const url = `${API_ENDPOINTS.LEARNING.SEARCH}?${queryParams.toString()}`;
      const response = await api.get(url);
      
      return {
        ...response.data,
        resources: response.data.resources.map(resource => this.transformResource(resource))
      };
    } catch (error) {
      console.error('Error searching learning resources:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Transform roadmap response for frontend consumption
   * @param {Object} roadmap - Raw roadmap data from API
   * @returns {Object} Transformed roadmap data
   */
  transformRoadmapResponse(roadmap) {
    return {
      ...roadmap,
      skill_paths: roadmap.skill_paths?.map(path => ({
        ...path,
        resources: path.resources?.map(resource => this.transformResource(resource)) || []
      })) || []
    };
  }

  /**
   * Transform learning resource for frontend consumption
   * @param {Object} resource - Raw resource data from API
   * @returns {Object} Transformed resource data
   */
  transformResource(resource) {
    return {
      ...resource,
      // Add any frontend-specific transformations here
      displayType: this.getResourceTypeDisplay(resource.type),
      isExternal: resource.url?.startsWith('http'),
      // Extract domain from URL for display
      domain: resource.url ? this.extractDomain(resource.url) : null
    };
  }

  /**
   * Get display-friendly resource type
   * @param {string} type - Resource type
   * @returns {string} Display-friendly type
   */
  getResourceTypeDisplay(type) {
    const typeMap = {
      'Documentation': '📚 Documentation',
      'Video': '🎥 Video',
      'Course': '🎓 Course',
      'Book': '📖 Book'
    };
    return typeMap[type] || type;
  }

  /**
   * Extract domain from URL
   * @param {string} url - Full URL
   * @returns {string|null} Domain name
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - Error object
   * @returns {Error} Processed error
   */
  handleError(error) {
    if (error.response?.status === 401) {
      // Handle authentication errors
      return new Error('Please log in to access learning resources');
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
const learningService = new LearningService();
export default learningService;
