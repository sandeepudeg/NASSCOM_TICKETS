# Implementation Plan: TicketIQ Enterprise Ingestion & Strategic Utility

This finalized plan initiates a parallel development track for both the backend ETL pipeline and the frontend Mapping Wizard, now featuring a **Smart Mapping Persistence** layer for recurring domain-specific imports.

## Proposed Changes (Parallel Tracks)

### Track 1: Backend ETL & Feature Extraction
The target is a high-performance ingestion engine that redacts and vectorizes data in real-time.

#### [NEW] [import_service.py](file:///d:/Learning/Self_learning/Nasscom/Tickets/backend/src/services/import_service.py)
- **Flexible Mapping Engine**: A core service that takes a `mapping_config` JSON and applies it to parsed spreadsheet rows.
- **Mapping Persistence**: Logic to store and retrieve named mapping configurations (e.g., "Monthly Hospital Log" or "Gov Form v2") in the database.
- **Auto-Feature Extraction**: Integration with `StructuredInputParser` to automatically "mine" data (error codes, intents, entities) from descriptions during ingestion.
- **Embedded Privacy Layer**: Mandatory **PII Scrubbing** before any data is persisted.

#### [MODIFY] [tickets.py](file:///d:/Learning/Self_learning/Nasscom/Tickets/backend/src/api/tickets.py)
- New endpoint `POST /api/v1/tickets/import` for file uploads.
- New endpoints `GET /api/v1/tickets/import/mappings` and `POST /api/v1/tickets/import/mappings` to manage saved configurations.

---

### Track 2: Frontend Mapping Wizard
The target is a "plug-and-play" UI for domain stakeholders (Health, Legal, Gov).

#### [NEW] [ImportWorkspace.tsx](file:///d:/Learning/Self_learning/Nasscom/Tickets/frontend/src/pages/ImportWorkspace.tsx)
- **Universal Column Mapper**:
  1.  **Selection**: Upload any spreadsheet.
  2.  **Mapping UI**: A visual field-picker that allows users to map their domain-specific columns to TicketIQ standard fields.
- **Save Configuration Toggle**: Option to save current mapping for future use.
- **Mapping Selector**: Dropdown to choose from previously saved mappings ("Healthcare Template", etc.).
- **Real-time Sanitization Summary**: Preview of PII redactions.

#### [MODIFY] [SettingsPage.tsx](file:///d:/Learning/Self_learning/Nasscom/Tickets/frontend/src/pages/SettingsPage.tsx)
- **Add a "Data Ingestion" Tab**: A dedicated section for all import activities.

#### [MODIFY] [DashboardPage.tsx](file:///d:/Learning/Self_learning/Nasscom/Tickets/frontend/src/pages/DashboardPage.tsx)
- **Operational Entry**: Update "Intelligence Hub" / "Quick Command Center" to include an **"IMPORT DATA"** command.
- **One-Click Sync**: Wire "SYNC ALL" button to execute a background ingestion using last-saved mapping.

---

## Strategic Alignment

This implementation addresses the Hackathon "Cross-Domain" metrics by providing:
- **Clean Ingestion**: Placing "Import" in Settings follows enterprise standards for administrative data management.
- **Privacy Auditability**: Explicitly showing redaction counts in the Settings success report.
- **Operational Scalability**: "Saved Mappings" ensure stakeholders (Legal, Health) can scale their domain imports without repeated configuration.
