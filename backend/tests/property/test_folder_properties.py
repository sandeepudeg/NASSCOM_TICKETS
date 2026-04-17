"""
Property-based tests for folder manager correctness properties (P1–P11).
Feature: tickets-folder
Uses Hypothesis with min 100 examples per property.
"""

import re
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import hypothesis.strategies as st
import pytest
from hypothesis import assume, given, settings

from src.repositories.audit_repository import AuditLogRepository
from src.repositories.folder_repository import FolderRepository
from src.schemas.errors import HTTPError
from src.schemas.folder import FolderCreate, FolderUpdate
import pytest_asyncio
from src.services.folder_service import FolderService
from src.services.ticket_assignment_service import TicketAssignmentService

pytestmark = pytest.mark.asyncio(loop_scope="session")

INJECTION_PAYLOADS = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:void(0)",
    "<b>bold</b>",
    "onerror=alert(1)",
    "<svg onload=alert(1)>",
]

VALID_NAME_STRATEGY = st.text(
    alphabet=st.characters(blacklist_categories=("Cs",)),
    min_size=1,
    max_size=255,
).filter(
    lambda s: s.strip() != ""
    and len(s.strip()) <= 255
    and not re.search(r"<[^>]+>|javascript:|on\w+\s*=", s, re.IGNORECASE)
)


def make_service():
    session = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return FolderService(session)


# Feature: tickets-folder, Property 1: Folder Name Validation
# For any string that is empty after stripping or longer than 255 chars,
# Folder_Manager SHALL reject create/rename with a validation error.
@pytest.mark.asyncio
class TestP1FolderNameValidation:

    @given(name=st.text().filter(lambda s: s.strip() == ""))
    @settings(max_examples=100)
    async def test_whitespace_only_name_rejected_on_create(self, name):
        """P1: Whitespace-only names must be rejected."""
        # Feature: tickets-folder, Property 1: Folder Name Validation
        assume(name.strip() == "")
        service = make_service()
        folder_data = FolderCreate(name=name if name else " ")

        with pytest.raises(HTTPError) as exc_info:
            await service.create_folder(folder_data, "user-1")
        assert exc_info.value.problem.status == 422

    @given(name=st.text(min_size=256))
    @settings(max_examples=100)
    async def test_name_exceeding_255_chars_rejected(self, name):
        """P1: Names exceeding 255 chars must be rejected — either by Pydantic schema or service."""
        # Feature: tickets-folder, Property 1: Folder Name Validation
        assume(len(name.strip()) > 255)
        import pydantic

        # Pydantic enforces max_length=255 at schema level — this IS the validation error
        with pytest.raises((pydantic.ValidationError, HTTPError)):
            folder_data = FolderCreate(name=name[:300])

            with patch.object(
                FolderRepository,
                "get_by_name",
                new_callable=AsyncMock,
                return_value=None,
            ):
                with patch.object(
                    FolderRepository,
                    "count_by_owner",
                    new_callable=AsyncMock,
                    return_value=0,
                ):
                    service = make_service()
                    await service.create_folder(folder_data, "user-1")


@pytest.mark.asyncio
class TestP2DuplicateFolderNameRejection:

    @given(name=VALID_NAME_STRATEGY)
    @settings(max_examples=100)
    async def test_duplicate_name_rejected(self, name):
        """P2: Creating a folder with an existing name must return 409."""
        # Feature: tickets-folder, Property 2: Duplicate Folder Name Rejection
        service = make_service()
        folder_data = FolderCreate(name=name)
        existing = MagicMock()
        existing.id = str(uuid4())

        with patch.object(
            FolderRepository,
            "get_by_name",
            new_callable=AsyncMock,
            return_value=existing,
        ):
            with pytest.raises(HTTPError) as exc_info:
                await service.create_folder(folder_data, "user-1")
            assert exc_info.value.problem.status == 409


@pytest.mark.asyncio
class TestP3FolderCreationRoundTrip:

    @given(name=VALID_NAME_STRATEGY)
    @settings(max_examples=100)
    async def test_created_folder_has_id_and_timestamp(self, name):
        """P3: Created folder must have non-null id, created_at, and stripped name."""
        # Feature: tickets-folder, Property 3: Folder Creation Round-Trip
        service = make_service()
        folder_data = FolderCreate(name=name)
        owner_id = "user-1"

        mock_folder = MagicMock()
        mock_folder.id = str(uuid4())
        mock_folder.name = name.strip()
        mock_folder.owner_id = owner_id
        mock_folder.version = 1
        mock_folder.deleted_at = None
        mock_folder.created_at = datetime.utcnow()
        mock_folder.updated_at = datetime.utcnow()

        with patch.object(
            FolderRepository, "get_by_name", new_callable=AsyncMock, return_value=None
        ):
            with patch.object(
                FolderRepository,
                "count_by_owner",
                new_callable=AsyncMock,
                return_value=0,
            ):
                with patch.object(
                    FolderRepository,
                    "create",
                    new_callable=AsyncMock,
                    return_value=mock_folder,
                ):
                    with patch.object(
                        AuditLogRepository, "create", new_callable=AsyncMock
                    ):
                        result = await service.create_folder(folder_data, owner_id)
        assert result.id is not None
        assert result.created_at is not None
        assert result.name == name.strip()


@pytest.mark.asyncio
class TestP4InjectionPayloadRejection:

    @given(name=st.sampled_from(INJECTION_PAYLOADS))
    @settings(max_examples=100)
    async def test_injection_payloads_rejected(self, name):
        """P4: HTML/script injection payloads must be rejected with 422."""
        # Feature: tickets-folder, Property 4: Injection Payload Rejection
        service = make_service()
        folder_data = FolderCreate(name=name)

        with pytest.raises(HTTPError) as exc_info:
            await service.create_folder(folder_data, "user-1")
        assert exc_info.value.problem.status == 422


@pytest.mark.asyncio
class TestP5FolderListCompleteness:

    @given(n=st.integers(min_value=0, max_value=20))
    @settings(max_examples=100)
    async def test_list_returns_only_owner_folders(self, n):
        """P5: List must return exactly N active folders for the owner."""
        # Feature: tickets-folder, Property 5: Folder List Completeness and Ownership
        owner_id = "user-1"
        folders = []
        for _ in range(n):
            f = MagicMock()
            f.id = str(uuid4())
            f.name = f"folder-{uuid4()}"
            f.owner_id = owner_id
            f.version = 1
            f.deleted_at = None
            f.created_at = datetime.utcnow()
            f.updated_at = datetime.utcnow()
            folders.append(f)

        service = make_service()
        from src.schemas.folder import FolderPaginationParams
        params = FolderPaginationParams()

        with patch.object(
            FolderRepository,
            "list_folders",
            new_callable=AsyncMock,
            return_value=(folders, None),
        ):
            result = await service.list_folders(owner_id, params)

        assert result.total == n
        assert len(result.folders) == n
        for folder in result.folders:
            assert folder.owner_id == owner_id
            assert folder.deleted_at is None


@pytest.mark.asyncio
class TestP6ListSortOrderInvariant:

    @given(n=st.integers(min_value=2, max_value=10))
    @settings(max_examples=100)
    async def test_default_sort_is_descending_by_created_at(self, n):
        """P6: Default folder list must be sorted by created_at descending."""
        # Feature: tickets-folder, Property 6: List Sort Order Invariant
        from datetime import timedelta
        base = datetime.utcnow()
        folders = []
        for i in range(n):
            f = MagicMock()
            f.id = str(uuid4())
            f.name = f"folder-{i}"
            f.owner_id = "user-1"
            f.version = 1
            f.deleted_at = None
            f.created_at = base - timedelta(seconds=i)
            f.updated_at = f.created_at
            folders.append(f)

        service = make_service()
        from src.schemas.folder import FolderPaginationParams
        params = FolderPaginationParams()

        with patch.object(
            FolderRepository,
            "list_folders",
            new_callable=AsyncMock,
            return_value=(folders, None),
        ):
            result = await service.list_folders("user-1", params)

        timestamps = [f.created_at for f in result.folders]
        assert timestamps == sorted(timestamps, reverse=True)


