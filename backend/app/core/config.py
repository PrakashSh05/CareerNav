from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=False)
    
    # MongoDB Configuration
    mongodb_uri: str = "mongodb://localhost:27017/career_navigator"
    
    # JWT Configuration
    jwt_secret_key: str = "your-super-secret-jwt-key-here-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    
    # Application Configuration
    app_name: str = "Career Navigator API"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # CORS Configuration
    allowed_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # TheirStack API Configuration
    their_stack_api_key: str
    their_stack_base_url: str = "https://api.theirstack.com"
    their_stack_timeout: int = 30
    their_stack_max_retries: int = 3
    their_stack_rate_limit: int = 300

    # Scheduler / Job Collection Configuration
    job_collection_schedule: str = "0 2 * * *"
    max_jobs_per_search: int = 100
    job_data_retention_days: int = 90
    job_collection_roles: List[str] | None = None
    job_collection_locations: List[str] | None = None

    @field_validator("allowed_origins", mode="before")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    @field_validator("job_collection_roles", "job_collection_locations", mode="before")
    def assemble_collection_lists(cls, v):
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, list):
            return [item.strip() for item in v if isinstance(item, str) and item.strip()]
        return []

    @field_validator("their_stack_api_key")
    def validate_api_key(cls, v: str):
        if not v or not v.strip():
            raise ValueError("THEIR_STACK_API_KEY must be provided")
        return v.strip()

    @field_validator(
        "their_stack_timeout",
        "their_stack_max_retries",
        "their_stack_rate_limit",
        "max_jobs_per_search",
        "job_data_retention_days",
        mode="before",
    )
    def ensure_positive_int(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.isdigit():
                v = int(v)
        if not isinstance(v, int) or v <= 0:
            raise ValueError("Configuration values must be positive integers")
        return v


# Create a global settings instance
settings = Settings()
