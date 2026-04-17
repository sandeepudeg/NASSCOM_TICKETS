# Project Structure

## Overview

This document describes the standardized directory structure of the Tickets Folder Feature project.

## Directory Layout

```
tickets/
├── .github/                      # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml               # CI/CD pipeline
│
├── .kiro/                        # Kiro AI assistant specs
│   └── specs/
│       └── tickets-folder/      # Feature specifications
│
├── src/                          # Main source code
│   ├── api/                      # FastAPI routers (HTTP layer)
│   │   ├── __init__.py
│   │   ├── classification.py    # Classification endpoints
│   │   ├── escalations.py       # Escalation management
│   │   ├── folders.py           # Folder CRUD operations
│   │   ├── health.py            # Health check endpoints
│   │   ├── model_metrics.py     # ML metrics endpoints
│   │   └── tickets.py           # Ticket management
│   │
│   ├── ml/                       # Machine learning pipeline
│   │   ├── __init__.py
│   │   ├── classifier.py        # Ticket classifier
│   │   ├── embedding_service.py # Embedding generation
│   │   ├── escalation_service.py# Escalation logic
│   │   ├── pattern_detection.py # Pattern detection
│   │   ├── pii_scrubber.py      # PII scrubbing
│   │   ├── rag_service.py       # RAG pipeline
│   │   └── structured_input_parser.py
│   │
│   ├── repositories/             # Data access layer
│   │   ├── __init__.py
│   │   ├── audit_repository.py  # Audit log access
│   │   ├── database.py          # Database connection
│   │   ├── folder_repository.py # Folder data access
│   │   ├── models.py            # SQLAlchemy models
│   │   └── ticket_repository.py # Ticket data access
│   │
│   ├── schemas/                  # Pydantic models (DTOs)
│   │   ├── __init__.py
│   │   ├── audit.py             # Audit schemas
│   │   ├── errors.py            # Error schemas
│   │   ├── folder.py            # Folder schemas
│   │   ├── settings.py          # Application settings
│   │   └── ticket.py            # Ticket schemas
│   │
│   ├── services/                 # Business logic layer
│   │   ├── __init__.py
│   │   ├── drift_monitor.py     # Model drift monitoring
│   │   ├── folder_service.py    # Folder business logic
│   │   ├── ticket_assignment_service.py
│   │   └── ticket_service.py    # Ticket business logic
│   │
│   └── __init__.py
│
├── scripts/                      # Utility scripts
│   ├── ml/                       # ML-related scripts
│   │   ├── download_datasets.py # Download Kaggle datasets
│   │   ├── evaluate_classifier.py# Model evaluation
│   │   ├── retrain_classifier.py# Model retraining
│   │   ├── rollback_classifier.py# Model rollback
│   │   ├── ingest_ticket.py     # Ticket ingestion
│   │   ├── inspect_dataset.py   # Dataset inspection
│   │   └── monitor_drift.py     # Drift monitoring
│   │
│   ├── db/                       # Database scripts
│   │   ├── archive_audit_logs.py# Archive old logs
│   │   ├── purge_deleted_folders.py
│   │   └── backup_postgres.sh   # Database backup
│   │
│   ├── utils/                    # Utility scripts
│   │   ├── check_dataset_schema.py
│   │   ├── bootstrap_dataset.py # Bootstrap test data
│   │   └── export_tickets.py    # Export tickets
│   │
│   └── e2e/                      # E2E test runners
│       ├── run_e2e_tests.sh     # Unix E2E runner
│       └── run_e2e_tests.ps1    # Windows E2E runner
│
├── tests/                        # Test suite
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── property/                 # Property-based tests
│   ├── e2e/                      # End-to-end tests
│   ├── conftest.py              # Pytest configuration
│   └── pytest.ini               # Pytest settings
│
├── alembic/                      # Database migrations
│   ├── versions/                 # Migration scripts
│   ├── env.py                   # Alembic environment
│   └── script.py.mako           # Migration template
│
├── docs/                         # Documentation
│   ├── architecture/             # Architecture docs
│   │   ├── ARCHITECTURE.md
│   │   ├── design.md
│   │   └── DOMAIN_ADAPTATION.md
│   ├── datasets/                 # Dataset documentation
│   │   ├── DATASET_LICENSES.md
│   │   ├── DATASET_SCHEMA_MAPPING.md
│   │   └── DATASET_MAPPING_IMPLEMENTATION.md
│   ├── ml/                       # ML documentation
│   │   └── MODEL_CARD.md
│   ├── operations/               # Operational docs
│   │   ├── audit_log_archival.md
│   │   ├── observability.md
│   │   ├── security.md
│   │   └── token_refresh.md
│   ├── frontend/                 # Frontend docs
│   │   └── frontend_matrix.md
│   ├── requirements/             # Requirements docs
│   │   └── requirements_v2_1.md
│   ├── tasks/                    # Task summaries
│   │   └── TASK_27_SUMMARY.md
│   ├── guides/                   # User guides
│   │   ├── agents.md
│   │   └── skills.md
│   └── README.md                # Documentation index
│
├── config/                       # Configuration files
│   ├── classifier_config.yaml   # Classifier configuration
│   ├── prometheus.yml           # Prometheus config
│   ├── alembic.ini              # Alembic configuration
│   ├── mypy.ini                 # MyPy configuration
│   └── observability.py         # Observability setup
│
├── data/                         # Data directory
│   ├── datasets/                 # Downloaded datasets
│   ├── models/                   # Model artifacts
│   ├── reports/                  # Evaluation reports
│   │   └── .gitkeep
│   └── .gitkeep
│
├── db/                           # Database SQL scripts
│   └── audit_rls.sql            # Row-level security
│
├── docker/                       # Docker configuration
│   ├── Dockerfile               # Backend container
│   ├── docker-compose.yml       # Service orchestration
│   └── .dockerignore            # Docker ignore rules
│
├── frontend/                     # React frontend
│   ├── src/                      # Frontend source
│   ├── public/                   # Static assets
│   ├── Dockerfile               # Frontend container
│   ├── package.json             # NPM dependencies
│   └── vite.config.ts           # Vite configuration
│
├── flask_admin/                  # Flask admin interface
│   ├── static/                   # Static assets (CSS, JS, favicon)
│   │   ├── css/                  # Custom stylesheets
│   │   │   └── style.css        # Main stylesheet
│   │   ├── js/                   # Client-side JavaScript
│   │   │   └── app.js           # Main JavaScript file
│   │   └── favicon.ico          # Application icon
│   ├── templates/                # Jinja2 HTML templates
│   │   ├── base.html            # Base template with navigation
│   │   ├── dashboard.html       # Dashboard page
│   │   ├── folders.html         # Folder management
│   │   ├── create_ticket.html   # Ticket creation form
│   │   ├── classify_test.html   # Classification testing
│   │   ├── health.html          # System health monitoring
│   │   ├── 404.html             # Not found error page
│   │   ├── 500.html             # Server error page
│   │   └── 403.html             # Forbidden error page
│   ├── utils/                    # Utility modules
│   │   ├── __init__.py
│   │   └── api_client.py        # FastAPI client for backend communication
│   ├── app.py                    # Main Flask application
│   ├── config.py                # Configuration management
│   └── __init__.py              # Package initialization
│
├── demo/                         # Demo files
│   └── index.html               # Demo page
│
├── app.py                        # HF Spaces entry point (Flask admin)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── main.py                       # Application entry point
├── pyproject.toml                # Python project config
├── requirements.txt              # Python dependencies
├── requirements_core.txt         # Core dependencies
├── playwright.config.py          # Playwright config
├── README.md                     # Main README
├── PROJECT_STRUCTURE.md          # This file
└── REORGANIZATION_PLAN.md        # Reorganization plan
```

