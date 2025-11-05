import logging
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from cachetools import TTLCache

from app.models.user import User
from app.models.job_posting import JobPosting
from app.schemas.analytics import SkillGapItem, GapAnalysisResponse
from app.services.skill_extractor import skill_extractor

# Cache for 30 minutes to reduce database load
cache = TTLCache(maxsize=200, ttl=1800)
logger = logging.getLogger(__name__)


# Clear cache for debugging - remove this in production
def clear_cache():
    """Clear the cache for debugging purposes."""
    cache.clear()
    logger.info("Cache cleared for debugging")
    # Also clear any cached skill data
    from app.services.skill_extractor import skill_extractor
    if hasattr(skill_extractor, 'clear_cache'):
        skill_extractor.clear_cache()
    logger.info("Skill extractor cache cleared")


# Call this to clear cache on startup for debugging
clear_cache()


async def get_role_required_skills(role: str, days: int = 30, threshold: float = 0.25) -> List[Dict]:
    """
    Get skills required for a specific role based on job posting analysis using technology_slugs.
    
    This function uses the clean, curated technology_slugs from TheirStack API,
    NOT the skills field which may contain text-extracted noise.
    
    Args:
        role: Target role title (case-insensitive)
        days: Number of days to look back for analysis
        threshold: Minimum percentage of jobs that must require the skill
        
    Returns:
        List[Dict]: Skills with their frequency data
    """
    cache_key = f"role_skills_{role.lower()}_{days}_{threshold}"
    if cache_key in cache:
        logger.info(f"Returning cached role skills for {role}")
        return cache[cache_key]
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        normalized_role = role.strip()

        # Create case-insensitive regex patterns for role matching
        role_pattern = re.compile(re.escape(normalized_role), re.IGNORECASE)
        search_keyword_pattern = re.compile(f"^{re.escape(normalized_role)}$", re.IGNORECASE)
        
        # Primary filter uses search_keywords with case-insensitive matching
        role_filter = {
            "scraped_at": {"$gte": cutoff_date},
            "search_keywords": search_keyword_pattern,
        }
        
        # Get total jobs count separately to avoid 16MB document limit
        total_jobs = await JobPosting.find(role_filter).count()
        
        # Fallback: if nothing matches search_keywords (legacy data), use title regex
        if total_jobs == 0:
            role_filter = {
                "scraped_at": {"$gte": cutoff_date},
                "title": {"$regex": role_pattern}
            }
            total_jobs = await JobPosting.find(role_filter).count()
        
        # Check if we have any jobs with technology_slugs at all
        jobs_with_tech_slugs = await JobPosting.find(
            {"technology_slugs": {"$exists": True, "$ne": []}}
        ).count()
        
        logger.info(f"Total jobs with technology_slugs: {jobs_with_tech_slugs}")
        
        if jobs_with_tech_slugs == 0:
            logger.warning("No jobs found with technology_slugs field - job collection may not be working properly")
            # Let's also check if there are any jobs at all
            total_all_jobs = await JobPosting.find().count()
            logger.info(f"Total jobs in database: {total_all_jobs}")
            
            # Let's check a sample job to see its structure
            sample_job = await JobPosting.find().first_or_none()
            if sample_job:
                logger.info(f"Sample job structure: {sample_job.dict()}")
                logger.info(f"Sample job has technology_slugs: {hasattr(sample_job, 'technology_slugs')}")
                if hasattr(sample_job, 'technology_slugs'):
                    logger.info(f"Sample job technology_slugs: {sample_job.technology_slugs}")
            return []
        
        # Optimized pipeline to avoid $push: "$$ROOT" and single-document $group
        pipeline_match = {
            "scraped_at": {"$gte": cutoff_date},
        }
        if "search_keywords" in role_filter:
            pipeline_match["search_keywords"] = role_filter["search_keywords"]
        else:
            pipeline_match["title"] = role_filter["title"]

        pipeline = [
            # Match jobs within time window and role
            {"$match": pipeline_match},
            # Project only technology_slugs field to reduce memory usage
            {"$project": {"technology_slugs": 1}},
            # Unwind technology_slugs array
            {"$unwind": "$technology_slugs"},
            # Group by technology slug and count occurrences
            {"$group": {
                "_id": "$technology_slugs",
                "count": {"$sum": 1}
            }},
            # Sort by count descending
            {"$sort": {"count": -1}}
        ]
        
        logger.info(f"Executing aggregation pipeline for role '{role}' with {total_jobs} jobs found")
        results = await JobPosting.aggregate(pipeline).to_list()
        
        logger.info(f"Aggregation results: {len(results)} technology slugs found")
        for i, result in enumerate(results[:5]):  # Log first 5 results
            logger.info(f"  {i+1}. Technology slug: '{result['_id']}', count: {result['count']}")
        
        if not results:
            logger.warning(f"No technology slugs found for role '{role}' in the last {days} days")
            return []
        
        # Calculate percentages in Python and filter by threshold
        required_skills = []
        for result in results:
            skill = result["_id"]
            count = result["count"]
            if total_jobs == 0:
                continue

            percentage = (count / total_jobs) * 100
            
            # Filter by threshold
            if percentage >= (threshold * 100):
                # Use the technology slug directly as the skill name
                logger.debug(f"Using technology slug as skill name: '{skill}'")
                required_skills.append({
                    "skill": skill,  # Use the raw technology slug
                    "technology_slug": skill,  # Add the original slug as a separate field
                    "count": count,
                    "percentage": round(percentage, 2),
                    "total_jobs": total_jobs
                })
        
        # Cache the results
        cache[cache_key] = required_skills
        logger.info(f"Found {len(required_skills)} required skills for role '{role}' from {total_jobs} jobs")
        
        return required_skills
        
    except Exception as e:
        logger.error(f"Error getting required skills for role '{role}': {str(e)}")
        return []


