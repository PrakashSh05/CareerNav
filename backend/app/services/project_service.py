import json
import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from cachetools import TTLCache

from app.models.user import User
from app.schemas.learning import ProjectIdea, ProjectRecommendationsResponse, Difficulty

# Cache for 1 hour to improve performance
cache = TTLCache(maxsize=100, ttl=3600)
logger = logging.getLogger(__name__)

# Constants for validation
DIFFICULTIES = {"Beginner", "Intermediate", "Advanced"}


def load_project_ideas() -> List[Dict]:
    """
    Load project ideas from JSON file with caching.
    
    Returns:
        List[Dict]: List of project ideas
        
    Raises:
        Exception: If file cannot be loaded
    """
    cache_key = "project_ideas"
    if cache_key in cache:
        logger.info("Returning cached project ideas")
        return cache[cache_key]
    
    try:
        # Path to the project ideas JSON file
        projects_path = Path(__file__).parent.parent.parent / "project_ideas.json"
        
        with open(projects_path, 'r', encoding='utf-8') as file:
            projects_data = json.load(file)
        
        # Handle both old format (direct array) and new format (with "projects" key)
        if isinstance(projects_data, dict) and "projects" in projects_data:
            projects_list = projects_data["projects"]
        elif isinstance(projects_data, list):
            projects_list = projects_data
        else:
            raise ValueError("Invalid project data format")
        
        # Cache the loaded data
        cache[cache_key] = projects_list
        logger.info(f"Loaded {len(projects_list)} project ideas")
        
        return projects_list
        
    except FileNotFoundError:
        logger.error(f"Project ideas file not found at {projects_path}")
        raise Exception("Project ideas data file not found")
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in project ideas file: {e}")
        raise Exception("Invalid project ideas data format")
    except Exception as e:
        logger.error(f"Error loading project ideas: {e}")
        raise Exception("Failed to load project ideas")


def normalize_skill_name(skill: str) -> str:
    """
    Normalize skill name for consistent matching.
    
    Args:
        skill: Raw skill name
        
    Returns:
        str: Normalized skill name (lowercase, stripped)
    """
    return skill.lower().strip()


def calculate_skill_match(user_skills: List[str], project_skills: List[str]) -> Tuple[float, List[str]]:
    """
    Calculate skill match percentage between user and project skills.
    
    Args:
        user_skills: List of user's skills
        project_skills: List of skills required for the project
        
    Returns:
        Tuple[float, List[str]]: (match_percentage, missing_skills)
    """
    if not project_skills:
        return 100.0, []
    
    # Normalize skills for case-insensitive comparison
    user_skills_normalized = {normalize_skill_name(skill) for skill in user_skills}
    project_skills_normalized = [normalize_skill_name(skill) for skill in project_skills]
    
    # Calculate matches and missing skills
    matched_skills = 0
    missing_skills = []
    
    for project_skill in project_skills:
        project_skill_normalized = normalize_skill_name(project_skill)
        if project_skill_normalized in user_skills_normalized:
            matched_skills += 1
        else:
            missing_skills.append(project_skill)
    
    match_percentage = (matched_skills / len(project_skills)) * 100
    return round(match_percentage, 2), missing_skills


def filter_projects_by_difficulty(projects: List[Dict], difficulty: str) -> List[Dict]:
    """
    Filter projects by difficulty level.
    
    Args:
        projects: List of project dictionaries
        difficulty: Difficulty level to filter by
        
    Returns:
        List[Dict]: Filtered projects
    """
    if difficulty not in DIFFICULTIES:
        return projects
    
    return [p for p in projects if p.get("difficulty") == difficulty]


