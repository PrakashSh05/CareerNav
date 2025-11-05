# Career Navigator - Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Configuration](#environment-configuration)
6. [Development Workflow](#development-workflow)

---

## Overview

Career Navigator's frontend is a modern, responsive single-page application (SPA) built with React. It provides an intuitive interface for students and professionals to:

- **Analyze Skill Gaps**: Compare your skills against market demands for target roles
- **Get Learning Recommendations**: Receive personalized learning paths based on skill gaps
- **Discover Project Ideas**: Find projects that match your skills and interests
- **Track Career Progress**: Monitor your skill development and market readiness

### Key Features

✅ **Authentication System**: Secure JWT-based authentication with auto-refresh  
✅ **Responsive Design**: Mobile-first design with Tailwind CSS  
✅ **Interactive Visualizations**: Chart.js powered skill gap and trend analysis  
✅ **Real-time Market Data**: Live job market insights and trending skills  
✅ **Personalized Dashboards**: Custom recommendations based on user profile  
✅ **Smooth Animations**: Framer Motion for delightful user experience  

---

## Technology Stack

### Core Framework
- **React 18.2.0**: Modern UI library with hooks and concurrent features
- **Vite 7.1.7**: Lightning-fast build tool and dev server
- **React Router 6.15.0**: Client-side routing with protected routes

### UI & Styling
- **Tailwind CSS 3.3.3**: Utility-first CSS framework with dark theme
- **PostCSS 8.4.31**: CSS processing with Autoprefixer
- **Framer Motion 10.18.0**: Production-ready animation library
- **Lucide React 0.263.1**: Beautiful, customizable SVG icons

### Data Visualization
- **Chart.js 4.4.0**: Flexible charting library
- **React Chart.js 2 5.2.0**: React wrapper for Chart.js

### Form Handling & Validation
- **React Hook Form 7.45.4**: Performant form validation
- **Custom Validation**: Pattern-based email/password validation

### HTTP Client
- **Axios 1.5.0**: Promise-based HTTP client with interceptors

### Development Tools
- **ESLint 8.45.0**: Code quality and consistency
- **Vite Plugin React**: Fast Refresh and JSX transform

---

## Project Structure

```
frontend/
├── index.html                 # HTML entry point
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite build configuration
├── tailwind.config.js        # Tailwind CSS theme customization
├── postcss.config.js         # PostCSS configuration
│
└── src/
    ├── main.jsx              # React application entry
    ├── App.jsx               # Main app component with routing
    ├── index.css             # Global styles and Tailwind imports
    │
    ├── components/           # Reusable UI components
    │   ├── ErrorBoundary.jsx
    │   ├── charts/           # Chart components
    │   │   ├── SkillGapChart.jsx
    │   │   ├── TrendingSkillsChart.jsx
    │   │   └── index.js
    │   ├── layout/           # Layout components
    │   │   ├── AuthLayout.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── learning/         # Learning-specific components
    │   │   ├── ResourceCard.jsx
    │   │   └── SkillLearningPath.jsx
    │   ├── projects/         # Project-specific components
    │   │   └── ProjectCard.jsx
    │   └── ui/               # Generic UI components
    │       ├── Badge.jsx
    │       ├── Button.jsx
    │       ├── Card.jsx
    │       ├── FilterDropdown.jsx
    │       ├── Input.jsx
    │       ├── LoadingSpinner.jsx
    │       ├── Modal.jsx
    │       ├── SearchInput.jsx
    │       └── SkillsModal.jsx
    │
    ├── contexts/             # React Context providers
    │   └── AuthContext.jsx   # Global authentication state
    │
    ├── hooks/                # Custom React hooks
    │   └── useAuth.js        # Authentication hook
    │
    ├── pages/                # Page components (routes)
    │   ├── Landing.jsx       # Public landing page
    │   ├── Login.jsx         # User login
    │   ├── Signup.jsx        # User registration
    │   ├── ForgotPassword.jsx
    │   ├── Onboarding.jsx    # Post-signup skill/role selection
    │   ├── Dashboard.jsx     # Main user dashboard
    │   ├── SkillGapReport.jsx
    │   ├── LearningRoadmap.jsx
    │   ├── ProjectRecommendations.jsx
    │   ├── Terms.jsx
    │   └── Privacy.jsx
    │
    ├── services/             # API service layer
    │   ├── api.js            # Axios instance and interceptors
    │   ├── authService.js    # Authentication API calls
    │   ├── learningService.js
    │   ├── marketService.js
    │   ├── projectService.js
    │   └── skillsService.js
    │
    └── utils/                # Utility functions and constants
        ├── constants.js      # API endpoints, roles, skills
        └── validation.js     # Form validation rules
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: v16.0 or higher (v18+ recommended)
- **npm**: v7.0 or higher (or yarn/pnpm)
- **Backend API**: Running on `http://localhost:8000`

### Installation

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   # Create .env file in frontend root
   echo "VITE_API_BASE_URL=http://localhost:8000" > .env
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   The application will be available at **http://localhost:3000**

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

---

## Environment Configuration

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# Optional: Enable debug logging
VITE_DEBUG=true
```

### Vite Configuration

**File**: `vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // Frontend dev server port
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Backend API
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    sourcemap: true,  // Enable source maps for debugging
    outDir: 'dist'
  }
})
```

**Key Features**:
- Development server on port **3000**
- API proxy to backend (port **8000**)
- Source maps enabled for debugging
- Fast Refresh for React components

---

## Development Workflow

### 1. Component Development

**Best Practices**:
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use PropTypes or TypeScript for type safety

**Example Component Structure**:
```jsx
import { useState, useEffect } from 'react'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const MyComponent = ({ title, data }) => {
  const { user } = useAuth()
  const [state, setState] = useState(null)

  useEffect(() => {
    // Component logic
  }, [dependencies])

  return (
    <div className="p-4">
      <h2>{title}</h2>
      {/* Component JSX */}
    </div>
  )
}

