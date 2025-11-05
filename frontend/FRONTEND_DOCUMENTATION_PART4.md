# Frontend Documentation - Part 4: UI Components, Charts & Styling

## Table of Contents
1. [UI Component Library](#ui-component-library)
2. [Chart Components](#chart-components)
3. [Tailwind CSS Configuration](#tailwind-css-configuration)
4. [Animation System](#animation-system)

---

## UI Component Library

### Design System Overview

The UI components follow a **dark theme design** with the following principles:
- **Consistency**: Reusable components with standardized props
- **Accessibility**: ARIA labels, keyboard navigation
- **Responsiveness**: Mobile-first approach
- **Visual Hierarchy**: Clear typography and spacing
- **Animation**: Smooth transitions with Framer Motion

---

### 1. Button Component

**File**: `src/components/ui/Button.jsx`

**Variants**:
- `primary`: Bright accent color (yellow)
- `secondary`: Coral/red accent
- `outline`: Transparent with border
- `ghost`: Transparent, minimal styling

**Sizes**:
- `sm`: Small (padding: 2-3)
- `md`: Medium (padding: 3-4) [default]
- `lg`: Large (padding: 4-6)

**Usage**:
```jsx
<Button 
  variant="primary" 
  size="md" 
  onClick={handleClick}
  loading={isLoading}
  disabled={false}
  className="w-full"
>
  Submit
</Button>
```

**Features**:
- Loading spinner state
- Disabled state styling
- Icon support (prefix/suffix)
- Full width option
- Click event handling

**Example Implementation**:
```jsx
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseStyles = 'rounded-lg font-semibold transition-all duration-200 flex items-center justify-center'
  
  const variantStyles = {
    primary: 'bg-accent-500 hover:bg-accent-600 text-primary-900',
    secondary: 'bg-highlight-500 hover:bg-highlight-600 text-white',
    outline: 'border-2 border-accent-500 text-accent-500 hover:bg-accent-500/10',
    ghost: 'text-gray-400 hover:text-white hover:bg-primary-800'
  }
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  }
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : children}
    </button>
  )
}
```

---

### 2. Card Component

**File**: `src/components/ui/Card.jsx`

**Purpose**: Container component with consistent styling

**Features**:
- Dark background with border
- Hover effects (optional)
- Padding options
- Sub-components: `Card.Header`, `Card.Title`, `Card.Body`, `Card.Footer`

**Usage**:
```jsx
<Card hover className="p-6 bg-primary-800">
  <Card.Header>
    <Card.Title>Skill Gap Analysis</Card.Title>
  </Card.Header>
  <Card.Body>
    {/* Content */}
  </Card.Body>
  <Card.Footer>
    <Button>View Details</Button>
  </Card.Footer>
</Card>
```

**Styling**:
```css
.card {
  background: #1a1a1a;  /* primary-800 */
  border: 1px solid #333333;  /* primary-700 */
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.card-hover:hover {
  border-color: #FEE715;  /* accent-500 */
}
```

---

### 3. Input Component

**File**: `src/components/ui/Input.jsx`

**Features**:
- Dark theme styling
- Error state
- Focus styles
- Prefix/suffix icons
- Different input types

**Usage**:
```jsx
<Input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  icon={<Mail className="w-5 h-5" />}
/>
```

**Styling**:
```jsx
const inputStyles = `
  w-full bg-primary-800 border border-primary-600 
  rounded-lg px-4 py-3 text-white 
  focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20
  placeholder:text-gray-400
  transition-all duration-200
  ${error ? 'border-red-500' : ''}
`
```

---

### 4. Modal Component

**File**: `src/components/ui/Modal.jsx`

**Features**:
- Overlay backdrop
- Close button
- Escape key to close
- Click outside to close (optional)
- Smooth animations

**Usage**:
```jsx
<Modal
  title="Edit Profile"
  open={isOpen}
  onClose={() => setIsOpen(false)}
>
  <div className="space-y-4">
    {/* Modal content */}
  </div>
</Modal>
```

**Implementation**:
```jsx
const Modal = ({ title, open, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-primary-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {children}
      </motion.div>
    </div>
  )
}
```

---

### 5. LoadingSpinner Component

**File**: `src/components/ui/LoadingSpinner.jsx`

**Variants**:
- Inline spinner
- Overlay spinner (full screen)
- Different sizes (sm, md, lg)

**Usage**:
```jsx
{/* Inline loading */}
{loading && <LoadingSpinner size="lg" text="Loading data..." />}

{/* Overlay loading */}
<LoadingSpinner overlay text="Processing..." />
```

**Implementation**:
```jsx
const LoadingSpinner = ({ size = 'md', text = '', overlay = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const spinner = (
    <div className="flex flex-col items-center space-y-3">
      <div className={`${sizeClasses[size]} border-4 border-accent-500 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-primary-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}
```

---

### 6. Badge Component

**File**: `src/components/ui/Badge.jsx`

**Variants**:
- `success`: Green
- `warning`: Yellow
- `error`: Red
- `info`: Blue
- `default`: Gray

**Usage**:
```jsx
<Badge variant="success">Completed</Badge>
<Badge variant="warning">In Progress</Badge>
<Badge variant="error">Missing</Badge>
```

**Styling**:
```jsx
const variantStyles = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  default: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}
```

---

### 7. SkillsModal Component

**File**: `src/components/ui/SkillsModal.jsx`

**Purpose**: Specialized modal for managing skills/roles

**Features**:
- Search/add skills
- Display current skills as tags
- Remove skills
- Save changes
- Skill suggestions

**Usage**:
```jsx
<SkillsModal
  title="Manage Skills"
  open={isOpen}
  onClose={() => setIsOpen(false)}
  items={skills}
  onAdd={addSkill}
  onRemove={removeSkill}
  onSave={handleSave}
  inputValue={skillInput}
  onInputChange={setSkillInput}
  suggestions={COMMON_SKILLS}
  saving={saving}
/>
```

**Key Features**:
- Tag-based skill display
- Autocomplete suggestions
- Add/remove functionality
- Save button with loading state

---

## Chart Components

### 1. TrendingSkillsChart

**File**: `src/components/charts/TrendingSkillsChart.jsx`

**Purpose**: Doughnut chart showing trending skills from job market

**Props**:
- `data`: Array of { skill, count, percentage }
- `loading`: Boolean loading state
- `error`: Error message or null
- `title`: Chart title
- `height`: Chart height in pixels

**Usage**:
```jsx
<TrendingSkillsChart
  data={trendingData.top_skills}
  loading={loading}
  error={error}
  title="Top Skills in Demand"
  height={400}
/>
```

**Chart Configuration**:
```javascript
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: title,
      color: '#F7FAFC',  // Light text
      font: { size: 18, weight: 'bold' }
    },
    legend: {
      position: 'right',
      labels: {
        color: '#E2E8F0',
        font: { size: 12 },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: '#2D3748',  // Dark background
      titleColor: '#F7FAFC',
      bodyColor: '#E2E8F0',
      borderColor: '#4FD1C5',
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        label: function(context) {
          const skill = context.label
          const count = context.parsed
          const percentage = context.dataset.percentages[context.dataIndex]
          return `${skill}: ${count} jobs (${percentage.toFixed(1)}%)`
        }
      }
    }
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 1000,
    easing: 'easeInOutQuart'
  }
}
```

**Color Palette** (Dark Theme Optimized):
```javascript
const colors = [
  '#4FD1C5',  // Primary teal
  '#F6E05E',  // Gold
  '#68D391',  // Green
  '#63B3ED',  // Blue
  '#F687B3',  // Pink
  '#9F7AEA',  // Purple
  '#FBB6CE',  // Light pink
  '#FEB2B2',  // Light red
  '#C6F6D5',  // Light green
  '#BEE3F8',  // Light blue
  '#FEEBC8',  // Light orange
  '#E9D8FD',  // Light purple
]
```

**States**:

**Loading State**:
```jsx
if (loading) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <LoadingSpinner size="lg" />
      <p className="text-gray-400 mt-4">Loading trending skills...</p>
    </div>
  )
}
```

**Error State**:
```jsx
if (error) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" style={{ height }}>
      <svg className="w-12 h-12 text-red-400 mx-auto mb-4">
        {/* Error icon */}
      </svg>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">
        Unable to Load Chart
      </h3>
      <p className="text-gray-400 text-sm">{error}</p>
    </div>
  )
}
```

**Empty State**:
```jsx
if (!data || data.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <svg className="w-12 h-12 text-gray-400">{/* Chart icon */}</svg>
      <p className="text-gray-400">No data available</p>
    </div>
  )
}
```

---

### 2. SkillGapChart

**File**: `src/components/charts/SkillGapChart.jsx`

**Purpose**: Horizontal bar chart showing skill gaps for a role

**Props**:
- `data`: Gap analysis data with required_skills array
- `loading`: Boolean
- `error`: Error message
- `title`: Chart title
- `role`: Target role name
- `height`: Dynamic height based on skill count

**Data Structure**:
```javascript
{
  role: "Software Engineer",
  required_skills: [
    { 
      skill: "Python", 
      percentage: 75.5,
      user_has: true,
      technology_slug: "python"
    },
    {
      skill: "JavaScript",
      percentage: 68.2,
      user_has: false,
      technology_slug: "javascript"
    }
    // ...
  ],
  coverage_percentage: 45.5,
  missing_skills: ["JavaScript", "Docker"],
  total_postings_analyzed: 150
}
```

**Chart Configuration**:
```javascript
const options = {
  indexAxis: 'y',  // Horizontal bars
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#E2E8F0',
        font: { size: 12 },
        usePointStyle: true
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const dataset = context.dataset.label
          const value = context.parsed.x
          return `${dataset}: ${value.toFixed(1)}% of jobs require this`
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      max: 100,
      ticks: {
        color: '#A0AEC0',
        callback: (value) => `${value}%`
      },
      grid: {
        color: '#2D3748'
      }
    },
    y: {
      stacked: true,
      ticks: {
        color: '#E2E8F0',
        font: { size: 11 }
      },
      grid: {
        display: false
      }
    }
  }
}
```

**Color Coding**:
- **Skills You Have**: Teal (#4FD1C5)
- **Skills to Learn**: Gold (#F6E05E)

**Dynamic Height**:
```jsx
height={Math.max(500, (data.required_skills.length || 10) * 35)}
```

---

## Tailwind CSS Configuration

**File**: `tailwind.config.js`

### Custom Color Palette

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f5f5f5',
        100: '#e5e5e5',
        200: '#cccccc',
        300: '#b3b3b3',
        400: '#999999',
        500: '#666666',
        600: '#4d4d4d',
        700: '#333333',      // Card borders
        800: '#1a1a1a',      // Card backgrounds
        900: '#101820',      // Dark charcoal
        950: '#0a0c10',      // Deeper charcoal (page bg)
      },
      accent: {
        50: '#fffef0',
        100: '#fffce0',
        200: '#fff9c2',
        300: '#fff6a3',
        400: '#fff385',
        500: '#FEE715',      // Bright yellow (primary CTA)
        600: '#e5d013',
        700: '#ccb911',
        800: '#b3a20f',
        900: '#998b0d',
      },
      highlight: {
        50: '#fff5f5',
        100: '#ffe5e5',
        200: '#ffcccc',
        300: '#ffb3b3',
        400: '#ff9999',
        500: '#F96167',      // Light coral (secondary accent)
        600: '#e05056',
        700: '#c74045',
        800: '#ae3034',
        900: '#952023',
      },
      secondary: {
        500: '#F9E795',      // Pastel yellow
      }
    }
  }
}
```

