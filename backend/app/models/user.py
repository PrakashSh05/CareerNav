from beanie import Document, Indexed
from pydantic import EmailStr, Field
from typing import List, Optional
from datetime import datetime
from pymongo import IndexModel


class User(Document):
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    full_name: str
    skills: List[str] = Field(default_factory=list)
    target_roles: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = None  # e.g., "Entry", "Mid", "Senior"
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "users"
        indexes = [
            IndexModel([("email", 1)], unique=True),
            IndexModel([("created_at", -1)]),
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.utcnow()
    
    async def update_profile(self, **kwargs):
        """Update user profile with new data"""
        for key, value in kwargs.items():
            if hasattr(self, key) and key not in ["id", "email", "hashed_password", "created_at"]:
                setattr(self, key, value)
        
        self.update_timestamp()
        await self.save()
    
    def dict_exclude_password(self):
        """Return user dict without password"""
        user_dict = self.dict()
        user_dict.pop("hashed_password", None)
        return user_dict
