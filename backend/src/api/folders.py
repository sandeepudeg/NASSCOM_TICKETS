from fastapi import APIRouter, Depends, Header, Query
from fastapi.responses import JSONResponse
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.database import get_db
from src.services.folder_service import FolderService
from src.services.ticket_assignment_service import TicketAssignmentService
from src.schemas.folder import (
    FolderCreate,
    FolderUpdate,
    FolderResponse,
    FolderListResponse,
    FolderPaginationParams,
    FolderStatsResponse,
)
from src.schemas.ticket import (
    BulkAssignRequest,
    BulkAssignResponse,
    TicketListResponse,
    TicketPaginationParams,
)
from src.schemas.errors import ProblemDetail

router = APIRouter(prefix="/folders", tags=["folders"])


@router.post(
    "", response_model=FolderResponse, responses={422: {"model": ProblemDetail}}
)
async def create_folder(
    folder_data: FolderCreate,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = FolderService(db)
    return await service.create_folder(
        folder_data,
        owner_id=x_user_id,
        source_ip=x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.get("/stats", response_model=FolderStatsResponse)
async def get_all_folder_stats(
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    service = FolderService(db)
    return await service.get_all_folder_stats(x_user_id)


@router.get(
    "/{folder_id}",
    response_model=FolderResponse,
    responses={404: {"model": ProblemDetail}},
)
async def get_folder(
    folder_id: str,
    include_deleted: bool = Query(False),
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    service = FolderService(db)
    return await service.get_folder(folder_id, x_user_id, include_deleted)


@router.get("", response_model=FolderListResponse)
async def list_folders(
    page_size: int = Query(50, ge=1, le=200),
    cursor: Optional[str] = Query(None),
    name_filter: Optional[str] = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|name)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    include_deleted: bool = Query(False),
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    service = FolderService(db)
    params = FolderPaginationParams(
        page_size=page_size,
        cursor=cursor,
        name_filter=name_filter,
        sort_by=sort_by,
        sort_dir=sort_dir,
        include_deleted=include_deleted,
    )
    return await service.list_folders(x_user_id, params)


@router.put(
    "/{folder_id}",
    response_model=FolderResponse,
    responses={
        404: {"model": ProblemDetail},
        409: {"model": ProblemDetail},
        422: {"model": ProblemDetail},
    },
)
async def rename_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = FolderService(db)
    return await service.rename_folder(
        folder_id,
        folder_data,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.delete(
    "/{folder_id}", status_code=204, responses={404: {"model": ProblemDetail}}
)
async def delete_folder(
    folder_id: str,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = FolderService(db)
    await service.delete_folder(
        folder_id,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.get("/{folder_id}/count")
async def get_folder_ticket_count(
    folder_id: str,
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    service = FolderService(db)
    count = await service.get_folder_ticket_count(folder_id, x_user_id)
    return {"count": count}


# --- Ticket assignment sub-routes under /folders/{folder_id}/tickets ---

@router.get("/{folder_id}/tickets", response_model=TicketListResponse)
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


@router.post(
    "/{folder_id}/tickets/{ticket_id}",
    responses={404: {"model": ProblemDetail}, 409: {"model": ProblemDetail}},
    status_code=201,
)
async def assign_ticket_to_folder(
    folder_id: str,
    ticket_id: str,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    service = TicketAssignmentService(db)
    await service.assign_ticket(
        ticket_id,
        folder_id,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )
    return {"status": "assigned"}


@router.delete(
    "/{folder_id}/tickets/{ticket_id}",
    status_code=204,
    responses={404: {"model": ProblemDetail}},
)
async def remove_ticket_from_folder(
    folder_id: str,
    ticket_id: str,
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
    "/{folder_id}/tickets/bulk",
    responses={
        207: {"description": "Multi-status — some assignments failed"},
        404: {"model": ProblemDetail},
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
    result = await service.bulk_assign(
        folder_id,
        request,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )
    # Return 207 if there were any failures, 201 if all succeeded
    status_code = 207 if result.failed else 201
    return JSONResponse(status_code=status_code, content=result.model_dump())
