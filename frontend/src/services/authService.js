import { api, handleApiResponse, tokenUtils } from './api'
import { API_ENDPOINTS } from '../utils/constants'

class AuthService {
  // Login user
  async login(email, password) {
    return handleApiResponse(async () => {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: email.toLowerCase(),
        password,
      })
      
      // Store token and refresh token
      if (response.data.access_token) {
        tokenUtils.setToken(response.data.access_token)
      }
      if (response.data.refresh_token) {
        tokenUtils.setRefreshToken(response.data.refresh_token)
      }
      
      // Get user data after successful login
      const userResponse = await this.getCurrentUser()
      if (userResponse.success) {
        tokenUtils.setUser(userResponse.data)
        return {
          ...response,
          data: {
            ...response.data,
            user: userResponse.data
          }
        }
      }
      
      return response
    })
  }

  // Register new user
  async register(userData) {
    return handleApiResponse(async () => {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
        email: userData.email.toLowerCase(), // Normalize email
        password: userData.password,
        full_name: userData.full_name,
      })
      
      // Auto-login after successful registration
      if (response.status === 201) {
        const loginResult = await this.login(userData.email, userData.password)
        if (loginResult.success) {
          return {
            ...response,
            data: {
              ...response.data,
              ...loginResult.data
            }
          }
        }
      }
      
      return response
    })
  }

  // Get current user data
  async getCurrentUser() {
    return handleApiResponse(async () => {
      const response = await api.get(API_ENDPOINTS.AUTH.ME)
      
      // Update stored user data
      if (response.data) {
        tokenUtils.setUser(response.data)
      }
      
      return response
    })
  }

  // Update user profile
  async updateProfile(profileData) {
    return handleApiResponse(async () => {
      const response = await api.put(API_ENDPOINTS.AUTH.ME, profileData)
      
      // Update stored user data
      if (response.data) {
        tokenUtils.setUser(response.data)
      }
      
      return response
    })
  }

  // Logout user
  async logout() {
    try {
      // Clear all stored data
      tokenUtils.clearAll()
      
      // You could also call a logout endpoint here if your backend supports it
      // await api.post('/auth/logout')
      
      return { success: true }
    } catch (error) {
      // Even if the API call fails, we should clear local data
      tokenUtils.clearAll()
      return { success: true }
    }
  }

  // Check if user has a token (regardless of user cache)
  hasToken() {
    return !!tokenUtils.getToken()
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = tokenUtils.getToken()
    const user = tokenUtils.getUser()
    
    if (!token || !user) {
      return false
    }
    
    // You could add token expiration check here
    // For now, we'll rely on the API interceptor to handle expired tokens
    return true
  }

  // Get stored user data
  getCurrentUserData() {
    return tokenUtils.getUser()
  }

  // Refresh user data from server
  async refreshUserData() {
    if (!this.hasToken()) {
      return { success: false, error: 'Not authenticated' }
    }
    
    return await this.getCurrentUser()
  }

  // Update specific user fields locally (for optimistic updates)
  updateUserDataLocally(updates) {
    const currentUser = tokenUtils.getUser()
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates }
      tokenUtils.setUser(updatedUser)
      return updatedUser
    }
    return null
  }

  // Check if user has completed onboarding
  hasCompletedOnboarding() {
    const user = tokenUtils.getUser()
    return user && user.skills && user.skills.length > 0 && user.target_roles && user.target_roles.length > 0
  }

  // Refresh access token using refresh token
  async refreshToken() {
    return handleApiResponse(async () => {
      const refreshToken = tokenUtils.getRefreshToken()
      
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }
      
      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH, {
        refresh_token: refreshToken
      })
      
      // Store new tokens
      if (response.data.access_token) {
        tokenUtils.setToken(response.data.access_token)
      }
      if (response.data.refresh_token) {
        tokenUtils.setRefreshToken(response.data.refresh_token)
      }
      
      return response
    })
  }

  // Validate current session
  async validateSession() {
    if (!this.hasToken()) {
      return { success: false, error: 'No active session' }
    }
    
    // Try to get current user to validate token
    const result = await this.getCurrentUser()
    
    if (!result.success && result.status === 401) {
      // Token is invalid, clear local data
      tokenUtils.clearAll()
      return { success: false, error: 'Session expired' }
    }
    
    return result
  }
}

// Create and export a singleton instance
const authService = new AuthService()
export default authService
