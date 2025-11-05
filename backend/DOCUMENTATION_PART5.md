# Career Navigator Backend Documentation - Part 5

## Error Handling

### Global Exception Handler

**File:** `app/main.py`

```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception handler caught: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

All unhandled exceptions return a generic 500 error to avoid exposing internal details.

---

### HTTP Exception Patterns

#### Authentication Errors (401)

```python
from fastapi import HTTPException, status

# Invalid credentials
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
    headers={"WWW-Authenticate": "Bearer"}
)

# Invalid token
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"}
)
```

---

#### Validation Errors (400)

```python
# Duplicate email
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Email already registered"
)

# Invalid input
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Role 'XYZ' is not in your target roles. Available: Software Engineer, Data Scientist"
)
```

---

#### Not Found Errors (404)

```python
# No data found
raise HTTPException(
    status_code=404,
    detail={
        "message": "No job data found for 'Senior Backend Engineer'",
        "suggestions": [
            "Try increasing the time window",
            "Check if the role name is spelled correctly",
            "Consider using a more general role title"
        ],
        "alternatives": ["Software Engineer", "Backend Developer"]
    }
)
```

---

#### Conflict Errors (409)

```python
from beanie.exceptions import RevisionIdWasChanged

try:
    await user.update_profile(**update_dict)
except RevisionIdWasChanged:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="User data was modified by another request. Please try again."
    )
```

---

#### Server Errors (500)

```python
# Generic server error
raise HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail="Unable to retrieve market data. Please try again later."
)
```

---

### TheirStack API Error Handling

#### Custom Exceptions

```python
class TheirStackClientError(Exception):
    """Base exception for TheirStack client errors."""

class TheirStackAuthenticationError(TheirStackClientError):
    """Raised when authentication with TheirStack fails."""

class TheirStackRetryableError(TheirStackClientError):
    """Raised for retryable TheirStack API errors."""
```

#### Error Mapping

| HTTP Status | Exception | Action |
|-------------|-----------|--------|
| 401, 403 | `TheirStackAuthenticationError` | Check API key |
| 429 | `TheirStackRetryableError` | Retry with backoff |
| 5xx | `TheirStackRetryableError` | Retry with backoff |
| 4xx (other) | `TheirStackClientError` | Log and fail |
| Network errors | `TheirStackRetryableError` | Retry with backoff |

---

### Logging Strategy

**Configuration:**
```python
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)
```

**Log Levels:**

**INFO** - Normal operations
```python
logger.info("Connected to MongoDB successfully")
logger.info(f"User {user.email} logged in")
logger.info(f"Generated {len(projects)} project recommendations")
```

**WARNING** - Recoverable issues
```python
logger.warning("en_core_web_sm model not found, using basic English model")
logger.warning(f"No resources found for skill: {skill}")
logger.warning(f"No job data available for the last {days} days")
```

**ERROR** - Errors requiring attention
```python
logger.error(f"Error connecting to MongoDB: {e}")
logger.error(f"TheirStack authentication failed: {exc}")
logger.error(f"Failed to upsert job: {exc}")
```

**DEBUG** - Detailed debugging information
```python
logger.debug(f"Extracted {len(skills)} skills from text length {len(text)}")
logger.debug(f"Cache hit for key: {cache_key}")
```

---

## Testing

### Unit Tests

Create a `tests/` directory structure:

```
backend/tests/
├── __init__.py
├── conftest.py              # Pytest fixtures
├── test_auth_service.py
├── test_gap_service.py
├── test_market_service.py
├── test_learning_service.py
├── test_project_service.py
└── test_job_collection_service.py
```

#### Example: Testing Auth Service

**File:** `tests/test_auth_service.py`

```python
import pytest
from app.services.auth_service import auth_service
from app.schemas.auth import UserCreate
from app.models.user import User

@pytest.mark.asyncio
async def test_create_user():
    """Test user creation."""
    user_data = UserCreate(
        email="test@example.com",
        password="SecurePass123",
        full_name="Test User",
        skills=["Python"],
        target_roles=["Software Engineer"]
    )
    
    user = await auth_service.create_user(user_data)
    
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert "python" in user.skills  # Normalized
    
    # Cleanup
    await user.delete()

@pytest.mark.asyncio
async def test_duplicate_email():
    """Test that duplicate emails are rejected."""
    user_data = UserCreate(
        email="duplicate@example.com",
        password="SecurePass123",
        full_name="User One"
    )
    
    user1 = await auth_service.create_user(user_data)
    
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.create_user(user_data)
    
    assert exc_info.value.status_code == 400
    assert "already registered" in exc_info.value.detail
    
    # Cleanup
    await user1.delete()

