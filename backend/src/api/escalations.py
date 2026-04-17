from fastapi import APIRouter, Depends, Header, Query
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.database import get_db
from src.repositories.ticket_repository import TicketRepository
from src.repositories.audit_repository import AuditLogRepository, AgentOverrideRepository
from src.schemas.ticket import Category, TicketResponse, TicketListResponse
from src.schemas.errors import ProblemDetail, HTTPError

router = APIRouter(prefix="/escalations", tags=["escalations"])


@router.get("", response_model=TicketListResponse)
async def get_escalation_queue(
    page_size: int = Query(25, ge=1, le=200),
    cursor: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all escalated tickets sorted oldest-first (minimises SLA breach risk)."""
    ticket_repo = TicketRepository(db)
    tickets, next_cursor = await ticket_repo.list_tickets(
        routing_status="escalated",
        page_size=page_size,
        cursor=cursor,
        sort_by="created_at",
        sort_dir="asc",
    )
    return {
        "escalations": [TicketResponse.model_validate(t) for t in tickets],
        "next_cursor": next_cursor,
        "total": len(tickets),
    }


@router.post(
    "/{ticket_id}/override",
    response_model=TicketResponse,
    responses={404: {"model": ProblemDetail}, 422: {"model": ProblemDetail}},
)
async def override_routing(
    ticket_id: str,
    corrected_category: Category,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Override the classifier's routing decision and record the label for retraining."""
    from src.services.ticket_service import TicketService

    service = TicketService(db)
    return await service.override_category(
        ticket_id,
        corrected_category,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )
