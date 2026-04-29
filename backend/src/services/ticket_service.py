import csv
import io
import json
from collections.abc import AsyncGenerator
from datetime import datetime

import structlog
from opentelemetry import trace
from sqlalchemy.ext.asyncio import AsyncSession

from config.observability import record_classification_latency
from src.ml.classifier import classifier
from src.ml.escalation_service import escalation_service
from src.ml.pattern_detection import pattern_detection_service
from src.ml.pii_scrubber import PIIScrubber
from src.ml.rag_service import rag_service
from src.repositories.audit_repository import (
    AgentOverrideRepository,
    AuditLogRepository,
)
from src.repositories.folder_repository import FolderRepository
from src.repositories.ticket_repository import TicketRepository
from src.schemas.errors import HTTPError
from src.schemas.settings import settings
from src.schemas.ticket import (
    Category,
    ResolutionSuggestion,
    RoutingStatus,
    TicketCreate,
    TicketListResponse,
    TicketPaginationParams,
    TicketResponse,
    TicketUpdate,
)
from src.services.converters import ticket_to_response
from src.services.routing_service import RoutingService
from src.services.ticket_assignment_service import TicketAssignmentService
from src.services.predictive_service import predictive_service
from src.services.audit_service import AuditService
from src.services.notification_service import NotificationService

logger = structlog.get_logger("services.ticket")


CATEGORY_SHORT_CODES = {
    Category.INFRASTRUCTURE: "INF",
    Category.APPLICATION: "APP",
    Category.SECURITY: "SEC",
    Category.DATABASE: "DB",
    Category.STORAGE: "STR",
    Category.NETWORK: "NET",
    Category.ACCESS_MANAGEMENT: "ACC",
}


def _calculate_intelligence_priority(
    sentiment_score: float, 
    impact_score: float, 
    original_priority: str | None
) -> str:
    """
    Logic for Phase 3: Sentiment-Aware Prioritization.
    Promotes priority based on user frustration and business impact.
    """
    # 1. Base Score calculation (50% sentiment, 50% impact)
    intelligence_score = (sentiment_score * 0.5) + (impact_score * 0.5)
    
    # 2. Logic: If either extreme (>0.85) or combined high (>0.7), flag as Urgent
    if intelligence_score > 0.7 or sentiment_score > 0.85 or impact_score > 0.85:
        return "urgent"
    elif intelligence_score > 0.5:
        return "high"
    elif intelligence_score > 0.3:
        return "medium"
    
    return "low"


