import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import authService from '../services/authService'

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
}

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
}

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      }
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      }
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
      }
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }
    
    default:
      return state
  }
}

// Create context
const AuthContext = createContext(null)

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
        
        // Check if user has a token (even if user cache is lost)
        if (authService.hasToken()) {
          // Validate session and get fresh user data
          const result = await authService.validateSession()
          
          if (result.success) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: result.data })
          } else {
            dispatch({ type: AUTH_ACTIONS.LOGOUT })
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'Failed to initialize authentication' })
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
      
      const result = await authService.login(email, password)
      
      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: result.data.user })
        return { success: true, user: result.data.user }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Register function
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
      
      const result = await authService.register(userData)
      
      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: result.data.user })
        return { success: true, user: result.data.user }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error })
        return { success: false, error: result.error, validationErrors: result.validationErrors }
      }
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear local state
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      return { success: true }
    }
  }, [])

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
      
      const result = await authService.updateProfile(profileData)
      
      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: result.data })
        return { success: true, user: result.data }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error })
        return { success: false, error: result.error, validationErrors: result.validationErrors }
      }
    } catch (error) {
      const errorMessage = 'Profile update failed. Please try again.'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const result = await authService.getCurrentUser()
      
      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: result.data })
        return { success: true, user: result.data }
      } else {
        if (result.status === 401) {
          dispatch({ type: AUTH_ACTIONS.LOGOUT })
        }
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Refresh user error:', error)
      return { success: false, error: 'Failed to refresh user data' }
    }
  }, [])

  // Update user locally (for optimistic updates)
  const updateUserLocally = useCallback((updates) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updates })
    authService.updateUserDataLocally(updates)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }, [])

  // Check if user has completed onboarding
  const hasCompletedOnboarding = useCallback(() => {
    return authService.hasCompletedOnboarding()
  }, [])

  // Context value
  const { user, loading, error, isAuthenticated } = state

  const value = useMemo(() => ({
    // State
    user,
    loading,
    error,
    isAuthenticated,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    updateUserLocally,
    clearError,
    hasCompletedOnboarding,
  }), [user, loading, error, isAuthenticated, login, register, logout, updateProfile, refreshUser, updateUserLocally, clearError, hasCompletedOnboarding])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext
