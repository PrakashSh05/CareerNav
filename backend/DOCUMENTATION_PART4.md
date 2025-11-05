# Career Navigator Backend Documentation - Part 4

## Job Collection System

### TheirStack Client

**File:** `app/services/theirstack_client.py`

Async HTTP client for interacting with TheirStack Jobs API.

#### Configuration

```python
class TheirStackClient:
    def __init__(
        self,
        base_url: str = settings.their_stack_base_url,
        api_key: str = settings.their_stack_api_key,
        timeout: int = settings.their_stack_timeout,
        max_retries: int = settings.their_stack_max_retries
    )
```

**Default Settings:**
- `base_url`: https://api.theirstack.com
- `timeout`: 30 seconds
- `max_retries`: 3 attempts

#### Exception Hierarchy

```python
TheirStackClientError (Base Exception)
├── TheirStackAuthenticationError  # 401, 403 errors
└── TheirStackRetryableError       # 429, 5xx errors
```

#### Methods

**`async search_jobs(payload: Dict[str, Any]) -> Dict[str, Any]`**

Search for jobs using TheirStack API.

**Required Payload Fields:**
- One of: `posted_at_max_age_days`, `posted_at_gte`, `posted_at_lte`

**Optional Payload Fields:**
```python
{
    "job_title_or": ["Software Engineer", "Backend Developer"],
    "job_location_pattern_or": ["San Francisco", "New York"],
    "job_country_code_or": ["US", "CA"],
    "posted_at_max_age_days": 30,
    "limit": 100,
    "page": 1,
    "remote": true,
    "min_annual_salary_usd": 80000
}
```

**Response Format:**
```python
{
    "data": [
        {
            "job_id": "123456",
            "job_title": "Senior Software Engineer",
            "company_object": {"name": "Tech Corp", "domain": "techcorp.com"},
            "locations": ["San Francisco, CA"],
            "description": "...",
            "technology_slugs": ["python", "react", "aws"],
            "job_url": "https://...",
            "posted_at": "2025-10-20T00:00:00Z",
            "min_annual_salary_usd": 120000,
            "max_annual_salary_usd": 180000,
            "remote": true
        }
    ],
    "metadata": {
        "total_results": 1250,
        "page": 1,
        "limit": 100,
        "has_more": true,
        "credits_used": 1,
        "estimated_credits": 1
    }
}
```

**Retry Logic:**
- Exponential backoff: 1s, 2s, 4s, 8s, 10s (max)
- Retries on: Network errors, 429 (rate limit), 5xx (server errors)
- No retry on: 401/403 (authentication), 4xx (client errors)

**Example Usage:**
```python
from app.services.theirstack_client import TheirStackClient

client = TheirStackClient()

try:
    response = await client.search_jobs({
        "job_title_or": ["Software Engineer"],
        "posted_at_max_age_days": 30,
        "job_country_code_or": ["US"],
        "limit": 100,
        "page": 1
    })
    
    jobs = response.get("data", [])
    metadata = response.get("metadata", {})
    
    print(f"Found {len(jobs)} jobs")
    print(f"Total results: {metadata.get('total_results')}")
    
except TheirStackAuthenticationError:
    print("API key is invalid")
except TheirStackRetryableError:
    print("API is temporarily unavailable")
finally:
    await client.close()
```

---

### Job Collection Service

**File:** `app/services/job_collection_service.py`

Orchestrates job data collection from TheirStack.

#### Role Variation Generation

The service automatically generates role variations for broader results:

**Examples:**
```python
"Backend Developer" → [
    "Backend Developer",
    "Backend",
    "Back-end Developer",
    "Backend Engineer"
]

"Software Engineer" → [
    "Software Engineer",
    "Software Developer",
    "SDE",
    "Engineer"
]

"Full Stack Developer" → [
    "Full Stack",
    "Fullstack Developer",
    "Full-stack Developer",
    "Full Stack Engineer"
]
```

**Special Cases:**
- React: Filters out "React Native" jobs when searching for "React"
- AWS Architect: Includes "Solutions Architect", "Cloud Architect"
- DevOps: Includes "SRE", "Platform Engineer"