def compute_user_coverage(user_skills: List[str], required_skills: List[Dict]) -> Tuple[List[SkillGapItem], List[str], float, int, int]:
    """
    Compute user's skill coverage against required skills using technology slugs.
    """
    if not required_skills:
        return [], [], 0.0, 0, 0

    # Normalize user skills for case-insensitive comparison
    user_skills = [s.lower().strip() for s in user_skills if s and s.strip()]
    
    skill_gap_items = []
    missing_skills = []
    skills_have = 0

    for req_skill in required_skills:
        # Get the skill name, preferring technology_slug if available
        skill_name = str(req_skill.get("technology_slug") or req_skill["skill"]).lower().strip()
        
        # Check if user has this skill (case-insensitive)
        user_has_skill = any(
            user_skill.lower() == skill_name
            for user_skill in user_skills
        )

        skill_gap_items.append(SkillGapItem(
            skill=skill_name,
            required_percentage=req_skill["percentage"],
            user_has=user_has_skill
        ))

        if not user_has_skill:
            missing_skills.append(skill_name)
        else:
            skills_have += 1

    # Calculate coverage percentage
    total_skills = len(required_skills)
    coverage = (skills_have / total_skills * 100) if total_skills > 0 else 0

    return skill_gap_items, missing_skills, coverage, skills_have, total_skills
async def analyze_skill_gap(user: User, target_role: str, days: int = 30, threshold: float = 0.25) -> GapAnalysisResponse:
    """
    Analyze skill gap for a user's target role.
    
    Args:
        user: User object with skills and target roles
        target_role: Specific role to analyze
        days: Number of days to look back for job analysis
        threshold: Minimum percentage of jobs that must require the skill
        
    Returns:
        GapAnalysisResponse: Complete skill gap analysis
    """
    try:
        
        # Get required skills for the role
        required_skills = await get_role_required_skills(target_role, days, threshold)
        
        if not required_skills:
            # Return empty analysis if no data available
            return GapAnalysisResponse(
                role=target_role,
                total_postings_analyzed=0,
                required_skills=[],
                missing_skills=[],
                coverage_percentage=0.0,
                skill_match_count=0,
                total_required_skills=0
            )
        
        # Compute user's coverage
        skill_gap_items, missing_skills, coverage_percentage, skill_match_count, total_required_skills = compute_user_coverage(
            user.skills, required_skills
        )
        
        # Debug logging
        logger.info(f"User {user.email} skills: {user.skills}")
        logger.info(f"Required skills found: {len(required_skills)}")
        logger.info(f"User skill matches: {skill_match_count}/{total_required_skills}")
        logger.info(f"Missing skills: {missing_skills}")
        
        # Get total postings analyzed (from the first skill's metadata)
        total_postings = required_skills[0]["total_jobs"] if required_skills else 0
        
        logger.info(f"Skill gap analysis for user {user.email}, role '{target_role}': "
                   f"{coverage_percentage}% coverage ({skill_match_count}/{total_required_skills} skills)")
        
        return GapAnalysisResponse(
            role=target_role,
            total_postings_analyzed=total_postings,
            required_skills=skill_gap_items,
            missing_skills=missing_skills,
            coverage_percentage=coverage_percentage,
            skill_match_count=skill_match_count,
            total_required_skills=total_required_skills
        )
        
    except Exception as e:
        logger.error(f"Error analyzing skill gap for role '{target_role}': {str(e)}")
        # Return empty analysis on error
        return GapAnalysisResponse(
            role=target_role,
            total_postings_analyzed=0,
            required_skills=[],
            missing_skills=[],
            coverage_percentage=0.0,
            skill_match_count=0,
            total_required_skills=0
        )
