// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    REFRESH: '/auth/refresh'
  },
  MARKET: {
    TRENDING: '/market/trending'
  },
  SKILLS: {
    GAP_ANALYSIS: '/skills/gap-analysis'
  },
  LEARNING: {
    ROADMAP: '/learning/roadmap',
    RESOURCES: '/learning/resources',
    SEARCH: '/learning/resources/search'
  },
  PROJECTS: {
    RECOMMENDATIONS: '/projects/recommendations',
    SKILL_BUILDING: '/projects/skill-building',
    SEARCH: '/projects/search',
    ALL: '/projects/all'
  }
}

// Experience Levels (academic journey stages)
export const EXPERIENCE_LEVELS = [
  { value: '12th Pass Out', label: '12th Pass Out' },
  { value: '1st Year', label: '1st Year' },
  { value: '2nd Year', label: '2nd Year' },
  { value: '3rd Year', label: '3rd Year' },
  { value: '4th Year', label: '4th Year' }
]

// Difficulty Levels for Projects
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
}

// Resource Types for Learning Materials
export const RESOURCE_TYPES = {
  DOCUMENTATION: 'Documentation',
  VIDEO: 'Video',
  COURSE: 'Course',
  BOOK: 'Book'
}

// Common Skills for Onboarding
export const COMMON_SKILLS = [
  // Programming Languages
  'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
  
  // Web Technologies
  'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Next.js', 'Nuxt.js', 'HTML', 'CSS', 'SASS',
  
  // Backend & Databases
  'Django', 'Flask', 'FastAPI', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs',
  
  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'Terraform', 'Ansible',
  
  // Data & Analytics
  'SQL', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Tableau', 'Power BI', 'Apache Spark',
  
  // Mobile Development
  'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin',
  
  // Design & UX
  'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'UI/UX Design', 'Wireframing', 'Prototyping',
  
  // Project Management
  'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'Trello', 'Asana', 'Project Management',
  
  // Soft Skills
  'Leadership', 'Communication', 'Problem Solving', 'Team Management', 'Strategic Planning', 'Mentoring'
]

// Common Target Roles (Optimized for TheirStack API & 2025 Job Market)
// ⭐ = Trending/High Demand | ✅ = Verified TheirStack Success
export const COMMON_ROLES = [
  // 🔥 HOT Roles in 2025 (Top Picks)
  'Software Engineer', // ✅ Most common, always works
  'AI Engineer', // ⭐ AI boom - extremely high demand
  'Machine Learning Engineer', // ⭐ AI/ML explosion
  'Data Engineer', // ⭐ Data infrastructure critical
  'Cloud Engineer', // ⭐ Cloud migration ongoing
  'Platform Engineer', // ⭐ Modern DevOps evolution
  'Solutions Architect', // ⭐ Enterprise architecture growing
  
  // 💻 Software Engineering
  'Backend Developer', // ✅ Verified to work well
  'Frontend Developer', // ✅ Verified to work well
  'Full Stack Developer', // ✅ High demand, broad
  'Mobile Developer', // iOS/Android apps
  'iOS Developer', // Apple ecosystem
  'Android Developer', // Google ecosystem
  'React Developer', // Frontend specialization
  'Node.js Developer', // Backend specialization
  
  // ☁️ Cloud & Infrastructure
  'DevOps Engineer', // ✅ Verified to work well
  'Site Reliability Engineer', // SRE practices
  'Infrastructure Engineer', // Cloud infrastructure
  'Kubernetes Engineer', // Container orchestration
  'AWS Solutions Architect', // Cloud architecture
  
  // 🤖 AI & Data Science
  'Data Scientist', // Analytics & ML
  'ML Ops Engineer', // ⭐ ML deployment & ops
  'NLP Engineer', // Natural language processing
  'Computer Vision Engineer', // Image/video AI
  'Data Analyst', // Business insights
  'Analytics Engineer', // Modern data role
  
  // 🔒 Security & Quality
  'Security Engineer', // Cybersecurity critical
  'Penetration Tester', // Ethical hacking
  'QA Engineer', // Quality assurance
  'Test Automation Engineer', // Automated testing
  
  // 🎨 Product & Design
  'Product Manager', // Product strategy
  'UX Designer', // User experience
  'UI Designer', // User interface
  'Product Designer', // End-to-end design
  
  // 🚀 Emerging Tech
  'Blockchain Developer', // ⭐ Web3 & crypto
  'Game Developer', // Gaming industry
  'AR/VR Developer', // ⭐ Augmented/Virtual reality
  'Embedded Systems Engineer', // IoT devices
  
  // 📊 Business & Analytics
  'Business Analyst', // Requirements analysis
  'Business Intelligence Analyst', // BI tools
  'Data Warehouse Engineer', // Data storage
  
  // 🎓 Leadership & Specialized
  'Engineering Manager', // Team leadership
  'Technical Lead', // Tech leadership
  'Staff Engineer', // Senior IC track
  'Principal Engineer', // Senior IC track
  'Solutions Architect', // Enterprise solutions
  'Technical Architect', // System design
  'Developer Advocate', // Developer relations
  'Sales Engineer', // Technical sales
]

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Please enter a valid email address'
    }
  },
  PASSWORD: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters long'
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  },
  FULL_NAME: {
    required: 'Full name is required',
    minLength: {
      value: 2,
      message: 'Full name must be at least 2 characters long'
    }
  }
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'career_navigator_token',
  USER: 'career_navigator_user',
  REFRESH_TOKEN: 'career_navigator_refresh_token'
}

// Animation Variants
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

// Onboarding Steps
export const ONBOARDING_STEPS = [
  {
    id: 'skills',
    title: 'Select Your Skills',
    description: 'Choose the skills you currently have or want to develop',
    icon: '🛠️'
  },
  {
    id: 'roles',
    title: 'Target Roles',
    description: 'What roles are you interested in pursuing?',
    icon: '🎯'
  },
  {
    id: 'experience',
    title: 'Experience & Location',
    description: 'Tell us about your experience level and preferred location',
    icon: '📍'
  }
]
