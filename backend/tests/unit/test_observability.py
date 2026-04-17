import json
import logging

import pytest
import structlog
from fastapi import FastAPI
from fastapi.testclient import TestClient
from opentelemetry import trace
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from config.observability import (
    CLASSIFICATION_LATENCY,
    REQUEST_COUNT,
    REQUEST_LATENCY,
    WEBHOOK_ATTEMPTS,
    WEBHOOK_LATENCY,
    StructuredLoggingMiddleware,
    record_classification_latency,
    record_webhook_attempt,
    setup_logging,
    setup_metrics,
    setup_tracing,
)


def test_structlog_outputs_json(caplog):
    setup_logging(debug=True)
    logger = structlog.get_logger("test")

    with caplog.at_level(logging.INFO):
        logger.info("hello", foo="bar")

    record = caplog.records[-1]
    parsed = json.loads(record.getMessage())
    assert parsed["event"] == "hello"
    assert parsed["foo"] == "bar"
    assert parsed["level"] == "info"


def test_metrics_middleware_records_requests():
    app = FastAPI()
    setup_metrics(app)

    @app.get("/ping")
    async def ping():
        return {"status": "ok"}

    client = TestClient(app)

    metric = REQUEST_COUNT.labels("GET", "/ping", "200")
    before = metric._value.get()

    client.get("/ping")

    after = metric._value.get()
    assert after == before + 1

    hist_samples = REQUEST_LATENCY.collect()[0].samples
    count_samples = [
        s
        for s in hist_samples
        if s.name.endswith("_count")
        and s.labels.get("method") == "GET"
        and s.labels.get("path") == "/ping"
        and s.labels.get("status_code") == "200"
    ]
    sum_samples = [
        s
        for s in hist_samples
        if s.name.endswith("_sum")
        and s.labels.get("method") == "GET"
        and s.labels.get("path") == "/ping"
        and s.labels.get("status_code") == "200"
    ]
    assert count_samples and count_samples[0].value >= 1
    assert sum_samples and sum_samples[0].value > 0


def test_tracing_uses_inmemory_exporter():
    app = FastAPI()
    exporter = InMemorySpanExporter()
    setup_tracing(app, span_exporter=exporter, use_batch=False)

    @app.get("/trace-me")
    async def trace_me():
        return {"trace": "ok"}

    client = TestClient(app)
    client.get("/trace-me")

    spans = exporter.get_finished_spans()
    assert spans, "expected at least one span to be exported"
    http_span = spans[-1]
    assert http_span.attributes.get("http.method") == "GET"
    assert "/trace-me" in http_span.name


def test_classification_latency_records_histogram():
    before = CLASSIFICATION_LATENCY.collect()[0].samples
    record_classification_latency(0.42, "auto_routed", "success")
    after = CLASSIFICATION_LATENCY.collect()[0].samples
    assert len(after) > len(before)


def test_webhook_metrics_increment():
    record_webhook_attempt(0.12, True)
    record_webhook_attempt(0.2, False)

    attempts = WEBHOOK_ATTEMPTS.collect()[0].samples
    success = [s for s in attempts if s.labels.get("outcome") == "success"][0]
    failure = [s for s in attempts if s.labels.get("outcome") == "failure"][0]
    assert success.value >= 1
    assert failure.value >= 1

    latency_samples = WEBHOOK_LATENCY.collect()[0].samples
    success_lat = [
        s
        for s in latency_samples
        if s.name.endswith("_sum") and s.labels.get("outcome") == "success"
    ][0]
    failure_lat = [
        s
        for s in latency_samples
        if s.name.endswith("_sum") and s.labels.get("outcome") == "failure"
    ][0]
    assert success_lat.value > 0
    assert failure_lat.value > 0


@pytest.mark.asyncio
async def test_structured_logs_include_trace_ids(caplog):
    from starlette.requests import Request
    from starlette.responses import Response

    app = FastAPI()
    setup_logging(debug=True)
    middleware = StructuredLoggingMiddleware(app)

    async def call_next(request: Request):
        return Response("ok")

    tracer = trace.get_tracer("test")
    with tracer.start_as_current_span("test-span") as span:
        request = Request(
            {"type": "http", "method": "GET", "path": "/trace", "headers": []}
        )
        with caplog.at_level(logging.INFO):
            await middleware.dispatch(request, call_next)

    http_logs = [r for r in caplog.records if r.name == "http"]
    assert http_logs, "expected structured http log"
    payload = json.loads(http_logs[-1].getMessage())
    assert payload.get("trace_id") == format(span.get_span_context().trace_id, "032x")
    assert payload.get("span_id") == format(span.get_span_context().span_id, "016x")