@pytest.mark.asyncio
async def test_authenticate_user():
    """Test user authentication."""
    # Create user
    user_data = UserCreate(
        email="auth@example.com",
        password="SecurePass123",
        full_name="Auth User"
    )
    user = await auth_service.create_user(user_data)
    
    # Test correct credentials
    auth_user = await auth_service.authenticate_user(
        "auth@example.com",
        "SecurePass123"
    )
    assert auth_user is not None
    assert auth_user.email == "auth@example.com"
    
    # Test incorrect password
    auth_user = await auth_service.authenticate_user(
        "auth@example.com",
        "WrongPassword"
    )
    assert auth_user is None
    
    # Cleanup
    await user.delete()
```

---

#### Example: Testing API Endpoints

**File:** `tests/test_auth_endpoints.py`

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_register_endpoint():
    """Test user registration endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/auth/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123",
            "full_name": "New User",
            "skills": ["Python", "React"],
            "target_roles": ["Software Engineer"]
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "python" in data["skills"]

@pytest.mark.asyncio
async def test_login_endpoint():
    """Test user login endpoint."""
    # First register a user
    async with AsyncClient(app=app, base_url="http://test") as client:
        await client.post("/auth/register", json={
            "email": "login@example.com",
            "password": "SecurePass123",
            "full_name": "Login User"
        })
        
        # Then login
        response = await client.post("/auth/login", json={
            "email": "login@example.com",
            "password": "SecurePass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "login@example.com"

@pytest.mark.asyncio
async def test_protected_endpoint():
    """Test accessing protected endpoint with token."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register and login
        await client.post("/auth/register", json={
            "email": "protected@example.com",
            "password": "SecurePass123",
            "full_name": "Protected User"
        })
        
        login_response = await client.post("/auth/login", json={
            "email": "protected@example.com",
            "password": "SecurePass123"
        })
        token = login_response.json()["access_token"]
        
        # Access protected endpoint
        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "protected@example.com"
```

---

### Running Tests

```bash
# Install pytest and dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth_service.py

# Run with verbose output
pytest -v

# Run specific test
pytest tests/test_auth_service.py::test_create_user
```

---

## Deployment

### Production Checklist

#### 1. Environment Variables

Update `.env` for production:

```env
# Change debug mode
DEBUG=False

# Use strong JWT secret
JWT_SECRET_KEY=<generate-strong-random-key>

# Production MongoDB with authentication
MONGODB_URI=mongodb://username:password@host:27017/career_navigator?authSource=admin

# Add production frontend URL
ALLOWED_ORIGINS=https://yourapp.com

# Valid TheirStack API key
THEIR_STACK_API_KEY=<production-api-key>

# Adjust job collection schedule
JOB_COLLECTION_SCHEDULE=0 2 * * *  # 2 AM daily
```

#### 2. Generate Strong JWT Secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 3. MongoDB Setup

```bash
# Connect to MongoDB
mongosh

# Create database user
use career_navigator
db.createUser({
  user: "career_nav_user",
  pwd: "strong_password_here",
  roles: [{ role: "readWrite", db: "career_navigator" }]
})

# Create indexes (done automatically by Beanie)
```

#### 4. Install Production Dependencies

```bash
# In production environment
pip install -r requirements.txt
pip install gunicorn  # Production WSGI server
```

#### 5. Run with Gunicorn

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

**Systemd Service File** (`/etc/systemd/system/career-navigator.service`):

```ini
[Unit]
Description=Career Navigator API
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/career-navigator/backend
Environment="PATH=/var/www/career-navigator/backend/venv/bin"
ExecStart=/var/www/career-navigator/backend/venv/bin/gunicorn \
  app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable career-navigator
sudo systemctl start career-navigator
sudo systemctl status career-navigator
```

---

### Docker Deployment

**Dockerfile:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/career_navigator
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - THEIR_STACK_API_KEY=${THEIR_STACK_API_KEY}
      - ALLOWED_ORIGINS=http://localhost:3000
    depends_on:
      - mongodb
    restart: unless-stopped
    volumes:
      - ./learning_resources.json:/app/learning_resources.json
      - ./project_ideas.json:/app/project_ideas.json

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    environment:
      - MONGO_INITDB_DATABASE=career_navigator

volumes:
  mongodb_data:
```

**Build and Run:**

```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

---

### Nginx Reverse Proxy

**Configuration** (`/etc/nginx/sites-available/career-navigator`):

```nginx
server {
    listen 80;
    server_name api.yourapp.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/career-navigator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error:**
```
Error connecting to MongoDB: ...
```

**Solutions:**
- Check MongoDB is running: `sudo systemctl status mongod`
- Verify connection string in `.env`
- Check network connectivity
- Verify authentication credentials
- Check firewall rules

---

#### 2. TheirStack Authentication Error

**Error:**
```
TheirStack authentication failed: 401
```

**Solutions:**
- Verify `THEIR_STACK_API_KEY` in `.env`
- Check API key is active in TheirStack dashboard
- Ensure no extra spaces in API key
- Check API rate limits

---

#### 3. No Job Data Found

**Error:**
```
No job data found for 'Role Name'
```

**Solutions:**
- Increase time window: `?days=60`
- Check role name spelling
- Use more general role title
- Trigger manual job collection
- Check if scheduler is running
- Verify TheirStack API is working

**Manual Collection:**
```python
from app.services.job_collection_service import JobCollectionService