#### Methods

**`async collect_jobs_for_roles(roles: List[str], locations: List[str], max_age_days: int = 14, per_role_limit: int = 100) -> Dict[str, Any]`**

Collects jobs for multiple roles and locations.

**Algorithm:**
1. For each role:
   - Generate role variations
   - Build search payload with variations
   - Add location filters
   - Add country codes based on locations
   - Paginate through results
   - Map each job to JobPosting schema
   - Upsert to database (deduplicates)
   - Track credits used

**Parameters:**
- `roles`: List of job roles to search
- `locations`: List of locations (e.g., ["United States", "Remote"])
- `max_age_days`: Maximum job posting age (API filter)
- `per_role_limit`: Max jobs to collect per role

**Returns:**
```python
{
    "Software Engineer": {
        "jobs_collected": 100,
        "pages_fetched": 5,
        "credits_tracked": 5
    },
    "Data Scientist": {
        "jobs_collected": 85,
        "pages_fetched": 4,
        "credits_tracked": 4
    }
}
```

**Location to Country Code Mapping:**
```python
"United States" → "US"
"India" → "IN"
"United Kingdom" → "GB"
"Canada" → "CA"
"Germany" → "DE"
"Australia" → "AU"
"Singapore" → "SG"
# ... and more
```

**Example Usage:**
```python
from app.services.job_collection_service import JobCollectionService

service = JobCollectionService()

summary = await service.collect_jobs_for_roles(
    roles=["Software Engineer", "Data Scientist"],
    locations=["United States", "Remote"],
    max_age_days=30,
    per_role_limit=50
)

print(summary)
# {
#   "Software Engineer": {"jobs_collected": 50, "pages_fetched": 3, ...},
#   "Data Scientist": {"jobs_collected": 45, "pages_fetched": 2, ...}
# }
```

---

**`async cleanup_old_jobs(days_to_keep: int = 90) -> int`**

Removes job postings older than retention window.

**Returns:**
- Number of deleted jobs

**Example:**
```python
deleted = await service.cleanup_old_jobs(days_to_keep=90)
print(f"Removed {deleted} old jobs")
```

---

**`async get_collection_statistics() -> Dict[str, Any]`**

Gets aggregated statistics about collected jobs.

**Returns:**
```python
{
    "total_jobs": 5432,
    "jobs_last_24h": 156,
    "jobs_last_7d": 892,
    "top_roles": [
        {"role": "Software Engineer", "count": 1234},
        {"role": "Data Scientist", "count": 567}
    ],
    "top_locations": [
        {"location": "San Francisco, CA", "count": 890},
        {"location": "New York, NY", "count": 678}
    ]
}
```

---

### User Job Collection Service

**File:** `app/services/user_job_collection_service.py`

Collects jobs based on user target roles.

#### Methods

**`async collect_jobs_for_all_users(max_age_days: int = 14, jobs_per_role: int = 5, locations: List[str] = None, data_freshness_days: int = 30) -> Dict[str, Dict[str, int]]`**

Collects jobs for all unique target roles across all users.

**Smart Freshness Check:**
- Only fetches roles without data in last N days
- Avoids redundant API calls
- Reduces credit consumption

**Algorithm:**
1. Get all users from database
2. Extract unique target roles
3. Filter roles needing updates (no data in last N days)
4. Collect jobs only for stale roles
5. Return summary

**Parameters:**
- `max_age_days`: Job posting age filter (API)
- `jobs_per_role`: Jobs to fetch per role
- `locations`: Override default locations
- `data_freshness_days`: Skip roles with data newer than this

**Example:**
```python
from app.services.user_job_collection_service import UserJobCollectionService

service = UserJobCollectionService()

summary = await service.collect_jobs_for_all_users(
    max_age_days=30,
    jobs_per_role=5,
    data_freshness_days=30
)

# Only fetches roles without data in last 30 days
```

---

**`async collect_jobs_for_user(user_id: str, max_age_days: int = 14, jobs_per_role: int = 5, locations: List[str] = None) -> Dict[str, Dict[str, int]]`**

Collects jobs for a specific user's target roles.

