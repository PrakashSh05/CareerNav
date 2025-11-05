# Career Navigator API

A comprehensive FastAPI backend for a career navigation platform that helps users discover learning resources, project ideas, and manage their professional development journey.

## Features

- **User Authentication**: JWT-based authentication with registration, login, and profile management
- **User Profiles**: Comprehensive user profiles with skills, target roles, and experience levels
- **Learning Resources**: Curated learning resources for various technical skills
- **Project Ideas**: Suggested projects to help users practice and demonstrate their skills
- **Job Data Collection**: Automated ingestion of job postings via TheirStack Jobs API with scheduled refreshes
- **Skill Extraction**: AI-powered skill extraction from job descriptions using spaCy NLP
- **Modern Architecture**: Clean architecture with separation of concerns
- **Database Integration**: MongoDB with Beanie ODM for async operations
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation

## Tech Stack

- **Framework**: FastAPI 0.104.1
- **Database**: MongoDB with Beanie ODM
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt via passlib
- **Validation**: Pydantic v2
- **ASGI Server**: Uvicorn
- **Environment Management**: python-dotenv
- **HTTP Client**: httpx 0.25+ with tenacity-powered retries for TheirStack API
- **Scheduling**: APScheduler 3.10+ for background ingestion and cleanup jobs
- **NLP Processing**: spaCy 3.7+ for skill extraction
- **Data Processing**: Pandas, NumPy for data analysis

## Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Application configuration & TheirStack settings
│   │   ├── database.py        # Database connection and setup
│   │   └── security.py        # JWT and password utilities
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py            # User model with Beanie
│   │   └── job_posting.py     # JobPosting model enriched with TheirStack data
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── market.py          # Market analytics endpoints
│   │   ├── skills.py          # Skill analysis endpoints
│   │   ├── learning.py        # Learning resources endpoints
│   │   └── projects.py        # Project recommendation endpoints
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py            # Pydantic schemas for auth
│   │   └── analytics.py       # Market analytics response models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py    # Business logic for authentication
│   │   ├── job_collection_service.py  # TheirStack-backed ingestion with skill extraction
│   │   ├── scheduler_service.py       # APScheduler orchestration
│   │   ├── theirstack_client.py       # Resilient TheirStack API client (httpx + tenacity)
│   │   └── skill_extractor.py # spaCy-based skill extraction with slug integration
│   ├── __init__.py
│   └── main.py                # FastAPI application entry point & scheduler bootstrap
├── learning_resources.json    # Curated learning resources
├── project_ideas.json         # Project suggestions
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Prerequisites

- Python 3.8 or higher
- MongoDB 4.4 or higher
- pip (Python package installer)
- spaCy English language model (for skill extraction)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Career_Navigator/backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install spaCy language model**
   ```bash
   python -m spacy download en_core_web_sm
   ```
   
   **Note**: This is required for the skill extraction functionality. If the model fails to install, the skill extractor will fall back to basic English processing.

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration (see `.env.example` for all keys):
   ```env
   # Core
   MONGODB_URI=mongodb://localhost:27017/career_navigator
   JWT_SECRET_KEY=your-super-secret-jwt-key-here-change-in-production
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
   APP_NAME=Career Navigator API
   APP_VERSION=1.0.0
   DEBUG=True
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

   # TheirStack API
   THEIR_STACK_API_KEY=your_api_key_here
   THEIR_STACK_BASE_URL=https://api.theirstack.com
   THEIR_STACK_TIMEOUT=30
   THEIR_STACK_MAX_RETRIES=3
   THEIR_STACK_RATE_LIMIT=300

   # Ingestion & Cleanup
   JOB_COLLECTION_SCHEDULE="0 2 * * *"  # Daily at 02:00
   MAX_JOBS_PER_SEARCH=100
   JOB_DATA_RETENTION_DAYS=90
   ```

## Database Setup

1. **Install MongoDB**
   - Download and install MongoDB from [official website](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud) by updating the `MONGODB_URI` in your `.env` file

2. **Start MongoDB service**
   ```bash
   # On Windows (if installed as service)
   net start MongoDB
   
   # On macOS with Homebrew
   brew services start mongodb/brew/mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   ```

