# Backend Documentation - Navigation Guide

**Version:** 1.0.0  
**Last Updated:** October 30, 2025

---

## 📖 Documentation Structure

The Career Navigator backend documentation is available in **two formats**:

### 1. Complete Single File (Recommended for Search)
📄 **[COMPLETE_BACKEND_DOCUMENTATION.md](./COMPLETE_BACKEND_DOCUMENTATION.md)**
- All documentation in one comprehensive file (~6,000 lines)
- Easy to search with Ctrl+F
- Perfect for offline reference
- Includes all code examples and detailed explanations

### 2. Multi-Part Documentation (Recommended for Navigation)
The documentation is split into 5 organized parts for easier navigation:

| File | Content | Lines |
|------|---------|-------|
| **[DOCUMENTATION.md](./DOCUMENTATION.md)** | Overview, Architecture, Tech Stack, Installation, Configuration | ~600 |
| **[DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md)** | Database Models, API Endpoints (Auth, Market, Skills) | ~700 |
| **[DOCUMENTATION_PART3.md](./DOCUMENTATION_PART3.md)** | API Endpoints (Learning, Projects), Services Layer | ~800 |
| **[DOCUMENTATION_PART4.md](./DOCUMENTATION_PART4.md)** | Job Collection System, TheirStack Client, Scheduler, Security | ~900 |
| **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** | Error Handling, Testing, Deployment, Troubleshooting, Examples | ~1,000 |

---

## 🚀 Quick Start Guide

### For New Developers

**Recommended Reading Order:**
1. [DOCUMENTATION.md](./DOCUMENTATION.md) - Start here to understand the system
   - Overview and key features
   - Architecture and design patterns
   - Technology stack
   - Installation steps
   - Environment configuration

2. [DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md) - Learn the data layer
   - User and JobPosting models
   - Database schema and indexes
   - Authentication endpoints
   - Market and Skills endpoints

3. [DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md) - Set up your environment
   - Testing examples
   - Deployment guides
   - Troubleshooting common issues

---

## 📚 Documentation by Role

### Backend Developers

**Essential Reading:**
1. ✅ [DOCUMENTATION.md](./DOCUMENTATION.md) - Architecture & Setup
2. ✅ [DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md) - Models & Endpoints
3. ✅ [DOCUMENTATION_PART3.md](./DOCUMENTATION_PART3.md) - Services & Business Logic
4. ✅ [DOCUMENTATION_PART4.md](./DOCUMENTATION_PART4.md) - Job Collection & Security

**Key Topics:**
- Service layer patterns
- MongoDB aggregation pipelines
- JWT authentication flow
- API endpoint design
- Error handling strategies

---

### Frontend Developers

**Essential Reading:**
1. ✅ [DOCUMENTATION.md](./DOCUMENTATION.md) - Overview & Setup
2. ✅ [DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md) - API Endpoints Reference

**Key Topics:**
- API endpoint specifications
- Request/response formats
- Authentication flow
- Error response structures
- CORS configuration

