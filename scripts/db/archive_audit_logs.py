#!/usr/bin/env python3
"""
Audit log archival job for tickets-folder feature.

Moves audit_log entries older than 12 months to MinIO audit-archive/ bucket.
Archived logs are retained for 5 years (60 months total retention).

Runs monthly via cron in Docker Compose.

Requirements: 28.3
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "archive-audit-logs", "event": "%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@postgres:5432/tickets_db"
)
ARCHIVE_RETENTION_MONTHS = int(os.getenv("AUDIT_ARCHIVE_RETENTION_MONTHS", "12"))

# MinIO configuration
MINIO_ENDPOINT = os.getenv("OBJECT_STORAGE_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("OBJECT_STORAGE_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("OBJECT_STORAGE_SECRET_KEY", "minioadmin")
MINIO_BUCKET = "audit-archive"


def get_minio_client():
    """Create and return a MinIO client."""
    try:
        from minio import Minio
    except ImportError:
        logger.error("minio package not installed. Install with: pip install minio")
        sys.exit(1)

    # Remove http:// or https:// prefix from endpoint
    endpoint = MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
    use_ssl = MINIO_ENDPOINT.startswith("https://")

    logger.info(f"Connecting to MinIO at {endpoint} (SSL: {use_ssl})")

    return Minio(
        endpoint,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=use_ssl,
    )


def ensure_bucket_exists(client, bucket_name: str) -> None:
    """Ensure the MinIO bucket exists, create if it doesn't."""
    try:
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            logger.info(f"Created bucket: {bucket_name}")
        else:
            logger.info(f"Bucket already exists: {bucket_name}")
    except Exception as e:
        logger.error(f"Failed to ensure bucket exists: {e}")
        raise


async def fetch_logs_to_archive(
    session: AsyncSession, cutoff_date: datetime
) -> List[Dict[str, Any]]:
    """
    Fetch audit log entries older than cutoff_date.

    Args:
        session: Database session
        cutoff_date: Archive logs older than this date

    Returns:
        List of audit log records as dictionaries
    """
    query = text("""
        SELECT 
            id,
            actor_user_id,
            action_type,
            target_resource_id,
            timestamp,
            source_ip,
            metadata_json
        FROM audit_log
        WHERE timestamp < :cutoff_date
        ORDER BY timestamp ASC
    """)

    result = await session.execute(query, {"cutoff_date": cutoff_date})
    rows = result.fetchall()

    logs = []
    for row in rows:
        logs.append(
            {
                "id": row[0],
                "actor_user_id": row[1],
                "action_type": row[2],
                "target_resource_id": row[3],
                "timestamp": row[4].isoformat() if row[4] else None,
                "source_ip": row[5],
                "metadata_json": row[6],
            }
        )

    return logs


async def delete_archived_logs(session: AsyncSession, log_ids: List[str]) -> int:
    """
    Delete audit log entries that have been archived.

    Note: This operation requires special privileges as audit_log has RLS.
    The deletion is performed by the archival job which runs with elevated privileges.

    Args:
        session: Database session
        log_ids: List of audit log IDs to delete

    Returns:
        Number of rows deleted
    """
    if not log_ids:
        return 0

    # Disable RLS for this session to allow deletion
    # This is safe because the archival job runs with controlled privileges
    await session.execute(text("SET LOCAL row_security = off"))

    query = text("""
        DELETE FROM audit_log
        WHERE id = ANY(:log_ids)
    """)

    result = await session.execute(query, {"log_ids": log_ids})
    return result.rowcount