## Key Directories

### `src/` - Source Code
Contains all production source code organized by layer:
- **api/**: HTTP endpoints and request/response handling
- **ml/**: Machine learning pipeline and models
- **repositories/**: Database access and ORM models
- **schemas/**: Data transfer objects (DTOs) and validation
- **services/**: Business logic and orchestration

### `scripts/` - Utility Scripts
Organized by purpose:
- **ml/**: Machine learning operations (training, evaluation, etc.)
- **db/**: Database maintenance and backup
- **utils/**: General utility scripts
- **e2e/**: End-to-end test execution

### `tests/` - Test Suite
Organized by test type:
- **unit/**: Fast, isolated unit tests
- **integration/**: Tests with real dependencies
- **property/**: Property-based tests (Hypothesis)
- **e2e/**: End-to-end browser tests (Playwright)

### `docs/` - Documentation
Organized by topic:
- **architecture/**: System design and architecture
- **datasets/**: Dataset documentation and licensing
- **ml/**: Machine learning model documentation
- **operations/**: Operational guides and procedures
- **requirements/**: System requirements
- **guides/**: User and developer guides

### `flask_admin/` - Flask Admin Interface
Web-based admin interface for system management:
- **static/**: Client-side assets (CSS, JavaScript, images)
  - **css/**: Custom stylesheets for responsive design
  - **js/**: Client-side functionality and AJAX interactions
- **templates/**: Jinja2 HTML templates with Bootstrap 5 styling
  - **base.html**: Common layout with navigation and flash messages
  - Page templates for dashboard, folders, tickets, classification, and health monitoring
  - Custom error pages (404, 500, 403) with consistent branding
- **utils/**: Utility modules for backend integration
  - **api_client.py**: HTTP client for FastAPI backend communication
- **app.py**: Main Flask application with route definitions
- **config.py**: Environment-based configuration management

### `config/` - Configuration
All configuration files in one place:
- Application configuration
- Tool configuration (mypy, alembic, etc.)
- Infrastructure configuration (prometheus, etc.)

### `data/` - Data Storage
Runtime data storage:
- **datasets/**: Downloaded training datasets
- **models/**: Trained model artifacts
- **reports/**: Evaluation and monitoring reports

## Import Conventions

### Python Imports
All imports use the `src.` prefix:

```python
# Correct
from src.api import folders
from src.ml.classifier import TicketClassifier
from src.repositories.database import get_db
from src.schemas.ticket import TicketCreate
from src.services.folder_service import FolderService

# Incorrect (old style)
from api import folders
from ml.classifier import TicketClassifier
```

### Script Imports
Scripts in `scripts/` can import from `src/`:

```python
# In scripts/ml/retrain_classifier.py
from src.ml.classifier import TicketClassifier
from src.repositories.models import Ticket
```

## Running Scripts

### ML Scripts
```bash
# From project root
python scripts/ml/download_datasets.py
python scripts/ml/evaluate_classifier.py
python scripts/ml/retrain_classifier.py
```

### Database Scripts
```bash
python scripts/db/archive_audit_logs.py
bash scripts/db/backup_postgres.sh
```

### Utility Scripts
```bash
python scripts/utils/check_dataset_schema.py
python scripts/utils/bootstrap_dataset.py
```

## Docker Usage

### Build and Run
```bash
# From project root
cd docker
docker-compose up --build
```

### Individual Services
```bash
cd docker
docker-compose up api          # FastAPI backend
docker-compose up frontend     # React frontend  
docker-compose up flask-admin  # Flask admin interface
```

## Testing

### Run All Tests
```bash
pytest tests/
```

### Run Specific Test Types
```bash
pytest tests/unit/           # Unit tests only
pytest tests/integration/    # Integration tests only
pytest tests/property/       # Property-based tests only
pytest tests/e2e/            # E2E tests only
```

### Run E2E Tests
```bash
# Unix/Linux/Mac
bash scripts/e2e/run_e2e_tests.sh

# Windows
powershell scripts/e2e/run_e2e_tests.ps1
```

## Development Workflow

1. **Source Code**: Edit files in `src/`
2. **Tests**: Add tests in `tests/`
3. **Scripts**: Add utilities in `scripts/`
4. **Documentation**: Update docs in `docs/`
5. **Configuration**: Modify configs in `config/`

## Benefits of This Structure

1. **Clear Separation**: Source code, scripts, tests, and docs are clearly separated
2. **Standard Layout**: Follows Python project best practices
3. **Easy Navigation**: Developers can find files quickly
4. **Scalability**: Easy to add new components
5. **Maintainability**: Logical grouping makes updates easier
6. **Clean Root**: Root directory only has essential files

## Migration Notes

This structure was created by reorganizing the original flat structure. Key changes:

1. Moved all source code to `src/`
2. Organized scripts by purpose in `scripts/`
3. Consolidated documentation in `docs/`
4. Centralized configuration in `config/`
5. Moved Docker files to `docker/`
6. Created `data/` for runtime data
7. Replaced Streamlit admin interface with Flask-based `flask_admin/` directory

All import paths have been updated to use the `src.` prefix.

The Flask admin interface provides the same functionality as the previous Streamlit interface but with better production readiness, security features, and deployment flexibility for both local Docker Compose and Hugging Face Spaces environments.
