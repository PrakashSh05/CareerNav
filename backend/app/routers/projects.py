from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
import logging

from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.learning import (
    ProjectRecommendationsResponse, ProjectIdea, ProjectSearchResponse,
    Difficulty
)
from app.services.project_service import (
    get_project_recommendations, search_projects, get_all_projects,
    get_skill_building_projects, load_project_ideas, calculate_skill_match,
    DIFFICULTIES
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/recommendations",
    response_model=ProjectRecommendationsResponse,
    summary="Get personalized project recommendations",
    description="Get personalized project recommendations based on user's skills, with optional difficulty and skill focus filtering."
)
async def get_user_project_recommendations(
    response: Response,
    current_user: User = Depends(get_current_active_user),
    difficulty: Optional[Difficulty] = Query(None, description="Filter by project difficulty level"),
    skill_focus: Optional[List[str]] = Query(None, description="Focus on projects using specific skills"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of projects to return"),
    target_role: Optional[str] = Query(None, description="Filter projects suited for a specific target role")
):
    """
    Get personalized project recommendations for the authenticated user.
    
    Recommendations are based on:
    - User's current skills (skill match percentage)
    - Project difficulty progression
    - Optional skill focus areas
    
    Projects are sorted by skill match percentage and difficulty appropriateness.
    """
    try:
        # Set cache headers for performance
        response.headers["Cache-Control"] = "max-age=3600"  # 1 hour cache
        
        # Validate difficulty
        if difficulty and difficulty.value not in DIFFICULTIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid difficulty level. Must be one of: {', '.join(DIFFICULTIES)}"
            )
        
        recommendations = await get_project_recommendations(
            user=current_user,
            difficulty=difficulty.value if difficulty else None,
            skill_focus=skill_focus,
            target_role=target_role,
            limit=limit
        )
        
        logger.info(f"Generated {len(recommendations.projects)} project recommendations for user {current_user.email}")
        return recommendations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project recommendations for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate project recommendations. Please try again later."
        )


@router.get(
    "/skill-building",
    response_model=List[ProjectIdea],
    summary="Get skill-building projects",
    description="Get projects that help build specific skills, useful for addressing skill gaps."
)
async def get_skill_building_project_recommendations(
    response: Response,
    skills: List[str] = Query(..., description="Skills to focus on building"),
    difficulty: Optional[Difficulty] = Query(None, description="Filter by project difficulty level"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of projects to return"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get projects that help build specific skills.
    
    Useful for:
    - Addressing skill gaps identified in gap analysis
    - Learning new technologies
    - Strengthening weak areas
    
    Projects are filtered to include those that teach the specified skills.
    """
    try:
        # Set cache headers for performance
        response.headers["Cache-Control"] = "max-age=3600"  # 1 hour cache
        
        # Validate difficulty
        if difficulty and difficulty.value not in DIFFICULTIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid difficulty level. Must be one of: {', '.join(DIFFICULTIES)}"
            )
        
        # Load all projects
        all_projects = load_project_ideas()
        
        # Get skill-building projects
        skill_building_projects_data = get_skill_building_projects(skills, all_projects)
        
        # Filter by difficulty if specified
        if difficulty:
            skill_building_projects_data = [
                p for p in skill_building_projects_data 
                if p.get("difficulty") == difficulty.value
            ]
        
        # Calculate skill matches for the user
        user_skills = current_user.skills or []
        projects_with_matches = []
        
        for project_data in skill_building_projects_data[:limit]:
            match_percentage, missing_skills = calculate_skill_match(
                user_skills, project_data.get("skills", [])
            )
            
            project = ProjectIdea(
                **project_data,
                skill_match_percentage=match_percentage,
                missing_skills=missing_skills
            )
            projects_with_matches.append(project)
        
        # Sort by difficulty (easier first) and then by skill match
        difficulty_order = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
        projects_with_matches.sort(
            key=lambda p: (difficulty_order.get(p.difficulty, 2), -p.skill_match_percentage)
        )
        
        logger.info(f"Found {len(projects_with_matches)} skill-building projects for skills {skills} for user {current_user.email}")
        return projects_with_matches
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting skill-building projects for skills {skills}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get skill-building projects. Please try again later."
        )


@router.get(
    "/search",
    response_model=ProjectSearchResponse,
    summary="Search projects",
    description="Search projects by query with optional filtering and pagination."
)
async def search_project_ideas(
    response: Response,
    query: str = Query(..., min_length=1, description="Search query"),
    skills: Optional[List[str]] = Query(None, description="Filter by required skills"),
    difficulty: Optional[Difficulty] = Query(None, description="Filter by project difficulty level"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip for pagination"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search projects by query.
    
    Searches across:
    - Project titles
    - Project descriptions
    - Project features
    - Required skills
    
    Supports:
    - Skills filtering
    - Difficulty filtering
    - Pagination with limit and offset
    """
    try:
        # Set cache headers for performance
        response.headers["Cache-Control"] = "max-age=3600"  # 1 hour cache
        
        # Validate difficulty
        if difficulty and difficulty.value not in DIFFICULTIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid difficulty level. Must be one of: {', '.join(DIFFICULTIES)}"
            )
        
        projects, total_found = await search_projects(
            query=query,
            skills=skills,
            difficulty=difficulty.value if difficulty else None,
            limit=limit,
            offset=offset
        )
        
        filters_applied = {
            "skills": skills,
            "difficulty": difficulty.value if difficulty else None,
            "limit": limit,
            "offset": offset
        }
        
        search_response = ProjectSearchResponse(
            projects=projects,
            total_found=total_found,
            search_query=query,
            filters_applied=filters_applied
        )
        
        logger.info(f"Search for '{query}' returned {len(projects)} projects (total: {total_found}) for user {current_user.email}")
        return search_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching projects with query '{query}': {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to search projects. Please try again later."
        )


@router.get(
    "/all",
    response_model=List[ProjectIdea],
    summary="Get all projects",
    description="Get all available projects with optional difficulty filtering and pagination."
)
async def get_all_project_ideas(
    response: Response,
    difficulty: Optional[Difficulty] = Query(None, description="Filter by project difficulty level"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip for pagination"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all available projects with optional filtering.
    
    Supports:
    - Difficulty filtering
    - Pagination with limit and offset
    
    Projects include skill match percentages based on user's current skills.
    """
    try:
        # Set cache headers for performance
        response.headers["Cache-Control"] = "max-age=3600"  # 1 hour cache
        
        # Validate difficulty
        if difficulty and difficulty.value not in DIFFICULTIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid difficulty level. Must be one of: {', '.join(DIFFICULTIES)}"
            )
        
        projects, total_count = await get_all_projects(
            difficulty=difficulty.value if difficulty else None,
            limit=limit,
            offset=offset
        )
        
        # Calculate skill matches for the user
        user_skills = current_user.skills or []
        projects_with_matches = []
        
        for project in projects:
            match_percentage, missing_skills = calculate_skill_match(
                user_skills, project.skills
            )
            
            # Update project with match information
            project.skill_match_percentage = match_percentage
            project.missing_skills = missing_skills
            projects_with_matches.append(project)
        
        logger.info(f"Retrieved {len(projects_with_matches)} projects (total: {total_count}) for user {current_user.email}")
        return projects_with_matches
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting all projects: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve projects. Please try again later."
        )
