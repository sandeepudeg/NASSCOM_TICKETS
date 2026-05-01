# System Baseline & Restoration Guide

This document defines the stable baseline for the TicketIQ platform as of May 2026, specifically covering the **Agentic Simulation** and **Data Ingestion** fixes. Use these instructions to restore the system if the database or environment is reset.

## 1. Database Configuration (Critical)

The **Agentic Simulation** requires specific values in the `audit_action_enum` type. These must be applied manually to the PostgreSQL database as they are part of the industrial-grade auditing logic.

### SQL Restoration Commands:
```sql
-- Connect to the 'tickets' database and run:
ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'ticket_simulate';
ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'ticket_remediate';
ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'ticket_verify';
```

---

## 2. Source Code Baseline

### Backend: Automation Resilience
**File**: `backend/src/services/automation_service.py`
- **Timeout**: Set to `120.0` seconds for Safety Audits.
- **Error Handling**: Implemented `rollback()` in all exception blocks to prevent cascading `InvalidRequestError` (500) responses.
- **Audit Logging**: Uses `ticket_simulate` for tracking dry-runs.

### Backend: Schema Definitions
**File**: `backend/src/repositories/models.py`
- **AuditLog**: The `action_type` column's `SQLEnum` must match the values added in Step 1.

### Frontend: State Synchronization
**File**: `frontend/src/workspaces/ImportWorkspace.tsx`
- **Cache Invalidation**: Triggers `queryClient.invalidateQueries` for `folders-stats`, `tickets-count`, and intelligence metrics immediately after a successful CSV ingestion.

---

## 3. Re-Deployment Procedure

If you make changes to the frontend or backend source code, follow this sequence to apply them:

1. **Rebuild Frontend (if UI changes are made)**:
   ```powershell
   cd docker
   docker compose build frontend
   docker compose up -d frontend
   ```

2. **Restart API (for Python changes)**:
   The API container supports hot-reloading (`UVICORN_RELOAD=true`), but a full restart ensures all DB connections are fresh:
   ```powershell
   docker compose restart api
   ```

## 4. Verification Checklist
- [ ] Login as `admin`.
- [ ] Upload a 50-ticket CSV in **Import Data**.
- [ ] Verify sidebar counts update **instantly** without logout.
- [ ] Open a ticket and click **Run Agentic Simulation**.
- [ ] Verify the "Requesting AI Safety Audit" step completes without "Internal Server Error".
