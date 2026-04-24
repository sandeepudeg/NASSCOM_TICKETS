---
title: Tickets Folder Feature
emoji: 🎫
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
---

# Tickets Folder Feature

AI-powered intelligent ticket routing and resolution platform with folder organization management.

## Overview

The Tickets Folder feature is a self-hosted IT ticket routing and resolution system that automatically classifies support tickets into predefined categories, retrieves semantically similar resolved tickets, suggests resolution steps, and enables ticket organization into named folders. All AI inference runs locally via Ollama with zero external API dependencies.

**Key capabilities:**
- Automatic ticket classification into 7 categories (including Access Management)
- **Zero-Dummy Intelligence Dashboard**: Real-time hourly trends and sentiment analysis
- **Unified SLA Breach Watchdog**: Precise 7-day breach monitoring synchronized across sidebar and global views
- **Intelligence Alerts Lifecycle**: Full Resolve/Snooze/Dismiss workflow for Pattern Alerts
- **RAG-based Resolution Suggestions**: High-confidence indexing with local LLM citations
- **Automation Intelligence Workspace**: Identifying recurring issues for self-service promotion
- **Promoted to Urgent Logic**: Automated priority escalation based on technical impact and sentiment
- **Enterprise Documentation**: 17+ detailed guides for infrastructure, AI, and domain adaptation

## Quick Start

### Prerequisites
- Docker 24+ and Docker Compose v2
- 8 GB RAM minimum (16 GB recommended for LLM inference)
- 20 GB disk space for models and data

### 1. Clone and Configure

```bash
git clone <repo-url>
cd tickets-folder

# Copy environment template
cp .env.example .env

# Edit .env with your configuration (see Environment Variables section below)
nano .env
```

### 2. Start All Services

```bash
# Start the full stack (API, PostgreSQL, Ollama, MinIO, Keycloak, observability)
docker compose up -d

# Wait for services to be ready (30-60 seconds)
docker compose logs -f api

# Check health
curl http://localhost:8000/health/ready
```

### 3. Run Database Migrations

```bash
# Apply schema migrations
docker compose exec api alembic upgrade head
```

### 4. Pull LLM Model

```bash
# Pull Mistral 7B model (or phi3-mini / gemma2b)
docker compose exec ollama ollama pull mistral:7b-instruct
```

### 5. Access the Application

- **Frontend UI**: http://localhost:3000
- **Flask Admin Interface**: http://localhost:5001
- **API Docs**: http://localhost:8000/docs
- **Grafana Dashboards**: http://localhost:3001 (admin/admin)
- **MLflow UI**: http://localhost:5000
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

### 6. Submit Your First Ticket

```bash
curl -X POST http://localhost:8000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "title": "API gateway returning 502 errors",
    "description": "Users reporting intermittent 502 errors from api-gateway service",
    "priority": "high"
  }'
```

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ React 18 UI │───▶│   Traefik    │───▶│  FastAPI    │
│  (Nginx)    │    │   Gateway    │    │   Backend   │
└─────────────┘    └──────────────┘    └─────────────┘
                           │                    │
                           ▼                    │
                   ┌──────────────┐            │
                   │ Flask Admin  │────────────┘
                   │ Interface    │
                   └──────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────┐
        ▼                     ▼               ▼                     ▼
  ┌──────────┐        ┌──────────┐    ┌──────────┐         ┌──────────┐
  │PostgreSQL│        │  Ollama  │    │  MinIO   │         │ Keycloak │
  │+pgvector │        │  (LLM)   │    │  (S3)    │         │ (OAuth2) │
  └──────────┘        └──────────┘    └──────────┘         └──────────┘
        │                     │               │
        └─────────────────────┴───────────────┴─────────────────────┐
                                                                     ▼
                                                              ┌──────────┐
                                                              │Prometheus│
                                                              │  Jaeger  │
                                                              │  Grafana │
                                                              └──────────┘
