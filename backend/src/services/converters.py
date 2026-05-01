import json

from src.schemas.ticket import (
    Category,
    CausalContext,
    EvaluationMatrix,
    ResolutionSuggestion,
    RoutingStatus,
    SimilarTicket,
    TicketResponse,
    TicketStatus,
)


def safe_enum(enum_cls, value, default=None):
    """Safely convert a value to an enum, returning default if invalid."""
    try:
        if value is None:
            return default
        return enum_cls(value)
    except (ValueError, KeyError):
        return default


def ticket_to_response(
    ticket,
    similar_tickets: list | None = None,
    resolution_suggestion: ResolutionSuggestion | None = None,
    assigned_department: str | None = None,
) -> TicketResponse:
    """Centralized converter from Ticket ORM model to TicketResponse Pydantic schema."""

    # 1. Handle Causal Context
    causal_context = None
    if ticket.causal_context_json:
        try:
            causal_context = CausalContext.model_validate(
                json.loads(ticket.causal_context_json)
            )
        except Exception:
            pass

    # 2. Reconstruct Evaluation Matrix from persisted columns
    # We prefer the in-memory object if it exists (for new tickets),
    # otherwise we reconstruct from DB columns.
    eval_matrix = getattr(ticket, "evaluation_matrix_obj", None)
    if not eval_matrix and (
        ticket.accuracy or ticket.f1_score or ticket.semantic_similarity
    ):
        eval_matrix = EvaluationMatrix(
            accuracy=ticket.accuracy,
            f1_score=ticket.f1_score,
            semantic_similarity=ticket.semantic_similarity,
        )

    # 3. Handle Resolution Suggestion
    res_suggestion = resolution_suggestion
    if not res_suggestion and ticket.resolution_steps_json:
        try:
            steps = json.loads(ticket.resolution_steps_json)
            # Find source IDs from similar tickets relationship if loaded
            source_ids = []
            if hasattr(ticket, "similar_tickets") and ticket.similar_tickets:
                source_ids = [st.similar_ticket_id for st in ticket.similar_tickets]
            res_suggestion = ResolutionSuggestion(
                steps=steps,
                source_ticket_ids=source_ids,
                root_cause=getattr(ticket, "resolution_root_cause", None),
            )
        except Exception:
            pass

    # 4. Handle Similar Tickets (Mapping ORM to Pydantic)
    sim_tickets = []
    try:
        # Check if relationship is loaded to avoid 500 lazy-load errors
        from sqlalchemy.orm import inspect

        if (
            inspect(ticket).mapper.relationships.similar_tickets
            in inspect(ticket).unloaded
        ):
            sim_tickets = []
        elif ticket.similar_tickets:
            sim_tickets = []
            for st in ticket.similar_tickets:
                try:
                    sim_tickets.append(
                        SimilarTicket(
                            id=st.similar_ticket_id,
                            title=st.title,
                            category=Category(st.category),
                            resolution_summary=st.resolution_summary,
                            similarity_score=st.similarity_score,
                            knowledge_source="Captured History",
                        )
                    )
                except Exception:
                    continue
    except Exception:
        sim_tickets = []

    # 5. Determine lifecycle stage (Business Logic)
    lifecycle_stage = (
        "Stage 5: Completed"
        if ticket.status == "resolved"
        else "Stage 4: Expert Review"
    )
    if ticket.routing_status == "pending_classification":
        lifecycle_stage = "Stage 1: Ingested"
    elif not (assigned_department or getattr(ticket, "assigned_department", None)):
        lifecycle_stage = "Stage 2: Classified"
    elif ticket.status == "open" and (
        assigned_department or getattr(ticket, "assigned_department", None)
    ):
        lifecycle_stage = "Stage 3: Transferred"

    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        title=ticket.title,
        description=ticket.description,
        owner_id=ticket.owner_id,
        priority=ticket.priority,
        category=safe_enum(Category, ticket.category),
        status=safe_enum(TicketStatus, ticket.status, TicketStatus.OPEN),
        routing_status=safe_enum(
            RoutingStatus, ticket.routing_status, RoutingStatus.PENDING_CLASSIFICATION
        ),
        confidence_score=ticket.confidence_score,
        evaluation_matrix=eval_matrix,
        causal_context=causal_context,
        causal_signal=ticket.causal_signal,
        parse_warning=ticket.parse_warning,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        resolved_at=ticket.resolved_at,
        similar_tickets=sim_tickets or [],
        resolution_suggestion=res_suggestion,
        assigned_department=assigned_department
        or getattr(ticket, "assigned_department", None),
        source_channel=getattr(ticket, "source_channel", "web"),
        lifecycle_stage=lifecycle_stage,
        is_automation_candidate=getattr(ticket, "is_automation_candidate", False),
        is_repeated_issue=getattr(ticket, "is_repeated_issue", False),
        sentiment_score=getattr(ticket, "sentiment_score", 0.0),
        impact_score=getattr(ticket, "impact_score", 0.0),
        intelligence_priority=getattr(ticket, "intelligence_priority", "medium"),
        complexity_score=getattr(ticket, "complexity_score", 1),
        estimated_resolution_at=getattr(ticket, "estimated_resolution_at", None),
        sla_status=getattr(ticket, "sla_status", "on_track"),
        automation_status=getattr(ticket, "automation_status", "none"),
        automation_output=getattr(ticket, "automation_output", None),
        automation_simulation_report=getattr(ticket, "automation_simulation_report", None),
        automation_runbook_id=getattr(ticket, "automation_runbook_id", None),
        automation_verification_json=getattr(ticket, "automation_verification_json", None),
        roi_value_saved=getattr(ticket, "roi_value_saved", None),
        resolution_time_ms=getattr(ticket, "resolution_time_ms", None),
        resolution_details=getattr(ticket, "resolution_details", None),
        hold_type=getattr(ticket, "hold_type", None),
        status_changed_at=getattr(ticket, "status_changed_at", None),
    )
