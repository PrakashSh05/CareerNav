# CareerNav

An AI-powered, real-time career guidance platform that bridges the industry–academia skill gap for engineering students with market-driven insights, personalized learning roadmaps, and project recommendations.

- Backend: FastAPI + MongoDB + TheirStack Jobs API + spaCy
- Frontend: React (Vite) + TailwindCSS + Chart.js

This repository is a monorepo containing both the backend API and the frontend web app.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started (Windows)](#getting-started-windows)
  - [1) Backend Setup](#1-backend-setup)
  - [2) Frontend Setup](#2-frontend-setup)
  - [3) Run Both Apps](#3-run-both-apps)
  - [4) Seed / Verify Data (Optional)](#4-seed--verify-data-optional)
- [Configuration](#configuration)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Frontend Environment Variables](#frontend-environment-variables)
- [API Overview](#api-overview)
- [Data & Models](#data--models)
- [Validation & Research Artifacts](#validation--research-artifacts)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

Career Navigator continuously ingests job market data, extracts in-demand skills, compares them with a user's profile, and produces:
- Market pulse dashboards (trending skills, locations)
- Personalized skill gap analysis for target roles
- Learning roadmaps with curated resources
- Project recommendations to build missing skills

Built with clean architecture, async data pipelines, and a modern UI geared for students and early-career professionals.

---

## Key Features

- Real-time market data (TheirStack API) with daily ingestion and 90-day rolling window
- Skills analytics using curated technology slugs + NLP support for resumes
- Threshold-based gap analysis (tune required skill demand %)
- Personalized learning resources and project suggestions
- JWT auth, onboarding, protected routes
- Beautiful, responsive dashboard with interactive charts

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                         Frontend                          │
│ React (Vite) · TailwindCSS · Chart.js · React Router      │
│  - Auth, Onboarding, Dashboard, Skill Gap, Learning       │
└───────────────────────────────────────────────────────────┘
                         ▲              │
                         │  HTTPS/JSON  │
                         │              ▼
┌───────────────────────────────────────────────────────────┐
│                          Backend                          │
│ FastAPI · Beanie/MongoDB · spaCy · APScheduler            │
│ Routers: /auth, /market, /skills, /learning, /projects    │
│ Services: job collection, gap analysis, learning, etc.    │
└───────────────────────────────────────────────────────────┘
                         ▲              │
                         │  Async HTTP  │
                         │              ▼
┌───────────────────────────────────────────────────────────┐
│                  External Integrations                    │
│  TheirStack Jobs API  ·  spaCy model (en_core_web_sm)     │
└───────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- Backend: FastAPI, Python 3.9+, Beanie/MongoDB, httpx, tenacity, APScheduler, spaCy
- Frontend: React 18, Vite, TailwindCSS, Chart.js, react-chartjs-2, React Router
- Auth: JWT (python-jose), passlib (bcrypt/pbkdf2)
- Infra: .env config, CORS, caching

---

## Project Structure

```
backend/
  app/
    core/ (config, database, security)
    models/ (User, JobPosting)
    routers/ (auth, market, skills, learning, projects)
    schemas/ (auth, analytics, learning)
    services/ (job_collection, scheduler, gap, learning, projects, theirstack_client, skill_extractor)
  requirements.txt, run_manual.py, learning_resources.json, project_ideas.json

frontend/
  src/ (components, pages, services, contexts, hooks, utils)
  vite.config.js (port 3000, /api → http://localhost:8000 proxy)
  tailwind.config.js, package.json
```

---

## Getting Started (Windows)

Prerequisites:
- Python 3.9+ and pip
- Node.js 16+ and npm (or yarn)
- MongoDB (local service or Atlas URI)

### 1) Backend Setup

```powershell
# From repo root
cd backend

# Create and activate venv
python -m venv venv
./venv/Scripts/Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Install spaCy English model (required for NLP features)
python -m spacy download en_core_web_sm

# Configure environment
# Create backend/.env (see variables below)

# Start API (dev)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 2) Frontend Setup

```powershell
# In a new terminal from repo root
cd frontend

# Install deps
npm install

# Configure environment (optional)
# Create frontend/.env with e.g. VITE_API_BASE_URL=/api

# Start dev server
npm run dev
```

The web app will be available at:
- http://localhost:3000 (Vite dev server)

The dev server proxies API calls from `/api/*` → `http://localhost:8000/*`.

### 3) Run Both Apps

- Start the backend (port 8000)
- Start the frontend (port 3000)
- Open http://localhost:3000 and sign up/login

### 4) Seed / Verify Data (Optional)

You can manually trigger an initial job collection seed in a Python REPL:

```python
# Run inside the backend venv (PowerShell: ./venv/Scripts/Activate.ps1)
import asyncio
from app.services.job_collection_service import JobCollectionService

async def seed():
    svc = JobCollectionService()
    roles = ["Software Engineer", "Data Scientist", "DevOps Engineer"]
    locations = ["India", "Remote"]
    await svc.collect_jobs_for_roles(roles, locations, max_age_days=14)

asyncio.run(seed())
```

Then verify data via API:
- GET http://localhost:8000/market/trending

---

## Configuration

### Backend Environment Variables
Create `backend/.env` and set the following:

```
# Core
MONGODB_URI=mongodb://localhost:27017/career_navigator
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
APP_NAME=Career Navigator API
APP_VERSION=1.0.0
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000

# TheirStack API
THEIR_STACK_API_KEY=your_api_key
THEIR_STACK_BASE_URL=https://api.theirstack.com
THEIR_STACK_TIMEOUT=30
THEIR_STACK_MAX_RETRIES=3
THEIR_STACK_RATE_LIMIT=300

# Ingestion & Cleanup
JOB_COLLECTION_SCHEDULE=0 2 * * *
MAX_JOBS_PER_SEARCH=100
JOB_DATA_RETENTION_DAYS=90
```

Notes:
- Obtain a TheirStack API key and set `THEIR_STACK_API_KEY`.
- If using MongoDB Atlas, replace `MONGODB_URI` with your cluster URI.

### Frontend Environment Variables
Create `frontend/.env` (optional for local dev):

```
VITE_API_BASE_URL=/api
VITE_NODE_ENV=development
```

---

## API Overview

High-level endpoints (see Swagger at /docs for full details):

- Auth
  - POST `/auth/register`, `/auth/login`
  - GET `/auth/me`, PUT `/auth/me`
- Market Analysis
  - GET `/market/trending?days=30&skills_limit=15`
- Skills
  - GET `/skills/gap-analysis?role=Software%20Engineer&days=30&threshold=0.25` (auth required)
- Learning
  - GET `/learning/roadmap?target_role=...&include_gap_analysis=true`
  - GET `/learning/resources?skills=Python&skills=React`
  - GET `/learning/resources/search?query=python`
- Projects
  - GET `/projects/recommendations`
  - GET `/projects/skill-building?skills=Docker&skills=Kubernetes`
  - GET `/projects/search?query=web%20app`

---

## Data & Models

- JobPosting: title, company, location, description, `technology_slugs`, skills, url, search context, timestamps
- User: email, hashed_password, full_name, skills, target_roles, experience_level, location

Indexes:
- `url` (unique), `scraped_at`, `skills`, `(search_keywords, search_location)`, `company`, `location`

---

## Validation & Research Artifacts

This project includes publication-oriented validation assets:
- `PUBLICATION_ANALYSIS.md` — detailed alignment and uniqueness analysis
- `PUBLICATION_QUICK_SUMMARY.md` — TL;DR summary for reviewers
- `NextLeapAI_Publication_Draft.md` — full paper draft with evaluation section

Evaluation (simulated placeholders you can replace with real data):
- Skill extraction accuracy: API slugs (P: 0.95, R: 0.88, F1: 0.91) vs NLP (P: 0.67, R: 0.81, F1: 0.73)
- User survey (n=30): 4.3/5 relevance, 87% roadmap helpful, 83% would recommend

---

## Deployment

### Backend (Uvicorn/Gunicorn)

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (Example: Backend Only)

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

For a full-stack deployment, serve the frontend statically (Vite build) behind a reverse proxy (e.g., Nginx) and proxy `/api` to the backend.

---

## Troubleshooting

- MongoDB connection errors: verify `MONGODB_URI` and that the service is running
- spaCy model not found: run `python -m spacy download en_core_web_sm`
- CORS issues: update `ALLOWED_ORIGINS` in backend `.env`
- No jobs returned: verify TheirStack API key, broaden roles/locations/date window
- Frontend cannot reach API: ensure frontend dev server proxy is active (`/api` → `8000`)

---

## Contributing

1. Fork the repo and create a feature branch
2. Follow the code style (PEP8 for Python, ESLint rules for React)
3. Add tests when adding business logic
4. Open a pull request with a clear description

---

© 2025 Career Navigator. For licensing, see project terms or add a LICENSE file.
