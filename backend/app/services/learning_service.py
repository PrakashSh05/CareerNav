import json
import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from cachetools import TTLCache
import re
from difflib import SequenceMatcher

from app.models.user import User
from app.schemas.learning import (
    LearningResource, SkillLearningPath, LearningRoadmapResponse,
    ResourceSearchResponse, ResourceType
)
from app.services.gap_service import analyze_skill_gap

# Cache for 1 hour to improve performance
cache = TTLCache(maxsize=100, ttl=3600)
logger = logging.getLogger(__name__)

# Constants for validation
RESOURCE_TYPES = {"Documentation", "Video", "Course", "Book"}


def load_learning_resources() -> Dict[str, List[Dict]]:
    """
    Load learning resources from JSON file with caching.
    
    Returns:
        Dict[str, List[Dict]]: Dictionary mapping skills to their resources
        
    Raises:
        HTTPException: If file cannot be loaded
    """
    cache_key = "learning_resources"
    if cache_key in cache:
        logger.info("Returning cached learning resources")
        return cache[cache_key]
    
    try:
        # Path to the learning resources JSON file
        resources_path = Path(__file__).parent.parent.parent / "learning_resources.json"
        
        with open(resources_path, 'r', encoding='utf-8') as file:
            resources_data = json.load(file)
        
        # Cache the loaded data
        cache[cache_key] = resources_data
        logger.info(f"Loaded learning resources for {len(resources_data)} skills")
        
        return resources_data
        
    except FileNotFoundError:
        logger.error(f"Learning resources file not found at {resources_path}")
        raise Exception("Learning resources data file not found")
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in learning resources file: {e}")
        raise Exception("Invalid learning resources data format")
    except Exception as e:
        logger.error(f"Error loading learning resources: {e}")
        raise Exception("Failed to load learning resources")


def normalize_skill_name(skill: str) -> str:
    """
    Normalize skill name for consistent matching.
    
    Args:
        skill: Raw skill name
        
    Returns:
        str: Normalized skill name (lowercase, stripped)
    """
    return skill.lower().strip()


def find_skill_resources(skill: str, resources_data: Dict[str, List[Dict]]) -> List[LearningResource]:
    """
    Find resources for a specific skill with fuzzy matching.
    
    Args:
        skill: Skill name to search for
        resources_data: Dictionary of all learning resources
        
    Returns:
        List[LearningResource]: List of resources for the skill
    """
    normalized_skill = normalize_skill_name(skill)
    
    best_match = None
    best_similarity = 0.0
    
    # First pass: look for exact matches while tracking closest partial match
    for skill_key, resources in resources_data.items():
        normalized_key = normalize_skill_name(skill_key)
        if normalized_key == normalized_skill:
            return [LearningResource(**resource) for resource in resources]
        
        # Compute similarity score for partial matches
        similarity = SequenceMatcher(None, normalized_skill, normalized_key).ratio()
        if normalized_key.startswith(normalized_skill) or normalized_skill.startswith(normalized_key):
            similarity = min(1.0, similarity + 0.1)
        
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = (skill_key, resources)
    
    # Use the closest partial match only if it's reasonably similar
    if best_match and best_similarity >= 0.7:
        skill_key, resources = best_match
        logger.info(
            "Found closest match for '%s': '%s' (similarity %.2f)",
            skill,
            skill_key,
            best_similarity,
        )
        return [LearningResource(**resource) for resource in resources]

    logger.warning(f"No resources found for skill: {skill}")
    return []