service = JobCollectionService()
await service.collect_jobs_for_roles(
    roles=["Software Engineer"],
    locations=["United States"],
    max_age_days=30,
    per_role_limit=50
)
```

---

#### 4. spaCy Model Not Found

**Error:**
```
OSError: [E050] Can't find model 'en_core_web_sm'
```

**Solution:**
```bash
python -m spacy download en_core_web_sm
```

---

#### 5. JWT Token Expired

**Error:**
```
401 Unauthorized: Could not validate credentials
```

**Solutions:**
- Login again to get new token
- Check token expiration time in config
- Increase `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` if needed

---

#### 6. Cache Issues (Development)

**Issue:**
Trending data not updating after new jobs collected

**Solution:**
Clear cache manually:
```python
from app.services.gap_service import clear_cache
clear_cache()
```

Or restart the application.

---

### Debug Mode

Enable detailed logging:

```python
# In app/main.py
logging.basicConfig(
    level=logging.DEBUG,  # Changed from INFO
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
```

---

### Health Check

```bash
# Check API is running
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "app": "Career Navigator API",
#   "version": "1.0.0"
# }
```

---

## API Usage Examples

### Complete User Journey

#### 1. Register Account

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "full_name": "John Doe",
    "skills": ["Python", "JavaScript"],
    "target_roles": ["Software Engineer", "Full Stack Developer"],
    "experience_level": "2nd Year",
    "location": "San Francisco, CA"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Save the token:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 3. Get Profile

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Update Profile (Add Skills)

```bash
curl -X PUT http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["Python", "JavaScript", "React", "MongoDB", "FastAPI"]
  }'
```

#### 5. Get Skill Gap Analysis

```bash
curl -X GET "http://localhost:8000/skills/gap-analysis?role=Software%20Engineer&days=30&threshold=0.25" \
  -H "Authorization: Bearer $TOKEN"
```

#### 6. Get Market Trends

```bash
curl -X GET "http://localhost:8000/market/trending?days=30&skills_limit=15&locations_limit=10"
```

#### 7. Get Learning Roadmap

```bash
curl -X GET "http://localhost:8000/learning/roadmap?target_role=Software%20Engineer&include_gap_analysis=true" \
  -H "Authorization: Bearer $TOKEN"
```

#### 8. Get Project Recommendations

```bash
curl -X GET "http://localhost:8000/projects/recommendations?difficulty=Beginner&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

#### 9. Search Projects

```bash
curl -X GET "http://localhost:8000/projects/search?query=web&difficulty=Beginner&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Python Client Example

```python
import httpx
import asyncio

class CareerNavigatorClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
    
    async def register(self, email, password, full_name, **kwargs):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/auth/register",
                json={
                    "email": email,
                    "password": password,
                    "full_name": full_name,
                    **kwargs
                }
            )
            return response.json()
    
    async def login(self, email, password):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password}
            )
            data = response.json()
            self.token = data["access_token"]
            return data
    
    async def get_gap_analysis(self, role, days=30, threshold=0.25):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/skills/gap-analysis",
                params={"role": role, "days": days, "threshold": threshold},
                headers={"Authorization": f"Bearer {self.token}"}
            )
            return response.json()
    
    async def get_trending_market(self, days=30):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/market/trending",
                params={"days": days}
            )
            return response.json()
    
    async def get_project_recommendations(self, difficulty=None, limit=10):
        async with httpx.AsyncClient() as client:
            params = {"limit": limit}
            if difficulty:
                params["difficulty"] = difficulty
            
            response = await client.get(
                f"{self.base_url}/projects/recommendations",
                params=params,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            return response.json()

# Usage
async def main():
    client = CareerNavigatorClient()
    
    # Login
    await client.login("john@example.com", "SecurePass123")
    
    # Get gap analysis
    gap = await client.get_gap_analysis("Software Engineer")
    print(f"Coverage: {gap['coverage_percentage']}%")
    print(f"Missing skills: {gap['missing_skills']}")
    
    # Get market trends
    market = await client.get_trending_market(days=30)
    print(f"Top skills: {[s['skill'] for s in market['top_skills'][:5]]}")
    
    # Get projects
    projects = await client.get_project_recommendations(difficulty="Beginner")
    print(f"Found {len(projects['projects'])} beginner projects")

asyncio.run(main())
```

---

## Conclusion

This documentation covers the complete Career Navigator backend system including:

✅ Architecture and design patterns  
✅ Database models and schemas  
✅ All API endpoints with examples  
✅ Service layer business logic  
✅ Job collection and scheduling  
✅ Security and authentication  
✅ Error handling and logging  
✅ Testing strategies  
✅ Production deployment  
✅ Troubleshooting guide  

For questions or issues, please refer to the code comments or contact the development team.

---

**Last Updated:** October 30, 2025  
**Version:** 1.0.0
