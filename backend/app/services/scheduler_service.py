import asyncio
import logging
from typing import Dict, List, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.services.job_collection_service import JobCollectionService
from app.services.user_job_collection_service import UserJobCollectionService
from app.services.theirstack_client import (
    TheirStackAuthenticationError,
    TheirStackRetryableError,
)

logger = logging.getLogger(__name__)


class SchedulerService:
    """Service responsible for orchestrating background job ingestion and maintenance."""

    def __init__(
        self,
        roles: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        collection_service: Optional[JobCollectionService] = None,
        use_user_roles: bool = True,
    ) -> None:
        self.scheduler = AsyncIOScheduler()
        self.roles = roles or []
        self.locations = locations or []
        self.collection_service = collection_service or JobCollectionService()
        self.user_collection_service = UserJobCollectionService(self.collection_service)
        self.use_user_roles = use_user_roles
        self._collection_job_id = "daily-job-collection"
        self._cleanup_job_id = "weekly-job-cleanup"
        self._started = False

    async def start_scheduler(self) -> None:
        """Start the scheduler and register recurring jobs."""
        if self._started:
            logger.info("Scheduler already started; skipping duplicate start")
            return

        self._register_jobs()
        self.scheduler.start()
        self._started = True
        logger.info("Scheduler started with jobs: %s", self.scheduler.get_jobs())

    async def stop_scheduler(self) -> None:
        """Stop the scheduler and cancel all jobs."""
        if not self._started:
            logger.info("Scheduler not running; nothing to stop")
            return

        await self.scheduler.shutdown(wait=False)
        self._started = False
        logger.info("Scheduler shutdown complete")

    async def trigger_manual_collection(
        self,
        roles: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        max_age_days: int = 14,
        per_role_limit: int = settings.max_jobs_per_search,
    ) -> Dict[str, Dict[str, int]]:
        """Trigger a manual job collection outside the scheduled window."""
        target_roles = roles or self.roles
        target_locations = locations or self.locations
        logger.info(
            "Manually triggering TheirStack job collection for roles=%s locations=%s",
            target_roles,
            target_locations,
        )
        return await self._run_collection_job(target_roles, target_locations, max_age_days, per_role_limit)

    def _register_jobs(self) -> None:
        """Register recurring jobs with the scheduler."""
        # Daily job collection using cron schedule from settings
        try:
            collection_trigger = CronTrigger.from_crontab(settings.job_collection_schedule)
        except ValueError as exc:
            logger.error("Invalid cron expression '%s': %s", settings.job_collection_schedule, exc)
            # Default to 2 AM daily if configuration invalid
            collection_trigger = CronTrigger(hour=2, minute=0)

        self.scheduler.add_job(
            self._scheduled_collection_wrapper,
            trigger=collection_trigger,
            id=self._collection_job_id,
            replace_existing=True,
            misfire_grace_time=600,
            max_instances=1,
        )

        # Weekly cleanup every Sunday at 3 AM
        cleanup_trigger = CronTrigger(day_of_week="sun", hour=3, minute=0)
        self.scheduler.add_job(
            self._scheduled_cleanup_wrapper,
            trigger=cleanup_trigger,
            id=self._cleanup_job_id,
            replace_existing=True,
            misfire_grace_time=600,
            max_instances=1,
        )

    async def _scheduled_collection_wrapper(self) -> None:
        if self.use_user_roles:
            await self._run_user_based_collection()
        else:
            await self._run_collection_job(self.roles, self.locations)

    async def _scheduled_cleanup_wrapper(self) -> None:
        try:
            removed = await self.collection_service.cleanup_old_jobs()
            logger.info("Weekly cleanup removed %s outdated job postings", removed)
        except Exception:  # pragma: no cover - defensive logging
            logger.exception("Unexpected error during cleanup job")

    async def _run_collection_job(
        self,
        roles: List[str],
        locations: List[str],
        max_age_days: int = 14,
        per_role_limit: int = settings.max_jobs_per_search,
    ) -> Dict[str, Dict[str, int]]:
        if not roles:
            logger.warning("No roles configured for job collection; skipping run")
            return {}

        # APScheduler expects coroutine to be awaited; ensure we run inside loop
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        try:
            summary = await self.collection_service.collect_jobs_for_roles(
                roles=roles,
                locations=locations,
                max_age_days=max_age_days,
                per_role_limit=per_role_limit,
            )
            logger.info("Job collection summary: %s", summary)
            return summary
        except TheirStackAuthenticationError as exc:
            logger.error("Job collection halted due to TheirStack authentication error: %s", exc)
        except TheirStackRetryableError as exc:
            logger.error("Job collection halted due to retryable TheirStack error: %s", exc)
        except Exception:  # pragma: no cover - defensive logging
            logger.exception("Unexpected error while running job collection")
        
        return {}

    async def _run_user_based_collection(self) -> Dict[str, Dict[str, int]]:
        """Run job collection based on all users' target roles."""
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        try:
            summary = await self.user_collection_service.collect_jobs_for_all_users(
                max_age_days=30,  # Search for jobs posted in last 30 days (increased from 14)
                jobs_per_role=5,
                locations=self.locations or settings.job_collection_locations,
                data_freshness_days=30,  # Only fetch roles without data in last 30 days
            )
            logger.info("User-based job collection summary: %s", summary)
            return summary
        except TheirStackAuthenticationError as exc:
            logger.error("User-based collection halted due to TheirStack authentication error: %s", exc)
        except TheirStackRetryableError as exc:
            logger.error("User-based collection halted due to retryable TheirStack error: %s", exc)
        except Exception:  # pragma: no cover - defensive logging
            logger.exception("Unexpected error while running user-based job collection")
        
        return {}