async def get_learning_roadmap(
    user: User,
    include_gap_analysis: bool = True,
    target_role: Optional[str] = None
) -> LearningRoadmapResponse:
    """
    Generate a personalized learning roadmap for the user.
    
    Args:
        user: User object with skills and target roles
        include_gap_analysis: Whether to include gap analysis for prioritization
        target_role: Specific target role to focus on (optional)
        
    Returns:
        LearningRoadmapResponse: Personalized learning roadmap
    """
    try:
        # Load learning resources
        resources_data = load_learning_resources()
        
        # Determine which role to analyze
        analysis_role = target_role
        if not analysis_role and user.target_roles:
            analysis_role = user.target_roles[0]  # Use first target role
        
        skill_paths = []
        missing_skills_count = 0
        coverage_percentage = None
        recommendations = []
        
        # Get gap analysis if requested and role is available
        gap_analysis = None
        if include_gap_analysis and analysis_role:
            try:
                # Use 10% threshold to include all skills appearing in at least 10% of jobs
                gap_analysis = await analyze_skill_gap(user, analysis_role, threshold=0.10)
                coverage_percentage = gap_analysis.coverage_percentage
                
                logger.info(f"Gap analysis for {analysis_role}: {len(gap_analysis.required_skills)} required skills, {len(gap_analysis.missing_skills)} missing")
                
                # Add recommendations based on gap analysis
                if gap_analysis.missing_skills:
                    recommendations.append(f"You're missing {len(gap_analysis.missing_skills)} key skills for {analysis_role}")
                    recommendations.append("Focus on high-demand skills first to maximize job opportunities")
                
                if coverage_percentage and coverage_percentage < 50:
                    recommendations.append("Consider starting with fundamental skills before advanced topics")
                elif coverage_percentage and coverage_percentage >= 80:
                    recommendations.append("You have strong skill coverage! Focus on building projects to demonstrate expertise")
                    
            except Exception as e:
                logger.error(f"Gap analysis failed for role '{analysis_role}': {e}", exc_info=True)
        
        # Create skill paths based on gap analysis or user's target roles
        skills_to_include = set()
        
        if gap_analysis and gap_analysis.required_skills:
            # Include skills from gap analysis with priority scores
            for skill_item in gap_analysis.required_skills:
                skills_to_include.add(skill_item.skill)
                
                resources = find_skill_resources(skill_item.skill, resources_data)
                if resources:
                    skill_path = SkillLearningPath(
                        skill=skill_item.skill,
                        resources=resources,
                        is_missing=not skill_item.user_has,
                        priority_score=skill_item.required_percentage
                    )
                    skill_paths.append(skill_path)
                    
                    if not skill_item.user_has:
                        missing_skills_count += 1
        else:
            # Fallback: include user's current skills and common skills
            user_skills = user.skills or []
            common_skills = ["Python", "JavaScript", "React", "Node.js", "MongoDB", "FastAPI"]
            
            all_skills = set(user_skills + common_skills)
            for skill in all_skills:
                skills_to_include.add(skill)
                
                resources = find_skill_resources(skill, resources_data)
                if resources:
                    is_missing = skill not in user_skills
                    skill_path = SkillLearningPath(
                        skill=skill,
                        resources=resources,
                        is_missing=is_missing,
                        priority_score=50.0 if is_missing else 25.0  # Default priority
                    )
                    skill_paths.append(skill_path)
                    
                    if is_missing:
                        missing_skills_count += 1
        
        # Sort skill paths by priority (missing skills with high priority first)
        skill_paths.sort(key=lambda x: (-x.priority_score if x.priority_score else 0, x.is_missing), reverse=True)
        
        # Add general recommendations
        if not recommendations:
            recommendations.append("Start with fundamental skills before moving to advanced topics")
            recommendations.append("Practice with real projects to reinforce your learning")
            recommendations.append("Join developer communities for support and networking")
        
        logger.info(f"Generated learning roadmap for user {user.email}: {len(skill_paths)} skills, {missing_skills_count} missing")
        
        return LearningRoadmapResponse(
            target_role=analysis_role,
            skill_paths=skill_paths,
            total_skills=len(skill_paths),
            missing_skills_count=missing_skills_count,
            coverage_percentage=coverage_percentage,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error generating learning roadmap for user {user.email}: {e}")
        # Return minimal roadmap on error
        return LearningRoadmapResponse(
            target_role=target_role,
            skill_paths=[],
            total_skills=0,
            missing_skills_count=0,
            coverage_percentage=None,
            recommendations=["Unable to generate personalized roadmap. Please try again later."]
        )


async def get_resources_for_skills(
    skills: List[str],
    resource_type: Optional[str] = None,
    search: Optional[str] = None
) -> List[LearningResource]:
    """
    Get learning resources for specific skills with optional filtering.
    
    Args:
        skills: List of skill names
        resource_type: Optional resource type filter
        search: Optional search query for resource content
        
    Returns:
        List[LearningResource]: Filtered list of resources
    """
    try:
        resources_data = load_learning_resources()
        all_resources = []
        
        for skill in skills:
            skill_resources = find_skill_resources(skill, resources_data)
            all_resources.extend(skill_resources)
        
        # Apply resource type filter
        if resource_type and resource_type in RESOURCE_TYPES:
            all_resources = [r for r in all_resources if r.type == resource_type]
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            filtered_resources = []
            for resource in all_resources:
                if (search_lower in resource.title.lower() or 
                    search_lower in resource.description.lower()):
                    filtered_resources.append(resource)
            all_resources = filtered_resources
        
        # Remove duplicates based on URL
        seen_urls = set()
        unique_resources = []
        for resource in all_resources:
            if resource.url not in seen_urls:
                seen_urls.add(resource.url)
                unique_resources.append(resource)
        
        logger.info(f"Found {len(unique_resources)} resources for skills: {skills}")
        return unique_resources
        
    except Exception as e:
        logger.error(f"Error getting resources for skills {skills}: {e}")
        return []


async def search_resources(
    query: str,
    resource_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
) -> Tuple[List[LearningResource], int]:
    """
    Search learning resources by query with pagination.
    
    Args:
        query: Search query
        resource_type: Optional resource type filter
        limit: Maximum number of results to return
        offset: Number of results to skip
        
    Returns:
        Tuple[List[LearningResource], int]: (resources, total_count)
    """
    try:
        resources_data = load_learning_resources()
        all_resources = []
        query_lower = query.lower()
        
        # Search across all skills and resources
        for skill, resources in resources_data.items():
            skill_lower = skill.lower()
            
            # Check if query matches skill name
            skill_matches = query_lower in skill_lower
            
            for resource_data in resources:
                resource = LearningResource(**resource_data)
                
                # Check if query matches resource content
                content_matches = (
                    query_lower in resource.title.lower() or
                    query_lower in resource.description.lower()
                )
                
                if skill_matches or content_matches:
                    all_resources.append(resource)
        
        # Apply resource type filter
        if resource_type and resource_type in RESOURCE_TYPES:
            all_resources = [r for r in all_resources if r.type == resource_type]
        
        # Remove duplicates
        seen_urls = set()
        unique_resources = []
        for resource in all_resources:
            if resource.url not in seen_urls:
                seen_urls.add(resource.url)
                unique_resources.append(resource)
        
        total_count = len(unique_resources)
        
        # Apply pagination
        paginated_resources = unique_resources[offset:offset + limit]
        
        logger.info(f"Search for '{query}' found {total_count} resources, returning {len(paginated_resources)}")
        return paginated_resources, total_count
        
    except Exception as e:
        logger.error(f"Error searching resources with query '{query}': {e}")
        return [], 0
