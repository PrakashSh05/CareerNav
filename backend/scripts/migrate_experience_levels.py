"""Migration script to update user experience levels.

This script maps legacy experience level values to the new academic journey
labels required by the product update (12th Pass Out, 1st Year, etc.).

Usage:
    python -m scripts.migrate_experience_levels

The script will:
1. Connect to MongoDB using the standard app configuration.
2. Locate all users whose `experience_level` field contains any of the legacy
   labels (Entry, Mid, Senior, Lead, Executive).
3. Update those documents to the new labels.
4. Print a summary of the migration.
"""

import asyncio
import logging
from typing import Dict

from app.core.database import connect_to_mongo
from app.models.user import User

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Mapping from legacy labels to new academic stages
EXPERIENCE_LEVEL_MAP: Dict[str, str] = {
    "Entry": "12th Pass Out",
    "Mid": "1st Year",
    "Senior": "2nd Year",
    "Lead": "3rd Year",
    "Executive": "4th Year",
}


async def migrate_experience_levels():
    """Update existing users to the new experience level taxonomy."""
    logger.info("Starting experience level migration...")

    await connect_to_mongo()
    logger.info("Connected to MongoDB")

    legacy_levels = list(EXPERIENCE_LEVEL_MAP.keys())

    users_to_update = await User.find({
        "experience_level": {"$in": legacy_levels}
    }).to_list()

    total = len(users_to_update)
    if total == 0:
        logger.info("No users found with legacy experience levels. Nothing to do.")
        return

    logger.info("Found %d users with legacy experience levels", total)

    updated = 0
    for user in users_to_update:
        old_level = user.experience_level
        new_level = EXPERIENCE_LEVEL_MAP.get(old_level)
        if not new_level:
            continue

        user.experience_level = new_level
        await user.save()
        updated += 1
        logger.debug("Updated %s from %s to %s", user.email, old_level, new_level)

    logger.info("Experience level migration complete")
    logger.info("Total users processed: %d", total)
    logger.info("Users updated: %d", updated)


async def verify_results():
    """Provide a quick summary of the new distribution."""
    logger.info("\nVerifying experience level distribution...")

    counts = {}
    for new_level in EXPERIENCE_LEVEL_MAP.values():
        counts[new_level] = await User.find({"experience_level": new_level}).count()

    for level, count in counts.items():
        logger.info("%s: %d", level, count)


async def main():
    await migrate_experience_levels()
    await verify_results()


if __name__ == "__main__":
    asyncio.run(main())