```

## Categories

| Category | Description |
|---|---|
| **Infrastructure** | Server, VM, OS-level failures, hardware issues |
| **Application** | Bugs, crashes, performance issues, feature failures |
| **Security** | Threats, vulnerabilities, malware alerts, compliance violations |
| **Database** | Query failures, replication lag, corruption, schema issues |
| **Storage** | Disk full, NAS/SAN failures, backup failures |
| **Network** | Connectivity loss, latency, DNS failures, VPN problems |
| **Access Management** | Account lockouts, permission errors, SSO failures |

## Features

### Intelligence Dashboard (Strategic Command Grid)
- **Zero-Dummy Metrics**: Every chart and percentage is driven by real-time database analytics.
- **Hourly Traffic Trend**: Live 24-hour visualization of ticket creation spikes.
- **Sentiment Pulse**: Aggregated customer emotion analysis across all incoming tickets.
- **Unified SLA precision**: Accurate breach counts matching the sidebar source-of-truth.
- **Orchestration Insights**: AI-suggested agent shifting based on departmental load.

### Intelligence Alerts & Patterns
- **Pattern Detection**: Automated clustering of repeated issues (≥3 cases, ≥0.80 similarity).
- **Alert Lifecycle**: Full management of system alerts with Resolve, Snooze (duration-based), and Dismiss actions.
- **Sidebar Integration**: Reactive badge counts that update instantly upon alert resolution.

### Folder Management
- Create, rename, delete ticket folders
- Soft-delete with recovery support
- Pagination and name filtering
- Optimistic locking with version field

### Ticket Classification
- 7 predefined categories with confidence scoring
- Local LLM via Ollama (zero external API costs)
- Structured input parsing (JSON logs, OTLP traces, Prometheus alerts)
- Causal context extraction

### RAG Pipeline
- Semantic similarity search using sentence-transformers
- Top-5 similar ticket retrieval (threshold ≥ 0.70)
- Resolution suggestion generation with citations
- PII scrubbing before embedding

### Escalation System
- Automatic escalation when confidence < 0.65
- Webhook notifications
- Human review queue with override capability
- Agent override feedback for model retraining

### Pattern Detection
- Repeated issue clustering (≥3 tickets, similarity ≥ 0.80)
- 7-day sliding window analysis
- Automation suggestions for recurring problems
- PatternAlert management (acknowledge, snooze, dismiss)

### Observability
- Prometheus metrics endpoint
- OpenTelemetry distributed tracing
- Structured JSON logging
- Health check endpoints (/health/live, /health/ready)

## API Endpoints

### Flask Admin Interface Routes
- `GET /` — Dashboard with system metrics and folder overview
- `GET /folders` — Folder management page with create form and folder listing
- `POST /folders` — Create new folder via web form
- `GET /create-ticket` — Ticket creation form with folder selection
- `POST /create-ticket` — Create ticket with automatic classification
- `GET /classify-test` — Classification testing form
- `POST /classify-test` — Test classification without creating tickets
- `GET /system-health` — System health monitoring dashboard
- `GET /health` — JSON health check endpoint for Docker/HF Spaces

### Folder Management
- `POST /api/v1/folders` — Create folder (agent, manager, admin)
- `GET /api/v1/folders` — List folders with pagination and filtering (viewer+)
- `PATCH /api/v1/folders/{id}` — Rename folder with optimistic locking (agent+)
- `DELETE /api/v1/folders/{id}` — Soft-delete folder (manager, admin)

### Ticket Assignment
- `POST /api/v1/folders/{id}/tickets/{ticket_id}` — Assign ticket to folder (agent+)
- `DELETE /api/v1/folders/{id}/tickets/{ticket_id}` — Remove ticket from folder (agent+)
- `GET /api/v1/folders/{id}/tickets` — List tickets in folder with pagination (viewer+)
- `POST /api/v1/folders/{id}/tickets/bulk` — Bulk assign up to 100 tickets atomically (agent+)

### Ticket Classification
- `POST /api/v1/tickets` — Submit ticket and trigger classification pipeline (agent+)
- `GET /api/v1/tickets/{id}/classification` — Get classification result with similar tickets (viewer+)
- `GET /api/v1/tickets` — List all tickets with filtering (viewer+)

### Escalation Management
- `GET /api/v1/escalations` — List escalation queue sorted oldest-first (agent+)
- `POST /api/v1/escalations/{id}/override` — Override classification with corrected category (agent+)

### Pattern Detection
- `GET /api/v1/pattern-alerts` — List active pattern alerts (manager, admin)
- `PATCH /api/v1/pattern-alerts/{id}` — Dismiss, snooze, or acknowledge alert (manager, admin)

### Model Metrics
- `GET /api/v1/model/metrics` — Get AI model performance metrics (F1, semantic similarity, judge scores) (agent, admin)

### Health Checks
- `GET /health/live` — Liveness probe (process running)
- `GET /health/ready` — Readiness probe (DB + Ollama + services reachable)

### Observability
- `GET /metrics` — Prometheus metrics endpoint (public)

## Environment Variables

### Flask Admin Configuration

| Variable | Default | Description |
|---|---|---|
| `API_BASE_URL` | `http://api:8000` | FastAPI backend URL for local Docker Compose (set via HF Spaces secrets for cloud deployment) |
| `SECRET_KEY` | *required* | Flask session secret key (no default - must be set in production) |
| `FLASK_ENV` | `development` | Flask environment (development, production) |
| `DEBUG` | `False` | Enable Flask debug mode |
| `PORT` | `7860` | Flask application port (7860 for HF Spaces, 5000 for local Docker Compose) |
| `HOST` | `0.0.0.0` | Flask application host |
| `LOG_FORMAT` | `text` | Logging format (text for development, json for production) |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

