from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict


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
    severity: Optional[str] = None
    timestamps: list[datetime] = Field(default_factory=list)


class SimilarTicket(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    category: Category
    description: Optional[str] = None
    resolution_summary: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    knowledge_source: Optional[str] = None


class ResolutionSuggestion(BaseModel):
    steps: list[str]
    source_ticket_ids: list[str]
    root_cause: Optional[str] = None


class TicketBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    priority: Optional[str] = None


class TicketCreate(TicketBase):
    source_channel: Optional[str] = "web"
    enable_judge: Optional[bool] = False
    structured_payload: Optional[dict[str, Any]] = None


class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, min_length=1)
    status: Optional[TicketStatus] = None
    category: Optional[Category] = None


class EvaluationMatrix(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    accuracy: Optional[float] = Field(None, ge=0.0, le=1.0)
    f1_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    solution_design: Optional[float] = Field(None, ge=0.0, le=1.0)
    usability: Optional[float] = Field(None, ge=0.0, le=1.0)
    feasibility: Optional[float] = Field(None, ge=0.0, le=1.0)
    security: Optional[float] = Field(None, ge=0.0, le=1.0)
    innovation: Optional[float] = Field(None, ge=0.0, le=1.0)
    semantic_similarity: Optional[float] = Field(None, ge=0.0, le=1.0)
    judge_explanation: Optional[str] = None


class TicketResponse(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_number: Optional[str] = None
    owner_id: str
    category: Optional[Category] = None
    status: TicketStatus = TicketStatus.OPEN
    routing_status: RoutingStatus = RoutingStatus.PENDING_CLASSIFICATION
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    causal_context: Optional[CausalContext] = None
    similar_tickets: list[SimilarTicket] = Field(default_factory=list)
    resolution_suggestion: Optional[ResolutionSuggestion] = None
    causal_signal: Optional[str] = None
    parse_warning: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    evaluation_matrix: Optional[EvaluationMatrix] = None
    assigned_department: Optional[str] = None
    source_channel: Optional[str] = "web"
    lifecycle_stage: Optional[str] = None
    is_automation_candidate: bool = False
    is_repeated_issue: bool = False


class TicketListResponse(BaseModel):
    tickets: Optional[list[TicketResponse]] = None
    escalations: Optional[list[TicketResponse]] = None
    automation_candidates: Optional[list[TicketResponse]] = None
    next_cursor: Optional[str] = None
    total: int


class TicketPaginationParams(BaseModel):
    page_size: int = Field(default=50, ge=1, le=200)
    cursor: Optional[str] = None
    sort_by: str = Field(
        default="assigned_at", pattern="^(assigned_at|status|created_at)$"
    )
    sort_dir: str = Field(default="desc", pattern="^(asc|desc)$")


class ClassificationResult(BaseModel):
    category: Category
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    routing_status: RoutingStatus
    causal_context: Optional[CausalContext] = None
    ticket_number: Optional[str] = None
    causal_signal: Optional[str] = None
    similar_tickets: list[SimilarTicket] = Field(default_factory=list)
    parse_warning: Optional[str] = None
    inference_outcome: str = Field(default="success", pattern="^(success|timeout|error)$")
    evaluation_matrix: Optional[EvaluationMatrix] = None
    is_automation_candidate: bool = False
    is_repeated_issue: bool = False


class BulkAssignRequest(BaseModel):
    ticket_ids: list[str] = Field(..., max_length=100)


class BulkAssignResponse(BaseModel):
    successful: list[str] = Field(default_factory=list)
    failed: list[dict[str, Any]] = Field(default_factory=list)
