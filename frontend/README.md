# Career Navigator Frontend

A modern React frontend for the Career Navigator platform - your AI-powered career guidance application.

## 🚀 Features

- **Modern React Architecture**: Built with React 18, Vite, and TypeScript support
- **Beautiful Dark UI**: Custom dark theme with vibrant teal and warm gold accents
- **Smooth Animations**: Powered by Framer Motion for delightful user interactions
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Authentication Flow**: Complete login, signup, and onboarding experience
- **Market Pulse Dashboard**: Real-time job market insights with trending skills visualization
- **Skill Gap Analysis**: Personalized skill gap analysis for target roles with interactive charts
- **Form Validation**: Robust form handling with React Hook Form
- **API Integration**: Seamless integration with FastAPI backend
- **State Management**: Context-based authentication state management

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS with custom dark theme
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Chart.js with react-chartjs-2 for data visualization
- **Build Tool**: Vite

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- npm or yarn package manager
- Career Navigator backend running on `http://localhost:8000`

## 🚀 Getting Started

### 1. Clone and Navigate

```bash
cd Career_Navigator/frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Copy the environment example file and configure it:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Recommended: Use Vite proxy for local development
VITE_API_BASE_URL=/api
VITE_NODE_ENV=development

# Alternative: Direct backend connection
# VITE_API_BASE_URL=http://localhost:8000
```

**Note**: The Vite proxy is configured to forward requests from `/api/*` to `http://localhost:8000/*`. This helps avoid CORS issues during development and provides a more production-like setup.

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements (Button, Input, Card, etc.)
│   ├── charts/         # Chart visualization components
│   │   ├── TrendingSkillsChart.jsx  # Market trends doughnut chart
│   │   ├── SkillGapChart.jsx        # Skill gap bar chart
│   │   └── index.js                 # Chart components barrel export
│   └── layout/         # Layout components (AuthLayout, ProtectedRoute)
├── pages/              # Page components
│   ├── Login.jsx       # Login page
│   ├── Signup.jsx      # Registration page
│   ├── Onboarding.jsx  # Multi-step onboarding
│   ├── Dashboard.jsx   # Main dashboard with analytics
│   └── SkillGapReport.jsx # Detailed skill gap analysis
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── hooks/              # Custom React hooks
│   └── useAuth.js      # Authentication hook
├── services/           # API services
│   ├── api.js          # Base API configuration
│   ├── authService.js  # Authentication API calls
│   ├── marketService.js # Market analysis API calls
│   └── skillsService.js # Skills analysis API calls
├── utils/              # Utility functions
│   ├── constants.js    # App constants
│   └── validation.js   # Form validation helpers
├── App.jsx             # Main app component
├── main.jsx            # App entry point
└── index.css           # Global styles
```

## 🎨 Design System

### Color Palette

- **Primary**: Dark slate grey (#1A202C) - Main background and surfaces
- **Accent**: Vibrant teal (#4FD1C5) - Interactive elements and highlights
- **Highlight**: Warm gold (#F6E05E) - Special accents and success states

### Typography

- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700

### Components

All UI components are built with:
- Consistent spacing and sizing
- Dark theme optimized colors
- Smooth hover and focus states
- Accessibility considerations
- Responsive design patterns

## 🔐 Authentication Flow

### Registration Process
1. User fills out signup form with email, password, and full name
2. Form validation ensures password strength and email format
3. API call creates user account
4. Automatic login after successful registration
5. Redirect to onboarding flow

### Login Process
1. User enters email and password
2. Form validation and API authentication
3. JWT token storage in localStorage
4. User data caching for offline access
5. Redirect to dashboard or intended page

### Onboarding Flow
1. **Step 1**: Skills selection with search and custom skills
2. **Step 2**: Target roles selection with search functionality
3. **Step 3**: Experience level and location input
4. Profile update API call
5. Redirect to dashboard

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 API Integration

The frontend integrates with the FastAPI backend through:

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login (OAuth2 format)
- `GET /auth/me` - Get current user data
- `PUT /auth/me` - Update user profile

### Analytics Endpoints
- `GET /market/trending` - Get trending skills and locations from job market data
- `GET /skills/gap-analysis` - Analyze skill gaps for user's target roles

### Request/Response Handling
- Automatic JWT token attachment
- Request/response interceptors for error handling
- Token refresh logic
- Network error handling

## 🎯 Key Features

### Multi-step Onboarding
- Progressive skill and role selection
- Search functionality for skills and roles
- Custom skill/role addition
- Form validation and progress tracking

### Market Pulse Dashboard
- Real-time job market insights with trending skills visualization
- Interactive doughnut charts showing skill demand percentages
- Market analysis based on recent job postings from Indeed
- Data sourced from scraped job descriptions with AI-powered skill extraction

### Skill Gap Analysis
- Personalized skill gap analysis for each target role
- Interactive bar charts showing required skills vs user skills
- Coverage percentage and missing skills identification
- Detailed skill gap report page with actionable learning recommendations
- Analysis based on job market data with configurable time windows and thresholds

### Responsive Dashboard
- User profile overview with real-time market data
- Skills and target roles display with gap analysis integration
- Interactive charts and visualizations
- Modern card-based layout with smooth animations

### Form Validation
- Real-time validation feedback
- Password strength indicator
- Email format validation
- Custom validation rules

### Animation System
- Page transitions with Framer Motion
- Hover and click animations
- Loading states and spinners
- Smooth form interactions

## 🔒 Security Features

- JWT token management with refresh token support
- Automatic token refresh and session validation
- Protected route handling
- Input sanitization and validation
- HTTPS enforcement (production)

### Token Storage Security

**Current Implementation**: JWT tokens are stored in `localStorage` for simplicity and development speed.

**Security Considerations**:
- **localStorage Pros**: Persists across browser sessions, easy to implement, works with SPA architecture
- **localStorage Cons**: Vulnerable to XSS attacks, accessible to any JavaScript code on the page
- **httpOnly Cookies Alternative**: More secure against XSS, but requires CSRF protection and backend session management

**Future Enhancement**: Consider migrating to httpOnly cookies for production deployments:
```javascript
// Future implementation with httpOnly cookies
// - Backend sets httpOnly cookie on login
// - Frontend makes requests without manual token handling
// - Automatic CSRF protection required
// - Better security against XSS attacks
```

**Current Mitigation Strategies**:
- Input sanitization to prevent XSS
- Content Security Policy (CSP) headers
- Regular security audits of dependencies
- Secure token refresh flow to minimize exposure time

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` directory with optimized production files.

