from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import JSONResponse
import logging

from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.learning import (
    LearningRoadmapResponse, ResourceSearchResponse, LearningResource,
    ResourceType
)
from app.services.learning_service import (
    get_learning_roadmap, get_resources_for_skills, search_resources,
    RESOURCE_TYPES
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/roadmap",
    response_model=LearningRoadmapResponse,
    summary="Get personalized learning roadmap",
    description="Generate a personalized learning roadmap based on user's skills and target roles, with optional gap analysis integration."
)
async def get_user_learning_roadmap(
    response: Response,
    current_user: User = Depends(get_current_active_user),
    target_role: Optional[str] = Query(None, description="Specific target role to focus the roadmap on"),
    include_gap_analysis: bool = Query(True, description="Whether to include skill gap analysis for prioritization")
):
    """
    Get a personalized learning roadmap for the authenticated user.
    
    The roadmap includes:
    - Prioritized skill learning paths
    - Resources for each skill
    - Gap analysis integration (if enabled)
    - Personalized recommendations
    """
    try:
        # Set cache headers for performance
        response.headers["Cache-Control"] = "max-age=3600"  # 1 hour cache
        
        roadmap = await get_learning_roadmap(
            user=current_user,
            include_gap_analysis=include_gap_analysis,
            target_role=target_role
        )
        
        logger.info(f"Generated learning roadmap for user {current_user.email}")
        return roadmap
        
    except Exception as e:
        logger.error(f"Error generating learning roadmap for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate learning roadmap. Please try again later."
        )


@router.get(
    "/resources",
    response_model=List[LearningResource],
    summary="Get learning resources for specific skills",
    description="Retrieve learning resources for specified skills with optional filtering by resource type and search query."
)
async def get_skill_resources(
    response: Response,
    skills: List[str] = Query(..., description="List of skills to get resources for"),
    resource_type: Optional[ResourceType] = Query(None, description="Filter by resource type"),
    search: Optional[str] = Query(None, description="Search query to filter resources"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get learning resources for specific skills.
    
    Supports filtering by:
    - Resource type (Documentation, Video, Course, Book)
    - Search query (searches titles and descriptions)
    """
    try:
        # Set cache headers for performance
        response.headers["Cache-Control"] = "max-age=3600"  # 1 hour cache
        
        # Validate resource type
        if resource_type and resource_type.value not in RESOURCE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid resource type. Must be one of: {', '.join(RESOURCE_TYPES)}"
            )
        
        resources = await get_resources_for_skills(
            skills=skills,
            resource_type=resource_type.value if resource_type else None,
            search=search
        )
        
        logger.info(f"Retrieved {len(resources)} resources for skills {skills} for user {current_user.email}")
        return resources
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting resources for skills {skills}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve learning resources. Please try again later."
        )


@router.get(
    "/resources/search",
    response_model=ResourceSearchResponse,
    summary="Search learning resources",
    description="Search learning resources by query with optional filtering and pagination."
)
async def search_learning_resources(
    response: Response,
    query: str = Query(..., min_length=1, description="Search query"),
    resource_type: Optional[ResourceType] = Query(None, description="Filter by resource type"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip for pagination"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search learning resources by query.
    
    Searches across:
    - Skill names
    - Resource titles
    - Resource descriptions
    
    Supports:
    - Resource type filtering
    - Pagination with limit and offset
    """
    try:
        # Set cache headers for performance
        response.headers["Cache-Control"] = "max-age=3600"  # 1 hour cache
        
        # Validate resource type
        if resource_type and resource_type.value not in RESOURCE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid resource type. Must be one of: {', '.join(RESOURCE_TYPES)}"
            )
        
        resources, total_found = await search_resources(
            query=query,
            resource_type=resource_type.value if resource_type else None,
            limit=limit,
            offset=offset
        )
        
        filters_applied = {
            "resource_type": resource_type.value if resource_type else None,
            "limit": limit,
            "offset": offset
        }
        
        search_response = ResourceSearchResponse(
            resources=resources,
            total_found=total_found,
            search_query=query,
            filters_applied=filters_applied
        )
        
        logger.info(f"Search for '{query}' returned {len(resources)} resources (total: {total_found}) for user {current_user.email}")
        return search_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching resources with query '{query}': {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to search learning resources. Please try again later."
        )
