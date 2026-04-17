import logging
import os
import time
from typing import Optional

import structlog
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from src.schemas.settings import settings


# Try to import OpenTelemetry but don't fail if it's not available
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SpanExporter

    OTEL_AVAILABLE = True
except (ImportError, TypeError):
    OTEL_AVAILABLE = False
    trace = None

try:
    from prometheus_client import Counter, Gauge, Histogram

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

    # Create dummy metric classes
    class Counter:
        def __init__(self, *args, **kwargs):
            pass

        def labels(self, *args, **kwargs):
            return self

        def inc(self, *args, **kwargs):
            pass

    class Histogram:
        def __init__(self, *args, **kwargs):
            pass

        def labels(self, *args, **kwargs):
            return self

        def observe(self, value):
            pass

    class Gauge:
        def __init__(self, *args, **kwargs):
            pass

        def labels(self, *args, **kwargs):
            return self

        def set(self, value):
            pass


# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests processed by the API.",
    ["method", "path", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds.",
    ["method", "path", "status_code"],
    buckets=[
        0.005,
        0.01,
        0.025,
        0.05,
        0.1,
        0.25,
        0.5,
        1,
        2,
        5,
    ],
)

CLASSIFICATION_LATENCY = Histogram(
    "ticket_classification_duration_seconds",
    "LLM-backed ticket classification latency.",
    ["routing_status", "outcome"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1, 2, 4, 6, 10],
)

WEBHOOK_ATTEMPTS = Counter(
    "escalation_webhook_attempts_total",
    "Escalation webhook attempts by outcome.",
    ["outcome"],
)

WEBHOOK_LATENCY = Histogram(
    "escalation_webhook_duration_seconds",
    "Escalation webhook attempt latency.",
    ["outcome"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1, 2, 4, 8],
)

# Additional metrics per design spec
CLASSIFIER_CONFIDENCE_SCORE = Histogram(
    "classifier_confidence_score",
    "Distribution of confidence scores",
    ["category"],
    buckets=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
)

CLASSIFIER_CATEGORY_TOTAL = Counter(
    "classifier_category_total",
    "Predictions per category",
    ["category"],
)

ESCALATION_QUEUE_DEPTH = Gauge(
    "escalation_queue_depth",
    "Current escalation queue size",
)

PATTERN_ALERT_COUNT = Gauge(
    "pattern_alert_count",
    "Active pattern alerts by status",
    ["status"],
)

PII_REDACTIONS_TOTAL = Counter(
    "pii_redactions_total",
    "PII entities redacted",
    ["entity_type"],
)

RAG_RETRIEVAL_DURATION_SECONDS = Histogram(
    "rag_retrieval_duration_seconds",
    "Vector search latency",
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0],
)

BULK_ASSIGN_BATCH_SIZE = Histogram(
    "bulk_assign_batch_size",
    "Bulk assign request sizes",
    buckets=[1, 5, 10, 25, 50, 75, 100],
)

WEBHOOK_DELIVERY_FAILURES_TOTAL = Counter(
    "webhook_delivery_failures_total",
    "Escalation webhook failures",
)


_logging_configured = False


