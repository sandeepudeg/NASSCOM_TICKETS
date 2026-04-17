# Audit Log Archival

## Overview

The audit log archival system ensures compliance with data retention policies by automatically archiving old audit logs to object storage (MinIO) and maintaining them for the required retention period.

## Requirements

- **Primary Retention**: Audit logs are retained in the PostgreSQL database for 12 months
- **Archive Retention**: Archived logs are stored in MinIO for an additional 5 years (60 months total retention)
- **Append-Only Enforcement**: Row-level security (RLS) policies prevent UPDATE and DELETE operations on active audit logs

## Architecture

### Row-Level Security (RLS)

The `audit_log` table is protected by PostgreSQL RLS policies that enforce append-only behavior:

- **SELECT Policy**: Allows all users to read audit logs
- **INSERT Policy**: Allows all users to write new audit log entries
- **UPDATE/DELETE**: No policies exist for these operations, effectively blocking them

The RLS policy is applied via Alembic migration `002_audit_log_rls_policy.py`.

### Archival Process

The archival job runs monthly (1st of each month at 4 AM) and performs the following steps:

1. **Fetch Old Logs**: Query audit logs older than 12 months
2. **Upload to MinIO**: Store logs as JSON in the `audit-archive` bucket under `archive/audit_logs_YYYYMMDD_HHMMSS.json`
3. **Delete from Database**: Remove archived logs from PostgreSQL (requires elevated privileges to bypass RLS)
4. **Audit the Archival**: Create a new audit log entry documenting the archival operation

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@postgres:5432/tickets_db` | PostgreSQL connection string |
| `OBJECT_STORAGE_ENDPOINT` | `http://localhost:9000` | MinIO endpoint URL |
| `OBJECT_STORAGE_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `OBJECT_STORAGE_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `AUDIT_ARCHIVE_RETENTION_MONTHS` | `12` | Number of months to retain logs in primary database |

### Docker Compose Service

The archival job runs as a Docker Compose service:

```yaml
archive-audit-logs:
  build: .
  container_name: tickets_archive_audit_logs
  environment:
    DATABASE_URL: postgresql+asyncpg://postgres:postgres@postgres:5432/tickets_db
    OBJECT_STORAGE_ENDPOINT: http://minio:9000
    OBJECT_STORAGE_ACCESS_KEY: minioadmin
    OBJECT_STORAGE_SECRET_KEY: minioadmin
    AUDIT_ARCHIVE_RETENTION_MONTHS: "12"
  volumes:
    - ./scripts/archive_audit_logs.py:/app/archive_audit_logs.py:ro
  command: # Cron job runs monthly on 1st at 4 AM
```

## Manual Execution

To manually run the archival job:

```bash
# Using Docker Compose
docker compose exec archive-audit-logs python /app/archive_audit_logs.py

# Or directly with Python (requires database and MinIO access)
python scripts/archive_audit_logs.py
```

## Archive Format

Archived logs are stored as JSON files with the following structure:

```json
{
  "archived_at": "2024-01-15T04:00:00Z",
  "record_count": 1523,
  "logs": [
    {
      "id": "uuid",
      "actor_user_id": "user-123",
      "action_type": "folder_create",
      "target_resource_id": "resource-uuid",
      "timestamp": "2023-01-10T10:30:00Z",
      "source_ip": "192.168.1.100",
      "metadata_json": "{\"folder_name\": \"Infrastructure\"}"
    }
  ]
}
```

## Monitoring

The archival job emits structured JSON logs:

```json
{
  "timestamp": "2024-01-15T04:00:00Z",
  "level": "INFO",
  "service": "archive-audit-logs",
  "event": "archive_completed_successfully",
  "logs_archived": 1523,
  "logs_deleted": 1523,
  "minio_object": "archive/audit_logs_20240115_040000.json"
}
```

### Key Events

- `archive_started`: Archival job begins
- `archive_logs_found`: Number of logs to archive
- `archive_logs_deleted`: Number of logs removed from database
- `archive_completed_successfully`: Archival completed
- `archive_completed_no_logs`: No logs needed archiving
- `archive_failed`: Archival encountered an error

## Testing

### Unit Tests

Run unit tests for the archival script:

```bash
pytest tests/unit/test_archive_audit_logs.py -v
```

### Integration Tests

Run integration tests for RLS enforcement:

```bash
pytest tests/integration/test_integration.py::test_audit_log_rls_blocks_update -v
pytest tests/integration/test_integration.py::test_audit_log_rls_blocks_delete -v
pytest tests/integration/test_integration.py::test_audit_log_rls_allows_insert -v
pytest tests/integration/test_integration.py::test_audit_log_rls_allows_select -v
```

**Note**: RLS tests require PostgreSQL and will be skipped when running against SQLite.

## Security Considerations

1. **RLS Bypass**: The archival job requires elevated privileges to delete archived logs. This is controlled by setting `row_security = off` within the transaction scope.

2. **Access Control**: MinIO bucket access should be restricted to the archival service and authorized administrators.

3. **Audit Trail**: Every archival operation creates a new audit log entry, ensuring a complete audit trail.

4. **Immutability**: Active audit logs cannot be modified or deleted due to RLS policies, ensuring data integrity.

## Troubleshooting

### Archival Job Not Running

Check the cron job status:

```bash
docker compose exec archive-audit-logs crontab -l
docker compose logs archive-audit-logs
```

### MinIO Connection Errors

Verify MinIO is accessible:

```bash
docker compose exec archive-audit-logs curl -f http://minio:9000/minio/health/live
```

### Database Connection Errors

Verify PostgreSQL is accessible:

```bash
docker compose exec archive-audit-logs pg_isready -h postgres -p 5432
```

### RLS Policy Issues

Check if RLS is enabled:

```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'audit_log';
```

List RLS policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'audit_log';
```

## Compliance

This archival system helps meet the following compliance requirements:

- **Requirement 28.2**: Audit log entries are stored in an append-only table protected by RLS
- **Requirement 28.3**: Audit logs are retained for 12 months in primary database, then archived for 5 years

Total retention period: **6 years** (12 months active + 60 months archived)
