from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING


class JobPosting(Document):
    """JobPosting document model for storing scraped job data."""
    
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    description: str = Field(..., description="Full job description text")
    skills: List[str] = Field(default_factory=list, description="Extracted skills from job description")
    url: Indexed(str, unique=True) = Field(..., description="Original job URL")
    search_keywords: str = Field(..., description="Search terms used to find this job")
    search_location: str = Field(..., description="Location searched")
    scraped_at: Indexed(datetime) = Field(default_factory=datetime.utcnow, description="When the job was scraped")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    job_id: Optional[str] = Field(default=None, description="Unique TheirStack job identifier")
    date_posted: Optional[datetime] = Field(default=None, description="Original job posting date")
    min_annual_salary_usd: Optional[int] = Field(default=None, description="Minimum estimated annual salary in USD")
    max_annual_salary_usd: Optional[int] = Field(default=None, description="Maximum estimated annual salary in USD")
    remote: Optional[bool] = Field(default=None, description="Whether the job is remote")
    technology_slugs: List[str] = Field(default_factory=list, description="Technology tags provided by TheirStack")
    company_domain: Optional[str] = Field(default=None, description="Company primary domain")
    coordinates: Optional[Dict[str, Any]] = Field(default=None, description="Geo coordinates for the job location")

    class Settings:
        name = "job_postings"
        indexes = [
            IndexModel([("url", ASCENDING)], unique=True),
            IndexModel([("job_id", ASCENDING)], unique=True, sparse=True),
            IndexModel([("scraped_at", ASCENDING)]),
            IndexModel([("date_posted", DESCENDING)], sparse=True),
            IndexModel([("skills", ASCENDING)]),
            IndexModel([("technology_slugs", ASCENDING)], sparse=True),
            IndexModel([("search_keywords", ASCENDING), ("search_location", ASCENDING)]),
            IndexModel([("company", ASCENDING)]),
            IndexModel([("location", ASCENDING)]),
            IndexModel([("remote", ASCENDING)], sparse=True),
            IndexModel([("min_annual_salary_usd", ASCENDING)], sparse=True),
            IndexModel([("max_annual_salary_usd", ASCENDING)], sparse=True),
        ]

    @classmethod
    async def upsert_job(cls, job_data: dict) -> "JobPosting":
        """
        Upsert a job posting prioritizing TheirStack job_id for deduplication.
        
        Args:
            job_data: Dictionary containing job posting data
            
        Returns:
            JobPosting: The created or updated job posting
        """
        job_data = dict(job_data)
        job_data["updated_at"] = datetime.utcnow()

        job_id = job_data.get("job_id")
        url = job_data.get("url")

        existing_job: Optional[JobPosting] = None

        if job_id:
            existing_job = await cls.find_one({"job_id": job_id})

        if existing_job is None and url:
            existing_job = await cls.find_one({"url": url})

        if existing_job:
            for key, value in job_data.items():
                if key == "scraped_at":
                    continue
                setattr(existing_job, key, value)
            await existing_job.save()
            return existing_job

        new_job = cls(**job_data)
        await new_job.insert()
        return new_job

    @classmethod
    async def get_jobs_by_skills(cls, skills: List[str], limit: int = 50) -> List["JobPosting"]:
        """
        Find jobs that contain any of the specified skills.
        
        Args:
            skills: List of skills to search for
            limit: Maximum number of jobs to return
            
        Returns:
            List[JobPosting]: Jobs containing the specified skills
        """
        return await cls.find(
            {"skills": {"$in": skills}}
        ).limit(limit).to_list()

    @classmethod
    async def get_jobs_by_keywords(cls, keywords: str, location: Optional[str] = None, limit: int = 50) -> List["JobPosting"]:
        """
        Find jobs by search keywords and optionally location.
        
        Args:
            keywords: Search keywords
            location: Optional location filter (filters by actual job location, not search location)
            limit: Maximum number of jobs to return
            
        Returns:
            List[JobPosting]: Jobs matching the criteria
        """
        query = {"search_keywords": {"$regex": keywords, "$options": "i"}}
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
            
        return await cls.find(query).limit(limit).to_list()

    @classmethod
    async def get_recent_jobs(cls, days: int = 7, limit: int = 100) -> List["JobPosting"]:
        """
        Get recently scraped jobs.
        
        Args:
            days: Number of days back to search
            limit: Maximum number of jobs to return
            
        Returns:
            List[JobPosting]: Recently scraped jobs
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        return await cls.find(
            cls.scraped_at >= cutoff_date
        ).sort(-cls.scraped_at).limit(limit).to_list()

    def __str__(self) -> str:
        return f"{self.title} at {self.company} ({self.location})"
