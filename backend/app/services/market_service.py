import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List
from cachetools import TTLCache

from app.models.job_posting import JobPosting
from app.schemas.analytics import (
    TrendingLocation,
    TrendingResponse,
    TrendingSkill,
    TechnologyTrend,
    SalaryTrend,
    RemoteTrend,
)

# DEVELOPMENT: Cache disabled for immediate updates (was 10 seconds)
# Set ttl=0 to effectively disable caching during development
cache = TTLCache(maxsize=100, ttl=0)
logger = logging.getLogger(__name__)


async def get_trending_skills(days: int = 30, limit: int = 15) -> List[TrendingSkill]:
    """
    Get trending skills from job postings using ONLY technology_slugs field.
    
    This function uses the clean, curated technology_slugs from TheirStack API,
    NOT the skills field which may contain text-extracted noise.
    
    Args:
        days: Number of days to look back for analysis
        limit: Maximum number of skills to return
        
    Returns:
        List[TrendingSkill]: Top skills sorted by frequency
    """
    cache_key = f"trending_skills_{days}_{limit}"
    if cache_key in cache:
        logger.info(f"Returning cached trending skills for {days} days")
        return cache[cache_key]
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # MongoDB aggregation pipeline using ONLY technology slugs (not skills field)
        pipeline = [
            {"$match": {"scraped_at": {"$gte": cutoff_date}}},
            # Project only technology_slugs field (ignore skills field completely)
            {"$project": {"technology_slugs": 1}},
            # Unwind technology_slugs array
            {"$unwind": "$technology_slugs"},
            {
                "$group": {
                    "_id": {"$toLower": "$technology_slugs"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": limit},
        ]
        
        # Get total job count for percentage calculation
        total_jobs = await JobPosting.find({"scraped_at": {"$gte": cutoff_date}}).count()
        
        if total_jobs == 0:
            logger.warning(f"No jobs found in the last {days} days")
            return []
        
        # Execute aggregation
        results = await JobPosting.aggregate(pipeline).to_list()
        
        trending_skills = []
        for result in results:
            skill = result["_id"]
            count = result["count"]
            percentage = (count / total_jobs) * 100
            
            trending_skills.append(TrendingSkill(
                skill=skill,
                count=count,
                percentage=round(percentage, 2)
            ))
        
        # Cache the results
        cache[cache_key] = trending_skills
        logger.info(f"Generated trending skills analysis for {days} days: {len(trending_skills)} skills")
        
        return trending_skills
        
    except Exception as e:
        logger.error(f"Error getting trending skills: {str(e)}")
        return []


async def get_trending_locations(days: int = 30, limit: int = 10) -> List[TrendingLocation]:
    """
    Get trending job locations using MongoDB aggregation.
    
    Args:
        days: Number of days to look back for analysis
        limit: Maximum number of locations to return
        
    Returns:
        List[TrendingLocation]: Top locations sorted by frequency
    """
    cache_key = f"trending_locations_{days}_{limit}"
    if cache_key in cache:
        logger.info(f"Returning cached trending locations for {days} days")
        return cache[cache_key]
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # MongoDB aggregation pipeline
        pipeline = [
            {"$match": {"scraped_at": {"$gte": cutoff_date}}},
            {
                "$match": {
                    "location": {"$ne": None, "$exists": True},
                    "$expr": {"$gt": [{"$strLenCP": "$location"}, 0]},
                }
            },
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit},
        ]
        
        # Execute aggregation
        results = await JobPosting.aggregate(pipeline).to_list()
        
        trending_locations = []
        for result in results:
            location = result["_id"]
            count = result["count"]
            
            trending_locations.append(TrendingLocation(
                location=location,
                count=count
            ))
        
        # Cache the results
        cache[cache_key] = trending_locations
        logger.info(f"Generated trending locations analysis for {days} days: {len(trending_locations)} locations")
        
        return trending_locations
        
    except Exception as e:
        logger.error(f"Error getting trending locations: {str(e)}")
        return []


async def get_market_summary(days: int = 30, skills_limit: int = 15, locations_limit: int = 10) -> TrendingResponse:
    """
    Get comprehensive market summary with trending skills and locations.
    
    Args:
        days: Number of days to look back for analysis
        skills_limit: Maximum number of trending skills to return
        locations_limit: Maximum number of trending locations to return
        
    Returns:
        TrendingResponse: Complete market analysis data
    """
    try:
        top_skills, top_locations, technology_trends, salary_trends, remote_distribution = await asyncio.gather(
            get_trending_skills(days=days, limit=skills_limit),
            get_trending_locations(days=days, limit=locations_limit),
            get_technology_trends(days=days, limit=min(20, skills_limit + 5)),
            get_salary_trends(days=days),
            get_remote_job_trends(days=days),
        )

        cutoff_date = datetime.utcnow() - timedelta(days=days)
        total_jobs = await JobPosting.find({"scraped_at": {"$gte": cutoff_date}}).count()

        return TrendingResponse(
            top_skills=top_skills,
            top_locations=top_locations,
            technology_trends=technology_trends,
            salary_trends=salary_trends,
            remote_distribution=remote_distribution,
            total_jobs_analyzed=total_jobs,
            generated_at=datetime.utcnow(),
            window_days=days,
        )
        
    except Exception as e:
        logger.error(f"Error generating market summary: {str(e)}")
        # Return empty response on error
        return TrendingResponse(
            top_skills=[],
            top_locations=[],
            technology_trends=[],
            salary_trends=[],
            remote_distribution=[],
            total_jobs_analyzed=0,
            generated_at=datetime.utcnow(),
            window_days=days
        )


async def get_technology_trends(days: int = 30, limit: int = 20) -> List[TechnologyTrend]:
    cache_key = f"technology_trends_{days}_{limit}"
    if cache_key in cache:
        logger.info("Returning cached technology trends for %s days", days)
        return cache[cache_key]

    cutoff = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"scraped_at": {"$gte": cutoff}, "technology_slugs": {"$exists": True, "$ne": []}}},
        {"$unwind": "$technology_slugs"},
        {
            "$group": {
                "_id": {"$toLower": "$technology_slugs"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]

    try:
        results = await JobPosting.aggregate(pipeline).to_list()
        trends = [TechnologyTrend(technology=result["_id"], count=result["count"]) for result in results]
        cache[cache_key] = trends
        logger.info("Generated technology trends for %s days: %s items", days, len(trends))
        return trends
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Error getting technology trends: %s", exc)
        return []


async def get_salary_trends(days: int = 30, role: str | None = None) -> List[SalaryTrend]:
    cache_key = f"salary_trends_{days}_{role or 'all'}"
    if cache_key in cache:
        logger.info("Returning cached salary trends for %s days (role=%s)", days, role)
        return cache[cache_key]

    cutoff = datetime.utcnow() - timedelta(days=days)
    match: Dict[str, Any] = {
        "scraped_at": {"$gte": cutoff},
        "min_annual_salary_usd": {"$ne": None},
        "max_annual_salary_usd": {"$ne": None},
    }
    if role:
        match["search_keywords"] = {"$regex": role, "$options": "i"}

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": "$location",
                "avg_min": {"$avg": "$min_annual_salary_usd"},
                "avg_max": {"$avg": "$max_annual_salary_usd"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"avg_max": -1}},
        {"$limit": 20},
    ]

    try:
        results = await JobPosting.aggregate(pipeline).to_list()
        trends = [
            SalaryTrend(
                location=result.get("_id") or "Unknown",
                avg_min=result.get("avg_min", 0),
                avg_max=result.get("avg_max", 0),
                count=result.get("count", 0),
            )
            for result in results
        ]
        cache[cache_key] = trends
        logger.info("Generated salary trends for %s days (role=%s): %s locations", days, role, len(trends))
        return trends
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Error getting salary trends: %s", exc)
        return []


async def get_remote_job_trends(days: int = 30) -> List[RemoteTrend]:
    cache_key = f"remote_trends_{days}"
    if cache_key in cache:
        logger.info("Returning cached remote job trends for %s days", days)
        return cache[cache_key]

    cutoff = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"scraped_at": {"$gte": cutoff}, "remote": {"$in": [True, False]}}},
        {"$group": {"_id": "$remote", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]

    try:
        results = await JobPosting.aggregate(pipeline).to_list()
        trends = [RemoteTrend(remote=bool(result.get("_id")), count=result.get("count", 0)) for result in results]
        cache[cache_key] = trends
        logger.info("Generated remote job distribution for %s days", days)
        return trends
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Error getting remote job trends: %s", exc)
        return []
