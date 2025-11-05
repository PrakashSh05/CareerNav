# Career Navigator Backend Documentation - Part 2

## Database Models

### User Model

**File:** `app/models/user.py`

The User model stores all user-related information including profile data, skills, and target roles.

#### Schema

```python
{
    "_id": ObjectId("507f1f77bcf86cd799439011"),
    "email": "user@example.com",              # Unique, indexed
    "hashed_password": "pbkdf2_sha256$...",
    "full_name": "John Doe",
    "skills": ["Python", "JavaScript", "React"],
    "target_roles": ["Software Engineer", "Full Stack Developer"],
    "experience_level": "2nd Year",           # Options: 12th Pass Out, 1st-4th Year
    "location": "San Francisco, CA",
    "created_at": ISODate("2025-01-15T10:00:00Z"),
    "updated_at": ISODate("2025-10-30T14:30:00Z")
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | EmailStr | Yes | User's email (unique, lowercase) |
| `hashed_password` | str | Yes | Hashed password (pbkdf2_sha256) |
| `full_name` | str | Yes | User's full name |
| `skills` | List[str] | No | User's current skills (normalized) |
| `target_roles` | List[str] | No | Desired job roles |
| `experience_level` | str | No | Education/experience level |
| `location` | str | No | User's location |
| `created_at` | datetime | Auto | Account creation timestamp |
| `updated_at` | datetime | Auto | Last update timestamp |

#### Indexes

```python
# Unique index on email
{"email": 1}, unique=True

# Index on created_at for sorting
{"created_at": -1}
```

#### Methods

**`update_timestamp()`**
- Updates the `updated_at` field to current UTC time

**`async update_profile(**kwargs)`**
- Updates user profile fields
- Automatically updates `updated_at` timestamp
- Validates field names

**`dict_exclude_password()`**
- Returns user dictionary without the hashed password
- Used for API responses

#### Usage Example

```python
from app.models.user import User

# Create a new user
user = User(
    email="john@example.com",
    hashed_password="hashed_pwd_here",
    full_name="John Doe",
    skills=["Python", "React"],
    target_roles=["Software Engineer"]
)
await user.insert()

# Find user by email
user = await User.find_one(User.email == "john@example.com")

# Update profile
await user.update_profile(
    skills=["Python", "React", "MongoDB"],
    location="New York"
)