**Quick Reference:**
- **Authentication**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me`
- **Skills**: `GET /skills/gap-analysis`
- **Market**: `GET /market/trending`
- **Learning**: `GET /learning/roadmap`, `GET /learning/resources`
- **Projects**: `GET /projects/recommendations`, `GET /projects/search`

---

### DevOps / System Administrators

**Essential Reading:**
1. ✅ [DOCUMENTATION.md](./DOCUMENTATION.md) - Tech Stack & Configuration
2. ✅ [DOCUMENTATION_PART4.md](./DOCUMENTATION_PART4.md) - Scheduler & Background Jobs
3. ✅ [DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md) - Deployment & Operations

**Key Topics:**
- Environment variables
- MongoDB setup and indexes
- Docker deployment
- Nginx reverse proxy
- Systemd service configuration
- Background scheduler (APScheduler)
- Job collection automation
- Health checks and monitoring

---

### QA / Testers

**Essential Reading:**
1. ✅ [DOCUMENTATION.md](./DOCUMENTATION.md) - Overview & Features
2. ✅ [DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md) - API Endpoints
3. ✅ [DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md) - Testing & Examples

**Key Topics:**
- API testing examples
- Test case scenarios
- Error responses
- cURL command examples
- Python client examples
- Troubleshooting guide

---

## 🔍 Quick Reference by Topic

### Installation & Setup
📄 **[DOCUMENTATION.md](./DOCUMENTATION.md)** → "Installation & Setup" section
- Prerequisites
- Virtual environment setup
- Dependencies installation
- spaCy model download
- Environment configuration
- Running the application

---

### Configuration
📄 **[DOCUMENTATION.md](./DOCUMENTATION.md)** → "Configuration" section
- Environment variables reference
- MongoDB settings
- JWT configuration
- CORS settings
- TheirStack API configuration
- Job collection settings

---

### Database Models
📄 **[DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md)** → "Database Models" section
- **User Model**: Profile data, skills, target roles
- **JobPosting Model**: Job market data from TheirStack
- Schema definitions
- Indexes
- Model methods
- Usage examples

---

### API Endpoints

**Authentication (`/auth`)**  
📄 **[DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md)** → "Authentication Endpoints" section
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update profile

**Market Analysis (`/market`)**  
📄 **[DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md)** → "Market Analysis Endpoints" section
- `GET /market/trending` - Trending skills and locations

**Skills Analysis (`/skills`)**  
📄 **[DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md)** → "Skills Analysis Endpoints" section
- `GET /skills/gap-analysis` - Analyze skill gaps

**Learning Resources (`/learning`)**  
📄 **[DOCUMENTATION_PART3.md](./DOCUMENTATION_PART3.md)** → "Learning Resources Endpoints" section
- `GET /learning/roadmap` - Personalized learning roadmap
- `GET /learning/resources` - Get learning resources
- `GET /learning/resources/search` - Search resources

**Projects (`/projects`)**  
📄 **[DOCUMENTATION_PART3.md](./DOCUMENTATION_PART3.md)** → "Project Recommendations Endpoints" section
- `GET /projects/recommendations` - Personalized projects
- `GET /projects/skill-building` - Projects to build specific skills
- `GET /projects/search` - Search projects
- `GET /projects/all` - Get all projects

---

### Services Layer

📄 **[DOCUMENTATION_PART3.md](./DOCUMENTATION_PART3.md)** → "Services Layer" section
- **Authentication Service**: User management, JWT tokens
- **Gap Analysis Service**: Skill gap calculations
- **Market Analysis Service**: Trending data aggregation
- **Learning Service**: Learning roadmap generation
- **Project Service**: Project recommendations

---

### Job Collection System

📄 **[DOCUMENTATION_PART4.md](./DOCUMENTATION_PART4.md)** → "Job Collection System" section
- **TheirStack Client**: API integration with retry logic
- **Job Collection Service**: Orchestrates data collection
- **User Job Collection Service**: User-based collection
- **Skill Extractor Service**: Technology slug mapping
- Role variation generation
- Location to country code mapping

---

### Background Tasks & Scheduling

📄 **[DOCUMENTATION_PART4.md](./DOCUMENTATION_PART4.md)** → "Background Tasks & Scheduling" section
- **Scheduler Service**: APScheduler integration
- Daily job collection (2 AM)
- Weekly cleanup (Sundays at 3 AM)
- Manual collection triggers
- Application startup integration

---

### Security & Authentication

📄 **[DOCUMENTATION_PART4.md](./DOCUMENTATION_PART4.md)** → "Security & Authentication" section
- Password hashing (pbkdf2_sha256)
- JWT token management
- Access and refresh tokens
- Authentication dependencies
- CORS configuration
- Protected route patterns

---

### Error Handling

📄 **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "Error Handling" section
- Global exception handler
- HTTP exception patterns
- TheirStack API error handling
- Logging strategy
- Error response formats

---

### Testing

📄 **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "Testing" section
- Unit test examples
- API endpoint testing
- Test structure
- Running tests with pytest
- Test coverage

---

### Deployment

📄 **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "Deployment" section
- **Production Checklist**: Environment setup
- **Docker Deployment**: Dockerfile and docker-compose
- **Nginx Configuration**: Reverse proxy setup
- **Systemd Service**: Service file configuration
- **MongoDB Production Setup**: Authentication and indexes

---

### Troubleshooting

📄 **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "Troubleshooting" section
- MongoDB connection issues
- TheirStack authentication errors
- No job data found
- spaCy model issues
- JWT token expired
- Cache issues
- Debug mode setup

---

### API Usage Examples

📄 **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "API Usage Examples" section
- Complete user journey (cURL examples)
- Python client implementation
- Registration and login flow
- Skill gap analysis requests
- Market trends requests
- Learning roadmap requests
- Project recommendations requests

---

## 🎯 Common Use Cases

### "How do I get started?"
👉 Read **[DOCUMENTATION.md](./DOCUMENTATION.md)** from start to finish

### "How do I call the API endpoints?"
👉 See **[DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md)** and **[DOCUMENTATION_PART3.md](./DOCUMENTATION_PART3.md)** for endpoint specs  
👉 See **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "API Usage Examples" for cURL and Python examples

### "How does the job collection work?"
👉 Read **[DOCUMENTATION_PART4.md](./DOCUMENTATION_PART4.md)** → "Job Collection System"

### "How do I deploy to production?"
👉 Read **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "Deployment"

### "Something isn't working, what do I do?"
👉 Check **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "Troubleshooting"

### "How do I write tests?"
👉 Read **[DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md)** → "Testing"

### "What are the database models?"
👉 Read **[DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md)** → "Database Models"

### "How does authentication work?"
👉 Read **[DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md)** → "Authentication Endpoints"  
👉 Read **[DOCUMENTATION_PART4.md](./DOCUMENTATION_PART4.md)** → "Security & Authentication"

---

## 📊 Documentation Statistics

- **Total Documentation**: ~6,000 lines
- **Code Examples**: 100+ examples
- **API Endpoints**: 15+ documented endpoints
- **Services**: 8 service classes documented
- **Models**: 2 database models
- **Configuration Options**: 15+ environment variables
- **Deployment Guides**: Docker, Systemd, Nginx
- **Test Examples**: Unit tests, API tests

---

## 🔄 Documentation Updates

This documentation is actively maintained. Last updated: **October 30, 2025**

For the latest updates, always refer to the complete documentation file or individual parts.

---

## 💡 Tips for Using This Documentation

1. **Use Ctrl+F** in the complete documentation file to search for specific topics
2. **Bookmark** the parts you reference most frequently
3. **Follow the reading order** based on your role for the best learning experience
4. **Try the examples** in the API Usage Examples section
5. **Check Troubleshooting** before asking for help

---

## 📞 Need Help?

- **API Questions**: See [DOCUMENTATION_PART2.md](./DOCUMENTATION_PART2.md) and [DOCUMENTATION_PART3.md](./DOCUMENTATION_PART3.md)
- **Deployment Issues**: See [DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md) → "Deployment" and "Troubleshooting"
- **Development Setup**: See [DOCUMENTATION.md](./DOCUMENTATION.md) → "Installation & Setup"
- **Testing**: See [DOCUMENTATION_PART5.md](./DOCUMENTATION_PART5.md) → "Testing"

---

**Happy Coding! 🚀**