def get_skill_building_projects(missing_skills: List[str], projects: List[Dict]) -> List[Dict]:
    """
    Get projects that help build specific missing skills.
    
    Args:
        missing_skills: List of skills the user needs to learn
        projects: List of all available projects
        
    Returns:
        List[Dict]: Projects that teach the missing skills
    """
    if not missing_skills:
        return []
    
    missing_skills_normalized = {normalize_skill_name(skill) for skill in missing_skills}
    skill_building_projects = []
    
    for project in projects:
        project_skills = project.get("skills", [])
        project_skills_normalized = {normalize_skill_name(skill) for skill in project_skills}
        
        # Check if project teaches any missing skills
        if missing_skills_normalized.intersection(project_skills_normalized):
            skill_building_projects.append(project)
    
    return skill_building_projects


async def get_project_recommendations(
    user: User,
    difficulty: Optional[str] = None,
    skill_focus: Optional[List[str]] = None,
    target_role: Optional[str] = None,
    limit: int = 10
) -> ProjectRecommendationsResponse:
    """
    Get personalized project recommendations for a user.
    
    Args:
        user: User object with skills
        difficulty: Optional difficulty filter
        skill_focus: Optional list of skills to focus on
        limit: Maximum number of projects to return
        
    Returns:
        ProjectRecommendationsResponse: Personalized project recommendations
    """
    try:
        # Load project ideas
        projects_data = load_project_ideas()
        
        # Apply difficulty filter
        if difficulty and difficulty in DIFFICULTIES:
            projects_data = filter_projects_by_difficulty(projects_data, difficulty)

        # Apply role filter if provided
        if target_role:
            normalized_role = normalize_skill_name(target_role)
            projects_with_roles = []
            for project in projects_data:
                project_roles = project.get("roles") or []
                project_roles_normalized = {normalize_skill_name(role) for role in project_roles}
                if normalized_role in project_roles_normalized:
                    projects_with_roles.append(project)
            projects_data = projects_with_roles

        # Apply skill focus filter
        if skill_focus:
            skill_focus_normalized = {normalize_skill_name(skill) for skill in skill_focus}
            filtered_projects = []
            
            for project in projects_data:
                project_skills = project.get("skills", [])
                project_skills_normalized = {normalize_skill_name(skill) for skill in project_skills}
                
                # Include project if it uses any of the focus skills
                if skill_focus_normalized.intersection(project_skills_normalized):
                    filtered_projects.append(project)
            
            projects_data = filtered_projects
        
        # Calculate skill matches and sort by match percentage
        user_skills = user.skills or []
        project_recommendations = []
        
        for project_data in projects_data:
            match_percentage, missing_skills = calculate_skill_match(user_skills, project_data.get("skills", []))
            
            project = ProjectIdea(
                **project_data,
                skill_match_percentage=match_percentage,
                missing_skills=missing_skills
            )
            project_recommendations.append(project)
        
        # Sort by skill match percentage (descending) and then by difficulty
        difficulty_order = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
        project_recommendations.sort(
            key=lambda p: (-p.skill_match_percentage, difficulty_order.get(p.difficulty, 2))
        )
        
        # Apply limit
        limited_projects = project_recommendations[:limit]
        
        # Generate recommendations
        recommendations = []
        if limited_projects:
            avg_match = sum(p.skill_match_percentage for p in limited_projects) / len(limited_projects)
            
            if avg_match >= 80:
                recommendations.append("Great! You have the skills for these projects. Start building to showcase your abilities.")
            elif avg_match >= 50:
                recommendations.append("You have good foundation skills. These projects will help you grow.")
            else:
                recommendations.append("These projects will challenge you to learn new skills. Start with beginner-level projects.")
            
            # Check for skill gaps
            all_missing_skills = set()
            for project in limited_projects[:3]:  # Check top 3 projects
                if project.missing_skills:
                    all_missing_skills.update(project.missing_skills)
            
            if all_missing_skills:
                top_missing = list(all_missing_skills)[:3]
                recommendations.append(f"Consider learning {', '.join(top_missing)} to unlock more project opportunities.")
        
        filters_applied = {
            "difficulty": difficulty,
            "skill_focus": skill_focus,
            "target_role": target_role,
            "limit": limit
        }
        
        logger.info(f"Generated {len(limited_projects)} project recommendations for user {user.email}")
        
        return ProjectRecommendationsResponse(
            projects=limited_projects,
            total_projects=len(project_recommendations),
            filters_applied=filters_applied,
            user_skill_count=len(user_skills),
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error getting project recommendations for user {user.email}: {e}")
        return ProjectRecommendationsResponse(
            projects=[],
            total_projects=0,
            filters_applied={
                "difficulty": difficulty,
                "skill_focus": skill_focus,
                "target_role": target_role,
                "limit": limit
            },
            user_skill_count=len(user.skills or []),
            recommendations=["Unable to generate project recommendations. Please try again later."]
        )


async def search_projects(
    query: str,
    skills: Optional[List[str]] = None,
    difficulty: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
) -> Tuple[List[ProjectIdea], int]:
    """
    Search projects by query with optional filters and pagination.
    
    Args:
        query: Search query
        skills: Optional skills filter
        difficulty: Optional difficulty filter
        limit: Maximum number of results to return
        offset: Number of results to skip
        
    Returns:
        Tuple[List[ProjectIdea], int]: (projects, total_count)
    """
    try:
        projects_data = load_project_ideas()
        query_lower = query.lower()
        matching_projects = []
        
        for project_data in projects_data:
            # Search in title, description, and features
            title_match = query_lower in project_data.get("title", "").lower()
            description_match = query_lower in project_data.get("description", "").lower()
            features_match = any(query_lower in feature.lower() for feature in project_data.get("features", []))
            skills_match = any(query_lower in skill.lower() for skill in project_data.get("skills", []))
            
            if title_match or description_match or features_match or skills_match:
                matching_projects.append(project_data)
        
        # Apply difficulty filter
        if difficulty and difficulty in DIFFICULTIES:
            matching_projects = filter_projects_by_difficulty(matching_projects, difficulty)
        
        # Apply skills filter
        if skills:
            skills_normalized = {normalize_skill_name(skill) for skill in skills}
            filtered_projects = []
            
            for project in matching_projects:
                project_skills = project.get("skills", [])
                project_skills_normalized = {normalize_skill_name(skill) for skill in project_skills}
                
                # Include project if it uses any of the specified skills
                if skills_normalized.intersection(project_skills_normalized):
                    filtered_projects.append(project)
            
            matching_projects = filtered_projects
        
        total_count = len(matching_projects)
        
        # Apply pagination
        paginated_projects = matching_projects[offset:offset + limit]
        
        # Convert to ProjectIdea objects
        project_ideas = [ProjectIdea(**project_data) for project_data in paginated_projects]
        
        logger.info(f"Search for '{query}' found {total_count} projects, returning {len(project_ideas)}")
        return project_ideas, total_count
        
    except Exception as e:
        logger.error(f"Error searching projects with query '{query}': {e}")
        return [], 0


async def get_all_projects(
    difficulty: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[ProjectIdea], int]:
    """
    Get all projects with optional filtering and pagination.
    
    Args:
        difficulty: Optional difficulty filter
        limit: Maximum number of results to return
        offset: Number of results to skip
        
    Returns:
        Tuple[List[ProjectIdea], int]: (projects, total_count)
    """
    try:
        projects_data = load_project_ideas()
        
        # Apply difficulty filter
        if difficulty and difficulty in DIFFICULTIES:
            projects_data = filter_projects_by_difficulty(projects_data, difficulty)
        
        total_count = len(projects_data)
        
        # Apply pagination
        paginated_projects = projects_data[offset:offset + limit]
        
        # Convert to ProjectIdea objects
        project_ideas = [ProjectIdea(**project_data) for project_data in paginated_projects]
        
        logger.info(f"Retrieved {len(project_ideas)} projects (total: {total_count})")
        return project_ideas, total_count
        
    except Exception as e:
        logger.error(f"Error getting all projects: {e}")
        return [], 0