3. **Verify connection**
   The application will automatically create the database and collections on first run.

## Running the Application

1. **Development server**
   ```bash
   # From the backend directory
   python -m app.main
   
   # Or using uvicorn directly
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Production server**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## TheirStack Data Ingestion

### Install spaCy Language Model

The skill extraction service enriches TheirStack responses with NLP-derived insights:

```bash
python -m spacy download en_core_web_sm
python -c "import spacy; spacy.load('en_core_web_sm'); print('spaCy model loaded successfully')"
```

### Configure TheirStack Access

1. Generate an API key from your TheirStack dashboard.
2. Copy `backend/.env.example` to `backend/.env` and populate the following keys:
   ```env
   THEIR_STACK_API_KEY=your_api_key_here
   THEIR_STACK_BASE_URL=https://api.theirstack.com
   THEIR_STACK_TIMEOUT=30
   THEIR_STACK_MAX_RETRIES=3
   THEIR_STACK_RATE_LIMIT=300
   JOB_COLLECTION_SCHEDULE="0 2 * * *"  # Daily at 02:00 local server time
   MAX_JOBS_PER_SEARCH=100
   JOB_DATA_RETENTION_DAYS=90
   ```
3. Adjust `JOB_COLLECTION_SCHEDULE` using standard cron syntax if you need a different cadence.

### Background Scheduler

- `app/services/scheduler_service.py` boots an APScheduler `AsyncIOScheduler` during FastAPI startup (`app/main.py`).
- Daily ingestion runs `JobCollectionService.collect_jobs_for_roles()` for curated roles and locations such as `"Software Engineer"` in `"United States"` / `"Remote"`.
- Weekly cleanup removes entries older than `JOB_DATA_RETENTION_DAYS`, keeping analytics focused on recent market data.
- Startup also performs a lightweight TheirStack connectivity check (1 result within the last 24 hours) and logs any authentication or retryable errors.

### Manual Seed (Recommended)

Before exposing analytics endpoints, run a one-time seed to prefill the database:

```python
import asyncio
from app.services.job_collection_service import JobCollectionService

async def seed():
    svc = JobCollectionService()
    roles = [
        "Software Engineer",
        "Data Scientist",
        "DevOps Engineer",
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Machine Learning Engineer",
        "Product Manager",
    ]
    locations = ["United States", "Remote"]
    await svc.collect_jobs_for_roles(roles, locations, max_age_days=14)

asyncio.run(seed())
```

After the seed completes, verify data availability:

```python
import asyncio
from app.models.job_posting import JobPosting

async def stats():
    recent = await JobPosting.get_recent_jobs(days=14)
    print(f"Recent postings: {len(recent)}")

asyncio.run(stats())
```

### Monitoring & Troubleshooting

- Application logs (stdout) include ingestion summaries per role: jobs collected, pages fetched, and TheirStack credit usage.
- MongoDB `job_postings` documents now include TheirStack-specific metadata like `job_id`, salary ranges, `remote`, `technology_slugs`, `company_domain`, and search context fields.
- Use `/market/trending` to confirm analytics. The response returns skill trends, technology adoption, salary ranges, and remote distribution for the configured time window.
- If ingestion fails, check for `TheirStackAuthenticationError` or `TheirStackRetryableError` entries in the logs, verify API keys, and ensure rate limits are respected.

## Skill Extraction

### How It Works

The skill extraction service uses spaCy NLP to identify technical skills from job descriptions:

1. **Text Preprocessing**: Normalizes text, handles common variations
2. **Named Entity Recognition**: Identifies technology names and tools
3. **Keyword Matching**: Matches against predefined skill databases
4. **Categorization**: Groups skills into categories (languages, frameworks, etc.)
5. **Filtering**: Removes common non-skill words and duplicates

### Skill Categories

- **Programming Languages**: Python, JavaScript, Java, C++, etc.
- **Frameworks/Libraries**: React, Django, Spring, TensorFlow, etc.
- **Databases**: MongoDB, PostgreSQL, Redis, etc.
- **Cloud Platforms**: AWS, Azure, GCP, etc.
- **Tools/Technologies**: Docker, Kubernetes, Git, etc.
- **Soft Skills**: Leadership, communication, problem-solving, etc.

### Testing Skill Extraction

```python
# Test the skill extractor directly
from app.services.skill_extractor import skill_extractor

