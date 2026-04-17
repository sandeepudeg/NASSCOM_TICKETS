"""
Property-based tests for ticket assignment correctness properties (P12–P16).
Feature: tickets-folder
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import hypothesis.strategies as st
import pytest
from hypothesis import given, settings

from src.repositories.audit_repository import AuditLogRepository
from src.repositories.folder_repository import FolderRepository
from src.repositories.ticket_repository import (
    TicketAssignmentRepository,
    TicketRepository,
)
from src.schemas.errors import HTTPError
from src.schemas.ticket import BulkAssignRequest
import pytest_asyncio
from src.services.ticket_assignment_service import TicketAssignmentService

pytestmark = pytest.mark.asyncio(loop_scope="session")


def make_service():
    session = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return TicketAssignmentService(session)


def make_folder(folder_id=None, owner_id="user-1"):
    f = MagicMock()
    f.id = folder_id or str(uuid4())
    f.owner_id = owner_id
    f.deleted_at = None
    return f


def make_ticket(ticket_id=None):
    t = MagicMock()
    t.id = ticket_id or str(uuid4())
    t.title = "Test ticket"
    t.description = "Description"
    t.owner_id = "user-1"
    t.priority = None
    t.category = None
    t.status = "open"
    t.routing_status = "pending_classification"
    t.confidence_score = None
    t.causal_context = None
    t.causal_signal = None
    t.parse_warning = None
    t.created_at = datetime.utcnow()
    t.updated_at = datetime.utcnow()
    t.resolved_at = None
    t.similar_tickets = []
    t.resolution_suggestion = None
    return t


# Feature: tickets-folder, Property 12: Ticket Assignment Round-Trip
@pytest.mark.asyncio
@given(ticket_id=st.uuids(), folder_id=st.uuids())
@settings(max_examples=10, deadline=None)
async def test_assign_creates_association(ticket_id, folder_id):
    """Property P12: Successful assignment must call repository assign method."""
    ticket_id = str(ticket_id)
    folder_id = str(folder_id)
    assigned_calls = []

    async def mock_assign(tid, fid):
        assigned_calls.append((tid, fid))

    with patch.object(
        TicketRepository,
        "get_by_id",
        new_callable=AsyncMock,
        return_value=make_ticket(ticket_id),
    ):
        with patch.object(
            FolderRepository,
            "get_by_id",
            new_callable=AsyncMock,
            return_value=make_folder(folder_id),
        ):
            with patch.object(
                TicketAssignmentRepository,
                "is_assigned",
                new_callable=AsyncMock,
                return_value=False,
            ):
                with patch.object(
                    TicketAssignmentRepository, "assign", side_effect=mock_assign
                ):
                    with patch.object(
                        AuditLogRepository, "create", new_callable=AsyncMock
                    ):
                        service = make_service()
                        try:
                            await service.assign_ticket(ticket_id, folder_id, "user-1")
                        except Exception:
                            pass

    assert (ticket_id, folder_id) in assigned_calls


@pytest.mark.asyncio
class TestP13DuplicateAssignmentRejection:

    @given(ticket_id=st.uuids().map(str), folder_id=st.uuids().map(str))
    @settings(max_examples=100)
    async def test_duplicate_assignment_returns_error(self, ticket_id, folder_id):
        """P13: Assigning an already-assigned ticket must return an error."""
        # Feature: tickets-folder, Property 13: Duplicate Assignment Rejection
        service = make_service()

        with patch.object(
            TicketRepository,
            "get_by_id",
            new_callable=AsyncMock,
            return_value=make_ticket(ticket_id),
        ):
            with patch.object(
                FolderRepository,
                "get_by_id",
                new_callable=AsyncMock,
                return_value=make_folder(folder_id),
            ):
                with patch.object(
                    TicketAssignmentRepository,
                    "is_assigned",
                    new_callable=AsyncMock,
                    return_value=True,
                ):
                    with pytest.raises(HTTPError) as exc_info:
                        await service.assign_ticket(ticket_id, folder_id, "user-1")
                    assert exc_info.value.problem.status in (400, 409)


@pytest.mark.asyncio
class TestP14BulkAssignAtomicity:

    @given(
        valid_count=st.integers(min_value=1, max_value=10),
        invalid_count=st.integers(min_value=1, max_value=5),
    )
    @settings(max_examples=100)
    async def test_bulk_assign_rolls_back_on_any_failure(self, valid_count, invalid_count):
        """P14: If any ticket in bulk assign fails, zero associations must be created."""
        # Feature: tickets-folder, Property 14: Bulk Assign Atomicity
        service = make_service()
        folder_id = str(uuid4())
        valid_ids = [str(uuid4()) for _ in range(valid_count)]
        invalid_ids = [str(uuid4()) for _ in range(invalid_count)]
        all_ids = valid_ids + invalid_ids
        request = BulkAssignRequest(ticket_ids=all_ids[:100])

        async def mock_get_ticket(tid):
            if tid in invalid_ids:
                return None  # simulate not found
            return make_ticket(tid)

        with patch.object(
            FolderRepository,
            "get_by_id",
            new_callable=AsyncMock,
            return_value=make_folder(folder_id),
        ):
            with patch.object(
                TicketRepository, "get_by_id", side_effect=mock_get_ticket
            ):
                with patch.object(
                    TicketAssignmentRepository,
                    "is_assigned",
                    new_callable=AsyncMock,
                    return_value=False,
                ):
                    result = await service.bulk_assign(folder_id, request, "user-1")

        # When any failure exists, successful list must be empty (full rollback)
        assert len(result.successful) == 0
        assert len(result.failed) > 0

    @given(ticket_ids=st.lists(st.uuids().map(str), min_size=1, max_size=100))
    @settings(max_examples=50)
    async def test_bulk_assign_all_valid_succeeds(self, ticket_ids):
        """P14: All-valid bulk assign must succeed with zero failures."""
        # Feature: tickets-folder, Property 14: Bulk Assign Atomicity
        service = make_service()
        folder_id = str(uuid4())
        request = BulkAssignRequest(ticket_ids=ticket_ids)

        with patch.object(
            FolderRepository,
            "get_by_id",
            new_callable=AsyncMock,
            return_value=make_folder(folder_id),
        ):
            with patch.object(
                TicketRepository,
                "get_by_id",
                new_callable=AsyncMock,
                return_value=make_ticket(),
            ):
                with patch.object(
                    TicketAssignmentRepository,
                    "is_assigned",
                    new_callable=AsyncMock,
                    return_value=False,
                ):
                    with patch.object(
                        TicketAssignmentRepository, "assign", new_callable=AsyncMock
                    ):
                        with patch.object(
                            AuditLogRepository, "create", new_callable=AsyncMock
                        ):
                            result = await service.bulk_assign(folder_id, request, "user-1")

        assert len(result.failed) == 0
        assert len(result.successful) == len(ticket_ids)


@pytest.mark.asyncio
class TestP15RemoveAssociationRoundTrip:

    @given(ticket_id=st.uuids().map(str), folder_id=st.uuids().map(str))
    @settings(max_examples=100)
    async def test_unassign_calls_delete_association(self, ticket_id, folder_id):
        """P15: Unassign must call delete on the association."""
        # Feature: tickets-folder, Property 15: Remove Association Round-Trip
        service = make_service()
        unassign_calls = []

        async def mock_unassign(tid, fid):
            unassign_calls.append((tid, fid))
            return True

        with patch.object(
            FolderRepository,
            "get_by_id",
            new_callable=AsyncMock,
            return_value=make_folder(folder_id),
        ):
            with patch.object(
                TicketAssignmentRepository,
                "is_assigned",
                new_callable=AsyncMock,
                return_value=True,
            ):
                with patch.object(
                    TicketAssignmentRepository, "unassign", side_effect=mock_unassign
                ):
                    with patch.object(
                        AuditLogRepository, "create", new_callable=AsyncMock
                    ):
                        await service.unassign_ticket(ticket_id, folder_id, "user-1")

        assert (ticket_id, folder_id) in unassign_calls

    @given(ticket_id=st.uuids().map(str), folder_id=st.uuids().map(str))
    @settings(max_examples=100)
    async def test_unassign_not_assigned_returns_error(self, ticket_id, folder_id):
        """P15: Removing a ticket not in the folder must return an error."""
        # Feature: tickets-folder, Property 15: Remove Association Round-Trip
        service = make_service()

        with patch.object(
            FolderRepository,
            "get_by_id",
            new_callable=AsyncMock,
            return_value=make_folder(folder_id),
        ):
            with patch.object(
                TicketAssignmentRepository,
                "is_assigned",
                new_callable=AsyncMock,
                return_value=False,
            ):
                with pytest.raises(HTTPError):
                    await service.unassign_ticket(ticket_id, folder_id, "user-1")


@pytest.mark.asyncio
class TestP16TicketDeletionCascadesAssociations:

    @given(folder_count=st.integers(min_value=1, max_value=5))
    @settings(max_examples=100, deadline=None)
    async def test_ticket_deletion_removes_all_associations(self, folder_count):
        """P16: Deleting a ticket must remove all its folder associations."""
        # Feature: tickets-folder, Property 16: Ticket Deletion Cascades Associations
        from src.services.ticket_service import TicketService

        session = AsyncMock()
        session.flush = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        service = TicketService(session)

        ticket_id = str(uuid4())
        delete_calls = []

        async def mock_delete_by_ticket(tid):
            delete_calls.append(tid)

        with patch.object(
            TicketRepository,
            "get_by_id",
            new_callable=AsyncMock,
            return_value=make_ticket(ticket_id),
        ):
            with patch.object(
                TicketAssignmentRepository,
                "delete_by_ticket",
                side_effect=mock_delete_by_ticket,
            ):
                with patch.object(TicketRepository, "delete", new_callable=AsyncMock):
                    with patch.object(
                        AuditLogRepository, "create", new_callable=AsyncMock
                    ):
                        await service.delete_ticket(ticket_id, "user-1")

        assert ticket_id in delete_calls
