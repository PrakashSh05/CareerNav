from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class ResourceType(str, Enum):
    """Enumeration for learning resource types."""
    DOCUMENTATION = "Documentation"
    VIDEO = "Video"
    COURSE = "Course"
    BOOK = "Book"


class LearningResource(BaseModel):
    """Schema for a learning resource."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "type": "Documentation",
                "title": "React Official Documentation",
                "url": "https://react.dev/",
                "description": "Official React documentation with comprehensive guides and API reference",
            }
        },
    )
    
    type: ResourceType = Field(..., description="Type of learning resource")
    title: str = Field(..., description="Title of the resource")
    url: str = Field(..., description="URL to access the resource")
    description: str = Field(..., description="Description of the resource content")


class SkillLearningPath(BaseModel):
    """Schema for a skill's learning path."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "skill": "React",
                "resources": [
                    {
                        "type": "Documentation",
                        "title": "React Official Documentation",
                        "url": "https://react.dev/",
                        "description": "Official React documentation with comprehensive guides",
                    }
                ],
                "is_missing": True,
                "priority_score": 85.5,
            }
        },
    )
    
    skill: str = Field(..., description="Name of the skill")
    resources: List[LearningResource] = Field(..., description="List of learning resources for this skill")
    is_missing: bool = Field(default=False, description="Whether this skill is missing from user's profile")
    priority_score: Optional[float] = Field(None, description="Priority score based on gap analysis")


class LearningRoadmapResponse(BaseModel):
    """Schema for learning roadmap response."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "target_role": "Frontend Developer",
                "skill_paths": [
                    {
                        "skill": "React",
                        "resources": [
                            {
                                "type": "Documentation",
                                "title": "React Official Documentation",
                                "url": "https://react.dev/",
                                "description": "Official React documentation",
                            }
                        ],
                        "is_missing": True,
                        "priority_score": 85.5,
                    }
                ],
                "total_skills": 5,
                "missing_skills_count": 2,
                "coverage_percentage": 60.0,
                "recommendations": [
                    "Focus on React first as it's required by 85% of jobs",
                    "Consider JavaScript fundamentals before advanced frameworks",
                ],
            }
        },
    )
    
    target_role: Optional[str] = Field(None, description="Target role for the roadmap")
    skill_paths: List[SkillLearningPath] = Field(..., description="Learning paths for skills")
    total_skills: int = Field(..., description="Total number of skills in roadmap")
    missing_skills_count: int = Field(..., description="Number of missing skills")
    coverage_percentage: Optional[float] = Field(None, description="Current skill coverage percentage")
    recommendations: List[str] = Field(default_factory=list, description="Learning recommendations")


class Difficulty(str, Enum):
    """Enumeration for project difficulty levels."""
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class ProjectIdea(BaseModel):
    """Schema for a project idea."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "title": "Personal Portfolio Website",
                "description": "Create a responsive personal portfolio website showcasing your skills",
                "difficulty": "Beginner",
                "estimated_time": "1-2 weeks",
                "skills": ["HTML", "CSS", "JavaScript", "React"],
                "features": [
                    "Responsive design",
                    "Interactive project gallery",
                    "Contact form",
                ],
                "skill_match_percentage": 75.0,
                "missing_skills": ["React"],
            }
        },
    )
    
    id: int = Field(..., description="Unique identifier for the project")
    title: str = Field(..., description="Project title")
    description: str = Field(..., description="Project description")
    difficulty: Difficulty = Field(..., description="Project difficulty level")
    estimated_time: str = Field(..., description="Estimated time to complete")
    skills: List[str] = Field(..., description="Skills required for the project")
    features: List[str] = Field(..., description="Key features of the project")
    roles: Optional[List[str]] = Field(default=None, description="Target roles this project is suitable for")
    skill_match_percentage: Optional[float] = Field(None, description="Percentage of skills user already has")
    missing_skills: Optional[List[str]] = Field(None, description="Skills user needs to learn")


class ProjectRecommendationsResponse(BaseModel):
    """Schema for project recommendations response."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "projects": [
                    {
                        "id": 1,
                        "title": "Personal Portfolio Website",
                        "description": "Create a responsive personal portfolio website",
                        "difficulty": "Beginner",
                        "estimated_time": "1-2 weeks",
                        "skills": ["HTML", "CSS", "JavaScript"],
                        "features": ["Responsive design", "Contact form"],
                        "skill_match_percentage": 100.0,
                        "missing_skills": [],
                    }
                ],
                "total_projects": 12,
                "filters_applied": {
                    "difficulty": "Beginner",
                    "skill_focus": ["JavaScript"],
                    "limit": 10,
                },
                "user_skill_count": 5,
                "recommendations": [
                    "Start with beginner projects to build confidence",
                    "Focus on projects that use your existing JavaScript skills",
                ],
            }
        },
    )
    
    projects: List[ProjectIdea] = Field(..., description="List of recommended projects")
    total_projects: int = Field(..., description="Total number of projects available")
    filters_applied: Dict[str, Any] = Field(..., description="Filters applied to the recommendations")
    user_skill_count: int = Field(..., description="Number of skills the user has")
    recommendations: List[str] = Field(default_factory=list, description="Personalized recommendations")


class ResourceSearchResponse(BaseModel):
    """Schema for resource search response."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "resources": [
                    {
                        "type": "Documentation",
                        "title": "React Official Documentation",
                        "url": "https://react.dev/",
                        "description": "Official React documentation",
                    }
                ],
                "total_found": 1,
                "search_query": "react",
                "filters_applied": {
                    "resource_type": "Documentation",
                },
            }
        },
    )
    
    resources: List[LearningResource] = Field(..., description="List of matching resources")
    total_found: int = Field(..., description="Total number of resources found")
    search_query: str = Field(..., description="Search query used")
    filters_applied: Dict[str, Any] = Field(..., description="Filters applied to the search")


class ProjectSearchResponse(BaseModel):
    """Schema for project search response."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "projects": [
                    {
                        "id": 1,
                        "title": "Personal Portfolio Website",
                        "description": "Create a responsive personal portfolio website",
                        "difficulty": "Beginner",
                        "estimated_time": "1-2 weeks",
                        "skills": ["HTML", "CSS", "JavaScript"],
                        "features": ["Responsive design"],
                        "skill_match_percentage": 100.0,
                        "missing_skills": [],
                    }
                ],
                "total_found": 1,
                "search_query": "portfolio",
                "filters_applied": {
                    "difficulty": "Beginner",
                },
            }
        },
    )
    
    projects: List[ProjectIdea] = Field(..., description="List of matching projects")
    total_found: int = Field(..., description="Total number of projects found")
    search_query: str = Field(..., description="Search query used")
    filters_applied: Dict[str, Any] = Field(..., description="Filters applied to the search")