def setup_logging(debug: bool = False) -> None:
    """Configure structured JSON logging with structlog."""
    global _logging_configured
    if _logging_configured:
        return

    logging.basicConfig(
        level=logging.DEBUG if debug else logging.INFO, format="%(message)s"
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.stdlib.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    _logging_configured = True


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        status_code: int = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            duration = time.perf_counter() - start
            labels = (request.method, request.url.path, str(status_code))
            REQUEST_COUNT.labels(*labels).inc()
            REQUEST_LATENCY.labels(*labels).observe(duration)


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger = structlog.get_logger("http")
        start = time.perf_counter()
        status_code: int = 500
        trace_fields = {}
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            if OTEL_AVAILABLE and trace is not None:
                ctx = trace.get_current_span().get_span_context()
                trace_fields = (
                    {
                        "trace_id": format(ctx.trace_id, "032x"),
                        "span_id": format(ctx.span_id, "016x"),
                    }
                    if ctx and ctx.is_valid
                    else {}
                )
            logger.exception(
                "request.error",
                method=request.method,
                path=request.url.path,
                status_code=status_code,
                duration_ms=duration_ms,
                user_agent=request.headers.get("user-agent"),
                **trace_fields,
            )
            raise
        finally:
            duration_ms = (time.perf_counter() - start) * 1000
            if OTEL_AVAILABLE and trace is not None:
                ctx = trace.get_current_span().get_span_context()
                trace_fields = (
                    {
                        "trace_id": format(ctx.trace_id, "032x"),
                        "span_id": format(ctx.span_id, "016x"),
                    }
                    if ctx and ctx.is_valid
                    else {}
                )
            logger.info(
                "request.completed",
                method=request.method,
                path=request.url.path,
                status_code=status_code,
                duration_ms=duration_ms,
                user_agent=request.headers.get("user-agent"),
                **trace_fields,
            )


def setup_metrics(app: FastAPI) -> None:
    """Attach Prometheus metrics middleware once per app."""
    if not settings.prometheus_enabled:
        return
    if getattr(app.state, "metrics_configured", False):
        return
    app.add_middleware(MetricsMiddleware)
    app.state.metrics_configured = True


def setup_tracing(
    app: FastAPI,
    *,
    span_exporter: SpanExporter | None = None,
    use_batch: bool = True,
) -> Optional["TracerProvider"]:
    """
    Configure OpenTelemetry tracing for the FastAPI app.

    span_exporter: optional custom exporter (e.g., InMemorySpanExporter for tests).
    use_batch: set False to use SimpleSpanProcessor (useful for tests).
    """
    if not OTEL_AVAILABLE:
        logging.warning("OpenTelemetry not available; tracing disabled")
        app.state.tracing_configured = True
        return None

    if getattr(app.state, "tracing_configured", False):
        return trace.get_tracer_provider()  # type: ignore[return-value]

    # Allow local dev to disable OTLP to avoid noisy connection errors when no collector is running.
    if os.getenv("DISABLE_OTEL_EXPORTER", "false").lower() == "true":
        app.state.tracing_configured = True
        return trace.get_tracer_provider()  # type: ignore[return-value]

    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import (
        BatchSpanProcessor,
        ConsoleSpanExporter,
        SimpleSpanProcessor,
    )

    resource = Resource.create(
        {
            "service.name": settings.app_name,
            "service.version": settings.app_version,
        }
    )
    provider = TracerProvider(resource=resource)

    try:
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
            OTLPSpanExporter,
        )

        exporter = span_exporter or OTLPSpanExporter(
            endpoint=settings.otel_exporter_otlp_endpoint,
            timeout=5,
        )
        processor = (
            BatchSpanProcessor(exporter) if use_batch else SimpleSpanProcessor(exporter)
        )
    except Exception as exc:
        # Fallback to console exporter to keep app running without crashing on missing collector.
        logging.warning(
            "OTLP exporter unavailable (%s); falling back to ConsoleSpanExporter. "
            "Set DISABLE_OTEL_EXPORTER=true to disable tracing entirely for local dev.",
            exc,
        )
        exporter = ConsoleSpanExporter()
        processor = SimpleSpanProcessor(exporter)

    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.instrument_app(
            app,
            tracer_provider=provider,
            excluded_urls="(/health/live)|(/health/ready)|(/metrics)",
        )
    except Exception as exc:
        logging.warning("Failed to instrument FastAPI with OpenTelemetry: %s", exc)

    try:
        # Instrument SQLAlchemy if present; safe to ignore failures in tests.
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

        from repositories.database import engine

        SQLAlchemyInstrumentor().instrument(engine=engine.sync_engine)
    except Exception:
        pass

    app.state.tracing_configured = True
    return provider


def setup_observability(app: FastAPI) -> None:
    """Convenience helper to wire logging, tracing, and metrics."""
    setup_logging(debug=settings.debug)
    app.add_middleware(StructuredLoggingMiddleware)
    setup_metrics(app)
    if OTEL_AVAILABLE:
        setup_tracing(app)


def record_classification_latency(
    duration_seconds: float, routing_status: str, outcome: str = "success"
) -> None:
    """Observe classification latency with routing_status and outcome labels."""
    CLASSIFICATION_LATENCY.labels(routing_status, outcome).observe(duration_seconds)


def record_webhook_attempt(duration_seconds: float, success: bool) -> None:
    """Record a single webhook attempt latency and outcome."""
    outcome = "success" if success else "failure"
    WEBHOOK_ATTEMPTS.labels(outcome).inc()
    WEBHOOK_LATENCY.labels(outcome).observe(duration_seconds)


def record_classifier_prediction(category: str, confidence_score: float) -> None:
    """Record classifier prediction metrics."""
    CLASSIFIER_CONFIDENCE_SCORE.labels(category).observe(confidence_score)
    CLASSIFIER_CATEGORY_TOTAL.labels(category).inc()


def record_pii_redaction(entity_type: str, count: int = 1) -> None:
    """Record PII redaction events."""
    PII_REDACTIONS_TOTAL.labels(entity_type).inc(count)


def record_rag_retrieval_duration(duration_seconds: float) -> None:
    """Record RAG retrieval latency."""
    RAG_RETRIEVAL_DURATION_SECONDS.observe(duration_seconds)


def record_bulk_assign_batch(batch_size: int) -> None:
    """Record bulk assign batch size."""
    BULK_ASSIGN_BATCH_SIZE.observe(batch_size)


def set_escalation_queue_depth(depth: int) -> None:
    """Set current escalation queue depth."""
    ESCALATION_QUEUE_DEPTH.set(depth)


def set_pattern_alert_count(status: str, count: int) -> None:
    """Set pattern alert count by status."""
    PATTERN_ALERT_COUNT.labels(status).set(count)


def record_webhook_delivery_failure() -> None:
    """Record webhook delivery failure."""
    WEBHOOK_DELIVERY_FAILURES_TOTAL.inc()
