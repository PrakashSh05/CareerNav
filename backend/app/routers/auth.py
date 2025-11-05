from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, UserUpdate
from app.services.auth_service import auth_service
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.user_job_collection_service import UserJobCollectionService
from app.services.job_collection_service import JobCollectionService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await auth_service.create_user(user_data)
        return UserResponse(**user.dict_exclude_password())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    """Login user and return access token"""
    try:
        user = await auth_service.authenticate_user(
            user_credentials.email, 
            user_credentials.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = auth_service.create_user_token(user)
        user_response = UserResponse(**user.dict_exclude_password())
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/login/form", response_model=Token)
async def login_user_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user with form data (OAuth2 compatible)"""
    try:
        user = await auth_service.authenticate_user(form_data.username, form_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = auth_service.create_user_token(user)
        user_response = UserResponse(**user.dict_exclude_password())
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Form login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return UserResponse(**current_user.dict_exclude_password())


async def collect_jobs_for_new_roles(user_id: str, new_roles: list):
    """
    Background task to collect jobs for newly added target roles.
    This runs asynchronously so the user doesn't have to wait.
    """
    try:
        logger.info(f"Background job collection triggered for user {user_id}, new roles: {new_roles}")
        
        from app.core.config import settings
        collection_service = JobCollectionService()
        
        # Get user to determine location
        user = await User.get(user_id)
        if not user:
            logger.error(f"User {user_id} not found")
            return
        
        # Use user's location if available, otherwise use config
        locations = [user.location] if user.location else settings.job_collection_locations
        
        # ⚡ KEY FIX: Collect ONLY for the NEW roles, not all user roles!
        summary = await collection_service.collect_jobs_for_roles(
            roles=new_roles,  # ← Only collect for NEW roles!
            locations=locations,
            max_age_days=90,  # Increased to 90 days to find more jobs
            per_role_limit=5,  # 5 jobs per role
        )
        
        logger.info(f"Background job collection completed for user {user_id}: {summary}")
    except Exception as e:
        logger.error(f"Error in background job collection for user {user_id}: {e}")


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Update current user profile"""
    try:
        # Track old target roles before update
        old_target_roles = set(current_user.target_roles or [])
        
        # Update user profile
        updated_user = await auth_service.update_user_profile(current_user, update_data)
        
        # Check if target_roles were added
        new_target_roles = set(updated_user.target_roles or [])
        added_roles = new_target_roles - old_target_roles
        
        if added_roles:
            # Trigger background job collection for new roles
            logger.info(f"User {updated_user.email} added new target roles: {added_roles}")
            background_tasks.add_task(
                collect_jobs_for_new_roles,
                str(updated_user.id),
                list(added_roles)
            )
        
        return UserResponse(**updated_user.dict_exclude_password())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )
