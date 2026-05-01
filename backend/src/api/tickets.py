import json
import structlog

logger = structlog.get_logger(__name__)

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
from src.services.automation_service import AutomationService
from src.services.graph_service import GraphService
from src.services.copilot_service import CopilotService
from src.services.global_service import GlobalService
from src.services.audit_service import AuditService
from src.services.workflow_service import WorkflowService

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
    # Use provided owner_id if available (typically for admins), otherwise use x_user_id
    owner_id = ticket_data.owner_id if ticket_data.owner_id else x_user_id
    
    return await service.create_ticket(
        ticket_data,
        owner_id=owner_id,
        source_ip=x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    page_size: int = Query(25, ge=1, le=200),
    page: int = Query(1, ge=1),
    status: str | None = Query(None),
    category: str | None = Query(None),
    routing_status: str | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|status|assigned_at)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    sla_breach: bool | None = Query(None),
    intelligence_priority: str | None = Query(None),
    owner_id: str | None = Query(None),
    q: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = TicketService(db)
    params = TicketPaginationParams(
        page_size=page_size,
        page=page,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return await service.list_tickets(
        status=status,
        category=category,
        routing_status=routing_status,
        params=params,
        sla_breach=sla_breach,
        intelligence_priority=intelligence_priority,
        owner_id=owner_id,
        q=q,
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


@router.post("/import")
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
        import traceback
        import structlog
        logger = structlog.get_logger("api.import")
        logger.error("import.endpoint_failed", error=str(e), traceback=traceback.format_exc())
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


@router.get("/import/templates")
async def get_import_templates():
    """Provides professional mapping templates for specific domains (Healthcare, Legal, etc)."""
    return ImportService.get_domain_templates()


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


@router.post("/{ticket_id}/simulate", response_model=dict)
async def simulate_remediation(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Agentic Simulation: Generate an AI Dry-Run report for the ticket's resolution.
    """
    service = AutomationService(db)
    report = await service.simulate_remediation(ticket_id)
    return {"ticket_id": ticket_id, "report": report}


@router.post("/{ticket_id}/remediate", response_model=dict)
async def execute_remediation(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Closed-Loop Execution: Trigger the automated resolution script for the ticket.
    Requires prior simulation and agent approval (Implicit in this call).
    """
    service = AutomationService(db)
    result = await service.execute_remediation(ticket_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.get("/automation/runbooks", response_model=list)
async def get_runbooks(
    db: AsyncSession = Depends(get_db),
):
    """List all available automation runbooks."""
    from src.repositories.models import AutomationRunbook
    from sqlalchemy import select
    stmt = select(AutomationRunbook).where(AutomationRunbook.is_active == True)
    result = await db.execute(stmt)
    runbooks = result.scalars().all()
    return [{"id": r.id, "name": r.name, "category": r.category_target} for r in runbooks]


@router.get("/{ticket_id}/graph", tags=["Intelligence"])
async def get_ticket_graph(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(default="system"),
):
    """
    Returns a semantic relationship graph for the ticket.
    """
    service = GraphService(db)
    return await service.get_semantic_graph(ticket_id)


@router.post("/{ticket_id}/summarize", tags=["Intelligence"])
async def summarize_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Generates a 3-bullet core summary of the ticket.
    """
    service = CopilotService(db)
    return await service.generate_summary(ticket_id)


@router.post("/{ticket_id}/draft", tags=["Intelligence"])
async def draft_ticket_reply(
    ticket_id: str,
    audience: str = "customer",
    db: AsyncSession = Depends(get_db),
):
    """
    Generates a contextual draft reply.
    """
    service = CopilotService(db)
    return await service.generate_draft_reply(ticket_id, audience)


@router.post("/{ticket_id}/translate", tags=["Global"])
async def translate_ticket(
    ticket_id: str,
    target_lang: str = "English",
    db: AsyncSession = Depends(get_db),
):
    """
    Translates the ticket title and description.
    """
    from src.repositories.ticket_repository import TicketRepository
    repo = TicketRepository(db)
    ticket = await repo.get_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    service = GlobalService(db)
    title_trans = await service.translate_text(ticket.title, target_lang)
    desc_trans = await service.translate_text(ticket.description, target_lang)
    
    return {
        "title": title_trans["translated_text"],
        "description": desc_trans["translated_text"],
        "language": target_lang
    }


@router.get("/{ticket_id}/global-insights", tags=["Global"])
async def get_global_insights(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Finds anonymized solutions for this problem from other organizations.
    """
    service = GlobalService(db)
    return await service.get_cross_tenant_insights(ticket_id)


@router.get("/{ticket_id}/snapshots", tags=["Governance"])
async def get_ticket_snapshots(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves forensic snapshots captured during manual overrides.
    """
    service = AuditService(db)
    return await service.get_snapshots_for_ticket(ticket_id)
@router.get("/{ticket_id}/logs", tags=["Governance"])
async def get_ticket_logs(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves all audit logs captured during the ticket lifecycle.
    """
    service = AuditService(db)
    return await service.get_logs_for_ticket(ticket_id)
@router.post("/{ticket_id}/dispatch", tags=["Intelligence"])
async def dispatch_drafts(
    ticket_id: str,
    drafts: dict,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(default="system"),
    x_forwarded_for: str | None = Header(None),
):
    """
    Approves and dispatches AI-generated drafts, updates ticket status to 'in_progress',
    and records the action in the audit log.
    """
    service = TicketService(db)
    return await service.dispatch_drafts(
        ticket_id,
        drafts,
        x_user_id,
        x_forwarded_for.split(",")[0] if x_forwarded_for else None,
    )


@router.post("/polish-description", tags=["Intelligence"])
async def polish_description(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Polishes the provided text to be more professional and readable.
    """
    text = payload.get("text", "")
    service = CopilotService(db)
    return await service.polish_text(text)


@router.api_route("/{ticket_id}/resolve", methods=["POST", "PATCH"], tags=["Workflow"], response_model=TicketResponse)
async def resolve_ticket(
    ticket_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(default="system"),
):
    """Provides detailed resolution steps and moves ticket to awaiting_feedback."""
    logger.info("workflow.resolve_request_received", ticket_id=ticket_id, user_id=x_user_id, payload_keys=list(payload.keys()))
    try:
        steps = payload.get("resolution_details", "")
        if not steps:
            logger.warning("workflow.resolve_missing_steps", ticket_id=ticket_id)
            raise HTTPException(status_code=400, detail="Resolution details are required")

        service = WorkflowService(db)
        ticket = await service.provide_resolution(ticket_id, steps, x_user_id)
        if not ticket:
            logger.error("workflow.resolve_ticket_not_found", ticket_id=ticket_id)
            raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
        
        logger.info("workflow.resolve_completed_successfully", ticket_id=ticket_id)
        return ticket
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("workflow.resolve_unhandled_exception", ticket_id=ticket_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal resolution logic failure: {str(e)}")


@router.post("/{ticket_id}/satisfy", tags=["Workflow"], response_model=TicketResponse)
async def satisfy_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(default="system"),
):
    """User marks ticket as satisfied, moving it to pending_closure."""
    service = WorkflowService(db)
    ticket = await service.mark_satisfied(ticket_id, x_user_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/{ticket_id}/feedback", tags=["Workflow"])
async def submit_ticket_feedback(
    ticket_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(default="system"),
):
    """User provides star rating and detailed comments for the resolution."""
    rating = payload.get("rating", 5)
    comment = payload.get("comment", "")
    service = WorkflowService(db)
    ticket = await service.submit_feedback(ticket_id, rating, comment, x_user_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/{ticket_id}/reopen", tags=["Workflow"], response_model=TicketResponse)
async def reopen_ticket(
    ticket_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(default="system"),
):
    """User reopens ticket if resolution was insufficient."""
    reason = payload.get("reason", "No reason provided")
    service = WorkflowService(db)
    ticket = await service.reopen_ticket(ticket_id, x_user_id, reason)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/{ticket_id}/hold", tags=["Workflow"], response_model=TicketResponse)
async def set_ticket_hold(
    ticket_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(default="system"),
):
    """Sets a hold status (evidence_needed or in_person_visit)."""
    hold_type = payload.get("hold_type")
    service = WorkflowService(db)
    ticket = await service.set_hold(ticket_id, hold_type, x_user_id)
    if not ticket:
        raise HTTPException(status_code=400, detail="Invalid hold type or ticket not found")
    return ticket

@router.post("/{ticket_id}/close", tags=["Workflow"], response_model=TicketResponse)
async def close_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(default="system"),
):
    """Administrator performs final alignment and closes the ticket."""
    service = WorkflowService(db)
    ticket = await service.close_ticket(ticket_id, x_user_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/workflow/auto-close", tags=["Workflow"])
async def run_auto_closures(
    db: AsyncSession = Depends(get_db),
):
    """Triggers the 7-day auto-closure logic for idle feedback tickets."""
    service = WorkflowService(db)
    count = await service.process_auto_closures()
    return {"status": "success", "processed_count": count}
