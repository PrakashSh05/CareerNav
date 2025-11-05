# Career Navigator Backend Documentation - Part 3

## Learning Resources Endpoints (`/learning`)

**File:** `app/routers/learning.py`

### GET `/learning/roadmap`

Get personalized learning roadmap for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `target_role` (string, optional): Specific role to focus on
- `include_gap_analysis` (bool, default: true): Include skill gap analysis

**Example Request:**
```
GET /learning/roadmap?target_role=Software Engineer&include_gap_analysis=true
```

**Response (200 OK):**
```json
{
  "target_role": "Software Engineer",
  "skill_paths": [
    {
      "skill": "python",
      "resources": [
        {
          "type": "Documentation",
          "title": "Python Official Documentation",
          "url": "https://docs.python.org/3/",
          "description": "Official Python documentation with tutorials"
        },
        {
          "type": "Course",
          "title": "Python for Everybody",
          "url": "https://www.py4e.com/",
          "description": "Free comprehensive Python course"
        }
      ],
      "is_missing": true,
      "priority_score": 78.5
    }
  ],
  "total_skills": 12,
  "missing_skills_count": 5,
  "coverage_percentage": 58.3,
  "recommendations": [
    "You're missing 5 key skills for Software Engineer",
    "Focus on high-demand skills first to maximize job opportunities"
  ]
}
```

**Response Headers:**
```
Cache-Control: max-age=3600  # 1 hour cache
```

**Error Responses:**
- `401` - Authentication required
- `500` - Failed to generate roadmap

---

### GET `/learning/resources`

Get learning resources for specific skills.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `skills` (List[string], required): Skills to get resources for
- `resource_type` (string, optional): Filter by type (Documentation, Video, Course, Book)
- `search` (string, optional): Search in titles/descriptions

**Example Request:**
```
GET /learning/resources?skills=python&skills=react&resource_type=Course&search=beginner
```

**Response (200 OK):**
```json
[
  {
    "type": "Course",
    "title": "Python for Beginners",
    "url": "https://example.com/python-course",
    "description": "Beginner-friendly Python course"
  },
  {
    "type": "Course",
    "title": "React Fundamentals",
    "url": "https://example.com/react-course",
    "description": "Learn React from scratch"
  }
]
```

**Error Responses:**
- `400` - Invalid resource type
- `401` - Authentication required
- `500` - Failed to retrieve resources

---

### GET `/learning/resources/search`

Search learning resources with pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `query` (string, required): Search query (min 1 char)
- `resource_type` (string, optional): Filter by type
- `limit` (int, default: 20): Results per page (1-100)
- `offset` (int, default: 0): Pagination offset

**Example Request:**
```
GET /learning/resources/search?query=react&resource_type=Video&limit=10&offset=0
```

**Response (200 OK):**
```json
{
  "resources": [
    {
      "type": "Video",
      "title": "React Tutorial for Beginners",
      "url": "https://www.youtube.com/watch?v=...",
      "description": "Complete React tutorial"
    }
  ],
  "total_found": 25,
  "search_query": "react",
  "filters_applied": {
    "resource_type": "Video",
    "limit": 10,
    "offset": 0
  }
}
```

---

## Project Recommendations Endpoints (`/projects`)

**File:** `app/routers/projects.py`

### GET `/projects/recommendations`

Get personalized project recommendations.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `difficulty` (string, optional): Filter by difficulty (Beginner, Intermediate, Advanced)
- `skill_focus` (List[string], optional): Focus on specific skills
- `limit` (int, default: 10): Max results (1-50)
- `target_role` (string, optional): Filter for specific role

**Example Request:**
```
GET /projects/recommendations?difficulty=Beginner&skill_focus=react&limit=5
```

**Response (200 OK):**
```json
{
  "projects": [
    {
      "id": 1,
      "title": "Personal Portfolio Website",
      "description": "Create a responsive portfolio showcasing your skills",
      "difficulty": "Beginner",
      "estimated_time": "1-2 weeks",
      "skills": ["html", "css", "javascript", "react"],
      "features": [
        "Responsive design",
        "Interactive project gallery",
        "Contact form"
      ],
      "roles": ["Frontend Developer", "Full Stack Developer"],
      "skill_match_percentage": 75.0,
      "missing_skills": ["react"]
    }
  ],
  "total_projects": 45,
  "filters_applied": {
    "difficulty": "Beginner",
    "skill_focus": ["react"],
    "target_role": null,
    "limit": 5
  },
  "user_skill_count": 3,
  "recommendations": [
    "Great! You have the skills for these projects.",
    "Start building to showcase your abilities."
  ]
}
```

---

### GET `/projects/skill-building`

Get projects that help build specific skills.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `skills` (List[string], required): Skills to focus on
- `difficulty` (string, optional): Filter by difficulty
- `limit` (int, default: 10): Max results (1-50)

**Example Request:**
```
GET /projects/skill-building?skills=docker&skills=kubernetes&difficulty=Intermediate
```