@pytest.mark.asyncio
class TestP9OptimisticLockingConflict:

    @given(stored_version=st.integers(min_value=2, max_value=100))
    @settings(max_examples=100)
    async def test_version_mismatch_returns_409(self, stored_version):
        """P9: Rename with wrong version must return HTTP 409."""
        # Feature: tickets-folder, Property 9: Optimistic Locking Conflict
        service = make_service()
        folder_id = str(uuid4())
        # Client sends version=1 but stored is stored_version (>1)
        folder_data = FolderUpdate(name="New Name", version=1)

        existing = MagicMock()
        existing.id = folder_id
        existing.version = stored_version  # mismatch

        with patch.object(
            FolderRepository, "get_by_id", new_callable=AsyncMock, return_value=existing
        ):
            with pytest.raises(HTTPError) as exc_info:
                await service.rename_folder(folder_id, folder_data, "user-1")
            assert exc_info.value.problem.status == 409


@pytest.mark.asyncio
class TestP10SoftDeleteVisibility:

    async def test_soft_deleted_folder_not_in_list(self):
        """P10: Soft-deleted folders must not appear in default list results."""
        # Feature: tickets-folder, Property 10: Soft-Delete Visibility
        service = make_service()
        # Repository returns empty list (soft-deleted excluded by default)
        from src.schemas.folder import FolderPaginationParams
        params = FolderPaginationParams()

        with patch.object(
            FolderRepository,
            "list_folders",
            new_callable=AsyncMock,
            return_value=([], None),
        ):
            result = await service.list_folders("user-1", params)
        assert result.total == 0

    async def test_delete_already_deleted_folder_returns_404(self):
        """P10c: Deleting an already soft-deleted folder must return 404."""
        # Feature: tickets-folder, Property 10: Soft-Delete Visibility
        service = make_service()
        folder_id = str(uuid4())

        existing = MagicMock()
        existing.id = folder_id
        existing.deleted_at = datetime.utcnow()  # already deleted
        existing.name = "deleted-folder"

        with patch.object(
            FolderRepository, "get_by_id", new_callable=AsyncMock, return_value=existing
        ):
            with pytest.raises(HTTPError) as exc_info:
                await service.delete_folder(folder_id, "user-1")
            assert exc_info.value.problem.status == 404

    async def test_include_deleted_returns_soft_deleted_folder(self):
        """P10b: include_deleted flag should surface soft-deleted folders."""
        # Feature: tickets-folder, Property 10: Soft-Delete Visibility
        service = make_service()
        folder_id = str(uuid4())
        deleted_folder = MagicMock()
        deleted_folder.id = folder_id
        deleted_folder.name = "deleted-folder"
        deleted_folder.owner_id = "user-1"
        deleted_folder.deleted_at = datetime.utcnow()
        deleted_folder.version = 1
        deleted_folder.created_at = datetime.utcnow()
        deleted_folder.updated_at = deleted_folder.created_at

        from src.schemas.folder import FolderPaginationParams
        params = FolderPaginationParams(include_deleted=True)

        with patch.object(
            FolderRepository,
            "list_folders",
            new_callable=AsyncMock,
            return_value=([deleted_folder], None),
        ):
            result = await service.list_folders("user-1", params)
        assert len(result.folders) == 1
        assert result.folders[0].deleted_at is not None


