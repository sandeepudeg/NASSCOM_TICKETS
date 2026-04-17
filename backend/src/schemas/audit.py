from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class AuditAction(str, Enum):
    FOLDER_CREATE = "folder_create"
    FOLDER_RENAME = "folder_rename"
    FOLDER_DELETE = "folder_delete"
    TICKET_ASSIGN = "ticket_assign"
    TICKET_UNASSIGN = "ticket_unassign"
    TICKET_BULK_ASSIGN = "ticket_bulk_assign"
    TICKET_CLASSIFY = "ticket_classify"
    TICKET_ESCALATE = "ticket_escalate"
    TICKET_OVERRIDE = "ticket_override"
    PATTERN_ALERT_CREATE = "pattern_alert_create"
    PATTERN_ALERT_DISMISS = "pattern_alert_dismiss"
    PATTERN_ALERT_SNOOZE = "pattern_alert_snooze"
    PATTERN_ALERT_ACKNOWLEDGE = "pattern_alert_acknowledge"
    MODEL_PROMOTE = "model_promote"


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_user_id: str
    action_type: AuditAction
    target_resource_id: str
    timestamp: datetime
    source_ip: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AuditLogListResponse(BaseModel):
    entries: list[AuditLogEntry]
    next_cursor: Optional[str] = None
    total: int


class PatternAlertStatus(str, Enum):
    ACTIVE = "active"
    SNOOZED = "snoozed"
    DISMISSED = "dismissed"
    ACKNOWLEDGED = "acknowledged"


class PatternAlert(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    cluster_size: int
    representative_title: str
    category: str
    time_window_days: int
    ticket_ids: list[str]
    status: PatternAlertStatus = PatternAlertStatus.ACTIVE
    snooze_until: Optional[datetime] = None
    created_at: datetime
    acknowledged_at: Optional[datetime] = None


class PatternAlertResponse(BaseModel):
    alerts: list[PatternAlert]


class AgentOverrideRecord(BaseModel):
    id: str
    ticket_id: str
    original_category: str
    corrected_category: str
    agent_user_id: str
    timestamp: datetime