### Core Configuration

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string with asyncpg driver |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `mistral:7b-instruct` | LLM model name (mistral:7b-instruct, phi3-mini, gemma2b) |
| `EMBEDDING_MODEL` | `intfloat/multilingual-e5-small` | Sentence-transformer model for embeddings |
| `MINIO_ENDPOINT` | `minio:9000` | MinIO S3-compatible endpoint |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `KEYCLOAK_URL` | `http://keycloak:8080` | Keycloak OAuth2/OIDC endpoint |
| `KEYCLOAK_REALM` | `tickets` | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | `tickets-api` | OAuth2 client ID |
| `KEYCLOAK_CLIENT_SECRET` | `<secret>` | OAuth2 client secret |

### AI/ML Configuration

| Variable | Default | Description |
|---|---|---|
| `ESCALATION_THRESHOLD` | `0.65` | Confidence below which tickets are escalated |
| `RAG_SIMILARITY_THRESHOLD` | `0.70` | Minimum cosine similarity for RAG retrieval |
| `RAG_TOP_K` | `5` | Number of similar tickets to retrieve |
| `PATTERN_WINDOW_DAYS` | `7` | Sliding window for pattern detection (days) |
| `PATTERN_SIMILARITY_THRESHOLD` | `0.80` | Minimum similarity for pattern clustering |
| `PATTERN_MIN_CLUSTER_SIZE` | `3` | Minimum tickets to trigger pattern alert |
| `CLASSIFIER_TIMEOUT_SECONDS` | `5` | Ollama request timeout |
| `CLASSIFIER_MAX_RETRIES` | `3` | Retry attempts on classifier failure |

### Domain Adaptation

The system supports transfer learning for new domains (HR, finance, facilities, etc.) through configurable category taxonomy and swappable embedding models. See [DOMAIN_ADAPTATION.md](DOMAIN_ADAPTATION.md) for detailed guide.

| Variable | Default | Description |
|---|---|---|
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence-transformer model (swappable at runtime) |
| `CLASSIFIER_CONFIG` | `classifier_config.yaml` | Path to category taxonomy configuration |