### Environment Variables

For production deployment, set:

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_NODE_ENV=production
```

### Dependencies

The application includes the following key dependencies:

```json
{
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "chartjs-adapter-date-fns": "^3.0.0"
}
```

**Chart.js Integration:**
- Interactive data visualizations with dark theme support
- Responsive charts that adapt to different screen sizes
- Custom color palettes optimized for the dark UI theme
- Smooth animations and hover effects for better user experience

**Chart Configuration:**
- Charts are configured with dark theme colors matching the application design
- Tooltips and legends use the established color palette (#4FD1C5 teal, #F6E05E gold)
- All charts are responsive and maintain aspect ratios across devices
- Error boundaries handle chart rendering failures gracefully

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for new components when possible
3. Ensure responsive design for all new features
4. Add proper error handling and loading states
5. Test authentication flows thoroughly

## 📝 Future Enhancements

- ✅ **Market analysis dashboard** - Completed with trending skills visualization
- ✅ **Skill gap analysis** - Completed with interactive charts and detailed reports
- ✅ **Data visualization charts** - Completed with Chart.js integration
- Learning path recommendations based on skill gaps
- Job matching algorithm with personalized scoring
- Real-time notifications for new opportunities
- Advanced filtering and search capabilities
- Export functionality for reports and analysis
- Location-based job market trends
- Salary insights and compensation analysis
- Career progression tracking and milestones

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**: Ensure the backend is running and CORS is properly configured

**Authentication Issues**: Check that JWT tokens are being stored and sent correctly

**Build Errors**: Clear node_modules and reinstall dependencies

**Styling Issues**: Ensure TailwindCSS is properly configured and imported

### Development Tips

- Use React Developer Tools for debugging
- Check browser console for API errors
- Verify environment variables are loaded
- Test authentication flows in incognito mode

## 📄 License

This project is part of the Career Navigator platform. All rights reserved.

---

Built with ❤️ using React, TailwindCSS, and Framer Motion