class TicketService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.ticket_repo = TicketRepository(session)
        self.folder_repo = FolderRepository(session)
        self.audit_repo = AuditLogRepository(session)
        self.override_repo = AgentOverrideRepository(session)
        self.assignment_service = TicketAssignmentService(session)
        self.routing_service = RoutingService(session)
        self.notification_service = NotificationService(session)
        self._calculate_intelligence_priority = _calculate_intelligence_priority

    async def create_ticket(
        self,
        ticket_data: TicketCreate,
        owner_id: str,
        source_ip: str | None = None,
    ) -> TicketResponse:
        structured_payload_str = None
        if ticket_data.structured_payload:
            structured_payload_str = json.dumps(ticket_data.structured_payload)
            if not settings.disable_pii_scrubbing:
                scrubbed, _ = PIIScrubber.scrub(structured_payload_str)
                structured_payload_str = scrubbed

        ticket = await self.ticket_repo.create(
            title=ticket_data.title,
            description=ticket_data.description,
            owner_id=owner_id,
            priority=ticket_data.priority,
            source_channel=ticket_data.source_channel or "web",
            structured_payload=structured_payload_str,
        )

        try:
            from time import perf_counter

            try:
                tracer = trace.get_tracer("tickets.service")
                start = perf_counter()
                with tracer.start_as_current_span("ticket.classify") as span:
                    span.set_attribute("ticket.id", ticket.id)
                    span.set_attribute("ticket.owner_id", owner_id)
                    span.set_attribute("ticket.title.length", len(ticket.title))
                    span.set_attribute(
                        "ticket.description.length", len(ticket.description)
                    )
                    span.set_attribute(
                        "ticket.has_structured_payload",
                        bool(ticket_data.structured_payload),
                    )

                    trace_id = span.get_span_context().trace_id
                    span_id = span.get_span_context().span_id

                    classification = await classifier.classify(
                        title=ticket.title,
                        description=ticket.description,
                        structured_payload=ticket_data.structured_payload,
                    )

                    span.set_attribute(
                        "classification.category", classification.category.value
                    )
                    span.set_attribute(
                        "classification.confidence", classification.confidence_score
                    )
                    span.set_attribute(
                        "classification.routing_status",
                        classification.routing_status.value,
                    )
                    span.set_attribute(
                        "classification.outcome", classification.inference_outcome
                    )
            except (NameError, TypeError):
                # Tracing not available
                start = perf_counter()
                trace_id = 0
                span_id = 0
                classification = await classifier.classify(
                    title=ticket.title,
                    description=ticket.description,
                    structured_payload=ticket_data.structured_payload,
                    enable_judge=ticket_data.enable_judge or False,
                )

            duration = perf_counter() - start
            record_classification_latency(
                duration_seconds=duration,
                routing_status=classification.routing_status.value,
                outcome=classification.inference_outcome,
            )

            ticket.category = classification.category.value
            ticket.confidence_score = classification.confidence_score
            ticket.routing_status = classification.routing_status.value
            ticket.causal_context_json = (
                classification.causal_context.model_dump_json()
                if classification.causal_context
                else None
            )
            ticket.causal_signal = classification.causal_signal
            ticket.parse_warning = classification.parse_warning
            
            # Intelligence Layer (Phase 3)
            ticket.sentiment_score = classification.sentiment_score
            ticket.impact_score = classification.impact_score
            ticket.intelligence_priority = self._calculate_intelligence_priority(
                sentiment_score=classification.sentiment_score,
                impact_score=classification.impact_score,
                original_priority=ticket.priority
            )
            
            # Predictive Analytics (Phase 4)
            ticket.complexity_score = classification.complexity_score
            ticket.estimated_resolution_at = predictive_service.calculate_estimated_resolution(
                category=ticket.category,
                complexity=ticket.complexity_score,
                created_at=ticket.created_at
            )
            ticket.sla_status = predictive_service.determine_sla_status(
                created_at=ticket.created_at,
                estimated_resolution_at=ticket.estimated_resolution_at
            )

            # Persist Intelligence Metrics
            if classification.evaluation_matrix:
                ticket.evaluation_matrix_obj = classification.evaluation_matrix
                ticket.accuracy = classification.evaluation_matrix.accuracy
                ticket.f1_score = classification.evaluation_matrix.f1_score
                ticket.semantic_similarity = (
                    classification.evaluation_matrix.semantic_similarity
                )

            # --- Generate & Persist Vector Embedding (for Intelligence Network) ---
            try:
                from src.ml.embedding_service import embedding_service
                from src.repositories.models import TicketEmbedding
                
                full_text = f"{ticket.title}. {ticket.description}"
                embedding = embedding_service.get_embedding(full_text)
                
                ticket_emb = TicketEmbedding(
                    ticket_id=ticket.id,
                    embedding=json.dumps(embedding.tolist()),
                    model_version=embedding_service.model_name
                )
                self.session.add(ticket_emb)
                logger.info("ticket.embedding_generated", ticket_id=ticket.id)
            except Exception as e:
                logger.warning("ticket.embedding_failed", error=str(e), ticket_id=ticket.id)

            # --- Generate Readable Ticket Number ---
            try:
                category_enum = Category(classification.category.value)
                short_code = CATEGORY_SHORT_CODES.get(category_enum, "GEN")

                # Sequence based on global count (offset by 100 to look more established)
                ticket_count = await self.ticket_repo.count_all()
                ticket.ticket_number = f"TK-{short_code}-{ticket_count + 101:05d}"
                logger.info(
                    "ticket.number_generated", ticket_number=ticket.ticket_number
                )
            except Exception as e:
                logger.warning(
                    "ticket.number_generation_failed", error=str(e), exc_info=True
                )
                ticket.ticket_number = f"TK-GEN-{ticket.id[:5]}"

            try:
                ticket = await self.ticket_repo.update(ticket)
            except Exception as e:
                logger.error("ticket.update_failed", error=str(e), exc_info=True)
                raise

            # --- Trigger Notification (Phase 3 Integration) ---
            try:
                # 1. Base Ticket Created Notification
                await self.notification_service.create_notification(
                    user_id=owner_id,
                    notif_type="ticket_created",
                    title="Ticket Successfully Logged",
                    message=f"Your ticket #{ticket.ticket_number} has been received and is being processed.",
                    ticket_id=ticket.id
                )

                # 2. Urgent Promotion Notification
                if ticket.intelligence_priority == "urgent":
                    await self.notification_service.create_notification(
                        user_id=owner_id,
                        notif_type="urgent_promotion",
                        title="🚀 AI Priority Promotion",
                        message=f"Ticket #{ticket.ticket_number} has been promoted to URGENT due to high detected impact/sentiment.",
                        ticket_id=ticket.id
                    )
            except Exception as e:
                logger.warning("ticket.notification_failed", error=str(e), ticket_id=ticket.id)

            logger.info(
                "ticket.classified",
                trace_id=f"{trace_id:032x}",
                span_id=f"{span_id:016x}",
                service="ai-classifier",
                ticket_id=ticket.id,
                category=classification.category.value,
                confidence_score=classification.confidence_score,
                routing_status=classification.routing_status.value,
                duration_ms=int(duration * 1000),
            )

            # --- Automated Departmental Transfer ---
            try:
                dept_folder = (
                    await self.routing_service.get_or_create_department_folder(
                        category=classification.category.value, owner_id=owner_id
                    )
                )
                await self.assignment_service.assign_ticket(
                    ticket_id=ticket.id,
                    folder_id=dept_folder.id,
                    user_id=owner_id,
                    source_ip=source_ip,
                )
                logger.info(
                    "ticket.departmental_transfer_complete",
                    ticket_id=ticket.id,
                    department=dept_folder.name,
                )
                # Store the assigned department name in the ticket object for the response
                ticket.assigned_department = dept_folder.name
            except Exception as e:
                logger.warning(
                    "ticket.routing_failed", error=str(e), ticket_id=ticket.id
                )
                ticket.assigned_department = "Pending Transfer"

            if classification.routing_status == RoutingStatus.ESCALATED:
                await escalation_service.notify_escalation(
                    ticket_id=ticket.id,
                    title=ticket.title,
                    category=classification.category.value,
                    confidence_score=classification.confidence_score,
                )

            await self.audit_repo.create(
                actor_user_id=owner_id,
                action_type="ticket_classify",
                target_resource_id=ticket.id,
                source_ip=source_ip or "127.0.0.1",
                metadata={
                    "category": classification.category.value,
                    "confidence": classification.confidence_score,
                    "routing_status": classification.routing_status.value,
                },
            )

            # --- RAG: Resolution suggestion or escalation enrichment ---
            similar_tickets = []
            resolution_suggestion = None

            if classification.routing_status == RoutingStatus.CLASSIFIED:
                # Confident classification — attempt to suggest a resolution
                try:
                    resolved_tickets = (
                        await self.ticket_repo.get_resolved_tickets_for_rag()
                    )
                    ticket_text = f"{ticket.title}. {ticket.description}"
                    similar_tickets, low_confidence = (
                        await rag_service.find_similar_tickets(
                            ticket_text=ticket_text,
                            resolved_tickets=resolved_tickets,
                        )
                    )
                    if similar_tickets and not low_confidence:
                        resolution_suggestion = (
                            await rag_service.generate_resolution_suggestion(
                                title=ticket.title,
                                description=ticket.description,
                                similar_tickets=similar_tickets,
                            )
                        )
                        # Persist RAG Insights
                        if resolution_suggestion:
                            ticket.resolution_steps_json = json.dumps(
                                resolution_suggestion.steps
                            )
                            ticket.resolution_root_cause = (
                                resolution_suggestion.root_cause
                            )

                        # Automation Intelligence Candidate Logic (Bonus requirement)
                        # Flag as automation opportunity if confidence or similarity is extremely high (> 95%)
                        high_confidence = classification.confidence_score > 0.95
                        high_similarity = any(
                            st.similarity_score > 0.95 for st in similar_tickets
                        )
                        if high_confidence or high_similarity:
                            ticket.is_automation_candidate = True
                            logger.info(
                                "ticket.automation_candidate_flagged",
                                ticket_id=ticket.id,
                                reason="high_confidence_or_similarity",
                            )
                            # Add a note about automation to the steps
                            auto_suggest = "🤖 AGENTIC INSIGHT: This issue matches high-confidence patterns. RECOMMENDED: Deploy automated resolution script."
                            if resolution_suggestion:
                                resolution_suggestion.steps.insert(0, auto_suggest)

                        from src.repositories.models import (
                            SimilarTicket as SimilarTicketModel,
                        )

                        for st in similar_tickets:
                            st_model = SimilarTicketModel(
                                ticket_id=ticket.id,
                                similar_ticket_id=st.id,
                                title=st.title,
                                category=st.category.value,
                                resolution_summary=st.resolution_summary,
                                similarity_score=st.similarity_score,
                            )
                            self.session.add(st_model)
                    logger.info(
                        "ticket.rag_complete",
                        ticket_id=ticket.id,
                        similar_count=len(similar_tickets),
                        has_suggestion=resolution_suggestion is not None,
                    )
                except Exception:
                    logger.exception(
                        "ticket.rag_failed",
                        ticket_id=ticket.id,
                    )

            # --- Agentic Layer: Repeated Issue Detection & Automation Suggestion ---
            try:
                # Fetch recent tickets to check for patterns
                # We reuse the resolved tickets fetcher but we actually need recent tickets (both open/resolved)
                # For now, we'll check against a small window of recent tickets
                recent_tickets = await self.ticket_repo.get_resolved_tickets_for_rag(
                    limit=50
                )

                # Check for patterns
                alerts = await pattern_detection_service.detect_patterns(recent_tickets)

                if alerts:
                    # Check if the current ticket matches any alert
                    for alert in alerts:
                        if ticket.id in alert.get("ticket_ids", []):
                            # Repeated issue found!
                            ticket.is_repeated_issue = True
                            automation_note = f"⚠️ REPEATED PATTERN DETECTED: {alert['cluster_size']} identical cases in 24h. Suggested Action: Promote to self-service automation."
                            if resolution_suggestion:
                                resolution_suggestion.steps.insert(0, automation_note)
                            else:
                                resolution_suggestion = ResolutionSuggestion(
                                    steps=[automation_note],
                                    source_ticket_ids=alert.get("ticket_ids", [])[:3],
                                )
                            logger.info(
                                "ticket.repeated_issue_detected",
                                ticket_id=ticket.id,
                                cluster_size=alert["cluster_size"],
                            )
                            break
            except Exception as e:
                logger.warning("ticket.pattern_detection_failed", error=str(e))

        except Exception:
            from time import perf_counter

            # If classify raised after start was set, record as failure; fallback to zero otherwise.
            duration = perf_counter() - start if "start" in locals() else 0
            record_classification_latency(
                duration_seconds=duration,
                routing_status=RoutingStatus.PENDING_CLASSIFICATION.value,
                outcome="error",
            )
            ticket.routing_status = RoutingStatus.PENDING_CLASSIFICATION.value
            ticket = await self.ticket_repo.update(ticket)

            logger.exception(
                "ticket.classification_failed",
                service="ai-classifier",
                ticket_id=ticket.id,
                duration_ms=int(duration * 1000),
            )
            similar_tickets = []
            resolution_suggestion = None

        await self.session.commit()
        return ticket_to_response(
            ticket,
            similar_tickets=similar_tickets,
            resolution_suggestion=resolution_suggestion,
            assigned_department=getattr(ticket, "assigned_department", None),
        )

    async def list_tickets(
        self,
        owner_id: str | None = None,
        status: str | None = None,
        category: str | None = None,
        routing_status: str | None = None,
        params: TicketPaginationParams | None = None,
        sla_breach: bool | None = None,
        intelligence_priority: str | None = None,
    ) -> TicketListResponse:
        p_size = params.page_size if params else 50
        p_page = params.page if params else 1
        p_sort_by = params.sort_by if params else "created_at"
        p_sort_dir = params.sort_dir if params else "desc"

        tickets = await self.ticket_repo.list_tickets(
            owner_id=owner_id,
            status=status,
            category=category,
            routing_status=routing_status,
            page_size=p_size,
            page=p_page,
            sort_by=p_sort_by,
            sort_dir=p_sort_dir,
            sla_breach=sla_breach,
            intelligence_priority=intelligence_priority,
        )

        total_count = await self.ticket_repo.count_tickets(
            owner_id=owner_id,
            status=status,
            category=category,
            routing_status=routing_status,
            sla_breach=sla_breach,
            intelligence_priority=intelligence_priority,
        )
        responses = [ticket_to_response(t) for t in tickets]
        
        import math
        total_pages = math.ceil(total_count / p_size) if total_count > 0 else 0
        
        return TicketListResponse(
            tickets=responses,
            page=p_page,
            page_size=p_size,
            total_pages=total_pages,
            total=total_count,
        )

    async def get_ticket(self, ticket_id: str) -> TicketResponse:
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPError.not_found("Ticket not found")
        return ticket_to_response(ticket)

    async def update_ticket(
        self,
        ticket_id: str,
        ticket_data: TicketUpdate,
        user_id: str,
        source_ip: str | None = None,
    ) -> TicketResponse:
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPError.not_found("Ticket not found")

        update_dict = ticket_data.model_dump(exclude_unset=True)
        if "status" in update_dict:
            if update_dict["status"] == "resolved" and ticket.status != "resolved":
                ticket.resolved_at = datetime.utcnow()

        ticket = await self.ticket_repo.update(ticket, **update_dict)
        await self.session.commit()
        return ticket_to_response(ticket)

    async def delete_ticket(
        self,
        ticket_id: str,
        user_id: str,
        source_ip: str | None = None,
    ) -> None:
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPError.not_found("Ticket not found")

        from src.repositories.ticket_repository import TicketAssignmentRepository

        assignment_repo = TicketAssignmentRepository(self.session)
        await assignment_repo.delete_by_ticket(ticket_id)
        await self.ticket_repo.delete(ticket)

        await self.audit_repo.create(
            actor_user_id=user_id,
            action_type="ticket_delete",
            target_resource_id=ticket_id,
            source_ip=source_ip or "127.0.0.1",
        )
        await self.session.commit()

    async def override_category(
        self,
        ticket_id: str,
        new_category: Category,
        agent_user_id: str,
        source_ip: str | None = None,
    ) -> TicketResponse:
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPError.not_found("Ticket not found")

        original_category = ticket.category
        await self.override_repo.create(
            ticket_id=ticket_id,
            original_category=original_category,
            corrected_category=new_category.value,
            agent_user_id=agent_user_id,
        )

        ticket.category = new_category.value
        ticket.routing_status = RoutingStatus.REVIEWED.value
        ticket = await self.ticket_repo.update(ticket)

        audit_log = await self.audit_repo.create(
            actor_user_id=agent_user_id,
            action_type="ticket_override",
            target_resource_id=ticket_id,
            source_ip=source_ip or "127.0.0.1",
            metadata={
                "original_category": original_category,
                "corrected_category": new_category.value,
            },
        )
        
        # Phase 8: Capture Forensic Snapshot
        audit_service = AuditService(self.session)
        await audit_service.capture_forensic_snapshot(audit_log.id, ticket_id)

        await self.session.commit()

        return ticket_to_response(ticket)

    async def export_tickets(
        self,
        status: str | None = None,
        category: str | None = None,
        routing_status: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a CSR stream for a complete dump of tickets."""
        # Use a larger page size for export query but we iterate to keep memory low
        tickets, _ = await self.ticket_repo.list_tickets(
            status=status,
            category=category,
            routing_status=routing_status,
            page_size=1000,  # Large batch for export
        )

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(
            [
                "Sr. No",
                "Ticket ID",
                "Ticket Number",
                "Title",
                "Description",
                "Category",
                "Status",
                "Priority",
                "Confidence Score",
                "Routing Status",
                "Source Channel",
                "Created At",
                "Assigned At",
            ]
        )
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        for i, t in enumerate(tickets, 1):
            # Extract assigned_at from assignments if available
            assigned_at = ""
            if hasattr(t, "assignments") and t.assignments:
                assigned_at = t.assignments[0].assigned_at.isoformat()

            writer.writerow(
                [
                    i,
                    t.id,
                    t.ticket_number or "N/A",
                    t.title,
                    t.description,
                    t.category,
                    t.status,
                    t.priority or "Normal",
                    f"{t.confidence_score * 100:.1f}%" if t.confidence_score else "0%",
                    t.routing_status,
                    t.source_channel,
                    t.created_at.isoformat() if t.created_at else "",
                    assigned_at,
                ]
            )
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
    async def dispatch_drafts(
        self,
        ticket_id: str,
        drafts: dict,
        user_id: str,
        source_ip: str | None = None,
    ) -> TicketResponse:
        """
        Logic for approving AI drafts and transitioning ticket to in_progress.
        """
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPError.not_found("Ticket not found")

        # 1. Update ticket status to 'in_progress'
        ticket.status = "in_progress"
        ticket = await self.ticket_repo.update(ticket)
        
        # 2. Record in Audit Log
        audit_log = await self.audit_repo.create(
            actor_user_id=user_id,
            action_type="ticket_dispatch",
            target_resource_id=ticket_id,
            source_ip=source_ip or "127.0.0.1",
            metadata={
                "customer_draft": drafts.get("customer_draft", ""),
                "engineer_note": drafts.get("engineer_note", ""),
                "action": "AI_DRAFT_APPROVED"
            }
        )
        
        # 3. Capture Forensic Snapshot (Phase 8 Governance)
        audit_service = AuditService(self.session)
        await audit_service.capture_forensic_snapshot(audit_log.id, ticket_id)

        await self.session.commit()
        return ticket_to_response(ticket)
