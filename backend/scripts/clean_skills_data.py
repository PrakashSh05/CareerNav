"""
Clean Skills Data Migration Script

This script updates existing job postings in MongoDB to replace the polluted
'skills' field (with text-extracted noise) with clean skills mapped from
'technology_slugs' field.

Usage:
    python -m scripts.clean_skills_data

The script will:
1. Find all job postings with technology_slugs
2. Map technology_slugs to normalized skill names
3. Replace the skills field with clean data
4. Report the number of jobs updated
"""

import asyncio
import logging
from datetime import datetime, UTC

from app.core.database import connect_to_mongo
from app.models.job_posting import JobPosting
from app.services.skill_extractor import skill_extractor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def clean_skills_data():
    """Clean existing skills data to use only mapped technology_slugs."""
    logger.info("Starting skills data cleanup migration...")
    
    try:
        # Initialize database connection
        await connect_to_mongo()
        logger.info("Database connection established")
        
        # Find all jobs with technology_slugs
        jobs_with_tech_slugs = await JobPosting.find(
            {"technology_slugs": {"$exists": True, "$ne": []}}
        ).to_list()
        
        total_jobs = len(jobs_with_tech_slugs)
        logger.info(f"Found {total_jobs} jobs with technology_slugs to process")
        
        if total_jobs == 0:
            logger.warning("No jobs found with technology_slugs field")
            return
        
        updated_count = 0
        skipped_count = 0
        error_count = 0
        
        for idx, job in enumerate(jobs_with_tech_slugs, 1):
            try:
                # Map technology slugs to clean skills
                old_skills_count = len(job.skills) if job.skills else 0
                clean_skills = skill_extractor.map_technology_slugs(job.technology_slugs)
                new_skills_count = len(clean_skills)
                
                # Only update if there's a change
                if set(clean_skills) != set(job.skills or []):
                    job.skills = clean_skills
                    job.updated_at = datetime.now(UTC)
                    await job.save()
                    updated_count += 1
                    
                    if idx % 100 == 0:
                        logger.info(
                            f"Progress: {idx}/{total_jobs} processed "
                            f"({updated_count} updated, {skipped_count} skipped, {error_count} errors)"
                        )
                    
                    # Log significant changes
                    if old_skills_count > new_skills_count * 2:
                        logger.debug(
                            f"Job {job.job_id or job.url}: "
                            f"Reduced skills from {old_skills_count} to {new_skills_count}"
                        )
                else:
                    skipped_count += 1
                    
            except Exception as e:
                error_count += 1
                logger.error(f"Error updating job {job.job_id or job.url}: {str(e)}")
        
        # Summary
        logger.info("=" * 60)
        logger.info("Skills Data Cleanup Complete!")
        logger.info(f"Total jobs processed: {total_jobs}")
        logger.info(f"Jobs updated: {updated_count}")
        logger.info(f"Jobs skipped (no change): {skipped_count}")
        logger.info(f"Errors: {error_count}")
        logger.info("=" * 60)
        
        # Sample verification
        if updated_count > 0:
            logger.info("\nVerifying changes with sample job:")
            sample_job = await JobPosting.find_one(
                {"technology_slugs": {"$exists": True, "$ne": []}}
            )
            if sample_job:
                logger.info(f"Sample Job: {sample_job.title} at {sample_job.company}")
                logger.info(f"Technology Slugs: {sample_job.technology_slugs}")
                logger.info(f"Mapped Skills: {sample_job.skills}")
        
    except Exception as e:
        logger.error(f"Fatal error during migration: {str(e)}")
        raise


async def verify_cleanup():
    """Verify the cleanup by checking sample jobs."""
    logger.info("\n" + "=" * 60)
    logger.info("Verification Report")
    logger.info("=" * 60)
    
    try:
        await connect_to_mongo()
        
        # Count total jobs
        total_jobs = await JobPosting.find_all().count()
        logger.info(f"Total jobs in database: {total_jobs}")
        
        # Count jobs with technology_slugs
        jobs_with_tech = await JobPosting.find(
            {"technology_slugs": {"$exists": True, "$ne": []}}
        ).count()
        logger.info(f"Jobs with technology_slugs: {jobs_with_tech}")
        
        # Check for jobs with large skills arrays (potential issues)
        pipeline = [
            {"$project": {
                "title": 1,
                "company": 1,
                "skills_count": {"$size": {"$ifNull": ["$skills", []]}},
                "tech_slugs_count": {"$size": {"$ifNull": ["$technology_slugs", []]}}
            }},
            {"$match": {"skills_count": {"$gt": 50}}},
            {"$limit": 5}
        ]
        
        jobs_with_many_skills = await JobPosting.aggregate(pipeline).to_list()
        
        if jobs_with_many_skills:
            logger.warning(f"\nFound {len(jobs_with_many_skills)} jobs with >50 skills (may need attention):")
            for job in jobs_with_many_skills:
                logger.warning(
                    f"  - {job.get('title')} at {job.get('company')}: "
                    f"{job.get('skills_count')} skills, {job.get('tech_slugs_count')} tech slugs"
                )
        else:
            logger.info("\n✅ No jobs with excessive skills count found!")
        
        # Sample clean jobs
        logger.info("\nSample of clean jobs:")
        sample_jobs = await JobPosting.find(
            {"technology_slugs": {"$exists": True, "$ne": []}}
        ).limit(3).to_list()
        
        for job in sample_jobs:
            logger.info(f"\n  Job: {job.title} at {job.company}")
            logger.info(f"  Tech Slugs ({len(job.technology_slugs)}): {job.technology_slugs[:5]}...")
            logger.info(f"  Skills ({len(job.skills)}): {job.skills[:5]}...")
        
    except Exception as e:
        logger.error(f"Error during verification: {str(e)}")


async def main():
    """Main execution function."""
    logger.info("Skills Data Cleanup Migration Script")
    logger.info("=" * 60)
    
    try:
        # Step 1: Clean the data
        await clean_skills_data()
        
        # Step 2: Verify the cleanup
        await verify_cleanup()
        
        logger.info("\n✅ Migration completed successfully!")
        logger.info("\nNext steps:")
        logger.info("1. Clear analytics cache or wait for TTL (1 hour)")
        logger.info("2. Test the dashboard and skill gap report")
        logger.info("3. Verify skills data looks clean and relevant")
        
    except Exception as e:
        logger.error(f"\n❌ Migration failed: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