**Response (200 OK):**
```json
[
  {
    "id": 15,
    "title": "Containerized Microservices",
    "description": "Build and deploy microservices with Docker and Kubernetes",
    "difficulty": "Intermediate",
    "estimated_time": "3-4 weeks",
    "skills": ["docker", "kubernetes", "nodejs", "mongodb"],
    "features": [
      "Multi-container architecture",
      "Kubernetes deployment",
      "Service mesh implementation"
    ],
    "skill_match_percentage": 50.0,
    "missing_skills": ["docker", "kubernetes"]
  }
]
```

---

### GET `/projects/search`

Search projects with filters and pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `query` (string, required): Search query (min 1 char)
- `skills` (List[string], optional): Filter by skills
- `difficulty` (string, optional): Filter by difficulty
- `limit` (int, default: 20): Results per page (1-100)
- `offset` (int, default: 0): Pagination offset

**Example Request:**
```
GET /projects/search?query=web&skills=react&difficulty=Beginner&limit=10
```

**Response (200 OK):**
```json
{
  "projects": [
    {
      "id": 1,
      "title": "Personal Portfolio Website",
      "description": "Create a responsive portfolio",
      "difficulty": "Beginner",
      "estimated_time": "1-2 weeks",
      "skills": ["html", "css", "javascript", "react"],
      "features": ["Responsive design"]
    }
  ],
  "total_found": 12,
  "search_query": "web",
  "filters_applied": {
    "skills": ["react"],
    "difficulty": "Beginner",
    "limit": 10,
    "offset": 0
  }
}
```

---

### GET `/projects/all`

Get all available projects with optional filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `difficulty` (string, optional): Filter by difficulty
- `limit` (int, default: 50): Results per page (1-100)
- `offset` (int, default: 0): Pagination offset

**Example Request:**
```
GET /projects/all?difficulty=Intermediate&limit=20&offset=0
```

**Response (200 OK):**
```json
[
  {
    "id": 5,
    "title": "E-commerce Platform",
    "description": "Build a full-featured online store",
    "difficulty": "Intermediate",
    "estimated_time": "4-6 weeks",
    "skills": ["react", "nodejs", "mongodb", "stripe"],
    "features": [
      "Product catalog",
      "Shopping cart",
      "Payment integration",
      "User authentication"
    ],
    "skill_match_percentage": 60.0,
    "missing_skills": ["stripe"]
  }
]
```

---

## Services Layer

### Authentication Service

**File:** `app/services/auth_service.py`

Handles user authentication, registration, and profile management.

#### Methods

**`async create_user(user_data: UserCreate) -> User`**

Creates a new user account.

- Normalizes email to lowercase
- Checks for duplicate emails
- Hashes password using pbkdf2_sha256
- Normalizes skills using canonical mapping
- Inserts user into database

**Error Handling:**
- Raises `HTTPException(400)` if email already exists
- Raises `HTTPException(500)` for database errors

**Example:**
```python
from app.services.auth_service import auth_service

user = await auth_service.create_user(user_data)
```

---

**`async authenticate_user(email: str, password: str) -> Optional[User]`**

Authenticates user credentials.

- Normalizes email to lowercase
- Verifies password hash
- Returns User object or None

**Returns:**
- `User` object if authentication successful
- `None` if credentials invalid

**Example:**
```python
user = await auth_service.authenticate_user("user@example.com", "password123")
if user:
    print("Login successful")
```

---

**`async update_user_profile(user: User, update_data: UserUpdate) -> User`**

Updates user profile with new data.

- Filters out None values
- Normalizes skills
- Updates timestamp
- Saves to database

**Error Handling:**
- Raises `HTTPException(409)` if concurrent modification detected
- Raises `HTTPException(500)` for database errors

**Example:**
```python
updated_user = await auth_service.update_user_profile(
    user,
    UserUpdate(skills=["Python", "React"])
)
```

---

**`create_user_token(user: User) -> str`**

Creates JWT access token for user.

- Encodes user ID in token payload
- Sets expiration time
- Signs with secret key

**Returns:**
- JWT token string

**Example:**
```python
token = auth_service.create_user_token(user)
```

---

### Gap Analysis Service

**File:** `app/services/gap_service.py`

Analyzes skill gaps between user skills and job requirements.

#### Methods

**`async get_role_required_skills(role: str, days: int = 30, threshold: float = 0.25) -> List[Dict]`**

Gets required skills for a role based on job analysis.

**Algorithm:**
1. Query job postings for the role within time window
2. Extract `technology_slugs` from each job
3. Count frequency of each technology
4. Calculate percentage of jobs requiring each skill
5. Filter by threshold
6. Return sorted list by frequency

**Parameters:**
- `role`: Target job role
- `days`: Look-back period for job analysis
- `threshold`: Minimum percentage of jobs (0.0-1.0)

**Returns:**
```python
[
    {
        "skill": "python",
        "technology_slug": "python",
        "count": 125,
        "percentage": 78.5,
        "total_jobs": 159
    }
]
```

**Caching:**
- Results cached for 30 minutes (TTL cache)
- Cache key: `role_skills_{role}_{days}_{threshold}`

---

**`async analyze_skill_gap(user: User, target_role: str, days: int = 30, threshold: float = 0.25) -> GapAnalysisResponse`**

