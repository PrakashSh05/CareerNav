# Frontend Documentation - Part 2: Pages, Routing & Components

## Table of Contents
1. [Application Routing](#application-routing)
2. [Page Components](#page-components)
3. [Layout Components](#layout-components)
4. [Feature Components](#feature-components)

---

## Application Routing

### Route Configuration

**File**: `src/App.jsx`

The application uses React Router v6 with a mix of public and protected routes.

```jsx
<BrowserRouter>
  <ErrorBoundary>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Protected Routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute><Onboarding /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/skill-gap-report" element={
        <ProtectedRoute><SkillGapReport /></ProtectedRoute>
      } />
      <Route path="/learning-roadmap" element={
        <ProtectedRoute><LearningRoadmap /></ProtectedRoute>
      } />
      <Route path="/project-recommendations" element={
        <ProtectedRoute><ProjectRecommendations /></ProtectedRoute>
      } />
    </Routes>
  </ErrorBoundary>
</BrowserRouter>
```

### Route Protection

**ProtectedRoute Component** (`src/components/layout/ProtectedRoute.jsx`):

```jsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner overlay text="Verifying authentication..." />
  }

  // Redirect to landing page if not authenticated
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Render protected content
  return children
}
```

**Features**:
- Checks authentication state from AuthContext
- Displays loading spinner during auth verification
- Redirects unauthenticated users to landing page
- Preserves intended destination in location state

---

## Page Components

### 1. Landing Page

**File**: `src/pages/Landing.jsx`

**Purpose**: Public homepage with marketing content and navigation to login/signup

**Key Features**:
- Hero section with value proposition
- Feature highlights
- Call-to-action buttons
- Navigation to authentication pages

**Example Structure**:
```jsx
const Landing = () => {
  return (
    <div className="min-h-screen bg-primary-950">
      {/* Navigation */}
      <nav className="flex justify-between p-6">
        <h1 className="text-gradient">Career Navigator</h1>
        <div>
          <Button onClick={() => navigate('/login')}>Login</Button>
          <Button onClick={() => navigate('/signup')}>Sign Up</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold">Navigate Your Career Path</h1>
        <p className="text-xl text-gray-400 mt-4">
          Analyze skill gaps, get learning recommendations, and advance your career
        </p>
      </section>
    </div>
  )
}
```

---

### 2. Login Page

**File**: `src/pages/Login.jsx`

**Purpose**: User authentication interface

**Features**:
- Email and password form
- Form validation
- Error message display
- Remember me checkbox
- Forgot password link
- Auto-redirect to dashboard on success

**Flow**:
1. User enters credentials
2. Form validated (email format, required fields)
3. API call to `/auth/login`
4. Token stored in localStorage
5. User data fetched and stored
6. Redirect to dashboard or onboarding

---

### 3. Signup Page

**File**: `src/pages/Signup.jsx`

**Purpose**: New user registration

**Features**:
- Full name, email, password fields
- Password strength validation
- Terms & conditions checkbox
- Auto-login after successful registration
- Redirect to onboarding for profile setup

**Validation Rules**:
```javascript
{
  email: {
    required: true,
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/  // Upper, lower, number
  },
  full_name: {
    required: true,
    minLength: 2
  }
}
```

---

### 4. Onboarding Page

**File**: `src/pages/Onboarding.jsx`

**Purpose**: Collect user skills and target roles after registration

**Multi-step Flow**:

**Step 1: Skills Selection**
- Search/select from common skills
- Custom skill input
- Minimum 1 skill required

**Step 2: Target Roles**
- Search/select from common roles
- Custom role input
- Minimum 1 role required

**Step 3: Experience & Location**
- Academic level selection (12th Pass Out, 1st Year, etc.)
- Location input (optional)

**Example Structure**:
```jsx
const Onboarding = () => {
  const [step, setStep] = useState(1)
  const [skills, setSkills] = useState([])
  const [roles, setRoles] = useState([])
  const [formData, setFormData] = useState({})

  const handleComplete = async () => {
    await updateProfile({
      skills,
      target_roles: roles,
      experience_level: formData.experience_level,
      location: formData.location
    })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-primary-950 p-8">
      {/* Progress indicator */}
      <div className="mb-8">
        Step {step} of 3
      </div>

      {/* Step content */}
      {step === 1 && <SkillsStep />}
      {step === 2 && <RolesStep />}
      {step === 3 && <ProfileStep />}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        {step > 1 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button onClick={handleComplete}>Complete</Button>
        )}
      </div>
    </div>
  )
}
```

---

### 5. Dashboard Page

**File**: `src/pages/Dashboard.jsx`

**Purpose**: Main user interface with overview and quick access

**Sections**:

**A. Header Bar**:
- User profile summary (name, location, academic level)
- Edit profile button
- Logout button

**B. Welcome Section**:
- Personalized greeting
- Motivational message

**C. Stats Cards** (4 cards):
1. **Target Roles**: Count of selected career roles
2. **Skills**: Total normalized skills
3. **Market Score**: Calculated from job postings analyzed
4. **Coverage**: Percentage of required skills user has

**D. Quick Access Cards** (3 navigation cards):
1. **Learning Roadmap**: Personalized learning paths
2. **Project Ideas**: Skill-building project recommendations
3. **Skill Analysis**: Detailed gap analysis report

**E. Your Skills Section**:
- Display user's skills as tags
- Edit skills modal
- Empty state prompt

**F. Target Roles Section**:
- List of target career roles
- Edit roles modal
- Empty state prompt

**G. Market Pulse Chart**:
- Doughnut chart of trending skills
- Top 10 skills from recent job postings
- Market insights summary

**H. Skill Gap Analysis Chart**:
- Horizontal bar chart showing required skills
- Color-coded: skills user has vs. skills to learn
- Quick insights panel (coverage %, skills to learn, jobs analyzed)
- View detailed report button

**Key Features**:
```jsx
const Dashboard = () => {
  const { user, updateProfile, logout } = useAuth()
  const [trendingData, setTrendingData] = useState(null)
  const [gapAnalysisData, setGapAnalysisData] = useState({})
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  // Load trending market data
  useEffect(() => {
    const loadData = async () => {
      const result = await marketService.getTrendingData({ days: 30 })
      if (result.success) setTrendingData(result.data)
    }
    loadData()
  }, [])

  // Load skill gap analysis with retry logic
  useEffect(() => {
    const loadGapAnalysis = async () => {
      for (let attempt = 0; attempt < 6; attempt++) {
        const results = await Promise.all(
          user.target_roles.map(role => 
            skillsService.getSkillGapAnalysis(role, { days: 90 })
          )
        )
        
        const successful = results.filter(r => r.success)
        if (successful.length > 0) {
          setGapAnalysisData(/* process results */)
          break
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    if (user?.target_roles?.length > 0) loadGapAnalysis()
  }, [user?.target_roles])

  return (
    <div className="min-h-screen bg-primary-950">
      {/* Header, Stats, Charts */}
    </div>
  )
}
```

**Retry Logic**:
- Gap analysis may take time to process
- Retries up to 6 times with 5-second delays
- Shows loading state during retries
- Displays error with suggestions if all retries fail

---

### 6. Skill Gap Report Page

**File**: `src/pages/SkillGapReport.jsx`

**Purpose**: Detailed analysis of skill gaps for target roles

**Sections**:
- Role selector (if multiple target roles)
- Comprehensive skill gap chart
- Required skills breakdown table
- Missing skills priority list
- Skills user has (matched skills)
- Learning recommendations

---

### 7. Learning Roadmap Page

**File**: `src/pages/LearningRoadmap.jsx`

**Purpose**: Personalized learning paths based on skill gaps

**Features**:
- Learning paths for each missing skill
- Curated resource recommendations
- Resource filtering (Documentation, Video, Course, Book)
- External links to learning materials
- Progress tracking

---

### 8. Project Recommendations Page

**File**: `src/pages/ProjectRecommendations.jsx`

**Purpose**: Suggest projects to build skills

**Features**:
- Projects matched to user skills
- Skill-building project ideas
- Difficulty levels (Beginner, Intermediate, Advanced)
- Technology stack information
- Project descriptions and goals

---

## Layout Components

### 1. AuthLayout

**File**: `src/components/layout/AuthLayout.jsx`

**Purpose**: Shared layout for login/signup pages

**Features**:
- Centered form container
- Brand logo/title
- Consistent styling
- Responsive design

```jsx
const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center">
      <div className="max-w-md w-full bg-primary-900 rounded-lg p-8 shadow-xl">
        <h1 className="text-gradient text-2xl font-bold mb-6">{title}</h1>
        {children}
      </div>
    </div>
  )
}
```

### 2. ProtectedRoute

**Already covered in Route Protection section above**

---

## Feature Components

### 1. Learning Components

**ResourceCard** (`src/components/learning/ResourceCard.jsx`):
- Displays individual learning resource
- Shows title, description, type icon
- External link button
- Domain extraction from URL

**SkillLearningPath** (`src/components/learning/SkillLearningPath.jsx`):
- Groups resources by skill
- Progress indicator
- Expandable/collapsible sections

---

### 2. Project Components

**ProjectCard** (`src/components/projects/ProjectCard.jsx`):
- Project title and description
- Difficulty badge
- Technology tags
- Estimated time
- "View Details" button

```jsx
const ProjectCard = ({ project }) => {
  return (
    <Card className="p-6 bg-primary-800 hover:border-accent-500">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{project.title}</h3>
        <Badge variant={project.difficulty}>{project.difficulty}</Badge>
      </div>
      
      <p className="text-gray-400 mb-4">{project.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {project.technologies.map(tech => (
          <span key={tech} className="px-3 py-1 bg-primary-700 rounded-full text-sm">
            {tech}
          </span>
        ))}
      </div>
      
      <Button variant="outline">View Details</Button>
    </Card>
  )
}
```

---

### 3. Chart Components

**TrendingSkillsChart** (`src/components/charts/TrendingSkillsChart.jsx`):
- Doughnut chart for trending skills
- Dark theme colors
- Interactive tooltips
- Loading and error states
- Empty state UI

**SkillGapChart** (`src/components/charts/SkillGapChart.jsx`):
- Horizontal bar chart for skill gaps
- Color-coded bars (skills you have vs. skills to learn)
- Dynamic height based on skill count
- Percentage labels

---

## Component Communication Patterns

### Props Flow
```
App.jsx (Router)
  └─> Dashboard.jsx
       ├─> TrendingSkillsChart (data, loading, error)
       ├─> SkillGapChart (data, loading, error)
       └─> Modal (isOpen, onClose)
```

### Context Usage
```
AuthContext (Global State)
  ├─> user (profile data)
  ├─> loading (auth check in progress)
  ├─> login(email, password)
  ├─> logout()
  └─> updateProfile(data)

Components consuming context:
  - Dashboard
  - ProtectedRoute
  - Navbar (profile display)
  - All protected pages
```

---

## Next Section

**Part 3**: Services, API Integration, and State Management

[Continue to FRONTEND_DOCUMENTATION_PART3.md →](./FRONTEND_DOCUMENTATION_PART3.md)
