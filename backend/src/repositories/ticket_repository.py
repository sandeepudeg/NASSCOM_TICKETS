from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import and_, or_, delete, func, select
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
        is_automation_candidate: bool | None = None,
        automation_status: str | None = None,
        sla_breach: bool | None = None,
        intelligence_priority: str | None = None,
        page_size: int = 50,
        page: int = 1,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
    ) -> list[Ticket]:
        import structlog
        logger = structlog.get_logger("repo.ticket")
        
        # Eager load similar_tickets for dashboard intelligence reconstruction
        query = select(Ticket).options(selectinload(Ticket.similar_tickets))
        
        logger.info("ticket.list.start", owner_id=owner_id, status=status, category=category, page_size=page_size)

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
        if automation_status:
            query = query.where(Ticket.automation_status == automation_status)
        if intelligence_priority:
            query = query.where(Ticket.intelligence_priority == intelligence_priority)
        if sla_breach is True:
            # 7-day breach threshold for active tickets
            threshold = datetime.utcnow() - timedelta(days=7)
            query = query.where(and_(Ticket.created_at < threshold, Ticket.status != 'resolved'))

        if sort_by == "status":
            order_col = Ticket.status
        elif sort_by == "created_at":
            order_col = Ticket.created_at
        else:
            order_col = Ticket.created_at

        if sort_dir == "desc":
            query = query.order_by(order_col.desc(), Ticket.id.desc())
        else:
            query = query.order_by(order_col.asc(), Ticket.id.asc())

        offset_val = (page - 1) * page_size
        query = query.offset(offset_val).limit(page_size)

        result = await self.session.execute(query)
        tickets = list(result.scalars().all())

        logger.info("ticket.list.done", count=len(tickets), query=str(query))

        return tickets

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

    async def count_tickets(
        self,
        owner_id: str | None = None,
        status: str | None = None,
        category: str | None = None,
        routing_status: str | None = None,
        sla_breach: bool | None = None,
        intelligence_priority: str | None = None,
    ) -> int:
        query = select(func.count(Ticket.id))
        
        if owner_id:
            query = query.where(Ticket.owner_id == owner_id)
        if status:
            query = query.where(Ticket.status == status)
        if category:
            query = query.where(Ticket.category == category)
        if routing_status:
            query = query.where(Ticket.routing_status == routing_status)
        if intelligence_priority:
            query = query.where(Ticket.intelligence_priority == intelligence_priority)
        if sla_breach is True:
            # 7-day breach threshold for active tickets
            threshold = datetime.utcnow() - timedelta(days=7)
            query = query.where(and_(Ticket.created_at < threshold, Ticket.status != 'resolved'))
            
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
            # Pull resolution from automation_output (Internal History) or structured_payload (Kaggle)
            resolution_summary = ""
            
            # Highest Priority: Actual automation execution output
            if ticket.automation_output:
                # Strip the 'Execution successful' prefix if present for cleaner RAG
                resolution_summary = ticket.automation_output.replace("Execution successful.\n", "")
            
            # Second Priority: Structured payload resolution (Kaggle artifacts)
            if not resolution_summary and ticket.structured_payload:
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

    async def get_tickets_with_embeddings(self, limit: int = 300) -> list[dict]:
        """Fetch recent tickets with their embeddings for pattern detection."""
        query = (
            select(Ticket, TicketEmbedding.embedding)
            .join(TicketEmbedding, Ticket.id == TicketEmbedding.ticket_id)
            .order_by(Ticket.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        rows = result.all()

        tickets = []
        for ticket, embedding in rows:
            tickets.append({
                "id": ticket.id,
                "title": ticket.title,
                "category": ticket.category,
                "embedding": embedding,
                "created_at": ticket.created_at
            })
        return tickets


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
        owner_id: str | None = None,
        page_size: int = 50,
        page: int = 1,
        sort_by: str = "assigned_at",
        sort_dir: str = "desc",
        status: str | None = None,
        category: str | None = None,
        routing_status: str | None = None,
        sla_breach: bool | None = None,
        intelligence_priority: str | None = None,
    ) -> list[Ticket]:
        query = (
            select(Ticket)
            .join(TicketFolderAssignment, Ticket.id == TicketFolderAssignment.ticket_id)
            .options(selectinload(Ticket.similar_tickets))
            .where(TicketFolderAssignment.folder_id == folder_id)
        )

        if owner_id:
            query = query.where(Ticket.owner_id == owner_id)

        if status:
            query = query.where(Ticket.status == status)
        if category:
            query = query.where(Ticket.category == category)
        if routing_status:
            query = query.where(Ticket.routing_status == routing_status)
        if intelligence_priority:
            query = query.where(Ticket.intelligence_priority == intelligence_priority)
        if sla_breach is True:
            # 7-day breach threshold for active tickets
            threshold = datetime.utcnow() - timedelta(days=7)
            query = query.where(and_(Ticket.created_at < threshold, Ticket.status != 'resolved'))

        if sort_by == "assigned_at":
            order_col = TicketFolderAssignment.assigned_at
        elif sort_by == "status":
            order_col = Ticket.status
        else:
            order_col = Ticket.created_at

        if sort_dir == "desc":
            query = query.order_by(order_col.desc(), Ticket.id.desc())
        else:
            query = query.order_by(order_col.asc(), Ticket.id.asc())

        offset_val = (page - 1) * page_size
        query = query.offset(offset_val).limit(page_size)

        result = await self.session.execute(query)
        tickets = list(result.scalars().all())

        return tickets

    async def count_folder_tickets(
        self,
        folder_id: str,
        owner_id: str | None = None,
        status: str | None = None,
        category: str | None = None,
        routing_status: str | None = None,
        sla_breach: bool | None = None,
        intelligence_priority: str | None = None,
    ) -> int:
        query = (
            select(func.count(Ticket.id))
            .join(TicketFolderAssignment, Ticket.id == TicketFolderAssignment.ticket_id)
            .where(TicketFolderAssignment.folder_id == folder_id)
        )
        
        if owner_id:
            query = query.where(Ticket.owner_id == owner_id)
        
        if status:
            query = query.where(Ticket.status == status)
        if category:
            query = query.where(Ticket.category == category)
        if routing_status:
            query = query.where(Ticket.routing_status == routing_status)
        if intelligence_priority:
            query = query.where(Ticket.intelligence_priority == intelligence_priority)
        if sla_breach is True:
            # 7-day breach threshold for active tickets
            threshold = datetime.utcnow() - timedelta(days=7)
            query = query.where(and_(Ticket.created_at < threshold, Ticket.status != 'resolved'))
            
        result = await self.session.execute(query)
        return result.scalar() or 0

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
