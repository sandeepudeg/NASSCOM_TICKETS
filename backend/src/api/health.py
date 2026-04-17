from fastapi import APIRouter, Response
from sqlalchemy import text

router = APIRouter(tags=["health"])


@router.get("/health/live")
async def liveness():
    """Liveness probe — returns 200 if the process is running."""
    from src.schemas.settings import settings
    return {"status": "ok", "version": settings.app_version}


@router.get("/health/ready")
async def readiness(response: Response):
    """Readiness probe — returns 200 only when DB and Ollama are reachable."""
    from src.schemas.settings import settings
    from src.repositories.database import engine

    components: dict[str, str] = {}

    # Check PostgreSQL
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        components["database"] = "ok"
    except Exception as e:
        components["database"] = f"unavailable: {e}"

    # Check Ollama
    try:
        import httpx
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{settings.ollama_base_url}/api/tags")
            components["ollama"] = "ok" if r.status_code == 200 else f"status {r.status_code}"
    except Exception as e:
        components["ollama"] = f"unavailable: {e}"

    all_ok = all(v == "ok" for v in components.values())
    if not all_ok:
        response.status_code = 503

    return {
        "status": "ok" if all_ok else "degraded",
        "version": settings.app_version,
        "components": components,
    }


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from fastapi.responses import Response as FastAPIResponse

    return FastAPIResponse(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )
