from pydantic import BaseModel, EmailStr, Field, field_validator, field_serializer, ConfigDict
from typing import List, Optional, Any
from datetime import datetime
from bson import ObjectId


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    full_name: str = Field(..., min_length=2, max_length=100)
    skills: List[str] = Field(default_factory=list)
    target_roles: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = None
    location: Optional[str] = None
    
    @field_validator("password", mode="before")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
    
    @field_validator("experience_level", mode="before")
    def validate_experience_level(cls, v):
        valid_levels = [
            "12th Pass Out",
            "1st Year",
            "2nd Year",
            "3rd Year",
            "4th Year",
        ]
        if v and v not in valid_levels:
            raise ValueError(
                "Experience level must be one of: 12th Pass Out, 1st Year, 2nd Year, 3rd Year, 4th Year"
            )
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    skills: List[str]
    target_roles: List[str]
    experience_level: Optional[str]
    location: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer("id")
    def serialize_id(self, v: Any):
        return str(v)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    skills: Optional[List[str]] = None
    target_roles: Optional[List[str]] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    
    @field_validator("experience_level", mode="before")
    def validate_experience_level(cls, v):
        valid_levels = [
            "12th Pass Out",
            "1st Year",
            "2nd Year",
            "3rd Year",
            "4th Year",
        ]
        if v and v not in valid_levels:
            raise ValueError(
                "Experience level must be one of: 12th Pass Out, 1st Year, 2nd Year, 3rd Year, 4th Year"
            )
        return v