**Quick domain adaptation:**
1. Edit `classifier_config.yaml` with your categories (7 categories, 50+ examples each)
2. Set `EMBEDDING_MODEL` to domain-specific model if needed (e.g., `all-mpnet-base-v2` for higher quality)
3. Run `python retrain_classifier.py --dataset your_data.json --config classifier_config.yaml`
4. Deploy new model via MLflow registry

See [DOMAIN_ADAPTATION.md](DOMAIN_ADAPTATION.md) for examples in HR, finance, and facilities domains.

### Feature Flags

| Variable | Default | Description |
|---|---|---|
| `DISABLE_PII_SCRUBBING` | `false` | **DANGER**: Disable PII scrubbing (test only) |
| `MULTI_FOLDER_ASSIGNMENT` | `false` | Allow tickets in multiple folders |
| `ENABLE_QDRANT` | `false` | Use Qdrant instead of pgvector for embeddings |

### Observability

| Variable | Default | Description |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://jaeger:4317` | OpenTelemetry OTLP gRPC endpoint |
| `OTEL_SERVICE_NAME` | `tickets-api` | Service name for distributed tracing |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `PROMETHEUS_MULTIPROC_DIR` | `/tmp/prometheus` | Prometheus multiprocess metrics directory |

### Security

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `RATE_LIMIT_PER_MINUTE` | `60` | API rate limit per user per minute |
| `JWT_SECRET_KEY` | `<generate-secure-key>` | JWT signing secret (use Infisical in production) |
| `ENCRYPTION_KEY` | `<generate-secure-key>` | AES-256 encryption key for data at rest |

### Production Hardening

| Variable | Default | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | Environment name (development, staging, production) |
| `SENTRY_DSN` | `null` | Sentry error tracking DSN |
| `WEBHOOK_ESCALATION_URL` | `null` | Webhook URL for escalation notifications |
| `WEBHOOK_RETRY_ATTEMPTS` | `3` | Webhook delivery retry attempts |
| `FOLDER_LIMIT_PER_USER` | `500` | Maximum folders per user |
| `BULK_ASSIGN_MAX_SIZE` | `100` | Maximum tickets per bulk-assign request |

## Hugging Face Spaces Deployment

The Flask Admin interface can be deployed to Hugging Face Spaces for easy cloud hosting:

### Quick HF Spaces Setup

