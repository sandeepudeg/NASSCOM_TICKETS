"""
Unit tests for audit log archival script.

Requirements: 28.3
"""
import pytest
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch, call
from uuid import uuid4


@pytest.mark.asyncio
async def test_fetch_logs_to_archive():
    """Test fetching audit logs older than cutoff date."""
    from scripts.archive_audit_logs import fetch_logs_to_archive
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=365)
    
    # Mock database session
    mock_session = AsyncMock()
    mock_result = MagicMock()
    
    # Create mock rows
    mock_rows = [
        (
            str(uuid4()),
            "user-1",
            "folder_create",
            str(uuid4()),
            datetime.now(timezone.utc) - timedelta(days=400),
            "192.168.1.1",
            '{"folder_name": "test"}',
        ),
        (
            str(uuid4()),
            "user-2",
            "ticket_assign",
            str(uuid4()),
            datetime.now(timezone.utc) - timedelta(days=380),
            "192.168.1.2",
            '{"ticket_id": "abc"}',
        ),
    ]
    
    mock_result.fetchall.return_value = mock_rows
    mock_session.execute.return_value = mock_result
    
    # Execute
    logs = await fetch_logs_to_archive(mock_session, cutoff_date)
    
    # Verify
    assert len(logs) == 2
    assert logs[0]["actor_user_id"] == "user-1"
    assert logs[0]["action_type"] == "folder_create"
    assert logs[1]["actor_user_id"] == "user-2"
    assert logs[1]["action_type"] == "ticket_assign"


@pytest.mark.asyncio
async def test_delete_archived_logs():
    """Test deleting archived logs from database."""
    from scripts.archive_audit_logs import delete_archived_logs
    
    # Mock database session
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.rowcount = 5
    mock_session.execute.return_value = mock_result
    
    log_ids = [str(uuid4()) for _ in range(5)]
    
    # Execute
    deleted_count = await delete_archived_logs(mock_session, log_ids)
    
    # Verify
    assert deleted_count == 5
    assert mock_session.execute.call_count == 2  # SET row_security + DELETE


@pytest.mark.asyncio
async def test_delete_archived_logs_empty_list():
    """Test deleting with empty log ID list returns 0."""
    from scripts.archive_audit_logs import delete_archived_logs
    
    mock_session = AsyncMock()
    
    # Execute
    deleted_count = await delete_archived_logs(mock_session, [])
    
    # Verify
    assert deleted_count == 0
    assert mock_session.execute.call_count == 0


def test_upload_to_minio():
    """Test uploading audit logs to MinIO."""
    from scripts.archive_audit_logs import upload_to_minio
    
    # Mock MinIO client
    mock_client = MagicMock()
    mock_client.put_object.return_value = None
    
    # Create test logs
    logs = [
        {
            "id": str(uuid4()),
            "actor_user_id": "user-1",
            "action_type": "folder_create",
            "target_resource_id": str(uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_ip": "192.168.1.1",
            "metadata_json": '{"test": "data"}',
        }
    ]
    
    archive_date = datetime.now(timezone.utc)
    
    # Execute
    object_name = upload_to_minio(mock_client, "audit-archive", logs, archive_date)
    
    # Verify
    assert object_name.startswith("archive/audit_logs_")
    assert object_name.endswith(".json")
    assert mock_client.put_object.called
    
    # Verify the uploaded data structure
    call_args = mock_client.put_object.call_args
    assert call_args[0][0] == "audit-archive"  # bucket name
    assert call_args[0][1] == object_name  # object name
    assert call_args[1]["content_type"] == "application/json"


def test_ensure_bucket_exists_creates_bucket():
    """Test bucket creation when it doesn't exist."""
    from scripts.archive_audit_logs import ensure_bucket_exists
    
    mock_client = MagicMock()
    mock_client.bucket_exists.return_value = False
    
    # Execute
    ensure_bucket_exists(mock_client, "test-bucket")
    
    # Verify
    mock_client.bucket_exists.assert_called_once_with("test-bucket")
    mock_client.make_bucket.assert_called_once_with("test-bucket")


def test_ensure_bucket_exists_skips_existing():
    """Test bucket creation is skipped when bucket exists."""
    from scripts.archive_audit_logs import ensure_bucket_exists
    
    mock_client = MagicMock()
    mock_client.bucket_exists.return_value = True
    
    # Execute
    ensure_bucket_exists(mock_client, "test-bucket")
    
    # Verify
    mock_client.bucket_exists.assert_called_once_with("test-bucket")
    mock_client.make_bucket.assert_not_called()


@pytest.mark.asyncio
async def test_archive_audit_logs_workflow():
    """Test archival workflow components are called correctly."""
    from scripts.archive_audit_logs import archive_audit_logs
    
    # This test verifies the workflow calls the right functions
    # Full integration testing requires a real database
    
    with patch("scripts.archive_audit_logs.create_async_engine") as mock_engine, \
         patch("scripts.archive_audit_logs.get_minio_client") as mock_minio, \
         patch("scripts.archive_audit_logs.ensure_bucket_exists") as mock_ensure, \
         patch("scripts.archive_audit_logs.fetch_logs_to_archive") as mock_fetch, \
         patch("scripts.archive_audit_logs.upload_to_minio") as mock_upload:
        
        # Setup mocks - return empty logs to avoid transaction complexity
        mock_session = AsyncMock()
        mock_fetch.return_value = []  # No logs to archive
        
        mock_engine_instance = AsyncMock()
        mock_engine_instance.dispose = AsyncMock()
        mock_engine.return_value = mock_engine_instance
        
        # Mock session context manager
        mock_session_maker = MagicMock()
        mock_session_maker.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_maker.return_value.__aexit__ = AsyncMock()
        
        with patch("scripts.archive_audit_logs.sessionmaker", return_value=mock_session_maker):
            # Execute
            stats = await archive_audit_logs()
        
        # Verify workflow was called
        mock_minio.assert_called_once()
        mock_ensure.assert_called_once()
        mock_fetch.assert_called_once()
        
        # Verify stats for no logs case
        assert stats["logs_archived"] == 0
        assert stats["logs_deleted"] == 0
        assert stats["minio_object"] is None


@pytest.mark.asyncio
async def test_archive_audit_logs_no_logs():
    """Test archival when no logs need archiving."""
    from scripts.archive_audit_logs import archive_audit_logs
    
    with patch("scripts.archive_audit_logs.create_async_engine") as mock_engine, \
         patch("scripts.archive_audit_logs.get_minio_client") as mock_minio, \
         patch("scripts.archive_audit_logs.ensure_bucket_exists") as mock_ensure, \
         patch("scripts.archive_audit_logs.fetch_logs_to_archive") as mock_fetch:
        
        # Setup mocks
        mock_session = AsyncMock()
        mock_fetch.return_value = []  # No logs to archive
        
        mock_engine_instance = AsyncMock()
        mock_engine_instance.dispose = AsyncMock()
        mock_engine.return_value = mock_engine_instance
        
        # Mock session context manager
        mock_session_maker = MagicMock()
        mock_session_maker.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_maker.return_value.__aexit__ = AsyncMock()
        
        with patch("scripts.archive_audit_logs.sessionmaker", return_value=mock_session_maker):
            # Execute
            stats = await archive_audit_logs()
        
        # Verify
        assert stats["logs_archived"] == 0
        assert stats["logs_deleted"] == 0
        assert stats["minio_object"] is None
