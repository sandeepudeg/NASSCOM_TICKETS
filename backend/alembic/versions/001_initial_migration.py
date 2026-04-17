"""Initial migration with all tables and pgvector index

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Create enum types
    op.execute("""
        CREATE TYPE category_enum AS ENUM (
            'Infrastructure', 'Application', 'Security', 
            'Database', 'Storage', 'Network', 'Access Management'
        )
    """)
    
    op.execute("""
        CREATE TYPE status_enum AS ENUM (
            'open', 'in_progress', 'resolved', 'closed'
        )
    """)
    
    op.execute("""
        CREATE TYPE routing_status_enum AS ENUM (
            'pending_classification', 'classified', 'escalated', 'reviewed'
        )
    """)
    
    op.execute("""
        CREATE TYPE audit_action_enum AS ENUM (
            'folder_create', 'folder_rename', 'folder_delete',
            'ticket_assign', 'ticket_unassign', 'ticket_bulk_assign',
            'ticket_create', 'ticket_delete', 'ticket_classify',
            'ticket_escalate', 'ticket_override',
            'pattern_alert_create', 'pattern_alert_dismiss',
            'pattern_alert_snooze', 'pattern_alert_acknowledge',
            'model_promote', 'webhook_delivery_failed',
            'retrain_skipped_concurrent'
        )
    """)
    
    op.execute("""
        CREATE TYPE pattern_status_enum AS ENUM (
            'active', 'snoozed', 'dismissed', 'acknowledged'
        )
    """)
    
    # Create folders table
    op.create_table(
        'folders',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('owner_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_folders_owner_id', 'folders', ['owner_id'])
    op.create_index('ix_folders_owner_id_name', 'folders', ['owner_id', 'name'])
    op.create_index('ix_folders_owner_deleted', 'folders', ['owner_id', 'deleted_at'])
    
    # Create tickets table
    op.create_table(
        'tickets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('owner_id', sa.String(), nullable=False),
        sa.Column('category', sa.Enum(
            'Infrastructure', 'Application', 'Security', 
            'Database', 'Storage', 'Network', 'Access Management',
            name='category_enum'
        ), nullable=True),
        sa.Column('status', sa.Enum(
            'open', 'in_progress', 'resolved', 'closed',
            name='status_enum'
        ), nullable=False, server_default='open'),
        sa.Column('routing_status', sa.Enum(
            'pending_classification', 'classified', 'escalated', 'reviewed',
            name='routing_status_enum'
        ), nullable=False, server_default='pending_classification'),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('priority', sa.String(length=50), nullable=True),
        sa.Column('structured_payload', sa.Text(), nullable=True),
        sa.Column('causal_context_json', sa.Text(), nullable=True),
        sa.Column('causal_signal', sa.Text(), nullable=True),
        sa.Column('parse_warning', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tickets_owner_id', 'tickets', ['owner_id'])
    op.create_index('ix_tickets_category', 'tickets', ['category'])
    op.create_index('ix_tickets_routing_status', 'tickets', ['routing_status'])
    op.create_index('ix_tickets_status', 'tickets', ['status'])
    op.create_index('ix_tickets_created_at', 'tickets', ['created_at'])
    
    # Create ticket_folder_assignments table
    op.create_table(
        'ticket_folder_assignments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('ticket_id', sa.String(), nullable=False),
        sa.Column('folder_id', sa.String(), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['folder_id'], ['folders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_assignment_ticket_folder', 'ticket_folder_assignments', 
                    ['ticket_id', 'folder_id'], unique=True)
    op.create_index('ix_assignment_folder', 'ticket_folder_assignments', ['folder_id'])
    
    # Create ticket_embeddings table with pgvector
    op.create_table(
        'ticket_embeddings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('ticket_id', sa.String(), nullable=False),
        sa.Column('embedding', sa.Text(), nullable=False),  # Will store vector as text initially
        sa.Column('model_version', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ticket_id')
    )
    op.create_index('ix_embedding_ticket', 'ticket_embeddings', ['ticket_id'])
    
    # Alter embedding column to use pgvector type (384 dimensions for all-MiniLM-L6-v2)
    op.execute('ALTER TABLE ticket_embeddings ALTER COLUMN embedding TYPE vector(384) USING embedding::vector(384)')
    
    # Create pgvector ivfflat index for ANN search
    op.execute("""
        CREATE INDEX idx_embeddings_vector ON ticket_embeddings 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    """)
    
    # Create similar_tickets table
    op.create_table(
        'similar_tickets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('ticket_id', sa.String(), nullable=False),
        sa.Column('similar_ticket_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('category', sa.Enum(
            'Infrastructure', 'Application', 'Security', 
            'Database', 'Storage', 'Network', 'Access Management',
            name='similar_category_enum'
        ), nullable=False),
        sa.Column('resolution_summary', sa.Text(), nullable=False),
        sa.Column('similarity_score', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_similar_ticket_ticket', 'similar_tickets', ['ticket_id'])
    
    # Create audit_log table
    op.create_table(
        'audit_log',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('actor_user_id', sa.String(), nullable=False),
        sa.Column('action_type', sa.Enum(
            'folder_create', 'folder_rename', 'folder_delete',
            'ticket_assign', 'ticket_unassign', 'ticket_bulk_assign',
            'ticket_create', 'ticket_delete', 'ticket_classify',
            'ticket_escalate', 'ticket_override',
            'pattern_alert_create', 'pattern_alert_dismiss',
            'pattern_alert_snooze', 'pattern_alert_acknowledge',
            'model_promote', 'webhook_delivery_failed',
            'retrain_skipped_concurrent',
            name='audit_action_enum'
        ), nullable=False),
        sa.Column('target_resource_id', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('source_ip', sa.String(), nullable=True),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_timestamp', 'audit_log', ['timestamp'])
    op.create_index('ix_audit_actor', 'audit_log', ['actor_user_id'])
    op.create_index('ix_audit_action', 'audit_log', ['action_type'])
    
    # Create pattern_alerts table
    op.create_table(
        'pattern_alerts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('cluster_size', sa.Integer(), nullable=False),
        sa.Column('representative_title', sa.String(length=500), nullable=False),
        sa.Column('category', sa.Enum(
            'Infrastructure', 'Application', 'Security', 
            'Database', 'Storage', 'Network', 'Access Management',
            name='pattern_category_enum'
        ), nullable=False),
        sa.Column('time_window_days', sa.Integer(), nullable=False),
        sa.Column('ticket_ids_json', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum(
            'active', 'snoozed', 'dismissed', 'acknowledged',
            name='pattern_status_enum'
        ), nullable=False, server_default='active'),
        sa.Column('snooze_until', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pattern_status', 'pattern_alerts', ['status'])
    op.create_index('ix_pattern_created', 'pattern_alerts', ['created_at'])
    
    # Create agent_overrides table
    op.create_table(
        'agent_overrides',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('ticket_id', sa.String(), nullable=False),
        sa.Column('original_category', sa.Enum(
            'Infrastructure', 'Application', 'Security', 
            'Database', 'Storage', 'Network', 'Access Management',
            name='override_original_category_enum'
        ), nullable=False),
        sa.Column('corrected_category', sa.Enum(
            'Infrastructure', 'Application', 'Security', 
            'Database', 'Storage', 'Network', 'Access Management',
            name='override_corrected_category_enum'
        ), nullable=False),
        sa.Column('agent_user_id', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_override_ticket', 'agent_overrides', ['ticket_id'])
    op.create_index('ix_override_agent', 'agent_overrides', ['agent_user_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_override_agent', table_name='agent_overrides')
    op.drop_index('ix_override_ticket', table_name='agent_overrides')
    op.drop_table('agent_overrides')
    
    op.drop_index('ix_pattern_created', table_name='pattern_alerts')
    op.drop_index('ix_pattern_status', table_name='pattern_alerts')
    op.drop_table('pattern_alerts')
    
    op.drop_index('ix_audit_action', table_name='audit_log')
    op.drop_index('ix_audit_actor', table_name='audit_log')
    op.drop_index('ix_audit_timestamp', table_name='audit_log')
    op.drop_table('audit_log')
    
    op.drop_index('ix_similar_ticket_ticket', table_name='similar_tickets')
    op.drop_table('similar_tickets')
    
    op.execute('DROP INDEX IF EXISTS idx_embeddings_vector')
    op.drop_index('ix_embedding_ticket', table_name='ticket_embeddings')
    op.drop_table('ticket_embeddings')
    
    op.drop_index('ix_assignment_folder', table_name='ticket_folder_assignments')
    op.drop_index('ix_assignment_ticket_folder', table_name='ticket_folder_assignments')
    op.drop_table('ticket_folder_assignments')
    
    op.drop_index('ix_tickets_created_at', table_name='tickets')
    op.drop_index('ix_tickets_status', table_name='tickets')
    op.drop_index('ix_tickets_routing_status', table_name='tickets')
    op.drop_index('ix_tickets_category', table_name='tickets')
    op.drop_index('ix_tickets_owner_id', table_name='tickets')
    op.drop_table('tickets')
    
    op.drop_index('ix_folders_owner_deleted', table_name='folders')
    op.drop_index('ix_folders_owner_id_name', table_name='folders')
    op.drop_index('ix_folders_owner_id', table_name='folders')
    op.drop_table('folders')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS pattern_status_enum')
    op.execute('DROP TYPE IF EXISTS audit_action_enum')
    op.execute('DROP TYPE IF EXISTS routing_status_enum')
    op.execute('DROP TYPE IF EXISTS status_enum')
    op.execute('DROP TYPE IF EXISTS category_enum')
    op.execute('DROP TYPE IF EXISTS similar_category_enum')
    op.execute('DROP TYPE IF EXISTS pattern_category_enum')
    op.execute('DROP TYPE IF EXISTS override_original_category_enum')
    op.execute('DROP TYPE IF EXISTS override_corrected_category_enum')
    
    # Drop pgvector extension
    op.execute('DROP EXTENSION IF EXISTS vector')
