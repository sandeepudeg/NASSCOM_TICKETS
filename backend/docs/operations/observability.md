# Observability Guide

## Metrics
- Endpoint: `/metrics` (Prometheus text)
- Key series:
  - `http_requests_total{method,path,status_code}`
  - `http_request_duration_seconds_bucket` (latency)
  - `ticket_classification_duration_seconds_bucket{routing_status,outcome}`
  - `escalation_webhook_attempts_total{outcome}`
  - `escalation_webhook_duration_seconds_bucket{outcome}`
  - `rag_retrieval_duration_seconds_bucket`
- Scrape target example:
  ```yaml
  - job_name: tickets-api
    metrics_path: /metrics
    scrape_interval: 15s
    static_configs: [{ targets: ["api:8000"] }]
  ```

## Tracing
- OTLP exporter endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT` (gRPC 4317 or HTTP 4318).
- Key spans:
  - `ticket.classify` (attrs: ticket.id, owner_id, category, confidence, routing_status, outcome)
  - `rag.retrieve` + `rag.generate` (linked to parent span)
  - `escalation.webhook` (events per attempt, outcome attribute)
- Exclusions: `/health/live`, `/health/ready`, `/metrics`.

## Logging
- Structured JSON via structlog; fields include trace_id/span_id when a span is active.
- Logger names: `http`, `services.ticket`, `ml.*`.
- Ship to Loki via Promtail (see `promtail-config.yml`).

## Dashboards / Alerts (recommended)
- Grafana panels:
  - HTTP p95 latency: `histogram_quantile(0.95, sum by (le)(rate(http_request_duration_seconds_bucket[5m])))`.
  - Classification p95 by routing_status: `histogram_quantile(0.95, sum by (routing_status,le)(rate(ticket_classification_duration_seconds_bucket[5m])))`.
  - Webhook failure ratio: `rate(escalation_webhook_attempts_total{outcome="failure"}[5m]) / rate(escalation_webhook_attempts_total[5m])`.
- Alerts:
  - Webhook failures >10% for 10m.
  - Webhook p95 latency >2s for 10m.
  - Classification p95 >4s by routing_status for 10m.

## Verification checklist
- Jaeger UI shows linked spans (`ticket.classify` → `rag.*` → `escalation.webhook`).
- Prometheus scrape succeeds; metrics contain labels.
- Logs in Loki include trace_id/span_id and correlate to Jaeger traces.