job_description = """
We're looking for a Senior Python Developer with experience in Django, 
React, and AWS. Must have strong knowledge of PostgreSQL, Docker, and 
Kubernetes. Experience with machine learning using TensorFlow is a plus.
"""

skills = skill_extractor.extract_skills(job_description)
print(f"Extracted skills: {skills}")

# Get categorized skills
categorized = skill_extractor.get_skill_categories(skills)
for category, skills_list in categorized.items():
    if skills_list:
        print(f"{category}: {skills_list}")
```

## Database Schema

### JobPosting Model

The `JobPosting` model stores ingested job data:

```python
class JobPosting(Document):
    title: str                    # Job title
    company: str                  # Company name
    location: str                 # Job location
    description: str              # Full job description
    skills: List[str]             # Extracted skills (populated by NLP)
    url: str                      # Original Indeed URL (unique)
    search_keywords: str          # Search terms used
    search_location: str          # Location searched
    scraped_at: datetime          # When ingested (field retained for backward compatibility)
    updated_at: datetime          # Last updated
```

### Database Indexes

Optimized indexes for efficient querying:

- `url` (unique) - Prevents duplicate job postings
- `scraped_at` - For time-based queries (ingestion timestamp)
- `skills` - For skill-based job matching
- `(search_keywords, search_location)` - For search optimization
- `company`, `location` - For filtering

### Querying Job Data

```python
# Get recent jobs with specific skills
jobs = await JobPosting.get_jobs_by_skills(["Python", "Django"], limit=20)

# Get jobs by search criteria
jobs = await JobPosting.get_jobs_by_keywords("Software Engineer", "Remote")

# Get recent jobs (last 7 days)
recent_jobs = await JobPosting.get_recent_jobs(days=7, limit=50)
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/login/form` | OAuth2 compatible login | No |
| GET | `/auth/me` | Get current user profile | Yes |
| PUT | `/auth/me` | Update user profile | Yes |

### Market Analysis

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/market/trending` | Get trending skills and locations from job market data | No |

### Skills Analysis

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/skills/gap-analysis` | Analyze skill gaps for user's target roles | Yes |

### Learning Resources

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/learning/roadmap` | Get personalized learning roadmap with gap analysis integration | Yes |
| GET | `/learning/resources` | Get learning resources for specific skills with filtering | Yes |
| GET | `/learning/resources/search` | Search learning resources by query with pagination | Yes |

### Project Recommendations

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/projects/recommendations` | Get personalized project recommendations based on user skills | Yes |
| GET | `/projects/skill-building` | Get projects that help build specific skills | Yes |
| GET | `/projects/search` | Search projects by query with filtering | Yes |
| GET | `/projects/all` | Get all available projects with optional filtering | Yes |

### General

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Root endpoint with API info | No |
| GET | `/health` | Health check endpoint | No |

## API Usage Examples

### Register a new user
```bash
curl -X POST "http://localhost:8000/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "SecurePass123",
       "full_name": "John Doe",
       "skills": ["Python", "FastAPI"],
       "target_roles": ["Backend Developer"],
       "experience_level": "Mid",
       "location": "New York"
     }'
```

### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "SecurePass123"
     }'
```

