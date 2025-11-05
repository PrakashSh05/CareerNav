import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.models.job_posting import JobPosting
from app.services.skill_extractor import skill_extractor
from app.services.theirstack_client import (
    TheirStackAuthenticationError,
    TheirStackClient,
    TheirStackRetryableError,
)

logger = logging.getLogger(__name__)


class JobCollectionService:
    """Service responsible for collecting job postings from TheirStack."""

    def __init__(self, client: Optional[TheirStackClient] = None) -> None:
        self.client = client or TheirStackClient()

    def _generate_role_variations(self, role: str) -> List[str]:
        """
        Generate common variations of a role for broader search results.
        Matches real job titles found in TheirStack API.
        
        Examples:
            "Backend Developer" → ["Backend Developer", "Backend", "Back-end Developer", etc.]
            "Software Engineer" → ["Software Engineer", "Software Developer", "SDE", etc.]
        """
        variations = [role]  # Always include the original
        role_lower = role.lower()
        
        # Backend Developer variations
        if "aws" in role_lower and "architect" in role_lower:
            variations.extend([
                "AWS Solutions Architect",
                "AWS Architect",
                "AWS Cloud Architect",
                "Cloud Solutions Architect",
                "Cloud Architect",
                "Solutions Architect",
                "AWS Certified Solutions Architect",
            ])
        elif "solutions architect" in role_lower:
            variations.extend([
                "Solutions Architect",
                "Cloud Solutions Architect",
                "Cloud Architect",
                "Technical Architect",
            ])
        elif "backend" in role_lower:
            variations.extend([
                "Backend",
                "Back-end Developer",
                "Back end Developer",
                "Backend Engineer",
                "Server-side Developer",
            ])
        
        # Frontend Developer variations
        elif "frontend" in role_lower or "front-end" in role_lower:
            variations.extend([
                "Frontend",
                "Front-end Developer", 
                "Front end Developer",
                "Frontend Engineer",
                "UI Developer",
            ])
        
        # Full Stack Developer variations
        elif "full stack" in role_lower or "fullstack" in role_lower or "full-stack" in role_lower:
            variations.extend([
                "Full Stack",
                "Fullstack Developer",
                "Full-stack Developer",
                "Full Stack Engineer",
                "Fullstack Engineer",
            ])
        
        # Software Engineer variations
        elif "software engineer" in role_lower:
            variations.extend([
                "Software Developer",
                "SDE",
                "Software Engineer",
                "Engineer",
                "Developer",
            ])
        
        # Data Engineer variations
        elif "data engineer" in role_lower:
            variations.extend([
                "Data Engineer",
                "Big Data Engineer",
                "ETL Developer",
                "Data Pipeline Engineer",
            ])
        
        # DevOps Engineer variations
        elif "devops" in role_lower:
            variations.extend([
                "DevOps",
                "DevOps Engineer",
                "SRE",
                "Site Reliability Engineer",
                "Platform Engineer",
            ])
        
        # Mobile Developer variations
        elif "mobile" in role_lower:
            variations.extend([
                "Mobile Developer",
                "Mobile Engineer",
                "iOS Developer",
                "Android Developer",
                "Mobile App Developer",
            ])
        
        # AI/ML Engineer variations
        elif "ai engineer" in role_lower or "ml engineer" in role_lower or "machine learning" in role_lower:
            variations.extend([
                "AI Engineer",
                "ML Engineer",
                "Machine Learning Engineer",
                "AI/ML Engineer",
                "Artificial Intelligence Engineer",
            ])
        
        # Data Scientist variations
        elif "data scientist" in role_lower:
            variations.extend([
                "Data Scientist",
                "ML Scientist",
                "Research Scientist",
            ])
        
        # Cloud Engineer variations
        elif "cloud engineer" in role_lower:
            variations.extend([
                "Cloud Engineer",
                "Cloud Architect",
                "Cloud Developer",
            ])
        
        # QA/Test Engineer variations
        elif "qa" in role_lower or "test" in role_lower or "quality" in role_lower:
            variations.extend([
                "QA Engineer",
                "Test Engineer",
                "QA Automation Engineer",
                "SDET",
                "Quality Engineer",
            ])
        
        # Product Manager variations
        elif "product manager" in role_lower:
            variations.extend([
                "Product Manager",
                "PM",
                "Product Owner",
                "Technical Product Manager",
            ])
        
        # Security Engineer variations
        elif "security" in role_lower:
            variations.extend([
                "Security Engineer",
                "Cybersecurity Engineer",
                "InfoSec Engineer",
                "Security Analyst",
            ])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_variations = []
        for var in variations:
            var_normalized = var.lower().strip()
            if var_normalized and var_normalized not in seen:
                seen.add(var_normalized)
                unique_variations.append(var)
        
        logger.info(f"Generated {len(unique_variations)} variations for role '{role}': {unique_variations}")
        return unique_variations

    def _should_skip_job(self, role: str, job_title: str | None) -> bool:
        """Determine if a fetched job should be skipped for the given role."""
        if not job_title:
            return False

        role_lower = role.lower()
        title_lower = job_title.lower()

        # Avoid collecting React Native roles when user asked for React (web) roles
        if "react" in role_lower and "native" not in role_lower and "react native" in title_lower:
            logger.debug(
                "Skipping job '%s' for role '%s' because it targets React Native",
                job_title,
                role,
            )
            return True

        return False

    async def collect_jobs_for_roles(
        self,
        roles: List[str],
        locations: List[str],
        max_age_days: int = 14,
        per_role_limit: int = settings.max_jobs_per_search,
    ) -> Dict[str, Any]:
        """Collect job postings for the supplied roles and locations."""
        if not roles:
            logger.warning("No roles provided for job collection")
            return {}

        normalized_locations = [loc.strip() for loc in locations or [] if loc and loc.strip()]
        search_location_label = ",".join(normalized_locations) if normalized_locations else ""
        summary: Dict[str, Any] = {}

        for role in roles:
            role_label = role.strip()
            if not role_label:
                continue

            total_collected = 0
            total_pages = 0
            total_credits_used = 0
            page = 1
            per_page_limit = max(1, min(settings.max_jobs_per_search, per_role_limit))
            logger.info(
                "Starting TheirStack collection for role '%s' with locations '%s'",
                role_label,
                search_location_label or "(any)",
            )

            while total_collected < per_role_limit:
                remaining = per_role_limit - total_collected
                page_limit = max(1, min(per_page_limit, remaining))
                
                # Generate common variations for broader results
                # "Backend Developer" → ["Backend Developer", "Senior Backend Developer", "Java Backend Developer", etc.]
                role_variations = self._generate_role_variations(role_label)
                
                payload: Dict[str, Any] = {
                    "job_title_or": role_variations,  # Search multiple variations at once
                    "posted_at_max_age_days": max_age_days,
                    "page": page,
                    "limit": page_limit,
                }

                if normalized_locations:
                    payload["job_location_pattern_or"] = normalized_locations
                    
                    # Add country codes for better matching
                    country_codes = []
                    for loc in normalized_locations:
                        loc_lower = loc.lower()
                        if "united states" in loc_lower:
                            country_codes.append("US")
                        elif "india" in loc_lower:
                            country_codes.append("IN")
                        elif "united kingdom" in loc_lower or "uk" in loc_lower:
                            country_codes.append("GB")
                        elif "canada" in loc_lower:
                            country_codes.append("CA")
                        elif "germany" in loc_lower:
                            country_codes.append("DE")
                        elif "australia" in loc_lower:
                            country_codes.append("AU")
                        elif "singapore" in loc_lower:
                            country_codes.append("SG")
                        elif "japan" in loc_lower:
                            country_codes.append("JP")
                        elif "hong kong" in loc_lower:
                            country_codes.append("HK")
                        elif "switzerland" in loc_lower:
                            country_codes.append("CH")
                        elif "france" in loc_lower:
                            country_codes.append("FR")
                        elif "netherlands" in loc_lower:
                            country_codes.append("NL")
                        elif "ireland" in loc_lower:
                            country_codes.append("IE")
                        elif "sweden" in loc_lower:
                            country_codes.append("SE")
                    
                    if country_codes:
                        payload["job_country_code_or"] = country_codes

                # Debug: Log the actual payload being sent with variations
                logger.info(f"Sending TheirStack search for '{role_label}' with {len(role_variations)} variations")
                logger.info(f"Payload: {payload}")

                try:
                    response = await self.client.search_jobs(payload)
                except TheirStackAuthenticationError as exc:
                    logger.error("TheirStack authentication failed for role '%s': %s", role_label, exc)
                    break
                except TheirStackRetryableError as exc:
                    logger.error("Retryable TheirStack error for role '%s': %s", role_label, exc)
                    break
                except Exception as exc:  # pragma: no cover - defensive
                    logger.exception("Unexpected error searching TheirStack for role '%s'", role_label)
                    break

                data = response.get("data", []) if isinstance(response, dict) else []
                metadata = response.get("metadata", {}) if isinstance(response, dict) else {}

                if not data:
                    logger.info(
                        "No job data returned from TheirStack for role '%s' on page %s",
                        role_label,
                        page,
                    )
                    break

                total_pages += 1
                credits_used = metadata.get("credits_used") or metadata.get("credits_consumed") or 0
                estimated_credits = (
                    metadata.get("estimated_credits")
                    or metadata.get("credits_estimated")
                    or 0
                )
                total_credits_used += credits_used or estimated_credits

                for job in data:
                    job_title = job.get("job_title") or job.get("title")
                    if self._should_skip_job(role_label, job_title):
                        continue

                    mapped = await self._map_job(role_label, search_location_label, job)
                    if mapped is None:
                        continue

                    try:
                        await JobPosting.upsert_job(mapped)
                        total_collected += 1
                    except Exception as exc:  # pragma: no cover - defensive
                        logger.exception("Failed to upsert job '%s': %s", mapped.get("job_id") or mapped.get("url"), exc)

                    if total_collected >= per_role_limit:
                        break

                has_more = metadata.get("has_more")
                total_results = metadata.get("total_results") or metadata.get("total")
                logger.info(
                    "Role '%s': collected %s/%s jobs after page %s (credits used this page: %s, total results reported: %s)",
                    role_label,
                    total_collected,
                    per_role_limit,
                    page,
                    credits_used or estimated_credits,
                    total_results,
                )

                if total_collected >= per_role_limit:
                    break
                if has_more is False:
                    break

                page += 1

            summary[role_label] = {
                "jobs_collected": total_collected,
                "pages_fetched": total_pages,
                "credits_tracked": total_credits_used,
            }

            logger.info(
                "Completed TheirStack collection for role '%s': %s jobs, %s pages, %s credits",
                role_label,
                total_collected,
                total_pages,
                total_credits_used,
            )

        return summary

    async def cleanup_old_jobs(self, days_to_keep: int = settings.job_data_retention_days) -> int:
        """Remove job postings older than the retention window."""
        cutoff = datetime.utcnow() - timedelta(days=days_to_keep)
        result = await JobPosting.find(JobPosting.scraped_at < cutoff).delete()
        deleted = getattr(result, "deleted_count", 0)
        logger.info("Cleanup job removed %s postings older than %s days", deleted, days_to_keep)
        return deleted

    async def get_collection_statistics(self) -> Dict[str, Any]:
        """Return aggregated statistics about collected job postings."""
        total_jobs = await JobPosting.find_all().count()
        last_day_cutoff = datetime.utcnow() - timedelta(days=1)
        last_week_cutoff = datetime.utcnow() - timedelta(days=7)

        jobs_last_day = await JobPosting.find(JobPosting.scraped_at >= last_day_cutoff).count()
        jobs_last_week = await JobPosting.find(JobPosting.scraped_at >= last_week_cutoff).count()

        first_pipeline = [
            {"$group": {"_id": "$search_keywords", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        top_roles = await JobPosting.aggregate(first_pipeline).to_list()

        location_pipeline = [
            {"$match": {"location": {"$ne": None}}},
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        top_locations = await JobPosting.aggregate(location_pipeline).to_list()

        return {
            "total_jobs": total_jobs,
            "jobs_last_24h": jobs_last_day,
            "jobs_last_7d": jobs_last_week,
            "top_roles": [{"role": item.get("_id"), "count": item.get("count", 0)} for item in top_roles],
            "top_locations": [
                {"location": item.get("_id"), "count": item.get("count", 0)} for item in top_locations
            ],
        }

    async def _map_job(
        self,
        role: str,
        search_location_label: str,
        job: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Map TheirStack API response payload to JobPosting schema."""
        if not isinstance(job, dict):
            return None

        description = job.get("description") or job.get("job_description") or ""
        technology_slugs = job.get("technology_slugs") or []
        # Map technology_slugs to normalized skill names (don't extract from description text)
        skills = skill_extractor.map_technology_slugs(technology_slugs)

        company_obj = job.get("company_object") or {}
        locations = job.get("locations") or []
        if isinstance(locations, str):
            locations_list = [locations]
        elif isinstance(locations, list):
            locations_list = []
            for loc in locations:
                if not loc:
                    continue
                if isinstance(loc, str):
                    locations_list.append(loc)
                elif isinstance(loc, dict):
                    name = (
                        loc.get("name")
                        or loc.get("city")
                        or loc.get("state")
                        or loc.get("country")
                    )
                    if name:
                        locations_list.append(name)
        else:
            locations_list = []
        location_label = ", ".join(str(item) for item in locations_list if item)

        date_posted = job.get("posted_at") or job.get("date_posted")
        if isinstance(date_posted, str):
            try:
                date_posted = datetime.fromisoformat(date_posted.replace("Z", "+00:00"))
            except ValueError:
                date_posted = None
        elif not isinstance(date_posted, datetime):
            date_posted = None

        coordinates = job.get("coordinates") or job.get("geo")

        job_id_raw = job.get("job_id") or job.get("id")
        job_id_str = str(job_id_raw) if job_id_raw is not None else None
        
        mapped_job = {
            "job_id": job_id_str,
            "title": job.get("job_title") or job.get("title") or role,
            "company": company_obj.get("name") or job.get("company") or "Unknown Company",
            "company_domain": company_obj.get("domain") or job.get("company_domain"),
            "location": location_label or job.get("location", "Unknown"),
            "description": description,
            "skills": skills,
            "url": job.get("job_url") or job.get("url") or job.get("detail_url"),
            "date_posted": date_posted,
            "min_annual_salary_usd": job.get("min_annual_salary_usd") or job.get("salary_min_annual_usd"),
            "max_annual_salary_usd": job.get("max_annual_salary_usd") or job.get("salary_max_annual_usd"),
            "remote": job.get("remote"),
            "technology_slugs": technology_slugs,
            "search_keywords": role,
            "search_location": search_location_label,
            "coordinates": coordinates,
            "scraped_at": datetime.utcnow(),
        }

        if not mapped_job.get("url") and not mapped_job.get("job_id"):
            logger.debug("Skipping TheirStack job without identifier or URL: %s", job)
            return None

        return mapped_job
