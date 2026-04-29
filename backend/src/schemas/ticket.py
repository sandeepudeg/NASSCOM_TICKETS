from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Category(str, Enum):
    INFRASTRUCTURE = "Infrastructure"
    APPLICATION = "Application"
    SECURITY = "Security"
    DATABASE = "Database"
    STORAGE = "Storage"
    NETWORK = "Network"
    ACCESS_MANAGEMENT = "Access Management"


class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class RoutingStatus(str, Enum):
    PENDING_CLASSIFICATION = "pending_classification"
    CLASSIFIED = "classified"
    ESCALATED = "escalated"
    REVIEWED = "reviewed"


class CausalContext(BaseModel):
    error_codes: list[str] = Field(default_factory=list)
    service_names: list[str] = Field(default_factory=list)
    severity: str | None = None
    timestamps: list[datetime] = Field(default_factory=list)


class SimilarTicket(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    category: Category
    description: str | None = None
    resolution_summary: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    knowledge_source: str | None = None


class ResolutionSuggestion(BaseModel):
    steps: list[str]
    source_ticket_ids: list[str]
    root_cause: str | None = None


class TicketBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    priority: str | None = None


class TicketCreate(TicketBase):
    source_channel: str | None = "web"
    enable_judge: bool | None = False
    structured_payload: dict[str, Any] | None = None


class TicketUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = Field(None, min_length=1)
    status: TicketStatus | None = None
    category: Category | None = None


class EvaluationMatrix(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    accuracy: float | None = Field(None, ge=0.0, le=1.0)
    f1_score: float | None = Field(None, ge=0.0, le=1.0)
    solution_design: float | None = Field(None, ge=0.0, le=1.0)
    usability: float | None = Field(None, ge=0.0, le=1.0)
    feasibility: float | None = Field(None, ge=0.0, le=1.0)
    security: float | None = Field(None, ge=0.0, le=1.0)
    innovation: float | None = Field(None, ge=0.0, le=1.0)
    semantic_similarity: float | None = Field(None, ge=0.0, le=1.0)
    judge_explanation: str | None = None


class TicketResponse(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_number: str | None = None
    owner_id: str
    category: Category | None = None
    status: TicketStatus = TicketStatus.OPEN
    routing_status: RoutingStatus = RoutingStatus.PENDING_CLASSIFICATION
    confidence_score: float | None = Field(None, ge=0.0, le=1.0)
    causal_context: CausalContext | None = None
    similar_tickets: list[SimilarTicket] = Field(default_factory=list)
    resolution_suggestion: ResolutionSuggestion | None = None
    causal_signal: str | None = None
    parse_warning: str | None = None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    evaluation_matrix: EvaluationMatrix | None = None
    assigned_department: str | None = None
    source_channel: str | None = "web"
    lifecycle_stage: str | None = None
    is_automation_candidate: bool = False
    is_repeated_issue: bool = False
    automation_status: str = "none"
    automation_output: str | None = None
    automation_simulation_report: str | None = None
    automation_runbook_id: str | None = None
    automation_verification_json: str | None = None
    roi_value_saved: float | None = None
    resolution_time_ms: int | None = None
    
    # Intelligence Layer (Phase 3)
    sentiment_score: float = 0.0
    impact_score: float = 0.0
    intelligence_priority: str | None = "medium"
    
    # Predictive Layer (Phase 4)
    complexity_score: int = 1
    estimated_resolution_at: datetime | None = None
    sla_status: str | None = "on_track"


class TicketListResponse(BaseModel):
    tickets: list[TicketResponse] | None = None
    escalations: list[TicketResponse] | None = None
    automation_candidates: list[TicketResponse] | None = None
    automation_archive: list[TicketResponse] | None = None
    page: int = 1
    page_size: int = 50
    total_pages: int = 0
    total: int


class TicketPaginationParams(BaseModel):
    page_size: int = Field(default=50, ge=1, le=200)
    page: int = Field(default=1, ge=1)
    sort_by: str = Field(
        default="assigned_at", pattern="^(assigned_at|status|created_at)$"
    )
    sort_dir: str = Field(default="desc", pattern="^(asc|desc)$")


class ClassificationResult(BaseModel):
    category: Category
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    routing_status: RoutingStatus
    causal_context: CausalContext | None = None
    ticket_number: str | None = None
    causal_signal: str | None = None
    similar_tickets: list[SimilarTicket] = Field(default_factory=list)
    parse_warning: str | None = None
    inference_outcome: str = Field(
        default="success", pattern="^(success|timeout|error)$"
    )
    evaluation_matrix: EvaluationMatrix | None = None
    is_automation_candidate: bool = False
    is_repeated_issue: bool = False
    sentiment_score: float = 0.0
    impact_score: float = 0.0
    complexity_score: int = 1


class BulkAssignRequest(BaseModel):
    ticket_ids: list[str] = Field(..., max_length=100)


class BulkAssignResponse(BaseModel):
    successful: list[str] = Field(default_factory=list)
    failed: list[dict[str, Any]] = Field(default_factory=list)

class OverrideRequest(BaseModel):
    corrected_category: Category
    agent_id: str