Complete skill gap analysis for user.

**Algorithm:**
1. Get required skills for role
2. Compare with user's skills (case-insensitive)
3. Calculate coverage percentage
4. Identify missing skills
5. Return comprehensive analysis

**Returns:**
```python
GapAnalysisResponse(
    role="Software Engineer",
    total_postings_analyzed=156,
    required_skills=[...],
    missing_skills=["docker", "kubernetes"],
    coverage_percentage=67.5,
    skill_match_count=8,
    total_required_skills=12
)
```

---

### Market Analysis Service

**File:** `app/services/market_service.py`

Provides market trend analysis and insights.

#### Methods

**`async get_trending_skills(days: int = 30, limit: int = 15) -> List[TrendingSkill]`**

Gets trending skills from job market.

**MongoDB Aggregation Pipeline:**
```python
[
    {"$match": {"scraped_at": {"$gte": cutoff_date}}},
    {"$project": {"technology_slugs": 1}},
    {"$unwind": "$technology_slugs"},
    {"$group": {
        "_id": {"$toLower": "$technology_slugs"},
        "count": {"$sum": 1}
    }},
    {"$sort": {"count": -1}},
    {"$limit": limit}
]
```

**Data Source:**
- Uses ONLY `technology_slugs` field (clean TheirStack data)
- Does NOT use text-extracted `skills` field (too noisy)

**Caching:**
- Development: Cache disabled (TTL = 0)
- Production: Would use TTL cache

---

**`async get_trending_locations(days: int = 30, limit: int = 10) -> List[TrendingLocation]`**

Gets trending job locations.

**Returns:**
```python
[
    TrendingLocation(location="San Francisco, CA", count=156),
    TrendingLocation(location="New York, NY", count=134)
]
```

---

**`async get_market_summary(days: int = 30, skills_limit: int = 15, locations_limit: int = 10) -> TrendingResponse`**

Comprehensive market analysis.

**Parallel Execution:**
- Runs 5 queries concurrently using `asyncio.gather()`
- `get_trending_skills()`
- `get_trending_locations()`
- `get_technology_trends()`
- `get_salary_trends()`
- `get_remote_job_trends()`

**Returns:**
```python
TrendingResponse(
    top_skills=[...],
    top_locations=[...],
    technology_trends=[...],
    salary_trends=[...],
    remote_distribution=[...],
    total_jobs_analyzed=312,
    generated_at=datetime.utcnow(),
    window_days=30
)
```

---

### Learning Service

**File:** `app/services/learning_service.py`

Generates personalized learning roadmaps and resources.

#### Methods

**`load_learning_resources() -> Dict[str, List[Dict]]`**

Loads learning resources from JSON file.

- Cached for 1 hour
- Reads from `learning_resources.json`
- Returns mapping of skills to resources

**File Format:**
```json
{
  "Python": [
    {
      "type": "Documentation",
      "title": "Python Docs",
      "url": "https://docs.python.org/",
      "description": "Official Python documentation"
    }
  ]
}
```

---

**`async get_learning_roadmap(user: User, include_gap_analysis: bool = True, target_role: Optional[str] = None) -> LearningRoadmapResponse`**

Generates personalized learning roadmap.

**Algorithm:**
1. Load learning resources
2. If gap analysis enabled, get skill gaps
3. Create skill paths with resources
4. Prioritize by gap analysis scores
5. Sort by priority (missing + high-demand first)
6. Generate recommendations

**Returns:**
```python
LearningRoadmapResponse(
    target_role="Software Engineer",
    skill_paths=[...],
    total_skills=12,
    missing_skills_count=5,
    coverage_percentage=58.3,
    recommendations=[...]
)
```

---

### Project Service

**File:** `app/services/project_service.py`

Provides project recommendations based on user skills.

#### Methods

**`load_project_ideas() -> List[Dict]`**

Loads project ideas from JSON file.

- Cached for 1 hour
- Reads from `project_ideas.json`
- Supports both array and object formats

**File Format:**
```json
{
  "projects": [
    {
      "id": 1,
      "title": "Personal Portfolio",
      "description": "Build a portfolio website",
      "difficulty": "Beginner",
      "estimated_time": "1-2 weeks",
      "skills": ["HTML", "CSS", "JavaScript"],
      "features": ["Responsive design"],
      "roles": ["Frontend Developer"]
    }
  ]
}
```

---

**`calculate_skill_match(user_skills: List[str], project_skills: List[str]) -> Tuple[float, List[str]]`**

Calculates skill match between user and project.

**Returns:**
```python
(75.0, ["React", "MongoDB"])  # (match_percentage, missing_skills)
```

---

**`async get_project_recommendations(user: User, difficulty: Optional[str], skill_focus: Optional[List[str]], target_role: Optional[str], limit: int) -> ProjectRecommendationsResponse`**

Gets personalized project recommendations.

**Algorithm:**
1. Load all projects
2. Apply difficulty filter
3. Apply role filter
4. Apply skill focus filter
5. Calculate skill matches
6. Sort by match percentage
7. Apply limit
8. Generate recommendations

---

