-- Enable RLS and basic policies for audit_log (PostgreSQL)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow owner to read their own audit entries
CREATE POLICY audit_log_owner_select
ON audit_log
FOR SELECT
USING (actor_user_id = current_setting('app.current_user_id', true));

-- Allow insert only via API role, forbid updates/deletes
GRANT INSERT, SELECT ON audit_log TO api_role;
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC, api_role;

-- Archival helper: move rows older than 90 days
-- Run as a scheduled job (cron/Celery beat)
-- INSERT INTO audit_log_archive SELECT * FROM audit_log WHERE timestamp < now() - interval '90 days';
-- DELETE FROM audit_log WHERE timestamp < now() - interval '90 days';
