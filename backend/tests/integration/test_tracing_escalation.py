import pytest
import pytest_asyncio
from opentelemetry import trace

pytestmark = pytest.mark.asyncio(loop_scope="session")
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.ml.classifier import classifier
from src.ml.escalation_service import escalation_service
from src.repositories.models import Base
from src.schemas.ticket import (
    Category,
    ClassificationResult,
    RoutingStatus,
    TicketCreate,
)
from src.services.ticket_service import TicketService



async def test_classify_to_escalate_produces_spans(monkeypatch):
    # OTEL in-memory setup
    real_provider = TracerProvider()
    trace.set_tracer_provider(real_provider)
    provider = trace.get_tracer_provider()
    exporter = InMemorySpanExporter()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    tracer = trace.get_tracer("test")

    # SQLite in-memory DB
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    # Mock classifier to force escalation
    async def fake_classify(title: str, description: str, structured_payload=None):
        return ClassificationResult(
            category=Category.NETWORK,
            confidence_score=0.2,
            routing_status=RoutingStatus.ESCALATED,
            inference_outcome="success",
        )

    monkeypatch.setattr(classifier, "classify", fake_classify)

    # Mock webhook to avoid network but keep span
    async def fake_notify(
        self, ticket_id: str, title: str, category: str, confidence_score: float
    ):
        parent_ctx = trace.set_span_in_context(trace.get_current_span())
        with tracer.start_as_current_span("escalation.webhook", context=parent_ctx):
            return True

    import types

    monkeypatch.setattr(
        escalation_service,
        "notify_escalation",
        types.MethodType(fake_notify, escalation_service),
    )

    async with session_maker() as session:
        service = TicketService(session)
        ticket_data = TicketCreate(title="Test", description="trigger escalation")

        with tracer.start_as_current_span("test.request"):
            await service.create_ticket(
                ticket_data, owner_id="user-123", source_ip="127.0.0.1"
            )

    spans = exporter.get_finished_spans()
    names = {s.name for s in spans}
    assert "ticket.classify" in names
    assert "escalation.webhook" in names

    await engine.dispose()