**Location Priority:**
1. User's location (if set)
2. Config default locations
3. Empty list (no filter)

---

### Skill Extractor Service

**File:** `app/services/skill_extractor.py`

NLP-based skill extraction using spaCy.

#### Important Usage Note

**Current Status (October 2025):**
- ✅ spaCy is installed and functional
- ✅ `extract_skills()` method exists
- ❌ NOT used for job skill extraction in production
- ✅ `map_technology_slugs()` is used instead

**Why spaCy is NOT used for jobs:**
- TheirStack provides clean `technology_slugs` (7-15 items)
- Text extraction produces too much noise (200+ items)
- Manual curation is more accurate

**Where spaCy CAN be used:**
- Resume parsing
- User profile analysis
- Learning content matching
- Advanced search features

#### Technology Slug Mapping

**Primary Method:** `map_technology_slugs(slugs: List[str]) -> List[str]`

Maps TheirStack technology slugs to canonical skill names.

**Mapping Examples:**
```python
"react" → "react"
"reactjs" → "react"
"react-js" → "react"
"nodejs" → "nodejs"
"node-js" → "nodejs"
"python" → "python"
"dotnet" → ".net"
"csharp" → "c#"
"aws-lambda" → "aws lambda"
"amazon-web-services" → "aws"
```

**Canonical Mapping:**
```python
SKILL_CANONICAL_MAP = {
    'cpp': 'c++',
    'csharp': 'c#',
    'dotnet': '.net',
    'js': 'javascript',
    'ts': 'typescript',
    'node-js': 'nodejs'
}
```

**Usage:**
```python
from app.services.skill_extractor import skill_extractor

slugs = ["react", "nodejs", "aws-lambda", "python"]
skills = skill_extractor.map_technology_slugs(slugs)
# Result: ["react", "nodejs", "aws lambda", "python"]
```

#### Skill Categories

The service categorizes skills into:
- **Programming Languages**: Python, Java, JavaScript, etc.
- **Frameworks/Libraries**: React, Django, FastAPI, etc.
- **Databases**: MongoDB, PostgreSQL, Redis, etc.
- **Cloud Platforms**: AWS, Azure, GCP, etc.
- **Tools/Technologies**: Docker, Kubernetes, Git, etc.
- **Soft Skills**: Leadership, Communication, etc.

---

## Background Tasks & Scheduling

### Scheduler Service

**File:** `app/services/scheduler_service.py`

Orchestrates background job ingestion and maintenance using APScheduler.

#### Configuration

```python
class SchedulerService:
    def __init__(
        self,
        roles: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        collection_service: Optional[JobCollectionService] = None,
        use_user_roles: bool = True
    )
```

**Parameters:**
- `roles`: Default roles for collection (fallback)
- `locations`: Default locations for collection
- `collection_service`: Custom collection service
- `use_user_roles`: Use user target roles instead of default roles

#### Scheduled Jobs

**Daily Job Collection**

- **Schedule**: Cron expression from config (default: `0 2 * * *` = 2 AM daily)
- **Task**: Collect jobs for all user target roles
- **Max Age**: 30 days
- **Jobs per Role**: 5
- **Freshness**: Only fetch roles without data in last 30 days

**Trigger Configuration:**
```python
# From config
JOB_COLLECTION_SCHEDULE=0 2 * * *  # Daily at 2 AM

# Fallback if invalid
CronTrigger(hour=2, minute=0)  # Daily at 2 AM
```

**Weekly Cleanup**

- **Schedule**: Every Sunday at 3 AM
- **Task**: Delete jobs older than retention period
- **Retention**: 90 days (configurable)

**Trigger Configuration:**
```python
CronTrigger(day_of_week="sun", hour=3, minute=0)
```

#### Methods

**`async start_scheduler() -> None`**

Starts the background scheduler.

- Registers all scheduled jobs
- Starts APScheduler
- Logs registered jobs

**Example:**
```python
from app.services.scheduler_service import SchedulerService

scheduler = SchedulerService(
    roles=["Software Engineer"],
    locations=["United States"],
    use_user_roles=True
)

await scheduler.start_scheduler()
# Scheduler started with jobs: [daily-job-collection, weekly-job-cleanup]
```

