from fastapi import APIRouter, Depends, Header, Query
from fastapi.responses import StreamingResponse
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.database import get_db
from src.services.ticket_assignment_service import TicketAssignmentService
from src.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketListResponse,
    BulkAssignRequest,
    BulkAssignResponse,
    TicketPaginationParams,
)
from src.schemas.errors import ProblemDetail
from src.services.ticket_service import TicketService

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post(
    "", response_model=TicketResponse, responses={422: {"model": ProblemDetail}}
)
async def create_ticket(
    ticket_data: TicketCreate,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = TicketService(db)
    return await service.create_ticket(
        ticket_data,
        owner_id=x_user_id,
        source_ip=x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    page_size: int = Query(25, ge=1, le=200),
    cursor: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    routing_status: Optional[str] = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|status|assigned_at)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    service = TicketService(db)
    params = TicketPaginationParams(
        page_size=page_size,
        cursor=cursor,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return await service.list_tickets(
        status=status,
        category=category,
        routing_status=routing_status,
        params=params,
    )


@router.get("/export-all")
async def export_tickets(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    routing_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Export tickets to a CSV file (Complete Dump).
    """
    service = TicketService(db)
    from datetime import datetime
    filename = f"ticketiq_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        service.export_tickets(
            status=status,
            category=category,
            routing_status=routing_status,
        ),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
    responses={404: {"model": ProblemDetail}},
)
async def get_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TicketService(db)
    return await service.get_ticket(ticket_id)


@router.get(
    "/{ticket_id}/classification",
    response_model=TicketResponse,
    responses={404: {"model": ProblemDetail}},
)
async def get_ticket_classification(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get ticket classification result including RAG suggestions, 
    assigned department, and lifecycle stage.
    """
    service = TicketService(db)
    return await service.get_ticket(ticket_id)


@router.put(
    "/{ticket_id}",
    response_model=TicketResponse,
    responses={404: {"model": ProblemDetail}},
)
async def update_ticket(
    ticket_id: str,
    ticket_data: TicketCreate,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = TicketService(db)
    return await service.update_ticket(
        ticket_id,
        ticket_data,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.delete(
    "/{ticket_id}", status_code=204, responses={404: {"model": ProblemDetail}}
)
async def delete_ticket(
    ticket_id: str,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = TicketService(db)
    await service.delete_ticket(
        ticket_id,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.post(
    "/{ticket_id}/assign/{folder_id}",
    response_model=TicketResponse,
    responses={404: {"model": ProblemDetail}, 400: {"model": ProblemDetail}},
)
async def assign_ticket(
    ticket_id: str,
    folder_id: str,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = TicketAssignmentService(db)
    return await service.assign_ticket(
        ticket_id,
        folder_id,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.delete(
    "/{ticket_id}/assign/{folder_id}",
    status_code=204,
    responses={404: {"model": ProblemDetail}, 400: {"model": ProblemDetail}},
)
async def unassign_ticket(
    ticket_id: str,
    folder_id: str,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = TicketAssignmentService(db)
    await service.unassign_ticket(
        ticket_id,
        folder_id,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.post(
    "/folders/{folder_id}/tickets/bulk",
    response_model=BulkAssignResponse,
    responses={
        404: {"model": ProblemDetail},
        400: {"model": ProblemDetail},
        422: {"model": ProblemDetail},
    },
)
async def bulk_assign_tickets(
    folder_id: str,
    request: BulkAssignRequest,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = TicketAssignmentService(db)
    return await service.bulk_assign(
        folder_id,
        request,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.get("/folders/{folder_id}/tickets", response_model=TicketListResponse)
async def get_folder_tickets(
    folder_id: str,
    page_size: int = Query(50, ge=1, le=200),
    cursor: Optional[str] = Query(None),
    sort_by: str = Query("assigned_at", pattern="^(assigned_at|status|created_at)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    service = TicketAssignmentService(db)
    params = TicketPaginationParams(
        page_size=page_size,
        cursor=cursor,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    tickets = await service.get_folder_tickets(folder_id, x_user_id, params)
    return TicketListResponse(tickets=tickets, next_cursor=None, total=len(tickets))
