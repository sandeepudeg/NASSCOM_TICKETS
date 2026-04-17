#!/usr/bin/env python3
"""
Soft-delete purge scheduled job for tickets-folder feature.

Physically removes soft-deleted folder records and their association history
older than 365 days. Runs daily at 3 AM via cron in Docker Compose.

Requirements: 23.9
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "purge-deleted", "event": "%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@postgres:5432/tickets_db")
RETENTION_DAYS = int(os.getenv("PURGE_RETENTION_DAYS", "365"))


async def purge_deleted_folders() -> dict:
    """
    Purge soft-deleted folders and their associations older than RETENTION_DAYS.
    
    Returns:
        dict: Statistics about the purge operation
    """
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    
    logger.info(f"purge_started", extra={
        "cutoff_date": cutoff_date.isoformat(),
        "retention_days": RETENTION_DAYS
    })
    
    stats = {
        "folders_purged": 0,
        "associations_purged": 0,
        "cutoff_date": cutoff_date.isoformat(),
    }
    
    try:
        async with async_session() as session:
            async with session.begin():
                # Find folders to purge (soft-deleted and older than retention period)
                find_folders_query = text("""
                    SELECT id FROM folders
                    WHERE deleted_at IS NOT NULL
                    AND deleted_at < :cutoff_date
                """)
                
                result = await session.execute(find_folders_query, {"cutoff_date": cutoff_date})
                folder_ids = [row[0] for row in result.fetchall()]
                
                if not folder_ids:
                    logger.info("purge_completed_no_folders")
                    return stats
                
                logger.info(f"purge_folders_found", extra={"count": len(folder_ids)})
                
                # Delete associations for these folders
                delete_associations_query = text("""
                    DELETE FROM ticket_folder_associations
                    WHERE folder_id = ANY(:folder_ids)
                """)
                
                associations_result = await session.execute(
                    delete_associations_query,
                    {"folder_ids": folder_ids}
                )
                stats["associations_purged"] = associations_result.rowcount
                
                logger.info(f"purge_associations_deleted", extra={
                    "count": stats["associations_purged"]
                })
                
                # Delete the folders themselves
                delete_folders_query = text("""
                    DELETE FROM folders
                    WHERE id = ANY(:folder_ids)
                """)
                
                folders_result = await session.execute(
                    delete_folders_query,
                    {"folder_ids": folder_ids}
                )
                stats["folders_purged"] = folders_result.rowcount
                
                logger.info(f"purge_folders_deleted", extra={
                    "count": stats["folders_purged"]
                })
                
                # Write audit log entry
                audit_query = text("""
                    INSERT INTO audit_log (
                        id,
                        actor_user_id,
                        action_type,
                        resource_id,
                        timestamp,
                        source_ip,
                        metadata
                    ) VALUES (
                        gen_random_uuid(),
                        NULL,
                        'purge_deleted_folders',
                        NULL,
                        :timestamp,
                        '127.0.0.1'::inet,
                        :metadata::jsonb
                    )
                """)
                
                await session.execute(audit_query, {
                    "timestamp": datetime.now(timezone.utc),
                    "metadata": {
                        "folders_purged": stats["folders_purged"],
                        "associations_purged": stats["associations_purged"],
                        "cutoff_date": cutoff_date.isoformat(),
                        "retention_days": RETENTION_DAYS,
                    }
                })
                
                logger.info("purge_completed_successfully", extra=stats)
                
    except Exception as e:
        logger.error(f"purge_failed", extra={
            "error": str(e),
            "error_type": type(e).__name__
        })
        stats["error"] = str(e)
        raise
    
    finally:
        await engine.dispose()
    
    return stats


async def main():
    """Main entry point for the purge script."""
    try:
        logger.info("purge_job_started")
        stats = await purge_deleted_folders()
        logger.info("purge_job_completed", extra=stats)
        sys.exit(0)
    except Exception as e:
        logger.error(f"purge_job_failed", extra={
            "error": str(e),
            "error_type": type(e).__name__
        })
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
