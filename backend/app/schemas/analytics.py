from datetime import datetime
from typing import List
from pydantic import BaseModel, Field, ConfigDict


class TrendingSkill(BaseModel):
    """Model representing a trending skill with its frequency data."""
    skill: str = Field(..., description="Name of the skill")
    count: int = Field(..., description="Number of job postings mentioning this skill")
    percentage: float = Field(..., description="Percentage of analyzed jobs requiring this skill")


class TrendingLocation(BaseModel):
    """Model representing a trending job location with its frequency data."""
    location: str = Field(..., description="Job location (city, state)")
    count: int = Field(..., description="Number of job postings in this location")


class TechnologyTrend(BaseModel):
    """Model representing technology adoption trends based on TheirStack tags."""
    technology: str = Field(..., description="Technology slug or normalized name")
    count: int = Field(..., description="Number of job postings tagged with this technology")


class SalaryTrend(BaseModel):
    """Model representing salary distribution statistics per location."""
    location: str = Field(..., description="Location associated with the salary data")
    avg_min: float = Field(..., description="Average minimum annual salary in USD")
    avg_max: float = Field(..., description="Average maximum annual salary in USD")
    count: int = Field(..., description="Number of postings contributing to this statistic")


class RemoteTrend(BaseModel):
    """Model representing remote vs onsite distribution."""
    remote: bool = Field(..., description="Whether the job is remote")
    count: int = Field(..., description="Number of postings with this remote flag")


class TrendingResponse(BaseModel):
    """Response model for trending market data analysis."""
    top_skills: List[TrendingSkill] = Field(..., description="List of trending skills sorted by frequency")
    top_locations: List[TrendingLocation] = Field(..., description="List of trending locations sorted by frequency")
    technology_trends: List[TechnologyTrend] = Field(..., description="Trending technologies derived from TheirStack tags")
    salary_trends: List[SalaryTrend] = Field(..., description="Average salary trends across locations")
    remote_distribution: List[RemoteTrend] = Field(..., description="Distribution of remote vs onsite roles")
    total_jobs_analyzed: int = Field(..., description="Total number of job postings analyzed")
    generated_at: datetime = Field(..., description="Timestamp when this analysis was generated")
    window_days: int = Field(..., description="Number of days of data included in analysis")

    model_config = ConfigDict(ser_json_timedelta="iso8601")


class SkillGapItem(BaseModel):
    """Model representing a skill gap analysis item."""
    skill: str = Field(..., description="Name of the skill")
    required_percentage: float = Field(..., description="Percentage of job postings requiring this skill")
    user_has: bool = Field(..., description="Whether the user currently has this skill")


class GapAnalysisResponse(BaseModel):
    """Response model for skill gap analysis."""
    role: str = Field(..., description="Target role analyzed")
    total_postings_analyzed: int = Field(..., description="Number of job postings analyzed for this role")
    required_skills: List[SkillGapItem] = Field(..., description="List of skills required for this role")
    missing_skills: List[str] = Field(..., description="List of skills the user is missing")
    coverage_percentage: float = Field(..., description="Percentage of required skills the user already has")
    skill_match_count: int = Field(..., description="Number of required skills the user has")
    total_required_skills: int = Field(..., description="Total number of skills required for this role")
