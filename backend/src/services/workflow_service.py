from datetime import datetime, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.models import Ticket, AuditLog
from src.schemas.ticket import TicketStatus
import structlog

logger = structlog.get_logger("services.workflow")

class WorkflowService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def provide_resolution(self, ticket_id: str, resolution_details: str, actor_id: str) -> Ticket:
        """Transitions ticket to awaiting_feedback with detailed steps."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await self.session.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return None
            
        ticket.status = "awaiting_feedback"
        ticket.resolution_details = resolution_details
        ticket.status_changed_at = datetime.utcnow()
        ticket.hold_type = None # Clear any holds when resolution is provided
        
        # Log the action
        audit = AuditLog(
            actor_user_id=actor_id,
            action_type="ticket_resolve",
            target_resource_id=ticket_id,
            metadata_json='{"action": "resolution_provided"}'
        )
        self.session.add(audit)
        await self.session.commit()
        return ticket

    async def mark_satisfied(self, ticket_id: str, actor_id: str) -> Ticket:
        """Transitions ticket to pending_closure based on user feedback."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await self.session.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return None
            
        ticket.status = "pending_closure"
        ticket.status_changed_at = datetime.utcnow()
        
        audit = AuditLog(
            actor_user_id=actor_id,
            action_type="ticket_satisfy",
            target_resource_id=ticket_id,
            metadata_json='{"feedback": "satisfied"}'
        )
        self.session.add(audit)
        await self.session.commit()
        return ticket

    async def reopen_ticket(self, ticket_id: str, actor_id: str, reason: str) -> Ticket:
        """Returns ticket to in_progress if user is not satisfied."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await self.session.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return None
            
        ticket.status = "in_progress"
        ticket.status_changed_at = datetime.utcnow()
        ticket.hold_type = None
        
        audit = AuditLog(
            actor_user_id=actor_id,
            action_type="ticket_reopen",
            target_resource_id=ticket_id,
            metadata_json=f'{{"reason": "{reason}"}}'
        )
        self.session.add(audit)
        await self.session.commit()
        return ticket

    async def set_hold(self, ticket_id: str, hold_type: str, actor_id: str) -> Ticket:
        """Sets a hold (evidence_needed or in_person_visit) to pause the timer."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await self.session.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return None
            
        if hold_type == "evidence_needed":
            ticket.status = "awaiting_evidence"
        elif hold_type == "in_person_visit":
            ticket.status = "pending_visit"
        else:
            return None
            
        ticket.hold_type = hold_type
        ticket.status_changed_at = datetime.utcnow()
        
        audit = AuditLog(
            actor_user_id=actor_id,
            action_type="ticket_hold",
            target_resource_id=ticket_id,
            metadata_json=f'{{"hold_type": "{hold_type}"}}'
        )
        self.session.add(audit)
        await self.session.commit()
        return ticket

    async def close_ticket(self, ticket_id: str, actor_id: str) -> Ticket:
        """Final transition to closed state by Administrator."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await self.session.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return None
            
        ticket.status = "closed"
        ticket.status_changed_at = datetime.utcnow()
        
        audit = AuditLog(
            actor_user_id=actor_id,
            action_type="ticket_satisfy", # Archive action
            target_resource_id=ticket_id,
            metadata_json='{"action": "final_closure_archived"}'
        )
        self.session.add(audit)
        await self.session.commit()
        return ticket

    async def process_auto_closures(self) -> int:
        """Background-ready task to move idle feedback tickets to pending_closure."""
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        stmt = select(Ticket).where(
            and_(
                Ticket.status == "awaiting_feedback",
                Ticket.hold_type == None,
                Ticket.status_changed_at <= seven_days_ago
            )
        )
        result = await self.session.execute(stmt)
        tickets = result.scalars().all()
        
        count = 0
        for ticket in tickets:
            ticket.status = "pending_closure"
            ticket.status_changed_at = datetime.utcnow()
            
            audit = AuditLog(
                actor_user_id="system",
                action_type="ticket_satisfy", # Reusing satisfy for auto-alignment
                target_resource_id=ticket.id,
                metadata_json='{"action": "auto_timeout_closure"}'
            )
            self.session.add(audit)
            count += 1
            
        if count > 0:
            await self.session.commit()
            logger.info("workflow.auto_closures_processed", count=count)
            
        return count

    async def submit_feedback(self, ticket_id: str, rating: int, comment: str, actor_id: str) -> Ticket:
        """Records user rating and comments in the audit log and moves ticket to pending_closure."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await self.session.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return None
            
        ticket.status = "pending_closure"
        ticket.status_changed_at = datetime.utcnow()
        
        audit = AuditLog(
            actor_user_id=actor_id,
            action_type="ticket_satisfy",
            target_resource_id=ticket_id,
            metadata_json=f'{{"rating": {rating}, "comment": "{comment}", "type": "user_feedback"}}'
        )
        self.session.add(audit)
        await self.session.commit()
        return ticket