---

**`async stop_scheduler() -> None`**

Stops the scheduler gracefully.

- Shuts down APScheduler
- Cancels running jobs (no wait)
- Logs shutdown

---

**`async trigger_manual_collection(roles, locations, max_age_days, per_role_limit) -> Dict`**

Triggers manual job collection outside scheduled window.

**Use Cases:**
- Admin panel triggers
- Testing
- Emergency data refresh

**Example:**
```python
summary = await scheduler.trigger_manual_collection(
    roles=["Data Engineer"],
    locations=["Remote"],
    max_age_days=7,
    per_role_limit=20
)
```

---

#### Application Startup Integration

**File:** `app/main.py`

```python
@app.on_event("startup")
async def startup_event():
    # Connect to database
    await connect_to_mongo()
    
    # Initialize job collection service
    job_collection_service = JobCollectionService()
    
    # Create scheduler with user-based collection
    scheduler = SchedulerService(
        roles=POPULAR_ROLES,
        locations=POPULAR_LOCATIONS,
        collection_service=job_collection_service,
    )
    
    # Store in app state
    app.state.job_collection_service = job_collection_service
    app.state.scheduler = scheduler
    
    # Start background scheduler
    await scheduler.start_scheduler()
    
    # Test TheirStack connectivity
    client = TheirStackClient()
    try:
        await client.search_jobs({
            "job_title_or": ["Software Engineer"],
            "posted_at_max_age_days": 1,
            "limit": 1,
            "page": 1,
            "job_country_code_or": ["US"]
        })
        logger.info("TheirStack API connectivity OK")
    except Exception as e:
        logger.error(f"TheirStack connectivity check failed: {e}")
    finally:
        await client.close()

@app.on_event("shutdown")
async def shutdown_event():
    # Stop scheduler
    if hasattr(app.state, "scheduler"):
        await app.state.scheduler.stop_scheduler()
    
    # Close database
    await close_mongo_connection()
```

---

## Security & Authentication

### Password Hashing

**File:** `app/core/security.py`

Uses `pbkdf2_sha256` algorithm (avoids bcrypt's 72-byte limit).

**Configuration:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
```

**Functions:**

**`hash_password(password: str) -> str`**
```python
hashed = hash_password("SecurePass123")
# Returns: pbkdf2_sha256$29000$rounds=...
```

**`verify_password(plain_password: str, hashed_password: str) -> bool`**
```python
is_valid = verify_password("SecurePass123", hashed)
# Returns: True or False
```

---

### JWT Token Management

**Token Structure:**
```python
{
    "sub": "507f1f77bcf86cd799439011",  # User ID
    "exp": 1730389200  # Expiration timestamp
}
```

**Functions:**

**`create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str`**

Creates a JWT access token.

```python
token = create_access_token(
    data={"sub": str(user.id)},
    expires_delta=timedelta(minutes=30)
)
```

**`decode_token(token: str) -> Optional[dict]`**

Decodes and validates a JWT token.

```python
payload = decode_token(token)
if payload:
    user_id = payload.get("sub")
```

---

### Authentication Dependencies

**`async get_current_user(credentials: HTTPAuthorizationCredentials) -> User`**

Dependency for protected endpoints.

**Usage:**
```python
from app.core.security import get_current_user

@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"user_id": str(current_user.id)}
```

**Flow:**
1. Extract Bearer token from `Authorization` header
2. Decode JWT token
3. Extract user ID from payload
4. Fetch user from database
5. Return User object

**Errors:**
- `401 Unauthorized` - Invalid/expired token
- `401 Unauthorized` - User not found

---

**`async get_current_active_user(current_user: User) -> User`**

Extended dependency for additional checks.

```python
@router.get("/admin")
async def admin_route(current_user: User = Depends(get_current_active_user)):
    # Can add role checks, status checks, etc.
    return {"user": current_user.email}
```

---

### CORS Configuration

**File:** `app/main.py`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # From .env
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"]
)
```

**Environment Configuration:**
```env
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Production
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

---

