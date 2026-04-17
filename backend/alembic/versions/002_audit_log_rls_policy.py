"""Add RLS policy to audit_log table for append-only enforcement

Revision ID: 002
Revises: 001
Create Date: 2024-01-16 10:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """
    Apply row-level security policy to audit_log table.

    This policy enforces append-only behavior by:
    1. Enabling RLS on the audit_log table
    2. Creating a policy that allows SELECT for all users
    3. Creating a policy that allows INSERT for all users
    4. Explicitly blocking UPDATE and DELETE operations

    Requirements: 28.2
    """
    # PostgreSQL-specific RLS (Row Level Security)
    if op.get_bind().dialect.name == "postgresql":
        # Enable row-level security on audit_log table
        op.execute("ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY")

        # Create policy to allow SELECT for all users
        # This allows reading audit logs for compliance and investigation
        op.execute("""
            CREATE POLICY audit_log_select_policy
            ON audit_log
            FOR SELECT
            USING (true)
        """)

        # Create policy to allow INSERT for all users
        # This allows writing new audit log entries
        op.execute("""
            CREATE POLICY audit_log_insert_policy
            ON audit_log
            FOR INSERT
            WITH CHECK (true)
        """)

        # No policies for UPDATE or DELETE - these operations will be blocked by RLS
        # When RLS is enabled and no policy exists for an operation, that operation is denied

        # Force RLS even for table owner (superuser bypass disabled)
        op.execute("ALTER TABLE audit_log FORCE ROW LEVEL SECURITY")


def downgrade() -> None:
    """
    Remove row-level security policy from audit_log table.
    """
    # Drop policies
    op.execute("DROP POLICY IF EXISTS audit_log_insert_policy ON audit_log")
    op.execute("DROP POLICY IF EXISTS audit_log_select_policy ON audit_log")

    # Disable RLS
    op.execute("ALTER TABLE audit_log NO FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY")