### Get user profile (with JWT token)
```bash
curl -X GET "http://localhost:8000/auth/me" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get trending market data
```bash
curl -X GET "http://localhost:8000/market/trending?days=30&skills_limit=15&locations_limit=10"
```

**Response Example:**
```json
{
  "top_skills": [
    {
      "skill": "Python",
      "count": 245,
      "percentage": 78.5
    },
    {
      "skill": "JavaScript",
      "count": 198,
      "percentage": 63.5
    }
  ],
  "top_locations": [
    {
      "location": "San Francisco, CA",
      "count": 156
    },
    {
      "location": "New York, NY",
      "count": 134
    }
  ],
  "total_jobs_analyzed": 312,
  "generated_at": "2024-01-15T10:30:00Z",
  "window_days": 30
}
```

**Query Parameters:**
- `days` (optional): Number of days to analyze (1-365, default: 30)
- `skills_limit` (optional): Maximum trending skills to return (1-50, default: 15)
- `locations_limit` (optional): Maximum trending locations to return (1-30, default: 10)

### Get skill gap analysis
```bash
curl -X GET "http://localhost:8000/skills/gap-analysis?role=Software%20Engineer&days=30&threshold=0.25" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
{
  "role": "Software Engineer",
  "total_postings_analyzed": 156,
  "required_skills": [
    {
      "skill": "Python",
      "required_percentage": 78.5,
      "user_has": true
    },
    {
      "skill": "Docker",
      "required_percentage": 45.2,
      "user_has": false
    }
  ],
  "missing_skills": ["Docker", "Kubernetes", "AWS"],
  "coverage_percentage": 67.5,
  "skill_match_count": 8,
  "total_required_skills": 12
}
```

**Query Parameters:**
- `role` (required): Target role to analyze (must match one of user's target roles)
- `days` (optional): Number of days to analyze job postings (1-365, default: 30)
- `threshold` (optional): Minimum percentage of jobs requiring skill (0.1-1.0, default: 0.25)

**Error Responses:**
- `400`: Role not in user's target roles or insufficient data
- `401`: Authentication required
- `500`: Server error during analysis

### Get learning roadmap
```bash
curl -X GET "http://localhost:8000/learning/roadmap?target_role=Software%20Engineer&include_gap_analysis=true" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
{
  "target_role": "Software Engineer",
  "skill_paths": [
    {
      "skill": "Python",
      "resources": [
        {
          "type": "Documentation",
          "title": "Python Official Documentation",
          "url": "https://docs.python.org/3/",
          "description": "Official Python 3 documentation with tutorials and reference materials"
        },
        {
          "type": "Course",
          "title": "Python for Everybody",
          "url": "https://www.coursera.org/specializations/python",
          "description": "University of Michigan's comprehensive Python programming specialization"
        }
      ],
      "is_missing": false,
      "priority_score": 85.5
    },
    {
      "skill": "Docker",
      "resources": [
        {
          "type": "Documentation",
          "title": "Docker Official Documentation",
          "url": "https://docs.docker.com/",
          "description": "Complete Docker documentation with tutorials and references"
        }
      ],
      "is_missing": true,
      "priority_score": 72.3
    }
  ],
  "total_skills": 8,
  "missing_skills_count": 3,
  "coverage_percentage": 62.5,
  "recommendations": [
    "Focus on Docker first as it's required by 72% of jobs",
    "Consider JavaScript fundamentals before advanced frameworks"
  ]
}
```

**Query Parameters:**
- `target_role` (optional): Specific target role to focus the roadmap on
- `include_gap_analysis` (optional): Whether to include skill gap analysis for prioritization (default: true)

### Get learning resources for skills
```bash
curl -X GET "http://localhost:8000/learning/resources?skills=Python&skills=React&resource_type=Course&search=beginner" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
[
  {
    "type": "Course",
    "title": "Complete Python Bootcamp",
    "url": "https://www.udemy.com/course/complete-python-bootcamp/",
    "description": "Comprehensive Python course from basics to advanced topics"
  },
  {
    "type": "Course",
    "title": "React - The Complete Guide",
    "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
    "description": "Master React with hooks, context, Redux, and modern development patterns"
  }
]
```

**Query Parameters:**
- `skills` (required): List of skills to get resources for (can be repeated)
- `resource_type` (optional): Filter by resource type (Documentation, Video, Course, Book)
- `search` (optional): Search query to filter resources

### Search learning resources
```bash
curl -X GET "http://localhost:8000/learning/resources/search?query=python&resource_type=Course&limit=10&offset=0" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
{
  "resources": [
    {
      "type": "Course",
      "title": "Python for Everybody",
      "url": "https://www.coursera.org/specializations/python",
      "description": "University of Michigan's comprehensive Python programming specialization"
    }
  ],
  "total_found": 15,
  "search_query": "python",
  "filters_applied": {
    "resource_type": "Course",
    "limit": 10,
    "offset": 0
  }
}
```

**Query Parameters:**
- `query` (required): Search query (minimum 1 character)
- `resource_type` (optional): Filter by resource type
- `limit` (optional): Maximum results to return (1-100, default: 20)
- `offset` (optional): Number of results to skip for pagination (default: 0)

### Get project recommendations
```bash
curl -X GET "http://localhost:8000/projects/recommendations?difficulty=Intermediate&skill_focus=Python&skill_focus=React&limit=5" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
{
  "projects": [
    {
      "id": 2,
      "title": "Task Management App",
      "description": "Create a full-stack task management application with user authentication, CRUD operations, and real-time updates.",
      "difficulty": "Intermediate",
      "estimated_time": "3-4 weeks",
      "skills": ["React", "Node.js", "MongoDB", "Express"],
      "features": [
        "User authentication",
        "Create, read, update, delete tasks",
        "Task categories and priorities",
        "Due date reminders",
        "Search and filter functionality"
      ],
      "skill_match_percentage": 75.0,
      "missing_skills": ["Node.js", "Express"]
    }
  ],
  "total_projects": 8,
  "filters_applied": {
    "difficulty": "Intermediate",
    "skill_focus": ["Python", "React"],
    "limit": 5
  },
  "user_skill_count": 6,
  "recommendations": [
    "You have good foundation skills. These projects will help you grow.",
    "Consider learning Node.js to unlock more project opportunities."
  ]
}
```

**Query Parameters:**
- `difficulty` (optional): Filter by difficulty level (Beginner, Intermediate, Advanced)
- `skill_focus` (optional): Focus on projects using specific skills (can be repeated)
- `limit` (optional): Maximum projects to return (1-50, default: 10)

### Get skill-building projects
```bash
curl -X GET "http://localhost:8000/projects/skill-building?skills=Docker&skills=Kubernetes&difficulty=Beginner&limit=3" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
[
  {
    "id": 5,
    "title": "Containerized Web Application",
    "description": "Build and deploy a web application using Docker containers with basic orchestration.",
    "difficulty": "Beginner",
    "estimated_time": "2-3 weeks",
    "skills": ["Docker", "Node.js", "HTML", "CSS"],
    "features": [
      "Docker containerization",
      "Multi-stage builds",
      "Docker Compose setup",
      "Basic deployment"
    ],
    "skill_match_percentage": 50.0,
    "missing_skills": ["Docker"]
  }
]
```

**Query Parameters:**
- `skills` (required): Skills to focus on building (can be repeated)
- `difficulty` (optional): Filter by difficulty level
- `limit` (optional): Maximum projects to return (1-50, default: 10)

### Search projects
```bash
curl -X GET "http://localhost:8000/projects/search?query=web%20app&skills=React&difficulty=Intermediate&limit=5&offset=0" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
{
  "projects": [
    {
      "id": 3,
      "title": "E-commerce Platform",
      "description": "Build a complete e-commerce platform with product catalog, shopping cart, payment integration, and admin dashboard.",
      "difficulty": "Advanced",
      "estimated_time": "8-12 weeks",
      "skills": ["React", "Node.js", "MongoDB", "Express", "Stripe API", "JWT"],
      "features": [
        "Product catalog with search",
        "Shopping cart and checkout",
        "Payment processing",
        "User accounts and order history",
        "Admin dashboard"
      ]
    }
  ],
  "total_found": 12,
  "search_query": "web app",
  "filters_applied": {
    "skills": ["React"],
    "difficulty": "Intermediate",
    "limit": 5,
    "offset": 0
  }
}
```

**Query Parameters:**
- `query` (required): Search query (minimum 1 character)
- `skills` (optional): Filter by required skills (can be repeated)
- `difficulty` (optional): Filter by difficulty level
- `limit` (optional): Maximum results to return (1-100, default: 20)
- `offset` (optional): Number of results to skip for pagination (default: 0)

### Get all projects
```bash
curl -X GET "http://localhost:8000/projects/all?difficulty=Beginner&limit=10&offset=0" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Example:**
```json
[
  {
    "id": 1,
    "title": "Personal Portfolio Website",
    "description": "Create a responsive personal portfolio website showcasing your skills, projects, and experience.",
    "difficulty": "Beginner",
    "estimated_time": "1-2 weeks",
    "skills": ["HTML", "CSS", "JavaScript", "React", "Responsive Design"],
    "features": [
      "Responsive design for all devices",
      "Interactive project gallery",
      "Contact form with validation",
      "Smooth scrolling navigation"
    ],
    "skill_match_percentage": 80.0,
    "missing_skills": ["React"]
  }
]
```

