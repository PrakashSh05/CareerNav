import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List
from app.models.user import User
from app.models.job_posting import JobPosting
from app.services.job_collection_service import JobCollectionService
from app.core.config import settings

logger = logging.getLogger(__name__)


class UserJobCollectionService:
    """Service to collect jobs based on all users' target roles."""

    def __init__(self, collection_service: JobCollectionService = None):
        self.collection_service = collection_service or JobCollectionService()

    async def collect_jobs_for_all_users(
        self,
        max_age_days: int = 14,
        jobs_per_role: int = 5,
        locations: List[str] = None,
        data_freshness_days: int = 30,
    ) -> Dict[str, Dict[str, int]]:
        """
        Collect jobs for all unique target roles across all users.
        Only fetches data for roles that don't have fresh data in the database.
        
        Args:
            max_age_days: Maximum age of job postings to fetch from API
            jobs_per_role: Number of jobs to fetch per role
            locations: List of locations to search (defaults to config)
            data_freshness_days: Skip roles with data newer than this many days (default: 30)
            
        Returns:
            Dictionary with collection summary per role
        """
        # Get all unique target roles from all users
        all_users = await User.find_all().to_list()
        
        unique_roles = set()
        for user in all_users:
            if user.target_roles:
                unique_roles.update(user.target_roles)
        
        if not unique_roles:
            logger.warning("No target roles found across all users")
            return {}
        
        roles_list = sorted(list(unique_roles))
        logger.info(
            f"Found {len(roles_list)} unique roles from {len(all_users)} users: {roles_list}"
        )
        
        # Filter out roles that already have fresh data
        roles_to_fetch = await self._filter_roles_needing_update(
            roles_list, data_freshness_days
        )
        
        if not roles_to_fetch:
            logger.info("All roles have fresh data (< %s days old). Skipping collection.", data_freshness_days)
            return {}
        
        logger.info(
            f"Collecting jobs for {len(roles_to_fetch)} roles that need updates: {roles_to_fetch}"
        )
        
        # Use config locations if not provided
        if locations is None:
            locations = settings.job_collection_locations
        
        # Collect jobs only for roles that need updates
        summary = await self.collection_service.collect_jobs_for_roles(
            roles=roles_to_fetch,
            locations=locations,
            max_age_days=max_age_days,
            per_role_limit=jobs_per_role,
        )
        
        logger.info(f"Completed user-driven job collection: {summary}")
        return summary

    async def collect_jobs_for_user(
        self,
        user_id: str,
        max_age_days: int = 14,
        jobs_per_role: int = 5,
        locations: List[str] = None,
    ) -> Dict[str, Dict[str, int]]:
        """
        Collect jobs for a specific user's target roles.
        
        Args:
            user_id: User ID to collect jobs for
            max_age_days: Maximum age of job postings to fetch
            jobs_per_role: Number of jobs to fetch per role
            locations: List of locations to search (defaults to user location or config)
            
        Returns:
            Dictionary with collection summary per role
        """
        user = await User.get(user_id)
        if not user:
            logger.error(f"User {user_id} not found")
            return {}
        
        if not user.target_roles:
            logger.warning(f"User {user_id} has no target roles set")
            return {}
        
        # Use user's location if available, otherwise use config
        if locations is None:
            if user.location:
                locations = [user.location]
            else:
                locations = settings.job_collection_locations
        
        logger.info(
            f"Collecting jobs for user {user_id} with roles: {user.target_roles}"
        )
        
        summary = await self.collection_service.collect_jobs_for_roles(
            roles=user.target_roles,
            locations=locations,
            max_age_days=max_age_days,
            per_role_limit=jobs_per_role,
        )
        
        logger.info(f"Completed job collection for user {user_id}: {summary}")
        return summary

    async def _filter_roles_needing_update(
        self, roles: List[str], freshness_days: int
    ) -> List[str]:
        """
        Filter roles to only include those that don't have fresh data in the database.
        
        Args:
            roles: List of role names to check
            freshness_days: Consider data fresh if it's newer than this many days
            
        Returns:
            List of roles that need new data
        """
        cutoff_date = datetime.utcnow() - timedelta(days=freshness_days)
        roles_needing_update = []
        
        for role in roles:
            # Check if we have recent jobs for this role
            recent_job = await JobPosting.find_one(
                {
                    "search_keywords": role,
                    "scraped_at": {"$gte": cutoff_date}
                }
            )
            
            if recent_job:
                logger.info(
                    f"Role '{role}' has fresh data (last scraped: {recent_job.scraped_at}). Skipping."
                )
            else:
                logger.info(
                    f"Role '{role}' needs update (no data newer than {freshness_days} days)."
                )
                roles_needing_update.append(role)
        
        return roles_needing_update