1. **Create a new HF Space**:
   - Go to [huggingface.co/new-space](https://huggingface.co/new-space)
   - Select **Docker** as the SDK
   - Choose a name for your space

2. **Configure Environment Variables** in HF Spaces Settings:
   ```
   API_BASE_URL=https://your-fastapi-backend.com
   SECRET_KEY=your-secure-random-key
   FLASK_ENV=production
   ```

3. **Push the code** to your HF Space repository:
   ```bash
   git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
   git push hf main
   ```

4. **Access your deployed app** at:
   `https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`

The application automatically detects HF Spaces environment and configures itself accordingly. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Tech Stack

### Backend
- **API Framework**: FastAPI (Python 3.10+)
- **Admin Interface**: Flask 3.0+ with Jinja2 templates and Bootstrap 5 UI
- **Database**: PostgreSQL 14+ with pgvector extension
- **Vector Store**: pgvector (primary) or Qdrant (optional)
- **LLM**: Ollama (Mistral 7B, Phi-3-mini, Gemma 2B)
- **Embeddings**: sentence-transformers (intfloat/multilingual-e5-small)
- **RAG Framework**: LangChain or LlamaIndex
- **PII Detection**: Microsoft Presidio
- **ML Registry**: MLflow
- **Object Storage**: MinIO (S3-compatible)

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Ant Design or Material-UI
- **State Management**: Zustand (UI state) + TanStack Query (server state)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **API Gateway**: Traefik v3 (TLS termination, rate limiting, load balancing)
- **Auth**: Keycloak or Authentik (OAuth2/OIDC)
- **Observability**: Prometheus, Jaeger, Loki, Grafana
- **Container Runtime**: Docker 24+ with Compose v2
- **Database Migrations**: Alembic

### Development Tools
- **Linting**: Ruff (Python), ESLint (TypeScript)
- **Formatting**: Ruff (Python), Prettier (TypeScript)
- **Type Checking**: mypy (Python), TypeScript compiler
- **Testing**: pytest + Hypothesis (Python), Vitest (TypeScript), Playwright (E2E)
- **Security Scanning**: Bandit, Semgrep, Trivy

## Requirements Specification

See `requirements_v2_1.md` for complete requirements covering:
- Folder CRUD operations (Requirements 1-4)
- Ticket assignment and bulk operations (Requirements 5-8)
- AI classification with confidence scoring (Requirement 9)
- Structured input parsing (Requirement 10)
- RAG-based retrieval and resolution suggestion (Requirement 11)
- Escalation and human review workflow (Requirement 12)
- Pattern detection and automation suggestions (Requirement 13)
- Model evaluation and Intelligence Hub metrics (Requirement 14)
- **NEW**: Automation Intelligence Workspace (Hackathon Enhancement)
- **NEW**: Access Management Vertical Integration
- **NEW**: Enterprise Ingestion & ETL Mapper (Cross-Domain Ready)
- Security and audit logging (Requirements 28-29)
- UI/Frontend specifications (Requirements 30-38)

## Documentation Suite

The `/docs` directory contains a comprehensive manual for every layer of the system:

| Guide | Description |
|---|---|
| [DOMAIN_ADAPTATION.md](docs/DOMAIN_ADAPTATION.md) | How to customize TicketIQ for HR, Finance, or Legal |
| [DASHBOARD_USER_MANUAL.md](docs/DASHBOARD_USER_MANUAL.md) | Layman-friendly guide to metrics and trends |
| [GRAFANA_VIZ_GUIDE.md](docs/GRAFANA_VIZ_GUIDE.md) | Setting up SRE dashboards and log-to-trace deep links |
| [CORE_API_GUIDE.md](docs/CORE_API_GUIDE.md) | Developer reference for the FastAPI backend |
| [OLLAMA_LLM_GUIDE.md](docs/OLLAMA_LLM_GUIDE.md) | Managing local LLMs and prompt engineering |
| [PROMETHEUS_METRICS.md](docs/PROM_METRICS_GUIDE.md) | Monitoring system throughput and error rates |
| ... and 11 others covering Traefik, Keycloak, MinIO, and more. | |

## Troubleshooting

### Ollama Model Not Loading

```bash
# Check Ollama service status
docker compose logs ollama

# Pull model manually
docker compose exec ollama ollama pull mistral:7b-instruct

# Verify model is available
docker compose exec ollama ollama list
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Verify connection string in .env
echo $DATABASE_URL

# Test connection
docker compose exec postgres psql -U tickets -d tickets -c "SELECT 1"
```

### Classification Timeout

```bash
# Increase timeout in .env
CLASSIFIER_TIMEOUT_SECONDS=10

# Check Ollama resource usage
docker stats ollama

# Consider using a smaller model
OLLAMA_MODEL=phi3-mini
```

### PII Scrubbing Errors

```bash
# Verify Presidio is installed
pip list | grep presidio

# Download required spaCy model
python -m spacy download en_core_web_lg

# Test PII scrubber
python -c "from ml.pii_scrubber import PIIScrubber; print(PIIScrubber().scrub('test@example.com'))"
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run test suite: `pytest tests/ -v`
5. Run linters: `ruff check . && ruff format .`
6. Commit with conventional commits: `git commit -m "feat: add new feature"`
7. Push and create a pull request

## Performance Targets

| Operation | p50 | p95 | p99 | Notes |
|-----------|-----|-----|-----|-------|
| Folder CRUD | ≤ 100 ms | ≤ 250 ms | ≤ 500 ms | Create, list, rename, delete |
| Ticket classification (full pipeline) | ≤ 2 s | ≤ 4 s | ≤ 6 s | Includes PII scrubbing, embedding, LLM inference, RAG retrieval |
| RAG vector search (top-5) | — | — | ≤ 500 ms | 1M corpus with pgvector ivfflat index |
| Bulk assign (100 tickets) | — | — | ≤ 2 s | Atomic transaction with rollback |

### Throughput Targets
- Concurrent users: 100+ (with horizontal scaling)
- Tickets per day: 10,000+ (single instance)
- Classification requests per second: 5-10 (limited by LLM inference)

## Security

### Authentication & Authorization
- OAuth2/OIDC via Keycloak/Authentik
- JWT Bearer token authentication
- Role-Based Access Control (RBAC):
  - **viewer**: Read-only access to tickets and folders
  - **agent**: Create/assign tickets, override classifications
  - **manager**: Manage folders, pattern alerts, escalations
  - **admin**: Full system access including model metrics

### Transport Security
- TLS 1.2+ for all external connections
- mTLS for inter-service communication (optional)
- HSTS headers enforced by Traefik

### Data Security
- AES-256 encryption for data at rest (PostgreSQL, MinIO)
- PII scrubbing before embedding generation (Microsoft Presidio)
- Audit log with append-only enforcement (PostgreSQL RLS)
- Secrets management via Infisical or HashiCorp Vault (production)

### Application Security
- CSRF protection on all state-mutating endpoints
- Per-user rate limiting (60 requests/minute default)
- Input validation with Pydantic v2 schemas
- SQL injection prevention via SQLAlchemy parameterized queries
- XSS prevention via HTML sanitization on folder names

### Compliance
- GDPR-compliant PII handling with scrubbing and retention policies
- Audit log retention: 12 months in database, 5 years in archive
- Soft-delete with 365-day purge window

## Getting Started (Development)

### Local Development Setup

```bash
# Clone repository
git clone <repo-url>
cd tickets-folder

# Create Python virtual environment
python3.10 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Start Backend Services Only

```bash
# Start PostgreSQL, Ollama, MinIO, Keycloak
docker compose up -d postgres ollama minio keycloak

# Wait for services to be ready
docker compose logs -f postgres

# Run database migrations
alembic upgrade head

# Pull LLM model
docker compose exec ollama ollama pull mistral:7b-instruct

# Start FastAPI in development mode
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Flask Admin Development Server

```bash
cd flask_admin

# Start Flask in development mode with hot reload
export FLASK_APP=app.py
export FLASK_ENV=development
export API_BASE_URL=http://localhost:8000
export SECRET_KEY=dev-secret-key

flask run --host 0.0.0.0 --port 5000

# Flask Admin will be available at http://localhost:5000
```

### Start Frontend Development Server

```bash
cd frontend

# Start Vite dev server with hot reload
npm run dev

# Frontend will be available at http://localhost:5173
```

### Development Workflow

1. Make code changes
2. Run unit tests: `pytest tests/unit/ -v`
3. Run linter: `ruff check . --fix`
4. Run formatter: `ruff format .`
5. Run type checker: `mypy api/ services/ repositories/ ml/`
6. Commit changes with conventional commit messages

### Useful Development Commands

```bash
# Watch logs from all services
docker compose logs -f

# Restart a specific service
docker compose restart api

# Access PostgreSQL shell
docker compose exec postgres psql -U tickets -d tickets

# Access Ollama CLI
docker compose exec ollama ollama list

# View Prometheus metrics
curl http://localhost:8000/metrics

# View health status
curl http://localhost:8000/health/ready | jq

# Test Flask Admin health
curl http://localhost:5000/health | jq

# Access Flask Admin in browser
open http://localhost:5000
```

## Testing

### Run All Tests

```bash
# Run full test suite (unit + integration + property-based)
pytest tests/ -v

# Run with coverage report
pytest tests/ --cov=api --cov=services --cov=repositories --cov=ml --cov-report=html --cov-report=term

# Open coverage report
open htmlcov/index.html
```

### Unit Tests

```bash
# Run unit tests only
pytest tests/unit/ -v

# Run specific test file
pytest tests/unit/test_folder_service.py -v

# Run specific test function
pytest tests/unit/test_folder_service.py::test_create_folder_success -v
```

### Property-Based Tests

```bash
# Run all property tests (Hypothesis)
pytest tests/property/ -v --hypothesis-seed=0

# Run with more examples (default is 100)
pytest tests/property/ -v --hypothesis-seed=0 --hypothesis-max-examples=500

# Run specific property test
pytest tests/property/test_property_based.py::test_folder_name_validation -v
```

### Integration Tests

```bash
# Run integration tests (requires Docker for testcontainers)
pytest tests/integration/ -v

# Run with real PostgreSQL container
pytest tests/integration/test_integration.py -v
```

### End-to-End Tests

```bash
# Start the full stack first
docker compose up -d

# Wait for services to be ready
sleep 30

# Run E2E tests with Playwright
pytest tests/e2e/ -v

# Run E2E tests with headed browser (for debugging)
pytest tests/e2e/ -v --headed

# Run specific E2E test
pytest tests/e2e/test_ticket_flow.py::test_ticket_submission_to_classification -v
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd frontend

# Run Vitest unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm run test -- src/components/FolderSidebar.test.tsx
```

### ML Pipeline Tests

```bash
# Test classifier evaluation script
python -m pytest tests/unit/test_evaluate_classifier.py -v

# Test ingestion script
python -m pytest tests/unit/test_ingest_ticket.py -v

# Run classifier evaluation (requires trained model)
python evaluate_classifier.py --test-split data/test_split.jsonl --output evaluation_report.json
```

### Test Coverage Targets

- Backend (Python): ≥ 80% line coverage
- Frontend (TypeScript): ≥ 75% line coverage
- Property tests: 100 examples per property minimum
- Integration tests: All critical paths covered with real DB

### Continuous Integration

```bash
# Run the same tests that CI runs
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# Lint checks
ruff check .
ruff format --check .

# Type checks
mypy api/ services/ repositories/ ml/

# Security scans
bandit -r api/ services/ repositories/ ml/ -ll
semgrep --config=auto .

# Container security scan
trivy image tickets-api:latest
```

## API Response Format

All API responses conform to RFC 7807 (Problem Details for HTTP APIs).

### Success Response Example

```json
{
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "category": "Infrastructure",
  "confidence_score": 0.87,
  "routing_status": "routed",
  "causal_signal": "error_rate_spike detected in service: api-gateway",
  "parse_warning": null,
  "similar_tickets": [
    {
      "ticket_id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "API gateway 502 errors",
      "category": "Infrastructure",
      "resolution_summary": "Restarted upstream pods and cleared connection pool",
      "similarity_score": 0.91
    }
  ],
  "resolution_suggestion": {
    "steps": [
      "Check pod health status in api-gateway namespace",
      "Review ingress controller logs for upstream errors",
      "Verify backend service endpoints are responding"
    ],
    "source_ticket_ids": [
      "660e8400-e29b-41d4-a716-446655440001",
      "770e8400-e29b-41d4-a716-446655440002"
    ],
    "low_retrieval_confidence": false
  }
}
```

### Error Response Example

```json
{
  "type": "https://tickets.example.com/errors/duplicate-folder-name",
  "title": "Duplicate Folder Name",
  "status": 409,
  "detail": "A folder named 'Infrastructure Issues' already exists for this user.",
  "instance": "/api/v1/folders"
}
```

### Bulk Operation Partial Failure (HTTP 207)

```json
{
  "status": 207,
  "successful": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "failed": [
    {
      "ticket_id": "770e8400-e29b-41d4-a716-446655440002",
      "error": "Ticket not found"
    },
    {
      "ticket_id": "880e8400-e29b-41d4-a716-446655440003",
      "error": "Ticket already assigned to this folder"
    }
  ]
}
```

## License

Open source — see LICENSE file for details.
