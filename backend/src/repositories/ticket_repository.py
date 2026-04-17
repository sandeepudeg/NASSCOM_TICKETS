from datetime import datetime
from uuid import uuid4

from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.repositories.models import Ticket, TicketEmbedding, TicketFolderAssignment


class TicketRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        title: str,
        description: str,
        owner_id: str,
        priority: str | None = None,
        source_channel: str = "web",
        structured_payload: str | None = None,
    ) -> Ticket:
        ticket = Ticket(
            id=str(uuid4()),
            title=title,
            description=description,
            owner_id=owner_id,
            priority=priority,
            source_channel=source_channel,
            structured_payload=structured_payload,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.session.add(ticket)
        await self.session.flush()
        return ticket

    async def get_by_id(self, ticket_id: str) -> Ticket | None:
        query = (
            select(Ticket)
            .options(selectinload(Ticket.similar_tickets))
            .where(Ticket.id == ticket_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_tickets(
        self,
        owner_id: str | None = None,
        status: str | None = None,
        category: str | None = None,
        routing_status: str | None = None,
        page_size: int = 50,
        cursor: str | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        is_automation_candidate: bool | None = None,
    ) -> tuple[list[Ticket], str | None]:
        # Eager load similar_tickets for dashboard intelligence reconstruction
        query = select(Ticket).options(selectinload(Ticket.similar_tickets))

        if owner_id:
            query = query.where(Ticket.owner_id == owner_id)
        if status:
            query = query.where(Ticket.status == status)
        if category:
            query = query.where(Ticket.category == category)
        if routing_status:
            query = query.where(Ticket.routing_status == routing_status)
        if is_automation_candidate is not None:
            query = query.where(
                Ticket.is_automation_candidate == is_automation_candidate
            )

        if sort_by == "status":
            order_col = Ticket.status
        elif sort_by == "created_at":
            order_col = Ticket.created_at
        else:
            order_col = Ticket.created_at

        if sort_dir == "desc":
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())

        query = query.limit(page_size + 1)

        if cursor:
            cursor_time = datetime.fromisoformat(cursor)
            if sort_dir == "desc":
                query = query.where(order_col < cursor_time)
            else:
                query = query.where(order_col > cursor_time)

        result = await self.session.execute(query)
        tickets = list(result.scalars().all())

        next_cursor = None
        if len(tickets) > page_size:
            tickets = tickets[:page_size]
            last_ticket = tickets[-1]
            next_cursor = last_ticket.created_at.isoformat()

        return tickets, next_cursor

    async def update(
        self,
        ticket: Ticket,
        **kwargs,
    ) -> Ticket:
        for key, value in kwargs.items():
            if value is not None and hasattr(ticket, key):
                setattr(ticket, key, value)
        ticket.updated_at = datetime.utcnow()
        await self.session.flush()
        return ticket

    async def delete(self, ticket: Ticket) -> None:
        await self.session.delete(ticket)
        await self.session.flush()

    async def count_by_status(
        self, owner_id: str | None = None, status: str | None = None
    ) -> dict[str, int]:
        query = select(Ticket.status, func.count(Ticket.id))
        if owner_id:
            query = query.where(Ticket.owner_id == owner_id)
        if status:
            query = query.where(Ticket.status == status)
        query = query.group_by(Ticket.status)
        result = await self.session.execute(query)
        return {row[0]: row[1] for row in result.all()}

    async def count_all(self) -> int:
        query = select(func.count(Ticket.id))
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_resolved_tickets_for_rag(self, limit: int = 300) -> list[dict]:
        """Fetch resolved tickets for RAG similarity search.

        Joins ticket_embeddings so pre-computed vectors are reused (fast path).
        Falls back to generating embeddings on-the-fly for tickets without stored vectors.
        Extracts resolution from structured_payload for Kaggle-sourced tickets.
        """
        import json as _json

        # LEFT JOIN so tickets without stored embeddings are still returned
        query = (
            select(Ticket, TicketEmbedding.embedding)
            .outerjoin(TicketEmbedding, Ticket.id == TicketEmbedding.ticket_id)
            .where(Ticket.status == "resolved")
            .where(Ticket.category.is_not(None))
            .order_by(Ticket.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        rows = result.all()

        tickets_for_rag = []
        for ticket, stored_embedding in rows:
            # Pull resolution from structured_payload (Kaggle datasets store it here)
            resolution_summary = ""
            if ticket.structured_payload:
                try:
                    payload = _json.loads(ticket.structured_payload)
                    resolution_summary = payload.get("resolution", "")
                except Exception:
                    pass

            if not resolution_summary and ticket.description:
                resolution_summary = f"[{ticket.category}] {ticket.description[:300]}"
            elif not resolution_summary:
                resolution_summary = f"[{ticket.category}] Resolved ticket."

            entry = {
                "id": ticket.id,
                "title": ticket.title,
                "description": ticket.description,
                "category": ticket.category,
                "resolution_summary": resolution_summary,
                # text used for on-the-fly embedding fallback
                "text": f"{ticket.title}. {ticket.description}",
                "knowledge_source": (
                    "Kaggle Dataset"
                    if ticket.owner_id == "kaggle_importer"
                    else "Internal History"
                ),
            }
            # If we have a pre-stored embedding, include it to skip re-computation
            if stored_embedding:
                entry["embedding"] = stored_embedding

            tickets_for_rag.append(entry)

        return tickets_for_rag


class TicketAssignmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def assign(self, ticket_id: str, folder_id: str) -> TicketFolderAssignment:
        assignment = TicketFolderAssignment(
            id=str(uuid4()),
            ticket_id=ticket_id,
            folder_id=folder_id,
            assigned_at=datetime.utcnow(),
        )
        self.session.add(assignment)
        await self.session.flush()
        return assignment

    async def unassign(self, ticket_id: str, folder_id: str) -> bool:
        query = select(TicketFolderAssignment).where(
            and_(
                TicketFolderAssignment.ticket_id == ticket_id,
                TicketFolderAssignment.folder_id == folder_id,
            )
        )
        result = await self.session.execute(query)
        assignment = result.scalar_one_or_none()
        if assignment:
            await self.session.delete(assignment)
            await self.session.flush()
            return True
        return False

    async def is_assigned(self, ticket_id: str, folder_id: str) -> bool:
        query = select(TicketFolderAssignment).where(
            and_(
                TicketFolderAssignment.ticket_id == ticket_id,
                TicketFolderAssignment.folder_id == folder_id,
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_folder_tickets(
        self,
        folder_id: str,
        page_size: int = 50,
        cursor: str | None = None,
        sort_by: str = "assigned_at",
        sort_dir: str = "desc",
    ) -> tuple[list[Ticket], str | None]:
        query = (
            select(Ticket)
            .join(TicketFolderAssignment, Ticket.id == TicketFolderAssignment.ticket_id)
            .options(selectinload(Ticket.similar_tickets))
            .where(TicketFolderAssignment.folder_id == folder_id)
        )

        if sort_by == "assigned_at":
            order_col = TicketFolderAssignment.assigned_at
        elif sort_by == "status":
            order_col = Ticket.status
        else:
            order_col = Ticket.created_at

        if sort_dir == "desc":
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())

        query = query.limit(page_size + 1)

        if cursor:
            cursor_time = datetime.fromisoformat(cursor)
            if sort_dir == "desc":
                query = query.where(order_col < cursor_time)
            else:
                query = query.where(order_col > cursor_time)

        result = await self.session.execute(query)
        tickets = list(result.scalars().all())

        next_cursor = None
        if len(tickets) > page_size:
            tickets = tickets[:page_size]
            last_ticket = tickets[-1]
            next_cursor = last_ticket.created_at.isoformat()

        return tickets, next_cursor

    async def count_folder_tickets(self, folder_id: str) -> int:
        query = select(func.count(TicketFolderAssignment.id)).where(
            TicketFolderAssignment.folder_id == folder_id
        )
        result = await self.session.execute(query)
        return result.scalar()

    async def delete_by_ticket(self, ticket_id: str) -> None:
        query = delete(TicketFolderAssignment).where(
            TicketFolderAssignment.ticket_id == ticket_id
        )
        await self.session.execute(query)
        await self.session.flush()

    async def delete_by_folder(self, folder_id: str) -> None:
        query = delete(TicketFolderAssignment).where(
            TicketFolderAssignment.folder_id == folder_id
        )
        await self.session.execute(query)
        await self.session.flush()
