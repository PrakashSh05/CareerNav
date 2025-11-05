# Frontend Documentation - Part 5: Build, Deployment & Best Practices

## Table of Contents
1. [Build Process](#build-process)
2. [Deployment](#deployment)
3. [Testing Strategy](#testing-strategy)
4. [Performance Optimization](#performance-optimization)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Build Process

### Development Build

**Start development server**:
```bash
npm run dev
```

**Features**:
- Hot Module Replacement (HMR)
- Fast Refresh for React components
- Source maps enabled
- Runs on port **3000**
- Proxies API requests to backend (port 8000)

**Vite Dev Server Configuration**:
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

---

### Production Build

**Build for production**:
```bash
npm run build
```

**Output**:
- Compiled files in `dist/` directory
- Minified JavaScript and CSS
- Optimized assets
- Source maps (for debugging)

**Build Configuration**:
```javascript
// vite.config.js
build: {
  sourcemap: true,
  outDir: 'dist',
  assetsDir: 'assets',
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'chart-vendor': ['chart.js', 'react-chartjs-2'],
        'animation-vendor': ['framer-motion']
      }
    }
  }
}
```

**Chunk Splitting Benefits**:
- Smaller initial bundle size
- Better caching (vendor chunks change less frequently)
- Faster page loads

---

### Preview Production Build

**Test production build locally**:
```bash
npm run preview
```

This starts a local server serving the built files from `dist/`.

---

## Deployment

### 1. Netlify Deployment

**Configuration File**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_API_BASE_URL = "https://your-api-domain.com"
```

**Deployment Steps**:

1. **Install Netlify CLI** (optional):
   ```bash
   npm install -g netlify-cli
   ```

2. **Build project**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Set environment variables** in Netlify dashboard:
   - `VITE_API_BASE_URL`: Your backend API URL

**GitHub Integration**:
- Connect Netlify to GitHub repository
- Auto-deploy on push to main branch
- Preview deployments for pull requests

---

### 2. Vercel Deployment

**Configuration File**: `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://your-api-domain.com"
  }
}
```

**Deployment Steps**:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

---

### 3. Static File Hosting (S3, Azure Blob, etc.)

**Build and deploy**:
```bash
# Build
npm run build

# Upload dist/ folder to static hosting service
aws s3 sync dist/ s3://your-bucket-name --delete
```

**Important**: Configure static hosting to redirect all requests to `index.html` for client-side routing to work.

---

### 4. Docker Deployment

**Dockerfile**:
```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and run**:
```bash
# Build image
docker build -t career-navigator-frontend .

# Run container
docker run -p 80:80 career-navigator-frontend
```

---

## Testing Strategy

### 1. Manual Testing Checklist

**Authentication Flow**:
- ✅ User can sign up with valid credentials
- ✅ User receives validation errors for invalid input
- ✅ User can log in with correct credentials
- ✅ User is redirected to dashboard after login
- ✅ User can log out successfully
- ✅ Token refresh works on 401 errors

**Dashboard**:
- ✅ Stats cards display correct counts
- ✅ Charts load and render correctly
- ✅ Edit profile modal works
- ✅ Skills/roles can be added and removed
- ✅ Data persists after page reload

**Skill Gap Analysis**:
- ✅ Gap analysis loads for target roles
- ✅ Retry logic works for pending analysis
- ✅ Error messages display with suggestions
- ✅ Chart displays skills correctly color-coded

**Learning Roadmap**:
- ✅ Learning paths load for missing skills
- ✅ Resources can be filtered by type
- ✅ External links open correctly

**Project Recommendations**:
- ✅ Projects load based on user skills
- ✅ Difficulty filters work
- ✅ Project cards display all information

---

### 2. Component Testing (Future Implementation)

**Recommended Tools**:
- **Vitest**: Fast unit test runner for Vite
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking

**Example Test**:
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Button from '../components/ui/Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

---

### 3. End-to-End Testing (Future Implementation)

**Recommended Tool**: Playwright or Cypress

**Example E2E Test**:
```javascript
import { test, expect } from '@playwright/test'

test('complete user journey', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000')
  
  // Sign up
  await page.click('text=Sign Up')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'SecurePassword123')
  await page.fill('input[name="full_name"]', 'Test User')
  await page.click('button:has-text("Create Account")')
  
  // Onboarding
  await page.waitForURL('**/onboarding')
  await page.click('text=Python')
  await page.click('text=Next')
  
  // Verify redirect to dashboard
  await page.waitForURL('**/dashboard')
  expect(await page.textContent('h2')).toContain('Welcome back')
})
```

---

## Performance Optimization

### 1. Code Splitting

**Lazy Loading Routes**:
```jsx
import { lazy, Suspense } from 'react'
import LoadingSpinner from './components/ui/LoadingSpinner'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const SkillGapReport = lazy(() => import('./pages/SkillGapReport'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner overlay />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/skill-gap-report" element={<SkillGapReport />} />
      </Routes>
    </Suspense>
  )
}
```

**Benefits**:
- Reduces initial bundle size
- Faster first page load
- Components loaded on-demand

---

### 2. Image Optimization

**Use Optimized Formats**:
- WebP for modern browsers
- Fallback to PNG/JPEG
- Lazy loading images

**Example**:
```jsx
<img 
  src="image.webp" 
  alt="Description"
  loading="lazy"
  width="800"
  height="600"
/>
```

---

### 3. Memoization

**Avoid Unnecessary Re-renders**:

```jsx
import { useMemo, useCallback } from 'react'

const Dashboard = () => {
  const [data, setData] = useState([])
  
  // Memoize expensive computation
  const processedData = useMemo(() => {
    return data.map(/* expensive transformation */)
  }, [data])
  
  // Memoize callback function
  const handleClick = useCallback(() => {
    // Handle click
  }, [/* dependencies */])
  
  return <ChildComponent data={processedData} onClick={handleClick} />
}
```

---

### 4. API Request Optimization

**Debounce Search Inputs**:
```jsx
import { useState, useEffect } from 'react'

const SearchComponent = () => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500)  // 500ms delay

    return () => clearTimeout(timer)
  }, [query])

  // Trigger search with debounced query
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery)
    }
  }, [debouncedQuery])

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

**Request Caching**:
```jsx
const cache = new Map()

const fetchWithCache = async (url) => {
  if (cache.has(url)) {
    return cache.get(url)
  }
  
  const response = await fetch(url)
  const data = await response.json()
  
  cache.set(url, data)
  return data
}
```

---

## Best Practices

### 1. Component Organization

**File Structure**:
```
ComponentName/
  ├── index.jsx           # Main component
  ├── ComponentName.css   # Component-specific styles (if not using Tailwind)
  └── ComponentName.test.jsx  # Tests
```

**Naming Conventions**:
- **Components**: PascalCase (`Button.jsx`, `SkillGapChart.jsx`)
- **Utilities**: camelCase (`api.js`, `validation.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`, `COMMON_SKILLS`)

---

### 2. State Management

**When to use different state types**:

**Local State** (useState):
- Form inputs
- UI toggles (modals, dropdowns)
- Component-specific data

**Context API** (useContext):
- Global user authentication
- Theme preferences
- Language settings

**Server State** (React Query - future):
- API data
- Cached responses
- Background data synchronization

---

### 3. Error Handling

**Component Error Boundary**:
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
            <p className="text-gray-400 mt-2">Please refresh the page</p>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**API Error Handling**:
```jsx
const fetchData = async () => {
  try {
    setLoading(true)
    setError(null)
    
    const result = await apiCall()
    
    if (result.success) {
      setData(result.data)
    } else {
      setError(result.error)
    }
  } catch (error) {
    setError('Failed to fetch data')
    console.error(error)
  } finally {
    setLoading(false)
  }
}
```

---

### 4. Accessibility

**Best Practices**:

✅ **Semantic HTML**:
```jsx
<nav>
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<main>
  <h1>Page Title</h1>
  <section>...</section>
</main>
```

✅ **ARIA Labels**:
```jsx
<button aria-label="Close modal" onClick={onClose}>
  <X className="w-6 h-6" />
</button>

<input 
  type="email" 
  aria-label="Email address" 
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby="email-error"
/>
{error && <p id="email-error" role="alert">{error}</p>}
```

✅ **Keyboard Navigation**:
```jsx
<div 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Clickable element
</div>
```

✅ **Focus Management**:
```jsx
const Modal = ({ open, onClose }) => {
  const firstFocusableRef = useRef(null)

  useEffect(() => {
    if (open) {
      firstFocusableRef.current?.focus()
    }
  }, [open])

  return (
    <div role="dialog" aria-modal="true">
      <button ref={firstFocusableRef} onClick={onClose}>
        Close
      </button>
      {/* Modal content */}
    </div>
  )
}
```

---

### 5. Security Best Practices

✅ **XSS Prevention**:
```jsx
// React automatically escapes content
<div>{userInput}</div>  // Safe

// Avoid dangerouslySetInnerHTML unless necessary
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

✅ **CSRF Protection**:
- Use JWT tokens (stored in localStorage, not cookies)
- Validate requests on backend

✅ **Secure Token Storage**:
```javascript
// Store tokens in localStorage (not cookies for SPA)
localStorage.setItem('token', accessToken)

// Clear tokens on logout
localStorage.removeItem('token')
localStorage.removeItem('refresh_token')
localStorage.removeItem('user')
```

✅ **Environment Variables**:
```javascript
// Never commit .env files
// Use VITE_ prefix for public variables
const API_URL = import.meta.env.VITE_API_BASE_URL

// Sensitive keys should only be on backend
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Error**: `Module not found`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

#### 2. CORS Errors

**Error**: `Access-Control-Allow-Origin header`

**Solution**: Configure proxy in `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true
    }
  }
}
```

Or configure CORS on backend:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

#### 3. Authentication Token Expired

**Error**: `401 Unauthorized` on every request

**Solution**: Check token refresh logic in `api.js` interceptor, or manually clear and re-login:
```javascript
localStorage.clear()
window.location.href = '/login'
```

---

#### 4. Charts Not Rendering

**Error**: Charts appear blank or throw errors

**Solution**:
- Ensure Chart.js components are registered:
  ```javascript
  import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
  ChartJS.register(ArcElement, Tooltip, Legend)
  ```
- Check data format matches expected structure
- Verify container has defined height

---

#### 5. Slow Page Load

**Solution**:
- Enable code splitting (lazy loading)
- Optimize images (use WebP, compress)
- Check for large dependencies
- Use React DevTools Profiler to identify slow components

---

#### 6. Environment Variables Not Loading

**Error**: `import.meta.env.VITE_API_BASE_URL` is undefined

**Solution**:
- Ensure `.env` file is in project root
- Variables must start with `VITE_`
- Restart dev server after changing `.env`

---

## Development Tools

### Recommended VS Code Extensions

- **ES7+ React/Redux/React-Native snippets**: Quick component templates
- **Tailwind CSS IntelliSense**: Auto-complete Tailwind classes
- **ESLint**: Code quality and style checking
- **Prettier**: Code formatting
- **Auto Rename Tag**: Rename paired HTML/JSX tags
- **Path Intellisense**: Auto-complete file paths

---

### Browser DevTools

**React Developer Tools**:
- Install Chrome/Firefox extension
- Inspect component tree
- View props and state
- Profile performance

**Redux DevTools** (if using Redux):
- Track state changes
- Time-travel debugging

---

## Maintenance Checklist

### Regular Updates

✅ **Dependencies**:
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update to latest versions (careful!)
npm install <package>@latest
```

✅ **Security Audits**:
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

### Performance Monitoring

✅ **Lighthouse Audit** (Chrome DevTools):
- Performance score
- Accessibility score
- Best practices
- SEO

✅ **Bundle Size Analysis**:
```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer()
  ]
})

# Build and view report
npm run build
open stats.html
```

---

## Conclusion

This concludes the comprehensive frontend documentation for Career Navigator. You now have:

✅ **Complete architecture overview**  
✅ **Detailed component documentation**  
✅ **Service layer and API integration guide**  
✅ **Styling and animation system**  
✅ **Deployment strategies**  
✅ **Best practices and troubleshooting**  

For quick navigation between documentation sections, refer to [FRONTEND_DOCUMENTATION_README.md](./FRONTEND_DOCUMENTATION_README.md).

---

## Additional Resources

**Official Documentation**:
- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Chart.js](https://www.chartjs.org/docs/)
- [Axios](https://axios-http.com/docs/)

**Community Resources**:
- [React Patterns](https://reactpatterns.com/)
- [JavaScript Info](https://javascript.info/)
- [Web.dev](https://web.dev/)

**Backend Documentation**:
- See `backend/DOCUMENTATION.md` for API reference
- See `backend/DOCUMENTATION_README.md` for backend navigation guide
