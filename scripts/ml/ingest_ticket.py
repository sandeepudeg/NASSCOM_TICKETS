#!/usr/bin/env python3
"""
ingest_ticket.py — CLI script for batch ticket ingestion.

Usage:
    python ingest_ticket.py --file <path> --format <format> [--api-url <url>]

Formats:
    json_log        — ECS or plain key-value JSON log
    otlp_trace      — OpenTelemetry OTLP JSON trace extract
    prometheus_alert — Prometheus Alertmanager webhook payload
    text            — Plain free text (default)

Requirements: 10.5
"""

import argparse
import json
import sys
import os
import httpx

from src.ml.pii_scrubber import PIIScrubber

VALID_FORMATS = ("json_log", "otlp_trace", "prometheus_alert", "text")


def load_payload(file_path: str) -> str:
    """Read file content as string."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def detect_title_from_payload(payload: str, fmt: str) -> str:
    """Extract a meaningful title from the payload."""
    if fmt == "text":
        first_line = (
            payload.strip().splitlines()[0] if payload.strip() else "Ingested ticket"
        )
        return first_line[:200]
    try:
        data = json.loads(payload)
        if fmt == "json_log":
            return data.get("message", data.get("msg", "Log ingestion ticket"))[:200]
        if fmt == "otlp_trace":
            spans = data.get("resourceSpans", [{}])[0].get("spans", [{}])
            return (
                spans[0].get("name", "Trace ingestion ticket")[:200]
                if spans
                else "Trace ingestion ticket"
            )
        if fmt == "prometheus_alert":
            alerts = data.get("alerts", [{}])
            labels = alerts[0].get("labels", {}) if alerts else {}
            return labels.get("alertname", "Prometheus alert ticket")[:200]
    except Exception:
        pass
    return "Ingested ticket"


def validate_structured_payload(payload: str, fmt: str) -> None:
    """Validate required fields for recognised formats. Raises ValueError on failure."""
    if fmt == "text":
        return
    try:
        data = json.loads(payload)
    except json.JSONDecodeError as e:
        raise ValueError(f"Payload is not valid JSON: {e}")

    if fmt == "otlp_trace":
        if "resourceSpans" not in data and "spans" not in data:
            raise ValueError(
                "OTLP trace payload missing required field 'resourceSpans'. "
                "Detected format: otlp_trace."
            )
    elif fmt == "prometheus_alert":
        if "alerts" not in data and "labels" not in data:
            raise ValueError(
                "Prometheus alert payload missing required field 'alerts'. "
                "Detected format: prometheus_alert."
            )
    elif fmt == "json_log":
        if not any(k in data for k in ("message", "msg", "level", "timestamp")):
            raise ValueError(
                "JSON log payload missing expected fields (message/msg/level/timestamp). "
                "Detected format: json_log."
            )


def build_ticket_payload(raw_payload: str, fmt: str) -> dict:
    """Build the API request body from the raw payload."""
    # PII scrub
    scrubbed, summary = PIIScrubber.scrub(raw_payload)
    if summary.get("total_detected", 0) > 0:
        print(
            f"[PII] Redacted {summary['total_detected']} entity/entities: "
            f"{summary['redaction_summary']}",
            file=sys.stderr,
        )

    title = detect_title_from_payload(scrubbed, fmt)
    description = scrubbed[:2000]  # truncate for description field

    payload: dict = {
        "title": title,
        "description": description,
    }

    if fmt != "text":
        try:
            payload["structured_payload"] = json.loads(scrubbed)
        except Exception:
            pass

    return payload


def submit_ticket(
    api_url: str, ticket_payload: dict, user_id: str = "ingest-cli"
) -> dict:
    """POST the ticket to the API and return the response."""
    headers = {"x-user-id": user_id, "Content-Type": "application/json"}
    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            f"{api_url}/api/v1/tickets", json=ticket_payload, headers=headers
        )
        response.raise_for_status()
        return response.json()


def main():
    parser = argparse.ArgumentParser(
        description="Ingest a ticket from a file into the TicketIQ system."
    )
    parser.add_argument("--file", required=True, help="Path to the input file")
    parser.add_argument(
        "--format",
        choices=VALID_FORMATS,
        default="text",
        help="Input format (default: text)",
    )
    parser.add_argument(
        "--api-url",
        default=os.getenv("TICKETS_API_URL", "http://localhost:8000"),
        help="Base URL of the TicketIQ API (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--user-id",
        default="ingest-cli",
        help="User ID to attribute the ticket to (default: ingest-cli)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate without submitting to the API",
    )
    args = parser.parse_args()

    # Load
    try:
        raw_payload = load_payload(args.file)
    except FileNotFoundError:
        print(f"[ERROR] File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    # Validate structured format
    try:
        validate_structured_payload(raw_payload, args.format)
    except ValueError as e:
        print(f"[ERROR] Schema validation failed: {e}", file=sys.stderr)
        sys.exit(1)

    # Build ticket
    ticket_payload = build_ticket_payload(raw_payload, args.format)

    if args.dry_run:
        print("[DRY RUN] Ticket payload (not submitted):")
        print(json.dumps(ticket_payload, indent=2))
        sys.exit(0)

    # Submit
    try:
        result = submit_ticket(args.api_url, ticket_payload, args.user_id)
        print(
            f"[OK] Ticket created: {result.get('id')} | "
            f"routing_status={result.get('routing_status')} | "
            f"category={result.get('category')}"
        )
    except httpx.HTTPStatusError as e:
        print(
            f"[ERROR] API returned {e.response.status_code}: {e.response.text}",
            file=sys.stderr,
        )
        sys.exit(1)
    except httpx.RequestError as e:
        print(
            f"[ERROR] Could not connect to API at {args.api_url}: {e}", file=sys.stderr
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