# Get user without password
user_data = user.dict_exclude_password()
```

---

### JobPosting Model

**File:** `app/models/job_posting.py`

The JobPosting model stores job market data collected from TheirStack API.

#### Schema

```python
{
    "_id": ObjectId("507f1f77bcf86cd799439012"),
    "job_id": "theirstack_123456",           # TheirStack unique ID
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "company_domain": "techcorp.com",
    "location": "San Francisco, CA",
    "description": "We are looking for...",
    "skills": ["python", "react", "aws"],     # Normalized from technology_slugs
    "technology_slugs": ["python", "react", "aws"],  # Raw TheirStack tags
    "url": "https://jobs.example.com/123",
    "search_keywords": "Software Engineer",   # Role searched for
    "search_location": "United States",       # Location searched for
    "date_posted": ISODate("2025-10-20T00:00:00Z"),
    "scraped_at": ISODate("2025-10-30T02:00:00Z"),
    "updated_at": ISODate("2025-10-30T02:00:00Z"),
    "min_annual_salary_usd": 120000,
    "max_annual_salary_usd": 180000,
    "remote": true,
    "coordinates": {"lat": 37.7749, "lng": -122.4194}
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `job_id` | str | No | TheirStack unique identifier |
| `title` | str | Yes | Job title |
| `company` | str | Yes | Company name |
| `company_domain` | str | No | Company website domain |
| `location` | str | Yes | Job location |
| `description` | str | Yes | Full job description |
| `skills` | List[str] | No | Normalized skills from technology_slugs |
| `technology_slugs` | List[str] | No | Raw technology tags from TheirStack |
| `url` | str | Yes | Job posting URL (unique) |
| `search_keywords` | str | Yes | Role used in search |
| `search_location` | str | Yes | Location used in search |
| `date_posted` | datetime | No | Original posting date |
| `scraped_at` | datetime | Auto | When scraped |
| `updated_at` | datetime | Auto | Last update |
| `min_annual_salary_usd` | int | No | Minimum salary (USD) |
| `max_annual_salary_usd` | int | No | Maximum salary (USD) |
| `remote` | bool | No | Remote work flag |
| `coordinates` | dict | No | Geographic coordinates |

#### Indexes

```python
# Unique indexes
{"url": 1}, unique=True
{"job_id": 1}, unique=True, sparse=True

# Query optimization indexes
{"scraped_at": 1}
{"date_posted": -1}, sparse=True
{"skills": 1}
{"technology_slugs": 1}, sparse=True
{"search_keywords": 1, "search_location": 1}
{"company": 1}
{"location": 1}
{"remote": 1}, sparse=True
{"min_annual_salary_usd": 1}, sparse=True
{"max_annual_salary_usd": 1}, sparse=True
```

#### Class Methods

**`async upsert_job(job_data: dict) -> JobPosting`**
- Insert or update job posting
- Deduplicates by `job_id` first, then `url`
- Updates existing records with new data
- Preserves original `scraped_at` timestamp

**`async get_jobs_by_skills(skills: List[str], limit: int = 50) -> List[JobPosting]`**
- Find jobs requiring specific skills
- Uses `$in` operator for matching

**`async get_jobs_by_keywords(keywords: str, location: Optional[str], limit: int = 50) -> List[JobPosting]`**
- Search jobs by title/role keywords
- Optional location filter
- Case-insensitive regex search

**`async get_recent_jobs(days: int = 7, limit: int = 100) -> List[JobPosting]`**
- Get recently scraped jobs
- Sorted by `scraped_at` descending

#### Usage Example

```python
from app.models.job_posting import JobPosting

# Upsert a job
job_data = {
    "job_id": "ts_123",
    "title": "Software Engineer",
    "company": "Tech Corp",
    "location": "Remote",
    "description": "...",
    "skills": ["python", "react"],
    "technology_slugs": ["python", "react"],
    "url": "https://example.com/job",
    "search_keywords": "Software Engineer",
    "search_location": "United States"
}
job = await JobPosting.upsert_job(job_data)

# Find jobs by skills
python_jobs = await JobPosting.get_jobs_by_skills(["python", "fastapi"], limit=20)

# Get recent jobs
recent = await JobPosting.get_recent_jobs(days=7, limit=50)
```

---

## API Endpoints

### Authentication Endpoints (`/auth`)

**File:** `app/routers/auth.py`

#### POST `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "skills": ["Python", "JavaScript"],
  "target_roles": ["Software Engineer"],
  "experience_level": "2nd Year",
  "location": "San Francisco, CA"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

**Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "John Doe",
  "skills": ["python", "javascript"],
  "target_roles": ["Software Engineer"],
  "experience_level": "2nd Year",
  "location": "San Francisco, CA",
  "created_at": "2025-10-30T10:00:00Z",
  "updated_at": "2025-10-30T10:00:00Z"
}
```

**Error Responses:**
- `400` - Email already registered
- `400` - Invalid password format
- `400` - Invalid experience level
- `500` - Server error

---

#### POST `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "skills": ["python", "javascript"],
    "target_roles": ["Software Engineer"],
    "experience_level": "2nd Year",
    "location": "San Francisco, CA",
    "created_at": "2025-10-30T10:00:00Z",
    "updated_at": "2025-10-30T10:00:00Z"
  }
}
```

**Error Responses:**
- `401` - Incorrect email or password
- `500` - Server error

---

#### GET `/auth/me`

Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "John Doe",
  "skills": ["python", "javascript"],
  "target_roles": ["Software Engineer"],
  "experience_level": "2nd Year",
  "location": "San Francisco, CA",
  "created_at": "2025-10-30T10:00:00Z",
  "updated_at": "2025-10-30T10:00:00Z"
}
```

**Error Responses:**
- `401` - Invalid or expired token
- `404` - User not found

---

#### PUT `/auth/me`

