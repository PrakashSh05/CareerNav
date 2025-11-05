from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
import logging

from app.services.market_service import get_market_summary
from app.schemas.analytics import TrendingResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/trending", response_model=TrendingResponse)
async def get_trending_market_data(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to analyze (1-365)"),
    skills_limit: int = Query(default=15, ge=1, le=50, description="Maximum number of trending skills to return (1-50)"),
    locations_limit: int = Query(default=10, ge=1, le=30, description="Maximum number of trending locations to return (1-30)")
):
    """
    Get trending skills and locations from job market data.
    
    This endpoint analyzes job postings from the specified time window to identify
    the most in-demand skills and popular job locations. The data is cached for
    performance and updated hourly.
    
    **Query Parameters:**
    - **days**: Time window for analysis (default: 30 days)
    - **skills_limit**: Maximum trending skills to return (default: 15)
    - **locations_limit**: Maximum trending locations to return (default: 10)
    
    **Response includes:**
    - Top trending skills with frequency counts and percentages
    - Top job locations with posting counts
    - Total number of job postings analyzed
    - Analysis generation timestamp and time window
    
    **Example Response:**
    ```json
    {
        "top_skills": [
            {
                "skill": "Python",
                "count": 245,
                "percentage": 78.5
            }
        ],
        "top_locations": [
            {
                "location": "San Francisco, CA",
                "count": 156
            }
        ],
        "total_jobs_analyzed": 312,
        "generated_at": "2024-01-15T10:30:00Z",
        "window_days": 30
    }
    ```
    """
    try:
        logger.info(f"Getting trending market data for {days} days")

        # Get market summary with custom limits
        market_data = await get_market_summary(
            days=days,
            skills_limit=skills_limit,
            locations_limit=locations_limit,
        )

        payload = market_data.model_dump(mode="json")

        if market_data.total_jobs_analyzed == 0:
            logger.warning(f"No job data available for the last {days} days")
            return JSONResponse(
                status_code=200,
                content=payload,
                headers={"Cache-Control": "max-age=1800"}  # Cache for 30 minutes when no data
            )

        logger.info(
            f"Returning trending data: {len(market_data.top_skills)} skills, "
            f"{len(market_data.top_locations)} locations, "
            f"{len(market_data.technology_trends)} technologies, "
            f"{market_data.total_jobs_analyzed} jobs analyzed"
        )

        # DEVELOPMENT: No caching for immediate updates
        response = JSONResponse(
            content=payload,
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}  # Disable all caching
        )

        return response

    except Exception as e:
        logger.error(f"Error getting trending market data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve market data. Please try again later."
        )
