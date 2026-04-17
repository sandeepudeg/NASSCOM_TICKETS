"""
Unit tests for ingest_ticket.py — argument parsing, format detection,
PII scrubbing, schema validation, and payload building.
Requirements: 10.5
"""

import json
import os
import sys
import tempfile
from pathlib import Path

import pytest

# Add scripts/ml to path for importing
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts" / "ml"))

# Import functions under test
from ingest_ticket import (
    VALID_FORMATS,
    build_ticket_payload,
    detect_title_from_payload,
    load_payload,
    validate_structured_payload,
)

# ---------------------------------------------------------------------------
# load_payload
# ---------------------------------------------------------------------------


def test_load_payload_reads_file():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write("Server is down")
        path = f.name
    try:
        content = load_payload(path)
        assert content == "Server is down"
    finally:
        os.unlink(path)


def test_load_payload_file_not_found():
    with pytest.raises(FileNotFoundError):
        load_payload("/nonexistent/path/file.txt")


# ---------------------------------------------------------------------------
# VALID_FORMATS
# ---------------------------------------------------------------------------


def test_valid_formats_contains_all_four():
    assert "json_log" in VALID_FORMATS
    assert "otlp_trace" in VALID_FORMATS
    assert "prometheus_alert" in VALID_FORMATS
    assert "text" in VALID_FORMATS


# ---------------------------------------------------------------------------
# detect_title_from_payload
# ---------------------------------------------------------------------------


def test_detect_title_text_format():
    payload = "Server is down\nMore details here"
    title = detect_title_from_payload(payload, "text")
    assert title == "Server is down"


def test_detect_title_json_log():
    payload = json.dumps({"message": "Connection refused", "level": "error"})
    title = detect_title_from_payload(payload, "json_log")
    assert "Connection refused" in title


def test_detect_title_otlp_trace():
    payload = json.dumps(
        {"resourceSpans": [{"spans": [{"name": "api-gateway error"}]}]}
    )
    title = detect_title_from_payload(payload, "otlp_trace")
    assert "api-gateway error" in title


def test_detect_title_prometheus_alert():
    payload = json.dumps(
        {"alerts": [{"labels": {"alertname": "HighLatency", "severity": "critical"}}]}
    )
    title = detect_title_from_payload(payload, "prometheus_alert")
    assert "HighLatency" in title


def test_detect_title_truncates_at_200_chars():
    long_text = "A" * 300
    title = detect_title_from_payload(long_text, "text")
    assert len(title) <= 200


# ---------------------------------------------------------------------------
# validate_structured_payload
# ---------------------------------------------------------------------------


def test_validate_text_format_always_passes():
    validate_structured_payload("any text here", "text")  # should not raise


def test_validate_otlp_trace_valid():
    payload = json.dumps({"resourceSpans": [{"spans": []}]})
    validate_structured_payload(payload, "otlp_trace")  # should not raise


def test_validate_otlp_trace_missing_field():
    payload = json.dumps({"someOtherField": "value"})
    with pytest.raises(ValueError) as exc_info:
        validate_structured_payload(payload, "otlp_trace")
    assert "otlp_trace" in str(exc_info.value)
    assert "resourceSpans" in str(exc_info.value)


def test_validate_prometheus_alert_valid():
    payload = json.dumps({"alerts": [{"labels": {"alertname": "Test"}}]})
    validate_structured_payload(payload, "prometheus_alert")  # should not raise


def test_validate_prometheus_alert_missing_field():
    payload = json.dumps({"unrelated": "data"})
    with pytest.raises(ValueError) as exc_info:
        validate_structured_payload(payload, "prometheus_alert")
    assert "prometheus_alert" in str(exc_info.value)


def test_validate_json_log_valid():
    payload = json.dumps({"message": "error occurred", "level": "error"})
    validate_structured_payload(payload, "json_log")  # should not raise


def test_validate_json_log_missing_fields():
    payload = json.dumps({"foo": "bar"})
    with pytest.raises(ValueError) as exc_info:
        validate_structured_payload(payload, "json_log")
    assert "json_log" in str(exc_info.value)


def test_validate_invalid_json_raises():
    with pytest.raises(ValueError) as exc_info:
        validate_structured_payload("not json {{{", "otlp_trace")
    assert "valid JSON" in str(exc_info.value)


# ---------------------------------------------------------------------------
# build_ticket_payload
# ---------------------------------------------------------------------------


def test_build_ticket_payload_text():
    payload = "Database connection timeout on prod-db-01"
    result = build_ticket_payload(payload, "text")
    assert "title" in result
    assert "description" in result
    assert "structured_payload" not in result


def test_build_ticket_payload_json_log_includes_structured():
    payload = json.dumps(
        {"message": "disk full", "level": "critical", "service": "storage"}
    )
    result = build_ticket_payload(payload, "json_log")
    assert "structured_payload" in result
    assert isinstance(result["structured_payload"], dict)


def test_build_ticket_payload_scrubs_email():
    payload = "Contact admin@example.com for support"
    result = build_ticket_payload(payload, "text")
    assert "admin@example.com" not in result["title"]
    assert "admin@example.com" not in result["description"]
    assert "[EMAIL]" in result["title"] or "[EMAIL]" in result["description"]


def test_build_ticket_payload_scrubs_ip():
    payload = "Error from server 192.168.1.100 at port 8080"
    result = build_ticket_payload(payload, "text")
    assert "192.168.1.100" not in result["description"]
    assert "[IP]" in result["description"]


def test_build_ticket_payload_description_truncated():
    long_payload = "A" * 5000
    result = build_ticket_payload(long_payload, "text")
    assert len(result["description"]) <= 2000


def test_build_ticket_payload_prometheus_includes_structured():
    payload = json.dumps(
        {"alerts": [{"labels": {"alertname": "HighCPU", "severity": "warning"}}]}
    )
    result = build_ticket_payload(payload, "prometheus_alert")
    assert "structured_payload" in result
