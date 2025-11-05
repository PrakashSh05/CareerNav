import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
import sys

# Add the current directory to path
sys.path.append(os.getcwd())

from app.models.user import User
from app.models.job_posting import JobPosting
from app.services.job_collection_service import JobCollectionService
from app.services.user_job_collection_service import UserJobCollectionService
from app.core.config import settings

async def main():
    client = None
    try:
        # Initialize MongoDB
        client = AsyncIOMotorClient(settings.mongodb_uri)
        database = client.get_database()
        await init_beanie(database=database, document_models=[User, JobPosting])
        
        # Get all users with target roles
        users = await User.find({"target_roles": {"$exists": True, "$ne": []}}).to_list()
        print(f"🎯 Found {len(users)} users with target roles")
        
        if not users:
            print("No users with target roles found")
            return

        # Initialize services
        collection_service = JobCollectionService()
        user_collection_service = UserJobCollectionService(collection_service)
        
        total_collected = 0
        
        for user in users:
            try:
                print(f"\n👤 Processing user: {user.email}")
                print(f"   🎯 Target roles: {', '.join(user.target_roles) if user.target_roles else 'None'}")
                
                # Collect jobs
                summary = await user_collection_service.collect_jobs_for_user(
                    user_id=str(user.id),
                    max_age_days=14,
                    jobs_per_role=5
                )
                
                if summary:
                    user_total = sum(role_stats.get('jobs_collected', 0) for role_stats in summary.values())
                    total_collected += user_total
                    print(f"   ✅ Collected {user_total} jobs:")
                    for role, stats in summary.items():
                        print(f"      • {role}: {stats.get('jobs_collected', 0)} jobs")
                else:
                    print("   ℹ️ No new jobs found or all roles have fresh data")
            
            except Exception as e:
                print(f"   ❌ Error processing user {user.email}: {str(e)}")
                continue
        
        print(f"\n✨ Job collection complete! Total jobs collected: {total_collected}")
                
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        raise
    finally:
        if client:
            client.close()  # Close without await for sync client
            print("Database connection closed")

if __name__ == "__main__":
    print("🚀 Starting job collection for ALL users...")
    asyncio.run(main())