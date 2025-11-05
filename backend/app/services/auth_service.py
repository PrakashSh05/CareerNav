from typing import Optional, List
from fastapi import HTTPException, status
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import UserCreate, UserUpdate, UserResponse
from app.services.skill_extractor import skill_extractor
from beanie.exceptions import RevisionIdWasChanged
from pymongo.errors import DuplicateKeyError
import logging

logger = logging.getLogger(__name__)


class AuthService:
    
    @staticmethod
    async def create_user(user_data: UserCreate) -> User:
        """Create a new user"""
        try:
            # Normalize email to lowercase
            email = user_data.email.lower()
            
            # Check if user already exists
            existing_user = await User.find_one(User.email == email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Hash the password
            hashed_password = hash_password(user_data.password)
            
            # Create user document
            user = User(
                email=email,
                hashed_password=hashed_password,
                full_name=user_data.full_name,
                skills=user_data.skills,
                target_roles=user_data.target_roles,
                experience_level=user_data.experience_level,
                location=user_data.location
            )
            
            # Normalize skills if provided
            if user_data.skills:
                normalized_skills = []
                for skill in user_data.skills:
                    if skill:
                        # Apply the same canonical mapping used for technology slugs
                        canonical = skill_extractor.SKILL_CANONICAL_MAP.get(skill.lower().strip(), skill.lower().strip())
                        if canonical not in normalized_skills:
                            normalized_skills.append(canonical)
                user.skills = normalized_skills
            
            # Save to database
            try:
                await user.insert()
            except DuplicateKeyError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            logger.info(f"User created successfully: {user.email}")
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error creating user"
            )
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        try:
            # Normalize email to lowercase
            email = email.lower()
            user = await User.find_one(User.email == email)
            if not user:
                return None
            
            if not verify_password(password, user.hashed_password):
                return None
            
            return user
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email"""
        try:
            # Normalize email to lowercase
            email = email.lower()
            return await User.find_one(User.email == email)
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by ID"""
        try:
            return await User.get(user_id)
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    @staticmethod
    async def update_user_profile(user: User, update_data: UserUpdate) -> User:
        """Update user profile"""
        try:
            # Prepare update data (exclude None values)
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            
            if not update_dict:
                return user
            
            # Normalize skills if they're being updated
            if 'skills' in update_dict and update_dict['skills']:
                normalized_skills = []
                for skill in update_dict['skills']:
                    if skill:
                        # Apply the same canonical mapping used for technology slugs
                        canonical = skill_extractor.SKILL_CANONICAL_MAP.get(skill.lower().strip(), skill.lower().strip())
                        if canonical not in normalized_skills:
                            normalized_skills.append(canonical)
                update_dict['skills'] = normalized_skills
            
            # Update user profile
            await user.update_profile(**update_dict)
            
            logger.info(f"User profile updated successfully: {user.email}")
            return user
            
        except RevisionIdWasChanged:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User data was modified by another request. Please try again."
            )
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error updating user profile"
            )
    
    @staticmethod
    def create_user_token(user: User) -> str:
        """Create access token for user"""
        return create_access_token(data={"sub": str(user.id)})


# Create service instance
auth_service = AuthService()