**Query Parameters:**
- `difficulty` (optional): Filter by difficulty level
- `limit` (optional): Maximum results to return (1-100, default: 50)
- `offset` (optional): Number of results to skip for pagination (default: 0)

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/career_navigator` |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | `your-super-secret-jwt-key-here-change-in-production` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `APP_NAME` | Application name | `Career Navigator API` |
| `APP_VERSION` | Application version | `1.0.0` |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `THEIR_STACK_API_KEY` | TheirStack Jobs API key | _required_ |
| `THEIR_STACK_BASE_URL` | TheirStack base URL | `https://api.theirstack.com` |
| `THEIR_STACK_TIMEOUT` | TheirStack client timeout (seconds) | `30` |
| `THEIR_STACK_MAX_RETRIES` | Maximum retry attempts for TheirStack requests | `3` |
| `THEIR_STACK_RATE_LIMIT` | TheirStack rate limit (requests per minute) | `300` |
| `JOB_COLLECTION_SCHEDULE` | APScheduler cron for daily ingestion | `"0 2 * * *"` |
| `MAX_JOBS_PER_SEARCH` | Maximum jobs requested per TheirStack search | `100` |
| `JOB_DATA_RETENTION_DAYS` | Days to retain ingested job data | `90` |
| `LOG_LEVEL` | Logging level | `INFO` |

### Security Considerations

- **JWT Secret**: Always use a strong, unique secret key in production
- **Password Requirements**: Passwords must be at least 8 characters with uppercase, lowercase, and digits
- **CORS**: Configure allowed origins appropriately for your frontend
- **Database**: Use authentication and SSL for MongoDB in production

### Performance Notes

#### Market Analysis Caching
- Trending data is cached for 1 hour to reduce database load
- Cache keys include analysis parameters (days, limits)
- Cache is automatically invalidated when new job data is ingested
- Response includes `Cache-Control` headers for client-side caching

#### Skill Gap Analysis Optimization
- Role-specific skill requirements are cached for 30 minutes
- MongoDB aggregation pipelines are optimized with proper indexes
- Minimum data requirements: 10+ job postings for meaningful analysis
- Analysis threshold should be ≥10% for reliable results

#### Database Performance
- Ensure proper indexes exist on `scraped_at`, `skills`, and `title` fields
- Consider MongoDB connection pooling for high-traffic scenarios
- Monitor aggregation query performance with MongoDB profiler
- Regular cleanup of old job postings (>90 days) recommended

## Development

### Code Style
- Follow PEP 8 guidelines
- Use type hints throughout the codebase
- Maintain consistent import organization

### Adding New Features
1. Create models in `app/models/`
2. Define schemas in `app/schemas/`
3. Implement business logic in `app/services/`
4. Create API endpoints in `app/routers/`
5. Register routers in `app/main.py`

### Testing
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests (when test files are created)
pytest
```

## Deployment

### Docker Deployment
```dockerfile
# Dockerfile example
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Checklist
- [ ] Set strong JWT secret key
- [ ] Configure MongoDB with authentication
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up CI/CD pipeline

## Development Workflow

### Testing the Ingestion Pipeline

1. **Start the API and scheduler**
   ```bash
   python -m app.main
   ```
   Launching the FastAPI application boots the APScheduler jobs configured in `app/services/scheduler_service.py`.

2. **Trigger a manual collection**
   Reuse the snippet under `Manual Seed (Recommended)` to call `JobCollectionService.collect_jobs_for_roles()` with your target roles, locations, and `max_age_days`. Logs surface page counts, retry attempts, and TheirStack credit usage.

3. **Inspect the database**
   ```bash
   mongo career_navigator
   db.job_postings.count()      # Number of ingested jobs
   db.job_postings.findOne()    # Sample TheirStack-enriched posting
   ```
   Confirm that fields like `job_id`, `technology_slugs`, and salary ranges are populated.

### Monitoring Automated Ingestion