### Typography

```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
```

### Custom Spacing

```javascript
spacing: {
  '18': '4.5rem',
  '88': '22rem',
}
```

### Animations

```javascript
animation: {
  'fade-in': 'fadeIn 0.5s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
}

keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { transform: 'translateY(10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
}
```

### Global Styles

**File**: `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-primary-950 text-white;
  }
}

@layer components {
  /* Text gradient for headings */
  .text-gradient {
    @apply bg-gradient-to-r from-accent-500 via-highlight-500 to-accent-500;
    @apply bg-clip-text text-transparent;
  }
  
  /* Card hover effect */
  .card-hover {
    @apply transition-all duration-200;
    @apply hover:border-accent-500 hover:shadow-lg hover:shadow-accent-500/10;
  }
  
  /* Input focus styles */
  .input-focus {
    @apply focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20;
  }
}

@layer utilities {
  /* Scrollbar styling */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

## Animation System

### Framer Motion Variants

**File**: `src/utils/constants.js`

```javascript
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  
  slideInRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  }
}
```

### Usage Examples

**Page Transitions**:
```jsx
<motion.div
  variants={ANIMATION_VARIANTS.fadeIn}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {/* Page content */}
</motion.div>
```

**Staggered List Items**:
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ staggerChildren: 0.1 }}
>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      variants={ANIMATION_VARIANTS.slideUp}
      transition={{ delay: index * 0.05 }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

**Hover Animations**:
```jsx
<motion.div
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  className="card"
>
  {/* Card content */}
</motion.div>
```

---

## Responsive Design

### Breakpoints

Tailwind CSS default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Examples

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>

<h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">
  {/* Responsive font sizes */}
</h1>

<div className="hidden md:flex items-center">
  {/* Hidden on mobile, visible on tablet+ */}
</div>
```

---

## Next Section

**Part 5**: Build, Deployment, Testing, and Best Practices

[Continue to FRONTEND_DOCUMENTATION_PART5.md →](./FRONTEND_DOCUMENTATION_PART5.md)
