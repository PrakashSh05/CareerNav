import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any

from app.models.job_posting import JobPosting
from app.core.config import settings
from app.services.theirstack_client import (
    TheirStackClient,
    TheirStackClientError,
    TheirStackAuthenticationError,
    TheirStackRetryableError,
    their_stack_client,
)

logger = logging.getLogger(__name__)


class ScraperService:
    """Service for managing job collection operations via TheirStack API."""

    def __init__(self, client: Optional[TheirStackClient] = None):
        self.client = client or their_stack_client
        self.active_jobs: Dict[str, Dict[str, Any]] = {}

    async def run_theirstack_collection(
        self,
        keywords: List[str],
        locations: List[str],
        max_age_days: int = 14,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """
        Collect jobs from the TheirStack API for the given keywords and locations.

        Args:
            keywords: List of job search keywords.
            locations: List of job locations or ISO country codes.
            max_age_days: Maximum age of job postings in days.
            limit: Maximum number of jobs to fetch across all pages.

        Returns:
            Dict containing collection results and statistics.
        """

        if not keywords:
            raise ValueError("At least one keyword must be provided")

        job_id = f"their_stack_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        start_time = datetime.utcnow()
        remaining = max(limit, 0)
        page = 1
        collected_jobs: List[Dict[str, Any]] = []
        errors: List[str] = []

        self.active_jobs[job_id] = {
            "status": "running",
            "start_time": start_time,
            "keywords": keywords,
            "locations": locations,
            "max_age_days": max_age_days,
            "requested_limit": limit,
            "fetched": 0,
            "pages": 0,
        }

        try:
            logger.info(
                "Starting TheirStack collection %s for keywords=%s locations=%s",
                job_id,
                keywords,
                locations,
            )

            location_patterns = []
            country_codes = []
            for loc in locations:
                if not loc:
                    continue
                stripped = loc.strip()
                if len(stripped) == 2 and stripped.isalpha():
                    country_codes.append(stripped.upper())
                else:
                    location_patterns.append(stripped)

            while remaining != 0:
                page_limit = min(settings.max_jobs_per_search, remaining) if remaining > 0 else settings.max_jobs_per_search
                payload: Dict[str, Any] = {
                    "job_title_or": keywords,
                    "posted_at_max_age_days": max_age_days,
                    "page": page,
                    "limit": page_limit,
                }

                if location_patterns:
                    payload["job_location_pattern_or"] = location_patterns
                if country_codes:
                    payload["job_country_code_or"] = country_codes

                logger.debug("Calling TheirStack page=%s limit=%s payload=%s", page, page_limit, payload)

                response = await self.client.search_jobs(payload)

                jobs = (
                    response.get("data")
                    or response.get("jobs")
                    or response.get("results")
                    or []
                )

                if not isinstance(jobs, list):
                    logger.error("Unexpected TheirStack response format: %s", response)
                    raise TheirStackClientError("Unexpected TheirStack response format")

                fetched_count = len(jobs)

                if fetched_count == 0:
                    logger.info("No more jobs returned by TheirStack; stopping pagination")
                    break

                collected_jobs.extend(jobs)
                if remaining > 0:
                    remaining = max(remaining - fetched_count, 0)

                self.active_jobs[job_id]["fetched"] = len(collected_jobs)
                self.active_jobs[job_id]["pages"] = page

                logger.info(
                    "TheirStack collection %s fetched %s jobs on page %s (remaining=%s)",
                    job_id,
                    fetched_count,
                    page,
                    remaining,
                )

                meta = response.get("meta") or {}
                total_pages = meta.get("total_pages") or meta.get("pages")
                has_next = meta.get("has_more")

                if remaining == 0:
                    break

                if has_next is False:
                    break

                if total_pages and page >= total_pages:
                    break

                next_page = meta.get("next_page")
                if next_page:
                    page = next_page
                else:
                    page += 1

            duration = (datetime.utcnow() - start_time).total_seconds()

            result_payload = {
                "job_id": job_id,
                "status": "completed",
                "fetched_count": len(collected_jobs),
                "pages": self.active_jobs[job_id]["pages"],
                "duration_seconds": duration,
                "errors": errors,
                "jobs": collected_jobs,
            }

            self.active_jobs[job_id].update(
                {
                    "status": "completed",
                    "end_time": datetime.utcnow(),
                    "duration_seconds": duration,
                }
            )

            logger.info(
                "TheirStack collection %s completed with %s jobs in %.2f seconds",
                job_id,
                len(collected_jobs),
                duration,
            )

            return result_payload

        except (TheirStackClientError, TheirStackRetryableError, TheirStackAuthenticationError) as exc:
            error_message = str(exc)
            logger.error("TheirStack collection %s failed: %s", job_id, error_message)
            errors.append(error_message)
            self.active_jobs[job_id].update(
                {
                    "status": "failed",
                    "end_time": datetime.utcnow(),
                    "error": error_message,
                }
            )
            return {
                "job_id": job_id,
                "status": "failed",
                "errors": errors,
            }
        except Exception as exc:
            error_message = str(exc)
            logger.exception("Unexpected error during TheirStack collection %s", job_id)
            errors.append(error_message)
            self.active_jobs[job_id].update(
                {
                    "status": "failed",
                    "end_time": datetime.utcnow(),
                    "error": error_message,
                }
            )
            return {
                "job_id": job_id,
                "status": "failed",
                "errors": errors,
            }
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a scraping job.
        
        Args:
            job_id: Job identifier
            
        Returns:
            Dict containing job status or None if not found
        """
        return self.active_jobs.get(job_id)
    
    async def get_scraped_jobs(
        self,
        keywords: Optional[str] = None,
        location: Optional[str] = None,
        skills: Optional[List[str]] = None,
        days_back: int = 7,
        limit: int = 50
    ) -> List[JobPosting]:
        """
        Retrieve scraped job postings with optional filters.
        
        Args:
            keywords: Filter by search keywords
            location: Filter by job location
            skills: Filter by required skills
            days_back: Number of days back to search
            limit: Maximum number of jobs to return
            
        Returns:
            List of JobPosting documents
        """
        try:
            query_filters = []
            
            # Date filter
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            query_filters.append(JobPosting.scraped_at >= cutoff_date)
            
            # Keywords filter
            if keywords:
                query_filters.append(
                    JobPosting.search_keywords.regex(keywords, "i")
                )
            
            # Location filter
            if location:
                query_filters.append(
                    JobPosting.location.regex(location, "i")
                )
            
            # Skills filter
            if skills:
                query_filters.append(
                    JobPosting.skills.in_(skills)
                )
            
            # Build query
            if query_filters:
                query = JobPosting.find(*query_filters)
            else:
                query = JobPosting.find()
            
            # Execute query
            jobs = await query.sort(-JobPosting.scraped_at).limit(limit).to_list()
            
            logger.info(f"Retrieved {len(jobs)} scraped jobs with filters: "
                       f"keywords={keywords}, location={location}, skills={skills}")
            
            return jobs
            
        except Exception as e:
            logger.error(f"Error retrieving scraped jobs: {e}")
            return []
    
    async def get_scraping_statistics(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Get statistics about scraped job data.
        
        Args:
            days_back: Number of days back to analyze
            
        Returns:
            Dict containing scraping statistics
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            
            # Basic counts
            total_jobs = await JobPosting.find(
                JobPosting.scraped_at >= cutoff_date
            ).count()
            
            # Get recent jobs for analysis
            recent_jobs = await JobPosting.find(
                JobPosting.scraped_at >= cutoff_date
            ).to_list()
            
            # Analyze data
            companies = set()
            locations = set()
            all_skills = []
            search_keywords = set()
            
            for job in recent_jobs:
                companies.add(job.company)
                locations.add(job.location)
                all_skills.extend(job.skills)
                search_keywords.add(job.search_keywords)
            
            # Count skill frequencies
            skill_counts = {}
            for skill in all_skills:
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
            # Get top skills
            top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:20]
            
            statistics = {
                'total_jobs': total_jobs,
                'unique_companies': len(companies),
                'unique_locations': len(locations),
                'unique_search_keywords': len(search_keywords),
                'total_skills_extracted': len(all_skills),
                'unique_skills': len(skill_counts),
                'top_skills': top_skills,
                'companies_list': sorted(list(companies))[:20],  # Top 20 companies
                'locations_list': sorted(list(locations))[:20],  # Top 20 locations
                'search_keywords_list': sorted(list(search_keywords)),
                'analysis_period_days': days_back,
                'analysis_date': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Generated scraping statistics for {days_back} days: {total_jobs} jobs analyzed")
            return statistics

        except Exception as e:
            logger.error(f"Error generating scraping statistics: {e}")
            return {
                'error': str(e),
                'analysis_date': datetime.utcnow().isoformat()
            }
    
    async def cleanup_old_jobs(self, days_to_keep: int = 90) -> Dict[str, int]:
        """
        Clean up old job postings to manage database size.
        
        Args:
            days_to_keep: Number of days of job data to keep
            
        Returns:
            Dict containing cleanup statistics
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
            
            # Count jobs to be deleted
            jobs_to_delete = await JobPosting.find(
                JobPosting.scraped_at < cutoff_date
            ).count()
            
            # Delete old jobs
            delete_result = await JobPosting.find(
                JobPosting.scraped_at < cutoff_date
            ).delete()
            
            logger.info(f"Cleaned up {delete_result.deleted_count} job postings older than {days_to_keep} days")
            
            return {
                'jobs_deleted': delete_result.deleted_count,
                'cutoff_date': cutoff_date.isoformat(),
                'days_kept': days_to_keep
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up old jobs: {e}")
            return {
                'error': str(e),
                'jobs_deleted': 0
            }
    
    async def get_skill_trends(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Analyze skill trends in scraped job data.
        
        Args:
            days_back: Number of days back to analyze
            
        Returns:
            Dict containing skill trend analysis
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            
            # Get jobs with skills
            jobs_with_skills = await JobPosting.find(
                JobPosting.scraped_at >= cutoff_date,
                JobPosting.skills.exists(True)
            ).to_list()
            
            # Analyze skill frequencies by category
            from app.services.skill_extractor import skill_extractor
            
            skill_categories = {
                'programming_languages': [],
                'frameworks_libraries': [],
                'databases': [],
                'cloud_platforms': [],
                'tools_technologies': [],
                'soft_skills': [],
                'other': []
            }
            
            all_skills = []
            for job in jobs_with_skills:
                all_skills.extend(job.skills)
            
            # Categorize skills
            categorized_skills = skill_extractor.get_skill_categories(all_skills)
            
            # Count frequencies in each category
            for category, skills in categorized_skills.items():
                skill_counts = {}
                for skill in skills:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
                
                # Get top skills in category
                top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                skill_categories[category] = top_skills
            
            return {
                'analysis_period_days': days_back,
                'total_jobs_analyzed': len(jobs_with_skills),
                'total_skills_found': len(all_skills),
                'skill_categories': skill_categories,
                'analysis_date': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing skill trends: {e}")
            return {
                'error': str(e),
                'analysis_date': datetime.utcnow().isoformat()
            }


# Global instance
scraper_service = ScraperService()