- **Scheduling**: `JOB_COLLECTION_SCHEDULE` controls daily ingestion cadence; weekly cleanup is defined in `app/services/scheduler_service.py`.
- **Health checks**: Startup performs a lightweight TheirStack probe—watch logs for `TheirStackAuthenticationError` or retry warnings.
- **Credits and rate limits**: Each request consumes credits. Monitor `metadata.total_results` and `metadata.credits_used` in logs to stay within the 300 requests-per-minute allowance.

### Data Quality Assurance

1. **Skill extraction accuracy**
   - Review extracted skills for relevance
   - Update skill categories in `skill_extractor.py`
   - Test with various job descriptions

2. **Duplicate handling**
   - Jobs are deduplicated by URL
   - Updated jobs overwrite existing ones
   - Monitor for duplicate detection

3. **Data freshness**
   - Ensure automated ingestion schedules run successfully
   - Clean up old job postings periodically
   - Monitor ingestion success rates

## Troubleshooting

### Ingestion Issues (TheirStack API)

- **Authentication errors (401/403)**: Verify `THEIR_STACK_API_KEY` and `THEIR_STACK_BASE_URL` in `backend/.env`. Invalid credentials also trigger startup health check failures.
- **Rate limits (429)**: Retries use exponential backoff controlled by `THEIR_STACK_MAX_RETRIES`. Persistent 429 responses mean you are exceeding the 300 requests-per-minute cap—reduce concurrency or widen ingestion windows.
- **Server errors (5xx)**: Usually transient. Retries handle most cases, but confirm network reachability and adjust `THEIR_STACK_TIMEOUT` if responses are slow.
- **Credit usage**: Each job costs one credit. Monitor `metadata.total_results` and `metadata.credits_used` in ingestion logs. Enable `blur_company_data` when full company details are unnecessary to reduce costs.
- **Minimal request example**:
  ```bash
  POST /v1/jobs/search
  Headers: Authorization: Bearer <THEIR_STACK_API_KEY>
  Body: {"job_title_or": ["Software Engineer"], "posted_at_max_age_days": 7, "job_country_code_or": ["US"], "page": 1, "limit": 10}
  ```
- **Configuration references**: See `backend/.env.example` for all `THEIR_STACK_*` and scheduler variables. APScheduler tasks live in `app/services/job_collection_service.py` and `app/services/scheduler_service.py`, and are wired up in `app/main.py`.

### spaCy Model Not Found

```bash
python -m spacy download en_core_web_sm
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.0/en_core_web_sm-3.7.0-py3-none-any.whl
```

### MongoDB Connection Issues

- Check `MONGODB_URI` in `backend/.env`
- Ensure MongoDB is running and accessible
- Verify database permissions

### No Jobs Returned

- Confirm roles, locations, and `max_age_days` passed to `collect_jobs_for_roles()` align with active TheirStack markets
- Inspect ingestion logs for empty `metadata.total_results`
- Broaden filters (locations, date windows) to capture more postings

### Skill Extraction Issues

```python
from app.services.skill_extractor import skill_extractor
print(skill_extractor._nlp)
skills = skill_extractor.extract_skills("Python Django AWS")
print(skills)
```

### Performance Issues

1. **Slow Ingestion**
   - Monitor TheirStack response latency and network connectivity
   - Review `THEIR_STACK_TIMEOUT` and `THEIR_STACK_MAX_RETRIES` settings
   - Observe CPU/memory usage during large batch collections

2. **Database Performance**
   - Ensure indexes are created (automatic on first run)
   - Monitor MongoDB performance
   - Consider connection pooling

3. **Memory Usage**
   - Process jobs in smaller ingestion batches when needed
   - Clear caches periodically
   - Monitor Python memory usage

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - Verify network connectivity

2. **JWT Token Issues**
   - Check if the secret key is consistent
   - Verify token expiration settings
   - Ensure proper token format in requests

3. **CORS Errors**
   - Update `ALLOWED_ORIGINS` in `.env`
   - Check frontend URL configuration

4. **Import Errors**
   - Ensure virtual environment is activated
   - Verify all dependencies are installed
   - Check Python path configuration

### Logs
The application uses Python's built-in logging. Check console output for detailed error messages and debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the troubleshooting section above
