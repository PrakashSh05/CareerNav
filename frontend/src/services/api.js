import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS, API_ENDPOINTS } from '../utils/constants'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      })
    }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    }
    
    // Handle 401 Unauthorized errors with refresh token attempt
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      
      // Try to refresh token if we have a refresh token
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
            refresh_token: refreshToken
          })
          
          if (refreshResponse.data.access_token) {
            // Update token and retry original request
            tokenUtils.setToken(refreshResponse.data.access_token)
            
            // Update refresh token if provided
            if (refreshResponse.data.refresh_token) {
              localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshResponse.data.refresh_token)
            }
            
            // Update authorization header for retry
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`
            
            // Retry the original request
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          // Fall through to clear tokens and redirect
        }
      }
      
      // Clear stored tokens if refresh failed or no refresh token
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      
      // Redirect to login if we're not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      
      return Promise.reject(error)
    }
    
    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Network error - please check your connection')
      networkError.isNetworkError = true
      return Promise.reject(networkError)
    }
    
    // Handle server errors
    if (error.response.status >= 500) {
      const serverError = new Error('Server error - please try again later')
      serverError.isServerError = true
      return Promise.reject(serverError)
    }
    
    return Promise.reject(error)
  }
)

// API response wrapper
const handleApiResponse = async (apiCall) => {
  try {
    const response = await apiCall()
    return {
      success: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    // Extract error message from response
    let message = 'An unexpected error occurred'
    
    if (error.isNetworkError) {
      message = error.message
    } else if (error.isServerError) {
      message = error.message
    } else if (error.response?.data?.detail) {
      // FastAPI error format
      if (typeof error.response.data.detail === 'string') {
        message = error.response.data.detail
      } else if (Array.isArray(error.response.data.detail)) {
        // Validation errors
        message = error.response.data.detail
          .map(err => err.msg || err.message)
          .join(', ')
      }
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }
    
    return {
      success: false,
      error: message,
      status: error.response?.status,
      validationErrors: error.response?.status === 422 ? error.response.data.detail : null,
    }
  }
}

// Token management utilities
export const tokenUtils = {
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  setToken: (token) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),
  removeToken: () => localStorage.removeItem(STORAGE_KEYS.TOKEN),
  
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
  removeRefreshToken: () => localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
  
  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER)
    return user ? JSON.parse(user) : null
  },
  setUser: (user) => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(STORAGE_KEYS.USER),
  
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  }
}

// Export the configured axios instance and helper
export { api, handleApiResponse }
export default api
