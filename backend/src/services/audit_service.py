import json
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.models import Ticket, AuditLog, AuditSnapshot

class AuditService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def capture_forensic_snapshot(self, audit_log_id: str, ticket_id: str):
        """
        Gathers a full 360-degree state of the ticket and system metrics.
        Stored as an immutable JSON blob for compliance audits.
        """
        # 1. Fetch current ticket state
        result = await self.session.execute(select(Ticket).where(Ticket.id == ticket_id))
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return

        # 2. Build the snapshot
        state = {
            "ticket_intelligence": {
                "sentiment_score": ticket.sentiment_score,
                "impact_score": ticket.impact_score,
                "complexity_score": ticket.complexity_score,
                "intelligence_priority": str(ticket.intelligence_priority),
                "confidence_score": ticket.confidence_score,
                "category_at_time": ticket.category
            },
            "automation_state": {
                "is_candidate": ticket.is_automation_candidate,
                "status": str(ticket.automation_status)
            },
            "system_health": {
                "timestamp": datetime.utcnow().isoformat(),
                "node": "primary-api-01",
                "compliance_mode": "strict"
            }
        }

        # 3. Persist the snapshot
        snapshot = AuditSnapshot(
            audit_log_id=audit_log_id,
            ticket_id=ticket_id,
            state_json=json.dumps(state),
            created_at=datetime.utcnow()
        )
        
        self.session.add(snapshot)
        await self.session.flush()

    async def get_snapshots_for_ticket(self, ticket_id: str) -> list[dict]:
        """
        Retrieves all forensic snapshots for a specific ticket.
        """
        query = select(AuditSnapshot).where(AuditSnapshot.ticket_id == ticket_id).order_by(AuditSnapshot.created_at.desc())
        result = await self.session.execute(query)
        snapshots = result.scalars().all()
        
        return [
            {
                "id": s.id,
                "audit_log_id": s.audit_log_id,
                "created_at": s.created_at,
                "state": json.loads(s.state_json)
            }
            for s in snapshots
        ]
