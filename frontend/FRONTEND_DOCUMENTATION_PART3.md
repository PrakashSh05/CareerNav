# Frontend Documentation - Part 3: Services, API Integration & State Management

## Table of Contents
1. [API Layer Architecture](#api-layer-architecture)
2. [Service Classes](#service-classes)
3. [State Management](#state-management)
4. [Authentication Flow](#authentication-flow)

---

## API Layer Architecture

### Base API Configuration

**File**: `src/services/api.js`

Central Axios instance with request/response interceptors for authentication and error handling.

```javascript
import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

// Create configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,  // http://localhost:8000
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,  // 10 seconds
})
```

### Request Interceptor

**Automatically adds JWT token to all requests**:

```javascript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('career_navigator_token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log requests in development
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
```

**Features**:
- Reads JWT token from localStorage
- Attaches token to Authorization header
- Development logging for debugging
- Error handling

---

### Response Interceptor

**Handles authentication errors and token refresh**:

```javascript
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('career_navigator_refresh_token')
      
      if (refreshToken) {
        try {
          // Attempt to refresh access token
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          )
          
          if (refreshResponse.data.access_token) {
            // Update token and retry original request
            localStorage.setItem('career_navigator_token', refreshResponse.data.access_token)
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }
      
      // Clear tokens and redirect to login
      localStorage.removeItem('career_navigator_token')
      localStorage.removeItem('career_navigator_user')
      localStorage.removeItem('career_navigator_refresh_token')
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Network error - please check your connection')
      networkError.isNetworkError = true
      return Promise.reject(networkError)
    }

    // Handle server errors (500+)
    if (error.response.status >= 500) {
      const serverError = new Error('Server error - please try again later')
      serverError.isServerError = true
      return Promise.reject(serverError)
    }

    return Promise.reject(error)
  }
)
```

**Key Features**:
- ✅ **Automatic token refresh** on 401 errors
- ✅ **Retry failed requests** after token refresh
- ✅ **Auto-logout** on refresh failure
- ✅ **User-friendly error messages**
- ✅ **Network error detection**

---

### API Response Wrapper

**Standardizes API responses across the app**:

```javascript
export const handleApiResponse = async (apiCall) => {
  try {
    const response = await apiCall()
    return {
      success: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    let message = 'An unexpected error occurred'
    
    if (error.isNetworkError || error.isServerError) {
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
    }
    
    return {
      success: false,
      error: message,
      status: error.response?.status,
      validationErrors: error.response?.status === 422 ? error.response.data.detail : null,
    }
  }
}
```

**Response Format**:
```javascript
// Success
{
  success: true,
  data: { /* API response data */ },
  status: 200
}

// Error
{
  success: false,
  error: "Error message",
  status: 400,
  validationErrors: [/* FastAPI validation errors */]
}
```

---

### Token Utilities

**Helper functions for token management**:

```javascript
export const tokenUtils = {
  getToken: () => localStorage.getItem('career_navigator_token'),
  setToken: (token) => localStorage.setItem('career_navigator_token', token),
  removeToken: () => localStorage.removeItem('career_navigator_token'),
  
  getRefreshToken: () => localStorage.getItem('career_navigator_refresh_token'),
  setRefreshToken: (token) => localStorage.setItem('career_navigator_refresh_token', token),
  removeRefreshToken: () => localStorage.removeItem('career_navigator_refresh_token'),
  
  getUser: () => {
    const user = localStorage.getItem('career_navigator_user')
    return user ? JSON.parse(user) : null
  },
  setUser: (user) => localStorage.setItem('career_navigator_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('career_navigator_user'),
  
  clearAll: () => {
    localStorage.removeItem('career_navigator_token')
    localStorage.removeItem('career_navigator_user')
    localStorage.removeItem('career_navigator_refresh_token')
  }
}
```

---

## Service Classes

### 1. Authentication Service

**File**: `src/services/authService.js`

Handles all authentication-related API calls.

#### Methods

**login(email, password)**
```javascript
async login(email, password) {
  return handleApiResponse(async () => {
    const response = await api.post('/auth/login', {
      email: email.toLowerCase(),
      password,
    })
    
    // Store tokens
    if (response.data.access_token) {
      tokenUtils.setToken(response.data.access_token)
    }
    if (response.data.refresh_token) {
      tokenUtils.setRefreshToken(response.data.refresh_token)
    }
    
    // Fetch user data
    const userResponse = await this.getCurrentUser()
    if (userResponse.success) {
      tokenUtils.setUser(userResponse.data)
    }
    
    return response
  })
}
```

**register(userData)**
```javascript
async register(userData) {
  return handleApiResponse(async () => {
    const response = await api.post('/auth/register', {
      email: userData.email.toLowerCase(),
      password: userData.password,
      full_name: userData.full_name,
    })
    
    // Auto-login after successful registration
    if (response.status === 201) {
      const loginResult = await this.login(userData.email, userData.password)
      return { ...response, data: { ...response.data, ...loginResult.data } }
    }
    
    return response
  })
}
```

**getCurrentUser()**
```javascript
async getCurrentUser() {
  return handleApiResponse(async () => {
    const response = await api.get('/auth/me')
    
    if (response.data) {
      tokenUtils.setUser(response.data)
    }
    
    return response
  })
}
```

**updateProfile(profileData)**
```javascript
async updateProfile(profileData) {
  return handleApiResponse(async () => {
    const response = await api.put('/auth/me', profileData)
    
    if (response.data) {
      tokenUtils.setUser(response.data)
    }
    
    return response
  })
}
```

**logout()**
```javascript
async logout() {
  try {
    tokenUtils.clearAll()
    return { success: true }
  } catch (error) {
    tokenUtils.clearAll()
    return { success: true }
  }
}
```

**Utility Methods**:
- `isAuthenticated()`: Check if user has valid token
- `hasCompletedOnboarding()`: Check if user has skills and roles
- `refreshToken()`: Manually refresh access token
- `validateSession()`: Verify current session validity

---

### 2. Skills Service

**File**: `src/services/skillsService.js`

Handles skill gap analysis and skill-related operations.

#### Methods

**getSkillGapAnalysis(role, params)**
```javascript
export const getSkillGapAnalysis = async (role, params = {}) => {
  if (!role || typeof role !== 'string') {
    return {
      success: false,
      error: 'Role parameter is required',
      status: 400
    }
  }

  return handleApiResponse(async () => {
    const queryParams = new URLSearchParams()
    queryParams.append('role', role)
    
    if (params.days !== undefined) {
      queryParams.append('days', params.days)
    }
    if (params.threshold !== undefined) {
      queryParams.append('threshold', params.threshold)
    }
    
    const url = `/skills/gap-analysis?${queryParams.toString()}`
    return api.get(url)
  })
}
```

**getMultipleSkillGapAnalysis(roles, params)**
```javascript
export const getMultipleSkillGapAnalysis = async (roles, params = {}) => {
  if (!Array.isArray(roles) || roles.length === 0) return []

  try {
    const analysisPromises = roles.map(role => 
      getSkillGapAnalysis(role, params)
    )
    
    const results = await Promise.all(analysisPromises)
    
    return results.map((result, index) => ({
      role: roles[index],
      ...result
    }))
  } catch (error) {
    console.error('Error getting multiple skill gap analyses:', error)
    return roles.map(role => ({
      role,
      success: false,
      error: 'Failed to analyze skill gap'
    }))
  }
}
```

**transformGapDataForChart(gapAnalysis)**
```javascript
export const transformGapDataForChart = (gapAnalysis) => {
  if (!gapAnalysis?.required_skills) return { labels: [], datasets: [] }

  // Sort and take top 10 skills
  const sortedSkills = [...gapAnalysis.required_skills]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10)

  const labels = sortedSkills.map(skill => 
    formatLabel(skill.technology_slug || skill.skill)
  )
  
  const userHasData = sortedSkills.map(skill => 
    skill.user_has ? skill.percentage : 0
  )
  const userMissingData = sortedSkills.map(skill => 
    !skill.user_has ? skill.percentage : 0
  )

  return {
    labels,
    datasets: [
      {
        label: 'Skills You Have',
        data: userHasData,
        backgroundColor: '#4FD1C5',  // Teal
        borderColor: '#38B2AC',
      },
      {
        label: 'Skills to Learn',
        data: userMissingData,
        backgroundColor: '#F6E05E',  // Gold
        borderColor: '#D69E2E',
      }
    ]
  }
}
```

**normalizeSkillName(skillName)**
```javascript
export const normalizeSkillName = (skillName) => {
  if (!skillName || typeof skillName !== 'string') return skillName

  const skill = skillName.toLowerCase().trim()

  // Canonical skill mapping (matches backend)
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
```

**Other Utilities**:
- `calculateGapSummary(gapAnalysis)`: Generate summary statistics
- `generateLearningRecommendations(gapAnalysis, maxRecommendations)`: Suggest learning priorities
- `normalizeUserSkills(userSkills)`: Normalize array of skills

---

### 3. Market Service

**File**: `src/services/marketService.js`

Handles market analysis and trending data.

#### Methods

**getTrendingData(params)**
```javascript
export const getTrendingData = async (params = {}) => {
  return handleApiResponse(async () => {
    const queryParams = new URLSearchParams()
    
    if (params.days !== undefined) {
      queryParams.append('days', params.days)
    }
    if (params.skills_limit !== undefined) {
      queryParams.append('skills_limit', params.skills_limit)
    }
    if (params.locations_limit !== undefined) {
      queryParams.append('locations_limit', params.locations_limit)
    }
    
    const url = `/market/trending?${queryParams.toString()}`
    return api.get(url)
  })
}
```

**Response Structure**:
```javascript
{
  success: true,
  data: {
    top_skills: [
      { skill: "Python", count: 150, percentage: 45.5 },
      { skill: "JavaScript", count: 120, percentage: 36.4 },
      // ...
    ],
    top_locations: [
      { location: "San Francisco", count: 80, percentage: 24.2 },
      // ...
    ],
    total_jobs_analyzed: 330,
    window_days: 30
  }
}
```

**getTrendingSkills(params)**: Returns only trending skills  
**getTrendingLocations(params)**: Returns only trending locations  
**transformDataForChart(trendingData, labelKey, valueKey)**: Transform for chart consumption

---

### 4. Learning Service

**File**: `src/services/learningService.js`

Handles learning roadmaps and resource recommendations.

#### Methods

**getLearningRoadmap(params)**
```javascript
async getLearningRoadmap(params = {}) {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.target_role) {
      queryParams.append('target_role', params.target_role)
    }
    if (params.include_gap_analysis !== undefined) {
      queryParams.append('include_gap_analysis', params.include_gap_analysis)
    }
    
    const url = `/learning/roadmap?${queryParams.toString()}`
    const response = await api.get(url)
    
    return this.transformRoadmapResponse(response.data)
  } catch (error) {
    throw this.handleError(error)
  }
}
```

**getResourcesForSkills(skills, params)**
```javascript
async getResourcesForSkills(skills, params = {}) {
  try {
    const queryParams = new URLSearchParams()
    
    skills.forEach(skill => {
      queryParams.append('skills', skill)
    })
    
    if (params.resource_type) {
      queryParams.append('resource_type', params.resource_type)
    }
    
    const url = `/learning/resources?${queryParams.toString()}`
    const response = await api.get(url)
    
    return response.data.map(resource => this.transformResource(resource))
  } catch (error) {
    throw this.handleError(error)
  }
}
```

**searchResources(query, params)**
```javascript
async searchResources(query, params = {}) {
  const queryParams = new URLSearchParams()
  queryParams.append('query', query)
  
  if (params.resource_type) {
    queryParams.append('resource_type', params.resource_type)
  }
  if (params.limit) {
    queryParams.append('limit', params.limit)
  }
  
  const url = `/learning/resources/search?${queryParams.toString()}`
  const response = await api.get(url)
  
  return {
    ...response.data,
    resources: response.data.resources.map(r => this.transformResource(r))
  }
}
```

**Resource Transformation**:
```javascript
transformResource(resource) {
  return {
    ...resource,
    displayType: this.getResourceTypeDisplay(resource.type),
    isExternal: resource.url?.startsWith('http'),
    domain: this.extractDomain(resource.url)
  }
}
```

---

## State Management

### Global State: AuthContext

**File**: `src/contexts/AuthContext.jsx`

Uses Context API with useReducer for global authentication state.

#### State Structure

```javascript
const initialState = {
  user: null,           // User profile data
  loading: true,        // Initial auth check
  error: null,          // Auth error message
  isAuthenticated: false
}
```

#### Reducer Actions

```javascript
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null
      }
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    
    default:
      return state
  }
}
```

#### Context Provider

```javascript
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.hasToken()) {
        const result = await authService.validateSession()
        if (result.success) {
          dispatch({ type: 'SET_USER', payload: result.data })
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    
    checkAuth()
  }, [])

  // Context methods
  const login = async (email, password) => {
    const result = await authService.login(email, password)
    if (result.success) {
      dispatch({ type: 'SET_USER', payload: result.data.user })
    }
    return result
  }

  const logout = async () => {
    await authService.logout()
    dispatch({ type: 'LOGOUT' })
  }

  const updateProfile = async (data) => {
    const result = await authService.updateProfile(data)
    if (result.success) {
      dispatch({ type: 'UPDATE_USER', payload: result.data })
    }
    return result
  }

  return (
    <AuthContext.Provider value={{
      user: state.user,
      loading: state.loading,
      error: state.error,
      isAuthenticated: state.isAuthenticated,
      login,
      logout,
      updateProfile,
      refreshUser: async () => {
        const result = await authService.getCurrentUser()
        if (result.success) {
          dispatch({ type: 'SET_USER', payload: result.data })
        }
      }
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### Custom Hook

```javascript
// src/hooks/useAuth.js
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## Authentication Flow

### 1. Login Flow

```
User enters credentials
      ↓
Login page validates form
      ↓
authService.login(email, password)
      ↓
POST /auth/login → Backend
      ↓
Receive { access_token, refresh_token }
      ↓
Store tokens in localStorage
      ↓
GET /auth/me → Fetch user profile
      ↓
Store user data in localStorage
      ↓
Dispatch SET_USER action
      ↓
Redirect to /dashboard or /onboarding
```

### 2. Token Refresh Flow

```
API request with expired token
      ↓
Receive 401 Unauthorized
      ↓
Response interceptor catches error
      ↓
Check for refresh_token in localStorage
      ↓
POST /auth/refresh with refresh_token
      ↓
Receive new access_token
      ↓
Update localStorage
      ↓
Retry original request with new token
      ↓
Return response to caller
```

### 3. Session Validation Flow

```
App loads
      ↓
AuthProvider useEffect runs
      ↓
Check for token in localStorage
      ↓
If found: authService.validateSession()
      ↓
GET /auth/me
      ↓
If success: Dispatch SET_USER
      ↓
If 401: Clear localStorage, set loading=false
      ↓
User redirected to landing if not authenticated
```

---

## Next Section

**Part 4**: UI Components, Charts, and Styling

[Continue to FRONTEND_DOCUMENTATION_PART4.md →](./FRONTEND_DOCUMENTATION_PART4.md)
