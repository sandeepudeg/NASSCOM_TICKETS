import json

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.database import get_db
from src.schemas.errors import ProblemDetail
from src.schemas.ticket import (
    BulkAssignRequest,
    BulkAssignResponse,
    TicketCreate,
    TicketListResponse,
    TicketPaginationParams,
    TicketResponse,
)
from src.services.import_service import ImportService
from src.services.ticket_assignment_service import TicketAssignmentService
from src.services.ticket_service import TicketService

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post(
    "", response_model=TicketResponse, responses={422: {"model": ProblemDetail}}
)
async def create_ticket(
    ticket_data: TicketCreate,
    x_user_id: str = Header(default="system"),
    x_forwarded_for: str | None = Header(None),
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
    cursor: str | None = Query(None),
    status: str | None = Query(None),
    category: str | None = Query(None),
    routing_status: str | None = Query(None),
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
    status: str | None = Query(None),
    category: str | None = Query(None),
    routing_status: str | None = Query(None),
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
        headers={"Content-Disposition": f"attachment; filename={filename}"},
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
    x_forwarded_for: str | None = Header(None),
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
    x_forwarded_for: str | None = Header(None),
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
    x_forwarded_for: str | None = Header(None),
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
    x_forwarded_for: str | None = Header(None),
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
    x_forwarded_for: str | None = Header(None),
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
    cursor: str | None = Query(None),
    sort_by: str = Query("assigned_at", pattern="^(assigned_at|status|created_at)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    TicketAssignmentService(db)
    TicketPaginationParams(
        page_size=page_size,
        cursor=cursor,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.post("/import/analyze")
async def analyze_import_file(
    file: UploadFile = File(...),
):
    """
    Extract headers and sample data from an uploaded file to assist in mapping.
    """
    try:
        file_content = await file.read()
        file_ext = file.filename.split(".")[-1]

        service = ImportService()
        result = await service.analyze_file(file_content, file_ext)

        if not result.get("success"):
            raise HTTPException(
                status_code=400, detail=result.get("error", "File analysis failed")
            )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


async def import_tickets(
    file: UploadFile = File(...),
    mapping_json: str = Form(...),
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    """
    Enterprise Data Ingestion: Bulk import tickets from CSV/Excel.
    Applies PII scrubbing and AI feature extraction during the ETL process.
    """
    try:
        mapping = json.loads(mapping_json)
        file_content = await file.read()
        file_ext = file.filename.split(".")[-1]

        service = ImportService()
        result = await service.process_import(
            file_content=file_content,
            file_extension=file_ext,
            mapping=mapping,
            owner_id=x_user_id,
            session=db,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=400, detail=result.get("error", "Import failed")
            )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/import/mappings")
async def get_import_mappings(
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve saved field mapping templates for the current user."""
    service = ImportService()
    configs = await service.get_mapping_configs(x_user_id, db)
    return [
        {"id": c.id, "name": c.name, "mapping": json.loads(c.config_json)}
        for c in configs
    ]


@router.post("/import/mappings")
async def save_import_mapping(
    name: str,
    mapping: dict,
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    """Save a domain-specific field mapping template (e.g., 'Healthcare Import')."""
    service = ImportService()
    config = await service.save_mapping_config(name, mapping, x_user_id, db)
    return {"id": config.id, "name": config.name}
