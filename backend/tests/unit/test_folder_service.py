import pytest
import asyncio
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

from src.services.folder_service import FolderService
from src.repositories.folder_repository import FolderRepository
from src.repositories.audit_repository import AuditLogRepository
from src.schemas.folder import FolderCreate, FolderUpdate
from src.schemas.errors import HTTPError


class TestFolderService:
    @pytest.fixture
    def mock_session(self):
        session = AsyncMock()
        session.flush = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        return session

    @pytest.fixture
    def folder_service(self, mock_session):
        return FolderService(mock_session)

    @pytest.mark.asyncio
    async def test_create_folder_success(self, folder_service, mock_session):
        folder_data = FolderCreate(name="Test Folder")
        owner_id = str(uuid4())

        with patch.object(
            FolderRepository, "get_by_name", new_callable=AsyncMock
        ) as mock_get:
            with patch.object(
                FolderRepository, "count_by_owner", new_callable=AsyncMock
            ) as mock_count:
                with patch.object(
                    FolderRepository, "create", new_callable=AsyncMock
                ) as mock_create:
                    mock_get.return_value = None
                    mock_count.return_value = 0

                    mock_folder = MagicMock()
                    mock_folder.id = str(uuid4())
                    mock_folder.name = "Test Folder"
                    mock_folder.owner_id = owner_id
                    mock_folder.version = 1
                    mock_folder.deleted_at = None
                    mock_folder.created_at = __import__('datetime').datetime.utcnow()
                    mock_folder.updated_at = __import__('datetime').datetime.utcnow()
                    mock_create.return_value = mock_folder

                    with patch.object(
                        AuditLogRepository, "create", new_callable=AsyncMock
                    ):
                        result = await folder_service.create_folder(
                            folder_data, owner_id
                        )

                        assert result.name == "Test Folder"
                        assert result.owner_id == owner_id

    @pytest.mark.asyncio
    async def test_create_folder_empty_name(self, folder_service):
        # Pydantic rejects empty string at schema level — test the service with whitespace-only name
        folder_data = FolderCreate(name="   ")  # whitespace-only, passes Pydantic min_length=1
        owner_id = str(uuid4())

        with pytest.raises(Exception) as exc_info:
            await folder_service.create_folder(folder_data, owner_id)

        assert "empty" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_create_folder_duplicate_name(self, folder_service, mock_session):
        folder_data = FolderCreate(name="Existing Folder")
        owner_id = str(uuid4())

        existing_folder = MagicMock()
        existing_folder.id = str(uuid4())

        with patch.object(
            FolderRepository, "get_by_name", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = existing_folder

            with pytest.raises(Exception) as exc_info:
                await folder_service.create_folder(folder_data, owner_id)

            assert (
                "already exists" in str(exc_info.value).lower()
                or "conflict" in str(exc_info.value).lower()
            )

    @pytest.mark.asyncio
    async def test_create_folder_html_injection(self, folder_service):
        folder_data = FolderCreate(name="<script>alert('xss')</script>")
        owner_id = str(uuid4())

        with pytest.raises(Exception) as exc_info:
            await folder_service.create_folder(folder_data, owner_id)

        assert (
            "invalid" in str(exc_info.value).lower()
            or "validation" in str(exc_info.value).lower()
        )

    @pytest.mark.asyncio
    async def test_create_folder_max_limit_exceeded(self, folder_service, mock_session):
        folder_data = FolderCreate(name="New Folder")
        owner_id = str(uuid4())

        with patch.object(
            FolderRepository, "get_by_name", new_callable=AsyncMock
        ) as mock_get:
            with patch.object(
                FolderRepository, "count_by_owner", new_callable=AsyncMock
            ) as mock_count:
                mock_get.return_value = None
                mock_count.return_value = 500

                with pytest.raises(Exception) as exc_info:
                    await folder_service.create_folder(folder_data, owner_id)

                assert "limit" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_rename_folder_success(self, folder_service, mock_session):
        folder_id = str(uuid4())
        folder_data = FolderUpdate(name="New Name", version=1)
        owner_id = str(uuid4())

        existing_folder = MagicMock()
        existing_folder.id = folder_id
        existing_folder.name = "Old Name"
        existing_folder.version = 1
        existing_folder.deleted_at = None

        with patch.object(
            FolderRepository, "get_by_id", new_callable=AsyncMock
        ) as mock_get:
            with patch.object(
                FolderRepository, "get_by_name", new_callable=AsyncMock
            ) as mock_get_name:
                with patch.object(
                    FolderRepository, "update", new_callable=AsyncMock
                ) as mock_update:
                    mock_get.return_value = existing_folder
                    mock_get_name.return_value = None

                    mock_updated = MagicMock()
                    mock_updated.id = folder_id
                    mock_updated.name = "New Name"
                    mock_updated.owner_id = owner_id
                    mock_updated.version = 2
                    mock_updated.deleted_at = None
                    mock_updated.created_at = __import__('datetime').datetime.utcnow()
                    mock_updated.updated_at = __import__('datetime').datetime.utcnow()
                    mock_update.return_value = mock_updated

                    with patch.object(
                        AuditLogRepository, "create", new_callable=AsyncMock
                    ):
                        result = await folder_service.rename_folder(
                            folder_id, folder_data, owner_id
                        )

                        assert result.name == "New Name"
                        assert result.version == 2

    @pytest.mark.asyncio
    async def test_rename_folder_version_conflict(self, folder_service):
        folder_id = str(uuid4())
        folder_data = FolderUpdate(name="New Name", version=1)
        owner_id = str(uuid4())

        existing_folder = MagicMock()
        existing_folder.version = 2

        with patch.object(
            FolderRepository, "get_by_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = existing_folder

            with pytest.raises(Exception) as exc_info:
                await folder_service.rename_folder(folder_id, folder_data, owner_id)

            assert (
                "conflict" in str(exc_info.value).lower()
                or "modified" in str(exc_info.value).lower()
                or "version" in str(exc_info.value).lower()
            )

    @pytest.mark.asyncio
    async def test_delete_folder_soft_delete(self, folder_service, mock_session):
        folder_id = str(uuid4())
        owner_id = str(uuid4())

        existing_folder = MagicMock()
        existing_folder.id = folder_id
        existing_folder.name = "To Delete"
        existing_folder.deleted_at = None

        with patch.object(
            FolderRepository, "get_by_id", new_callable=AsyncMock
        ) as mock_get:
            with patch.object(
                FolderRepository, "delete_folder_assignments", new_callable=AsyncMock
            ):
                with patch.object(
                    FolderRepository, "soft_delete", new_callable=AsyncMock
                ):
                    mock_get.return_value = existing_folder

                    await folder_service.delete_folder(folder_id, owner_id)

                    mock_session.delete.assert_not_called()
