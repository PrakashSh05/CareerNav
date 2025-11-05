import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import SkillGapReport from './pages/SkillGapReport'
import LearningRoadmap from './pages/LearningRoadmap'
import ProjectRecommendations from './pages/ProjectRecommendations'
import Landing from './pages/Landing'
import ForgotPassword from './pages/ForgotPassword'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import ProtectedRoute from './components/layout/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-primary-950 text-white">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
          />
          <Route 
            path="/forgot-password" 
            element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} 
          />
          <Route 
            path="/terms" 
            element={<Terms />} 
          />
          <Route 
            path="/privacy" 
            element={<Privacy />} 
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skill-gap-report"
            element={
              <ProtectedRoute>
                <SkillGapReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learning-roadmap"
            element={
              <ProtectedRoute>
                <LearningRoadmap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-recommendations"
            element={
              <ProtectedRoute>
                <ProjectRecommendations />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/" 
            element={
              user ? (
                user.skills && user.skills.length > 0 ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/onboarding" replace />
                )
              ) : (
                <Landing />
              )
            } 
          />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
