from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import sys

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routers.auth import router as auth_router
from app.routers.market import router as market_router
from app.routers.skills import router as skills_router
from app.routers.learning import router as learning_router
from app.routers.projects import router as projects_router
from app.services.scheduler_service import SchedulerService
from app.services.job_collection_service import JobCollectionService
from app.services.theirstack_client import (
    TheirStackClient,
    TheirStackAuthenticationError,
    TheirStackRetryableError,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Default roles/locations for automated job collection
POPULAR_ROLES = [
    "Software Engineer",
    "Data Scientist",
    "DevOps Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Machine Learning Engineer",
    "Product Manager",
]

POPULAR_LOCATIONS = [
    # North America
    "United States",
    "Canada",
    
    # Europe
    "United Kingdom",
    "Germany",
    "Netherlands",
    "France",
    "Ireland",
    "Switzerland",
    "Sweden",
    
    # Asia-Pacific
    "India",
    "Singapore",
    "Australia",
    "Japan",
    "Hong Kong",
    
    # Remote
    "Remote",
]


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="A comprehensive career navigation platform API",
    debug=settings.debug
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception handler caught: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database, scheduler, and external integrations on startup"""
    try:
        await connect_to_mongo()
        logger.info("Connected to MongoDB")

        job_collection_service = JobCollectionService()
        scheduler = SchedulerService(
            roles=POPULAR_ROLES,
            locations=POPULAR_LOCATIONS,
            collection_service=job_collection_service,
        )

        app.state.job_collection_service = job_collection_service
        app.state.scheduler = scheduler

        await scheduler.start_scheduler()
        logger.info("Background scheduler started")

        client = TheirStackClient()
        try:
            await client.search_jobs(
                {
                    "job_title_or": ["Software Engineer"],
                    "posted_at_max_age_days": 1,
                    "limit": 1,
                    "page": 1,
                    "job_country_code_or": ["US"],
                }
            )
            logger.info("TheirStack API connectivity OK")
        except TheirStackAuthenticationError as exc:
            logger.error("TheirStack connectivity check failed (authentication): %s", exc)
        except TheirStackRetryableError as exc:
            logger.error("TheirStack connectivity check failed (retryable): %s", exc)
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("TheirStack connectivity check failed: %s", exc)
        finally:
            await client.close()

        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    try:
        if hasattr(app.state, "scheduler"):
            await app.state.scheduler.stop_scheduler()
        await close_mongo_connection()
        logger.info("Application shutdown completed successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "app": settings.app_name, "version": settings.app_version}


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Career Navigator API",
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc"
    }


# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(market_router, prefix="/market", tags=["Market Analysis"])
app.include_router(skills_router, prefix="/skills", tags=["Skills Analysis"])
app.include_router(learning_router, prefix="/learning", tags=["Learning Resources"])
app.include_router(projects_router, prefix="/projects", tags=["Project Recommendations"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )
