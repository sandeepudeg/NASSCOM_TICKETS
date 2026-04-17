from datetime import datetime
from uuid import uuid4
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    Boolean,
    Text,
    Float,
    Enum as SQLEnum,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship, declarative_base
import uuid

Base = declarative_base()


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Folder(Base):
    __tablename__ = "folders"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    owner_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    version = Column(Integer, default=1, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    ticket_assignments = relationship(
        "TicketFolderAssignment", back_populates="folder", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_folders_owner_id", "owner_id"),
        Index("ix_folders_owner_id_name", "owner_id", "name"),
        Index("ix_folders_owner_deleted", "owner_id", "deleted_at"),
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, default=generate_uuid)
    ticket_number = Column(String(50), unique=True, index=True, nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    owner_id = Column(String, nullable=False)
    category = Column(
        SQLEnum(
            "Infrastructure",
            "Application",
            "Security",
            "Database",
            "Storage",
            "Network",
            "Access Management",
            name="category_enum",
        ),
        nullable=True,
    )
    status = Column(
        SQLEnum("open", "in_progress", "resolved", "closed", name="status_enum"),
        default="open",
        nullable=False,
    )
    routing_status = Column(
        SQLEnum(
            "pending_classification",
            "classified",
            "escalated",
            "reviewed",
            name="routing_status_enum",
        ),
        default="pending_classification",
        nullable=False,
    )
    confidence_score = Column(Float, nullable=True)
    priority = Column(String(50), nullable=True)
    source_channel = Column(String(50), default="web", nullable=False)
    structured_payload = Column(Text, nullable=True)
    causal_context_json = Column(Text, nullable=True)
    causal_signal = Column(Text, nullable=True)
    parse_warning = Column(Text, nullable=True)

    # AI Intelligence Persistence
    accuracy = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    semantic_similarity = Column(Float, nullable=True)
    resolution_steps_json = Column(Text, nullable=True)
    resolution_root_cause = Column(Text, nullable=True)
    is_automation_candidate = Column(Boolean, default=False, nullable=False)
    is_repeated_issue = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    resolved_at = Column(DateTime, nullable=True)

    folder_assignments = relationship(
        "TicketFolderAssignment", back_populates="ticket", cascade="all, delete-orphan"
    )
    similar_tickets = relationship(
        "SimilarTicket", back_populates="ticket", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_tickets_owner_id", "owner_id"),
        Index("ix_tickets_category", "category"),
        Index("ix_tickets_routing_status", "routing_status"),
        Index("ix_tickets_status", "status"),
        Index("ix_tickets_created_at", "created_at"),
    )


class TicketFolderAssignment(Base):
    __tablename__ = "ticket_folder_assignments"

    id = Column(String, primary_key=True, default=generate_uuid)
    ticket_id = Column(
        String, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False
    )
    folder_id = Column(
        String, ForeignKey("folders.id", ondelete="CASCADE"), nullable=False
    )
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ticket = relationship("Ticket", back_populates="folder_assignments")
    folder = relationship("Folder", back_populates="ticket_assignments")

    __table_args__ = (
        Index("ix_assignment_ticket_folder", "ticket_id", "folder_id", unique=True),
        Index("ix_assignment_folder", "folder_id"),
    )


class SimilarTicket(Base):
    __tablename__ = "similar_tickets"

    id = Column(String, primary_key=True, default=generate_uuid)
    ticket_id = Column(
        String, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False
    )
    similar_ticket_id = Column(String, nullable=False)
    title = Column(String(500), nullable=False)
    category = Column(
        SQLEnum(
            "Infrastructure",
            "Application",
            "Security",
            "Database",
            "Storage",
            "Network",
            "Access Management",
            name="similar_category_enum",
        ),
        nullable=False,
    )
    resolution_summary = Column(Text, nullable=False)
    similarity_score = Column(Float, nullable=False)

    ticket = relationship("Ticket", back_populates="similar_tickets")

    __table_args__ = (Index("ix_similar_ticket_ticket", "ticket_id"),)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    actor_user_id = Column(String, nullable=False)
    action_type = Column(
        SQLEnum(
            "folder_create",
            "folder_rename",
            "folder_delete",
            "ticket_assign",
            "ticket_unassign",
            "ticket_bulk_assign",
            "ticket_create",
            "ticket_delete",
            "ticket_classify",
            "ticket_escalate",
            "ticket_override",
            "pattern_alert_create",
            "pattern_alert_dismiss",
            "pattern_alert_snooze",
            "pattern_alert_acknowledge",
            "model_promote",
            "webhook_delivery_failed",
            "retrain_skipped_concurrent",
            name="audit_action_enum",
        ),
        nullable=False,
    )
    target_resource_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    source_ip = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_audit_timestamp", "timestamp"),
        Index("ix_audit_actor", "actor_user_id"),
        Index("ix_audit_action", "action_type"),
    )


class PatternAlert(Base):
    __tablename__ = "pattern_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    cluster_size = Column(Integer, nullable=False)
    representative_title = Column(String(500), nullable=False)
    category = Column(
        SQLEnum(
            "Infrastructure",
            "Application",
            "Security",
            "Database",
            "Storage",
            "Network",
            "Access Management",
            name="pattern_category_enum",
        ),
        nullable=False,
    )
    time_window_days = Column(Integer, nullable=False)
    ticket_ids_json = Column(Text, nullable=False)
    status = Column(
        SQLEnum(
            "active", "snoozed", "dismissed", "acknowledged", name="pattern_status_enum"
        ),
        default="active",
        nullable=False,
    )
    snooze_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_pattern_status", "status"),
        Index("ix_pattern_created", "created_at"),
    )


class AgentOverride(Base):
    __tablename__ = "agent_overrides"

    id = Column(String, primary_key=True, default=generate_uuid)
    ticket_id = Column(String, nullable=False)
    original_category = Column(
        SQLEnum(
            "Infrastructure",
            "Application",
            "Security",
            "Database",
            "Storage",
            "Network",
            "Access Management",
            name="override_original_category_enum",
        ),
        nullable=False,
    )
    corrected_category = Column(
        SQLEnum(
            "Infrastructure",
            "Application",
            "Security",
            "Database",
            "Storage",
            "Network",
            "Access Management",
            name="override_corrected_category_enum",
        ),
        nullable=False,
    )
    agent_user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_override_ticket", "ticket_id"),
        Index("ix_override_agent", "agent_user_id"),
    )


class TicketEmbedding(Base):
    __tablename__ = "ticket_embeddings"

    id = Column(String, primary_key=True, default=generate_uuid)
    ticket_id = Column(String, nullable=False, unique=True)
    embedding = Column(Text, nullable=False)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class MappingConfig(Base):
    __tablename__ = "mapping_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    config_json = Column(Text, nullable=False)  # Stores {"source_col": "target_field"}
    owner_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        Index("ix_mapping_config_owner", "owner_id"),
        Index("ix_mapping_config_name", "name"),
    )