Update current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "skills": ["Python", "JavaScript", "React", "MongoDB"],
  "target_roles": ["Software Engineer", "Full Stack Developer"],
  "experience_level": "3rd Year",
  "location": "New York, NY"
}
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "John Smith",
  "skills": ["python", "javascript", "react", "mongodb"],
  "target_roles": ["Software Engineer", "Full Stack Developer"],
  "experience_level": "3rd Year",
  "location": "New York, NY",
  "created_at": "2025-10-30T10:00:00Z",
  "updated_at": "2025-10-30T15:30:00Z"
}
```

**Special Behavior:**
- When `target_roles` are added, triggers background job collection for new roles
- Skills are automatically normalized to lowercase
- Only provided fields are updated (partial updates supported)

**Error Responses:**
- `401` - Invalid or expired token
- `400` - Invalid experience level
- `500` - Server error

---

### Market Analysis Endpoints (`/market`)

**File:** `app/routers/market.py`

#### GET `/market/trending`

Get trending skills, locations, and market insights.

**Query Parameters:**
- `days` (int, default: 30): Analysis time window (1-365 days)
- `skills_limit` (int, default: 15): Max trending skills (1-50)
- `locations_limit` (int, default: 10): Max trending locations (1-30)

**Example Request:**
```
GET /market/trending?days=30&skills_limit=15&locations_limit=10
```

**Response (200 OK):**
```json
{
  "top_skills": [
    {
      "skill": "python",
      "count": 245,
      "percentage": 78.5
    },
    {
      "skill": "react",
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
  "technology_trends": [
    {
      "technology": "python",
      "count": 245
    },
    {
      "technology": "kubernetes",
      "count": 112
    }
  ],
  "salary_trends": [
    {
      "location": "San Francisco, CA",
      "avg_min": 120000,
      "avg_max": 180000,
      "count": 89
    }
  ],
  "remote_distribution": [
    {
      "remote": true,
      "count": 178
    },
    {
      "remote": false,
      "count": 134
    }
  ],
  "total_jobs_analyzed": 312,
  "generated_at": "2025-10-30T14:30:00Z",
  "window_days": 30
}
```

**Response Headers:**
```
Cache-Control: no-cache, no-store, must-revalidate
```

**Error Responses:**
- `500` - Unable to retrieve market data

**Data Sources:**
- Uses `technology_slugs` field from JobPosting (not text-extracted skills)
- MongoDB aggregation pipelines for performance
- Results cached in development mode disabled for immediate updates

---

### Skills Analysis Endpoints (`/skills`)

**File:** `app/routers/skills.py`

#### GET `/skills/gap-analysis`

Analyze skill gaps for a user's target role (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `role` (string, required): Target role to analyze (must match user's target_roles)
- `days` (int, default: 30): Job analysis time window (1-365 days)
- `threshold` (float, default: 0.25): Minimum skill frequency (0.1-1.0)

**Example Request:**
```
GET /skills/gap-analysis?role=Software Engineer&days=30&threshold=0.25
```

**Response (200 OK):**
```json
{
  "role": "Software Engineer",
  "total_postings_analyzed": 156,
  "required_skills": [
    {
      "skill": "python",
      "required_percentage": 78.5,
      "user_has": true
    },
    {
      "skill": "docker",
      "required_percentage": 45.2,
      "user_has": false
    },
    {
      "skill": "kubernetes",
      "required_percentage": 38.7,
      "user_has": false
    }
  ],
  "missing_skills": ["docker", "kubernetes", "aws"],
  "coverage_percentage": 67.5,
  "skill_match_count": 8,
  "total_required_skills": 12
}
```

**Threshold Explanation:**
- `0.25` = Skill must appear in at least 25% of job postings
- `0.10` = Skill must appear in at least 10% of job postings
- `0.50` = Skill must appear in at least 50% of job postings

**Error Responses:**
- `400` - Role not in user's target roles
- `400` - User has no target roles configured
- `401` - Authentication required
- `404` - No job data found for role (includes suggestions)
- `500` - Server error

**Example 404 Response:**
```json
{
  "detail": {
    "message": "No job data found for 'Senior Backend Engineer'",
    "suggestions": [
      "Try increasing the time window (currently analyzing last 30 days)",
      "Check if the role name is spelled correctly",
      "Consider using a more general role title"
    ],
    "alternatives": [
      "Software Engineer",
      "Backend Developer",
      "Full Stack Developer"
    ]
  }
}
```

---