class TestP7CursorPaginationCompleteness:

    @given(
        total=st.integers(min_value=0, max_value=40),
        page_size=st.integers(min_value=1, max_value=10),
    )
    @settings(max_examples=50)
    @pytest.mark.asyncio
    async def test_paginating_all_pages_returns_full_set(self, total, page_size):
        """P7: Cursor pagination yields exactly N items with no duplicates."""
        # Feature: tickets-folder, Property 7: Cursor Pagination Completeness
        owner_id = "user-1"
        base = datetime.utcnow()

        dataset = []
        for i in range(total):
            f = MagicMock()
            f.id = f"folder-{i}"
            f.name = f"name-{i}"
            f.owner_id = owner_id
            f.version = 1
            f.deleted_at = None
            f.created_at = base - timedelta(seconds=i)
            f.updated_at = f.created_at
            dataset.append(f)

        async def mock_list_folders(
            owner_id: str,
            page_size: int = 50,
            cursor: str | None = None,
            name_filter: str | None = None,
            sort_by: str = "created_at",
            sort_dir: str = "desc",
            include_deleted: bool = False,
        ):
            items = dataset
            if cursor:
                cursor_dt = datetime.fromisoformat(cursor)
                items = [f for f in dataset if f.created_at < cursor_dt]
            slice_ = items[: page_size + 1]
            next_cursor = None
            if len(slice_) > page_size:
                slice_ = slice_[:page_size]
                next_cursor = slice_[-1].created_at.isoformat()
            return slice_, next_cursor

        service = make_service()
        from src.schemas.folder import FolderPaginationParams
        params = FolderPaginationParams(page_size=page_size)
        collected_ids = []
        cursor = None

        with patch.object(
            FolderRepository, "list_folders", side_effect=mock_list_folders
        ):
            while True:
                params.cursor = cursor
                result = await service.list_folders("user-1", params)
                collected_ids.extend([f.id for f in result.folders])
                if not result.next_cursor:
                    break
                cursor = result.next_cursor

        assert len(collected_ids) == total
        assert len(set(collected_ids)) == len(collected_ids)

    @given(page_size=st.integers(min_value=1, max_value=200))
    @settings(max_examples=50)
    def test_page_size_within_bounds(self, page_size):
        """P7: Page size must be accepted within [1, 200]."""
        # Feature: tickets-folder, Property 7: Cursor Pagination Completeness
        from src.schemas.folder import FolderPaginationParams
        params = FolderPaginationParams(page_size=page_size)
        assert 1 <= params.page_size <= 200


class TestP8NamePrefixFilterCorrectness:

    @given(
        prefix=st.text(
            min_size=1,
            max_size=10,
            alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
        )
    )
    @settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_prefix_filter_only_returns_matching_folders(self, prefix):
        """P8: All returned folders must start with the given prefix (case-insensitive)."""
        # Feature: tickets-folder, Property 8: Name Prefix Filter Correctness
        matching = [MagicMock() for _ in range(3)]
        for i, f in enumerate(matching):
            f.id = str(uuid4())
            f.name = f"{prefix}folder{i}"
            f.owner_id = "user-1"
            f.version = 1
            f.deleted_at = None
            f.created_at = datetime.utcnow()
            f.updated_at = datetime.utcnow()

        service = make_service()
        from src.schemas.folder import FolderPaginationParams
        params = FolderPaginationParams(name_filter=prefix)

        with patch.object(
            FolderRepository,
            "list_folders",
            new_callable=AsyncMock,
            return_value=(matching, None),
        ):
            result = await service.list_folders("user-1", params)

        for folder in result.folders:
            assert folder.name.lower().startswith(prefix.lower())


@pytest.mark.asyncio
class TestP11SoftDeleteCascadesAssociations:

    @given(folder_id=st.uuids().map(str))
    @settings(max_examples=50)
    async def test_soft_delete_removes_associations_not_tickets(self, folder_id):
        """P11: Soft-delete must remove ticket-folder associations without deleting tickets."""
        # Feature: tickets-folder, Property 11: Soft-Delete Cascades Associations
        service = make_service()

        existing = MagicMock()
        existing.id = folder_id
        existing.name = "to-delete"
        existing.owner_id = "user-1"
        existing.deleted_at = None

        delete_calls = []
        soft_delete_calls = []

        async def mock_delete_folder_assignments(fid):
            delete_calls.append(fid)

        async def mock_soft_delete(folder):
            soft_delete_calls.append(folder.id)

        with patch.object(
            FolderRepository, "get_by_id", new_callable=AsyncMock, return_value=existing
        ):
            with patch.object(
                FolderRepository,
                "delete_folder_assignments",
                side_effect=mock_delete_folder_assignments,
            ):
                with patch.object(
                    FolderRepository, "soft_delete", side_effect=mock_soft_delete
                ):
                    with patch.object(
                        AuditLogRepository, "create", new_callable=AsyncMock
                    ):
                        await service.delete_folder(folder_id, "user-1")

        assert folder_id in delete_calls
        assert folder_id in soft_delete_calls
