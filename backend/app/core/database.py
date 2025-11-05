from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.user import User
from app.models.job_posting import JobPosting
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    database = None


db = Database()


async def connect_to_mongo():
    """Create database connection"""
    try:
        db.client = AsyncIOMotorClient(settings.mongodb_uri)
        db.database = db.client.get_default_database()
        
        # Initialize Beanie with the User and JobPosting models
        await init_beanie(
            database=db.database,
            document_models=[User, JobPosting]
        )
        
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    try:
        if db.client:
            db.client.close()
            logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Error disconnecting from MongoDB: {e}")


async def get_database():
    """Get database instance"""
    return db.database