def upload_to_minio(
    client, bucket_name: str, logs: List[Dict[str, Any]], archive_date: datetime
) -> str:
    """
    Upload audit logs to MinIO as a JSON file.

    Args:
        client: MinIO client
        bucket_name: Target bucket name
        logs: List of audit log records
        archive_date: Date of archival (used in filename)

    Returns:
        Object name in MinIO
    """
    import io

    # Create filename with timestamp
    filename = f"audit_logs_{archive_date.strftime('%Y%m%d_%H%M%S')}.json"
    object_name = f"archive/{filename}"

    # Convert logs to JSON
    json_data = json.dumps(
        {
            "archived_at": archive_date.isoformat(),
            "record_count": len(logs),
            "logs": logs,
        },
        indent=2,
    )

    # Upload to MinIO
    data_bytes = json_data.encode("utf-8")
    data_stream = io.BytesIO(data_bytes)

    client.put_object(
        bucket_name,
        object_name,
        data_stream,
        length=len(data_bytes),
        content_type="application/json",
    )

    logger.info(f"Uploaded {len(logs)} logs to {bucket_name}/{object_name}")
    return object_name


async def archive_audit_logs() -> Dict[str, Any]:
    """
    Archive audit logs older than ARCHIVE_RETENTION_MONTHS to MinIO.

    Returns:
        dict: Statistics about the archival operation
    """
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    cutoff_date = datetime.now(timezone.utc) - timedelta(
        days=ARCHIVE_RETENTION_MONTHS * 30
    )
    archive_date = datetime.now(timezone.utc)

    logger.info(
        "archive_started",
        extra={
            "cutoff_date": cutoff_date.isoformat(),
            "retention_months": ARCHIVE_RETENTION_MONTHS,
        },
    )

    stats = {
        "logs_archived": 0,
        "logs_deleted": 0,
        "cutoff_date": cutoff_date.isoformat(),
        "archive_date": archive_date.isoformat(),
        "minio_object": None,
    }

    try:
        # Initialize MinIO client
        minio_client = get_minio_client()
        ensure_bucket_exists(minio_client, MINIO_BUCKET)

        async with async_session() as session:
            # Fetch logs to archive
            logs = await fetch_logs_to_archive(session, cutoff_date)

            if not logs:
                logger.info("archive_completed_no_logs")
                return stats

            logger.info("archive_logs_found", extra={"count": len(logs)})
            stats["logs_archived"] = len(logs)

            # Upload to MinIO
            object_name = upload_to_minio(
                minio_client, MINIO_BUCKET, logs, archive_date
            )
            stats["minio_object"] = object_name

            # Delete archived logs from database
            async with session.begin():
                log_ids = [log["id"] for log in logs]
                deleted_count = await delete_archived_logs(session, log_ids)
                stats["logs_deleted"] = deleted_count

                logger.info("archive_logs_deleted", extra={"count": deleted_count})

                # Write audit log entry for the archival operation
                # Note: This creates a new audit entry that will be archived in the next cycle
                audit_query = text("""
                    INSERT INTO audit_log (
                        id,
                        actor_user_id,
                        action_type,
                        target_resource_id,
                        timestamp,
                        source_ip,
                        metadata_json
                    ) VALUES (
                        gen_random_uuid()::text,
                        'system',
                        'audit_log_archive',
                        :minio_object,
                        :timestamp,
                        '127.0.0.1',
                        :metadata::jsonb
                    )
                """)

                await session.execute(
                    audit_query,
                    {
                        "minio_object": object_name,
                        "timestamp": archive_date,
                        "metadata": json.dumps(
                            {
                                "logs_archived": stats["logs_archived"],
                                "logs_deleted": stats["logs_deleted"],
                                "cutoff_date": cutoff_date.isoformat(),
                                "retention_months": ARCHIVE_RETENTION_MONTHS,
                            }
                        ),
                    },
                )

                logger.info("archive_completed_successfully", extra=stats)

    except Exception as e:
        logger.error(
            "archive_failed", extra={"error": str(e), "error_type": type(e).__name__}
        )
        stats["error"] = str(e)
        raise

    finally:
        await engine.dispose()

    return stats


async def main():
    """Main entry point for the archival script."""
    try:
        logger.info("archive_job_started")
        stats = await archive_audit_logs()
        logger.info("archive_job_completed", extra=stats)
        sys.exit(0)
    except Exception as e:
        logger.error(
            "archive_job_failed",
            extra={"error": str(e), "error_type": type(e).__name__},
        )
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
