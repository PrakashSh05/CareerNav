from fastapi import APIRouter, Query, HTTPException, Depends
import logging

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.gap_service import analyze_skill_gap
from app.schemas.analytics import GapAnalysisResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/gap-analysis", response_model=GapAnalysisResponse)
async def get_skill_gap_analysis(
    role: str = Query(..., description="Target role to analyze (must match one of user's target roles)"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days to analyze job postings (1-365)"),
    threshold: float = Query(default=0.25, ge=0.1, le=1.0, description="Minimum percentage of jobs requiring skill (0.1-1.0)"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Analyze skill gaps for a user's target role.
    
    This endpoint compares the user's current skills against the skills required
    for their target role based on recent job posting analysis. It identifies
    missing skills and calculates coverage percentage.
    
    **Authentication Required:** JWT Bearer token
    
    **Query Parameters:**
    - **role**: Target role to analyze (must be in user's target_roles)
    - **days**: Time window for job analysis (default: 30 days)
    - **threshold**: Minimum percentage of jobs requiring skill (default: 0.25 = 25%)
    
    **Response includes:**
    - Role analyzed and number of job postings used
    - List of required skills with user's coverage status
    - List of missing skills the user should learn
    - Overall coverage percentage and skill match statistics
    
    **Example Response:**
    ```json
    {
        "role": "Software Engineer",
        "total_postings_analyzed": 156,
        "required_skills": [
            {
                "skill": "Python",
                "required_percentage": 78.5,
                "user_has": true
            },
            {
                "skill": "Docker",
                "required_percentage": 45.2,
                "user_has": false
            }
        ],
        "missing_skills": ["Docker", "Kubernetes"],
        "coverage_percentage": 67.5,
        "skill_match_count": 8,
        "total_required_skills": 12
    }
    ```
    
    **Error Cases:**
    - 400: Role not in user's target roles or insufficient data
    - 401: Authentication required
    - 404: User not found
    - 500: Server error during analysis
    """
    try:
        logger.info(f"Analyzing skill gap for user {current_user.email}, role: {role}")
        
        # Validate user has target roles configured
        if not current_user.target_roles:
            raise HTTPException(
                status_code=400,
                detail="User has no target roles configured. Please update your profile first."
            )
        
        # Validate that the requested role is in user's target roles
        if role not in current_user.target_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Role '{role}' is not in your target roles. Available roles: {', '.join(current_user.target_roles)}"
            )
        
        # Perform skill gap analysis
        gap_analysis = await analyze_skill_gap(
            user=current_user,
            target_role=role,
            days=days,
            threshold=threshold
        )
        
        # Check if we have sufficient data for meaningful analysis
        if gap_analysis.total_postings_analyzed == 0:
            raise HTTPException(
                status_code=404,
                detail={
                    "message": f"No job data found for '{role}'",
                    "suggestions": [
                        f"Try increasing the time window (currently analyzing last {days} days)",
                        "Check if the role name is spelled correctly",
                        "Consider using a more general role title (e.g., 'Software Engineer' instead of 'Senior Backend Software Engineer')",
                        "This role might not have recent job postings in our database"
                    ],
                    "alternatives": [
                        "Software Engineer",
                        "Data Engineer", 
                        "Frontend Developer",
                        "Full Stack Developer"
                    ]
                }
            )
        
        # Log analysis results
        logger.info(f"Skill gap analysis completed: {gap_analysis.coverage_percentage}% coverage, "
                   f"{len(gap_analysis.missing_skills)} missing skills, "
                   f"{gap_analysis.total_postings_analyzed} jobs analyzed")
        
        return gap_analysis
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error performing skill gap analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Unable to perform skill gap analysis. Please try again later."
        )
