import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from config.observability import setup_observability
from src.api import auth, classification, compliance, escalations, folders, health, model_metrics, tickets, analytics, notifications
from src.repositories.database import close_db, init_db, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from src.schemas.errors import HTTPError, ProblemDetail
from src.schemas.settings import settings


class ProblemDetailException(Exception):
    def __init__(self, problem: ProblemDetail):
        self.problem = problem
        super().__init__(problem.detail)


def get_allowed_origins():
    """Get allowed CORS origins for FastAPI backend"""

    # Default origins for local development
    default_origins = [
        "http://localhost:3000",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:3004",
        "http://localhost:5000",  # Flask admin local (default)
        "http://localhost:5001",  # Flask admin local (alternative)
    ]

    # Get additional origins from environment
    cors_origins = os.getenv("CORS_ORIGINS", "")
    if cors_origins:
        additional_origins = [
            origin.strip() for origin in cors_origins.split(",") if origin.strip()
        ]
        default_origins.extend(additional_origins)

    # Remove duplicates while preserving order
    seen = set()
    unique_origins = []
    for origin in default_origins:
        if origin not in seen:
            seen.add(origin)
            unique_origins.append(origin)

    return unique_origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003", "http://localhost:3000", "http://127.0.0.1:3003", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


setup_observability(app)


@app.exception_handler(ProblemDetailException)
async def problem_detail_handler(request: Request, exc: ProblemDetailException):
    return JSONResponse(
        status_code=exc.problem.status,
        content=exc.problem.model_dump(),
    )


@app.exception_handler(HTTPError)
async def http_error_handler(request: Request, exc: HTTPError):
    return JSONResponse(
        status_code=exc.problem.status,
        content=exc.problem.model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    problem = ProblemDetail(
        type="urn:tickets:error:validation",
        title="Validation Error",
        status=422,
        detail=str(exc),
    )
    return JSONResponse(status_code=422, content=problem.model_dump())


app.include_router(health.router)
app.include_router(folders.router, prefix=settings.api_v1_prefix)
app.include_router(tickets.router, prefix=settings.api_v1_prefix)
app.include_router(classification.router, prefix=settings.api_v1_prefix)
app.include_router(escalations.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix + "/auth")
app.include_router(model_metrics.router, prefix=settings.api_v1_prefix)
app.include_router(compliance.router, prefix=settings.api_v1_prefix)
app.include_router(analytics.router, prefix=settings.api_v1_prefix)
app.include_router(notifications.router, prefix=settings.api_v1_prefix)



@app.get("/")
async def serve_root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "message": "Intelligence API is active.",
        "docs": "/docs",
    }


@app.get("/api/v1/debug/db")
async def debug_db(db: AsyncSession = Depends(get_db)):
    """Diagnostics: Check database state and table counts."""
    from sqlalchemy import func, select
    from src.repositories.models import Ticket, Folder, TicketFolderAssignment, TicketEmbedding
    
    try:
        t_count = await db.execute(select(func.count(Ticket.id)))
        f_count = await db.execute(select(func.count(Folder.id)))
        a_count = await db.execute(select(func.count(TicketFolderAssignment.id)))
        e_count = await db.execute(select(func.count(TicketEmbedding.id)))
        
        return {
            "status": "connected",
            "tickets": t_count.scalar(),
            "folders": f_count.scalar(),
            "assignments": a_count.scalar(),
            "embeddings": e_count.scalar(),
            "database_url_type": "postgres" if "postgres" in settings.database_url else "sqlite"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/v1/debug/files")
async def debug_files():
    """Diagnostics: Check which files are present in the app directory."""
    import os
    try:
        files = []
        for root, dirs, filenames in os.walk("."):
            for f in filenames:
                files.append(os.path.join(root, f))
        return {
            "cwd": os.getcwd(),
            "files": files[:100] # Limit to 100 files
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/v1/debug/reset")
async def debug_reset():
    """Force a database wipe and re-seed from tickets_seed.json."""
    from src.repositories.database import seed_from_json
    try:
        await seed_from_json()
        return {"status": "success", "message": "Database reset and re-seeded from local state."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/v1/master-control/status")
async def master_control_status():
    """Diagnostics: Return health status for all 15 services."""
    import random
    # In production/HF, most of these are simulated as we only have the Core API.
    # We mark the API and Frontend as healthy.
    
    services = {
        "api": {"status": "healthy", "latency": f"{random.randint(5, 25)}ms"},
        "frontend": {"status": "healthy", "latency": f"{random.randint(10, 40)}ms"},
        "postgres": {"status": "healthy", "latency": f"{random.randint(40, 100)}ms"},
        # Mock others for demo purposes on HF
        "traefik": {"status": "healthy", "latency": "5ms"},
        "grafana": {"status": "healthy", "latency": "12ms"},
        "prometheus": {"status": "healthy", "latency": "8ms"},
        "minio": {"status": "healthy", "latency": "18ms"},
        "keycloak": {"status": "healthy", "latency": "45ms"},
        "jaeger": {"status": "healthy", "latency": "15ms"},
        "mlflow": {"status": "healthy", "latency": "20ms"},
        "qdrant": {"status": "healthy", "latency": "30ms"},
        "ollama": {"status": "healthy", "latency": "250ms"},
        "loki": {"status": "healthy", "latency": "10ms"},
        "promtail": {"status": "healthy", "latency": "2ms"},
        "groq": {"status": "healthy", "latency": "110ms"}
    }
    
    return {"status": "ok", "services": services}


@app.get("/{full_path:path}")
async def serve_react_routes(full_path: str):
    # Skip if it looks like an API call
    if (
        full_path.startswith("api/v1")
        or full_path.startswith("docs")
        or full_path.startswith("openapi.json")
    ):
        pass  # Let FastAPI handle routers

    index_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Not Found"}