export default MyComponent
```

### 2. Styling with Tailwind CSS

**Dark Theme Colors** (defined in `tailwind.config.js`):

```javascript
colors: {
  primary: {
    800: '#1a1a1a',   // Card backgrounds
    900: '#101820',   // Dark charcoal
    950: '#0a0c10'    // Deeper charcoal
  },
  accent: {
    500: '#FEE715'    // Bright yellow (primary CTA)
  },
  highlight: {
    500: '#F96167'    // Light coral (secondary accents)
  }
}
```

**Usage Example**:
```jsx
<div className="bg-primary-950 text-white p-8 rounded-lg shadow-xl">
  <h1 className="text-gradient text-4xl font-bold">
    Career Navigator
  </h1>
  <button className="bg-accent-500 hover:bg-accent-600 px-6 py-3">
    Get Started
  </button>
</div>
```

### 3. State Management

**Global State** (Authentication):
- Managed via **AuthContext** (Context API + useReducer)
- Provides user data, login/logout functions, loading states
- Persists user session in localStorage

**Local State**:
- Component-specific state using `useState`
- Form state with React Hook Form
- Async data fetching with `useEffect`

### 4. API Integration

**Service Layer Pattern**:
```javascript
// services/skillsService.js
import { api, handleApiResponse } from './api'

export const getSkillGapAnalysis = async (role, params) => {
  return handleApiResponse(async () => {
    const response = await api.get('/skills/gap-analysis', {
      params: { role, ...params }
    })
    return response
  })
}
```

**Component Usage**:
```jsx
import skillsService from '../services/skillsService'

const MyComponent = () => {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const loadData = async () => {
      const result = await skillsService.getSkillGapAnalysis('Software Engineer')
      if (result.success) {
        setData(result.data)
      }
    }
    loadData()
  }, [])
}
```

### 5. Routing

**Protected Routes** (requires authentication):
```jsx
// App.jsx
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  
  {/* Protected routes */}
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

### 6. Error Handling

**Error Boundary** (catches React errors):
```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**API Error Handling** (via interceptors):
- 401 Unauthorized → Auto token refresh or redirect to login
- 500 Server Error → User-friendly error message
- Network Error → Offline indicator

---

## Next Steps

- **Part 2**: Pages, Routing, and Components
- **Part 3**: Services, API Integration, and State Management
- **Part 4**: UI Components, Charts, and Styling
- **Part 5**: Build, Deployment, and Testing

For navigation between documentation parts, see [FRONTEND_DOCUMENTATION_README.md](./FRONTEND_DOCUMENTATION_README.md)
