import { useAuthContext } from '../contexts/AuthContext'

// Custom hook for accessing authentication context
const useAuth = () => {
  const context = useAuthContext()
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export { useAuth }
