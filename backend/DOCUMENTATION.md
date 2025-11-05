# Career Navigator Backend - Complete Documentation

**Version:** 1.0.0  
**Last Updated:** October 30, 2025  
**Author:** Career Navigator Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [Services](#services)
9. [Security & Authentication](#security--authentication)
10. [Job Collection System](#job-collection-system)
11. [Skill Analysis System](#skill-analysis-system)
12. [Learning & Projects System](#learning--projects-system)
13. [Background Tasks & Scheduling](#background-tasks--scheduling)
14. [Error Handling](#error-handling)
15. [Testing](#testing)
16. [Deployment](#deployment)
17. [Troubleshooting](#troubleshooting)
18. [API Usage Examples](#api-usage-examples)

---

## Overview

Career Navigator is a comprehensive career guidance platform designed to help users:
- **Analyze skill gaps** between their current skills and target job roles
- **Discover trending skills** in the job market
- **Get personalized learning roadmaps** with curated resources
- **Receive project recommendations** to build practical experience
- **Track job market trends** with real-time data

### Key Features

✅ **Real-time Job Market Analysis** - Automated collection of job postings from TheirStack API  
✅ **Skill Gap Analysis** - Compare user skills against market demands  
✅ **Personalized Learning Paths** - Custom roadmaps with curated resources  
✅ **Project Recommendations** - Hands-on projects tailored to skill level  
✅ **Market Insights** - Trending skills, locations, and salary data  
✅ **User Authentication** - Secure JWT-based authentication  
✅ **Background Scheduling** - Automated daily job collection and cleanup  

---

## Architecture

### System Design

The backend follows a **layered architecture** pattern:

```
┌─────────────────────────────────────────────────────┐
│                  API Layer (FastAPI)                │
│         /auth, /skills, /market, /learning          │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│              Router Layer (Endpoints)                │
│    auth.py, skills.py, market.py, learning.py       │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│            Service Layer (Business Logic)            │
│   auth_service, gap_service, market_service, etc.   │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│              Data Layer (MongoDB/Beanie)             │
│           User, JobPosting (Document Models)         │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│            External Services & Integrations          │
│         TheirStack API, spaCy NLP, Scheduler         │
└─────────────────────────────────────────────────────┘
```

### Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   ├── core/                      # Core functionality
│   │   ├── config.py             # Configuration & settings
│   │   ├── database.py           # Database connection
│   │   └── security.py           # Authentication & security
│   ├── models/                    # Database models
│   │   ├── user.py               # User document model
│   │   └── job_posting.py        # Job posting document model
│   ├── routers/                   # API route handlers
│   │   ├── auth.py               # Authentication endpoints
│   │   ├── skills.py             # Skill gap analysis endpoints
│   │   ├── market.py             # Market trends endpoints
│   │   ├── learning.py           # Learning resources endpoints
│   │   └── projects.py           # Project recommendations endpoints
│   ├── schemas/                   # Pydantic schemas
│   │   ├── auth.py               # Auth request/response schemas
│   │   ├── analytics.py          # Analytics schemas
│   │   └── learning.py           # Learning & project schemas
│   └── services/                  # Business logic services
│       ├── auth_service.py       # User authentication service
│       ├── gap_service.py        # Skill gap analysis
│       ├── market_service.py     # Market trends analysis
│       ├── learning_service.py   # Learning path generation
│       ├── project_service.py    # Project recommendations
│       ├── job_collection_service.py  # Job data collection
│       ├── scheduler_service.py  # Background task scheduling
│       ├── theirstack_client.py  # TheirStack API client
│       ├── skill_extractor.py    # NLP-based skill extraction
│       └── user_job_collection_service.py  # User-specific job collection
├── scripts/                       # Utility scripts
│   ├── clean_skills_data.py      # Data cleaning scripts
│   └── migrate_experience_levels.py  # Database migrations
├── requirements.txt               # Python dependencies
├── run_manual.py                  # Manual run script
├── learning_resources.json        # Learning resources data
├── project_ideas.json             # Project ideas data
└── .env                          # Environment variables
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.9+ | Programming language |
| **FastAPI** | 0.104.1 | Web framework |
| **MongoDB** | 4.0+ | NoSQL database |
| **Beanie** | 1.23.6 | ODM for MongoDB |
| **Motor** | 3.3.2 | Async MongoDB driver |
| **Pydantic** | 2.9.0 | Data validation |

### Supporting Libraries

| Library | Purpose |
|---------|---------|
| **python-jose** | JWT token generation/validation |
| **passlib** | Password hashing (pbkdf2_sha256) |
| **httpx** | Async HTTP client for API calls |
| **tenacity** | Retry logic for API calls |
| **apscheduler** | Background task scheduling |
| **spacy** | NLP for skill extraction |
| **cachetools** | In-memory caching |

---

## Installation & Setup

### Prerequisites

- Python 3.9 or higher
- MongoDB 4.0 or higher
- pip package manager
- Virtual environment (recommended)

### Step 1: Clone Repository

```bash
cd d:\Career_Navigator_main\backend
```

### Step 2: Create Virtual Environment

```bash
python -m venv venv
.\venv\Scripts\activate  # Windows PowerShell
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Download spaCy Model

```bash
python -m spacy download en_core_web_sm
```

### Step 5: Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/career_navigator

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
APP_NAME=Career Navigator API
APP_VERSION=1.0.0
DEBUG=True

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# TheirStack API Configuration
THEIR_STACK_API_KEY=your-theirstack-api-key-here
THEIR_STACK_BASE_URL=https://api.theirstack.com
THEIR_STACK_TIMEOUT=30
THEIR_STACK_MAX_RETRIES=3
THEIR_STACK_RATE_LIMIT=300

# Job Collection Configuration
JOB_COLLECTION_SCHEDULE=0 2 * * *  # Daily at 2 AM
MAX_JOBS_PER_SEARCH=100
JOB_DATA_RETENTION_DAYS=90
```

### Step 6: Start MongoDB

Ensure MongoDB is running on your system:

```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"
```

### Step 7: Run the Application

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the manual run script
python run_manual.py
```

### Step 8: Verify Installation

Open your browser and navigate to:
- **API Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

---

## Configuration

### Environment Variables Reference

#### MongoDB Settings

```env
MONGODB_URI=mongodb://localhost:27017/career_navigator
```
- **Default:** `mongodb://localhost:27017/career_navigator`
- **Description:** MongoDB connection string
- **Production:** Use authenticated connection with replica sets

#### JWT Settings

```env
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```
- **JWT_SECRET_KEY:** Secret key for signing JWT tokens (MUST be changed in production)
- **JWT_ALGORITHM:** Algorithm for JWT signing (HS256, HS512, RS256)
- **JWT_ACCESS_TOKEN_EXPIRE_MINUTES:** Token expiration time in minutes

#### Application Settings

```env
APP_NAME=Career Navigator API
APP_VERSION=1.0.0
DEBUG=True
```
- **DEBUG:** Enable debug mode (set to `False` in production)

#### CORS Settings

```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```
- **Description:** Comma-separated list of allowed origins
- **Production:** Add your production frontend URL

#### TheirStack API Settings

```env
THEIR_STACK_API_KEY=your-api-key
THEIR_STACK_BASE_URL=https://api.theirstack.com
THEIR_STACK_TIMEOUT=30
THEIR_STACK_MAX_RETRIES=3
THEIR_STACK_RATE_LIMIT=300
```
- **THEIR_STACK_API_KEY:** API key for TheirStack (REQUIRED)
- **THEIR_STACK_TIMEOUT:** Request timeout in seconds
- **THEIR_STACK_MAX_RETRIES:** Number of retry attempts for failed requests
- **THEIR_STACK_RATE_LIMIT:** Rate limit for API calls

#### Job Collection Settings

```env
JOB_COLLECTION_SCHEDULE=0 2 * * *
MAX_JOBS_PER_SEARCH=100
JOB_DATA_RETENTION_DAYS=90
```
- **JOB_COLLECTION_SCHEDULE:** Cron expression for scheduled job collection
- **MAX_JOBS_PER_SEARCH:** Maximum jobs to collect per role/location
- **JOB_DATA_RETENTION_DAYS:** Days to retain old job data before cleanup

### Configuration Class

The `Settings` class in `app/core/config.py` handles all configuration:

```python
from app.core.config import settings

# Access configuration
print(settings.mongodb_uri)
print(settings.jwt_secret_key)
print(settings.allowed_origins)
```

---

