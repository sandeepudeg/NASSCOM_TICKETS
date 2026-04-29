from opentelemetry import trace
from sqlalchemy.ext.asyncio import AsyncSession

from config.observability import record_bulk_assign_batch
from src.repositories.audit_repository import AuditLogRepository
from src.repositories.folder_repository import FolderRepository
from src.repositories.ticket_repository import (
    TicketAssignmentRepository,
    TicketRepository,
)
from src.schemas.errors import HTTPError
from src.schemas.ticket import (
    BulkAssignRequest,
    BulkAssignResponse,
    TicketPaginationParams,
    TicketResponse,
)
from src.services.converters import ticket_to_response
from src.services.notification_service import NotificationService


class TicketAssignmentService:
    MAX_BULK_ASSIGN = 100

    def __init__(self, session: AsyncSession):
        self.session = session
        self.folder_repo = FolderRepository(session)
        self.ticket_repo = TicketRepository(session)
        self.assignment_repo = TicketAssignmentRepository(session)
        self.audit_repo = AuditLogRepository(session)
        self.notification_service = NotificationService(session)

    async def assign_ticket(
        self,
        ticket_id: str,
        folder_id: str,
        user_id: str,
        source_ip: str | None = None,
    ) -> dict:
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPError.not_found("Ticket not found")

        folder = await self.folder_repo.get_by_id(folder_id, user_id)
        if not folder:
            raise HTTPError.not_found("Folder not found")

        if folder.deleted_at:
            raise HTTPError.not_found("Folder has been deleted")

        is_assigned = await self.assignment_repo.is_assigned(ticket_id, folder_id)
        if is_assigned:
            raise HTTPError.bad_request("Ticket is already assigned to this folder")

        await self.assignment_repo.assign(ticket_id, folder_id)

        await self.audit_repo.create(
            actor_user_id=user_id,
            action_type="ticket_assign",
            target_resource_id=folder_id,
            source_ip=source_ip or "127.0.0.1",
            metadata={"ticket_id": ticket_id},
        )

        # Trigger Notification for Assignment
        try:
            await self.notification_service.create_notification(
                user_id=user_id,
                notif_type="ticket_classified",
                title="Ticket Categorized & Routed",
                message=f"Ticket #{ticket.ticket_number} has been classified as {ticket.category} and routed to the corresponding department.",
                ticket_id=ticket_id
            )
        except Exception:
            pass

        await self.session.commit()
        return {"ticket_id": ticket_id, "folder_id": folder_id, "status": "assigned"}

    async def unassign_ticket(
        self,
        ticket_id: str,
        folder_id: str,
        user_id: str,
        source_ip: str | None = None,
    ) -> None:
        folder = await self.folder_repo.get_by_id(folder_id, user_id)
        if not folder:
            raise HTTPError.not_found("Folder not found")

        is_assigned = await self.assignment_repo.is_assigned(ticket_id, folder_id)
        if not is_assigned:
            raise HTTPError.bad_request("Ticket is not assigned to this folder")

        await self.assignment_repo.unassign(ticket_id, folder_id)

        await self.audit_repo.create(
            actor_user_id=user_id,
            action_type="ticket_unassign",
            target_resource_id=folder_id,
            source_ip=source_ip or "127.0.0.1",
            metadata={"ticket_id": ticket_id},
        )
        await self.session.commit()

    async def bulk_assign(
        self,
        folder_id: str,
        request: BulkAssignRequest,
        user_id: str,
        source_ip: str | None = None,
    ) -> BulkAssignResponse:
        tracer = trace.get_tracer("services.ticket_assignment")

        with tracer.start_as_current_span("bulk_assign.transaction") as span:
            batch_size = len(request.ticket_ids)
            record_bulk_assign_batch(batch_size)
            span.set_attribute("bulk_assign.batch_size", batch_size)

            if batch_size > self.MAX_BULK_ASSIGN:
                raise HTTPError.validation_error(
                    f"Cannot assign more than {self.MAX_BULK_ASSIGN} tickets at once"
                )

            folder = await self.folder_repo.get_by_id(folder_id, user_id)
            if not folder:
                raise HTTPError.not_found("Folder not found")

            # Pre-validate all tickets before touching the DB (fail-fast, no partial state)
            failed = []
            valid_ticket_ids = []
            for ticket_id in request.ticket_ids:
                ticket = await self.ticket_repo.get_by_id(ticket_id)
                if not ticket:
                    failed.append({"ticket_id": ticket_id, "error": "Ticket not found"})
                    continue
                is_assigned = await self.assignment_repo.is_assigned(
                    ticket_id, folder_id
                )
                if is_assigned:
                    failed.append(
                        {
                            "ticket_id": ticket_id,
                            "error": "Ticket already assigned to this folder",
                        }
                    )
                    continue
                valid_ticket_ids.append(ticket_id)

            # If any pre-validation failed, rollback and return without writing anything
            if failed:
                span.set_attribute("bulk_assign.failed_count", len(failed))
                span.set_attribute("bulk_assign.success", False)
                return BulkAssignResponse(
                    successful=[],
                    failed=failed
                    + [
                        {"ticket_id": tid, "error": "Rolled back due to other failures"}
                        for tid in valid_ticket_ids
                    ],
                )

            # All valid — write atomically
            successful = []
            try:
                for ticket_id in valid_ticket_ids:
                    await self.assignment_repo.assign(ticket_id, folder_id)
                    successful.append(ticket_id)

                await self.audit_repo.create(
                    actor_user_id=user_id,
                    action_type="ticket_bulk_assign",
                    target_resource_id=folder_id,
                    source_ip=source_ip,
                    metadata={"ticket_ids": successful, "total": len(successful)},
                )

                span.set_attribute("bulk_assign.success_count", len(successful))
                span.set_attribute("bulk_assign.success", True)
                await self.session.commit()
            except Exception as e:
                await self.session.rollback()
                span.set_attribute("bulk_assign.success", False)
                raise HTTPError.internal_error(
                    f"Bulk assign failed and was rolled back: {e}"
                ) from e

            return BulkAssignResponse(successful=successful, failed=[])

    async def get_folder_tickets(
        self,
        folder_id: str,
        user_id: str,
        params: TicketPaginationParams,
        status: str | None = None,
        category: str | None = None,
        routing_status: str | None = None,
        sla_breach: bool | None = None,
        intelligence_priority: str | None = None,
    ) -> tuple[list[TicketResponse], int]:
        folder = await self.folder_repo.get_by_id(folder_id, user_id)
        if not folder:
            raise HTTPError.not_found("Folder not found")

        tickets = await self.assignment_repo.get_folder_tickets(
            folder_id=folder_id,
            page_size=params.page_size,
            page=params.page,
            sort_by=params.sort_by,
            sort_dir=params.sort_dir,
            status=status,
            category=category,
            routing_status=routing_status,
            sla_breach=sla_breach,
            intelligence_priority=intelligence_priority,
        )

        total = await self.assignment_repo.count_folder_tickets(
            folder_id=folder_id,
            status=status,
            category=category,
            routing_status=routing_status,
            sla_breach=sla_breach,
            intelligence_priority=intelligence_priority,
        )
 
        import math
        total_pages = math.ceil(total / params.page_size) if total > 0 else 0
 
        return [ticket_to_response(t) for t in tickets], total, total_pages
