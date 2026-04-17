import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch

from src.ml.structured_input_parser import StructuredInputParser
from src.ml.pii_scrubber import PIIScrubber


class TestStructuredInputParser:
    def test_detect_format_json_log(self):
        payload = (
            '{"level": "error", "message": "Service failed", "timestamp": "2024-01-01"}'
        )
        format_type = StructuredInputParser.detect_format(payload)
        assert format_type == "json_log"

    def test_detect_format_otlp_trace(self):
        payload = '{"resourceSpans": [{"spans": [{"spanId": "abc123"}]}]}'
        format_type = StructuredInputParser.detect_format(payload)
        assert format_type == "otlp_trace"

    def test_detect_format_prometheus_alert(self):
        payload = '{"alerts": [{"labels": {"alertname": "HighCPU"}, "startsAt": "2024-01-01"}]}'
        format_type = StructuredInputParser.detect_format(payload)
        assert format_type == "prometheus_alert"

    def test_detect_format_plain_text(self):
        payload = "This is just a plain text ticket"
        format_type = StructuredInputParser.detect_format(payload)
        assert format_type == "text"

    def test_parse_json_log(self):
        payload = '{"level": "error", "message": "Database connection failed", "service": "api", "timestamp": "2024-01-01T00:00:00Z"}'
        context = StructuredInputParser.parse_json_log(payload)

        assert context["severity"] == "error"
        assert "api" in context["service_names"]

    def test_parse_otlp_trace(self):
        payload = '{"resourceSpans": [{"spans": [{"status": {"code": 2, "message": "error"}, "attributes": [{"key": "service.name", "value": "checkout"}]}]}]}'
        context = StructuredInputParser.parse_otlp_trace(payload)

        assert context["severity"] == "error"
        assert "checkout" in context["service_names"]

    def test_parse_prometheus_alert(self):
        payload = '{"alerts": [{"labels": {"alertname": "HighMemory", "severity": "critical", "job": "payment"}, "startsAt": "2024-01-01T00:00:00Z"}]}'
        context = StructuredInputParser.parse_prometheus_alert(payload)

        assert context["severity"] == "critical"
        assert "payment" in context["service_names"]

    def test_parse_returns_causal_signal(self):
        payload = '{"level": "error", "message": "Connection refused", "service": "db", "timestamp": "2024-01-01"}'
        context, fmt, parse_warning, causal_signal = StructuredInputParser.parse(
            payload
        )

        assert causal_signal is not None
        assert "error" in causal_signal.lower() or "anomaly" in causal_signal.lower()


class TestPIIScrubber:
    def test_scrub_email(self):
        text = "Contact me at test@example.com for support"
        scrubbed, summary = PIIScrubber.scrub(text)

        assert "[EMAIL]" in scrubbed
        assert summary["redaction_summary"]["email"] == 1

    def test_scrub_phone(self):
        text = "Call me at 555-123-4567 for help"
        scrubbed, summary = PIIScrubber.scrub(text)

        assert "[PHONE]" in scrubbed
        assert summary["redaction_summary"]["phone"] >= 1

    def test_scrub_ip_address(self):
        text = "Error from server 192.168.1.1"
        scrubbed, summary = PIIScrubber.scrub(text)

        assert "[IP]" in scrubbed
        assert summary["redaction_summary"]["ip_address"] >= 1

    def test_scrub_credit_card(self):
        text = "Card number 4111-1111-1111-1111"
        scrubbed, summary = PIIScrubber.scrub(text)

        assert "[CREDIT_CARD]" in scrubbed
        assert summary["redaction_summary"]["credit_card"] >= 1

    def test_scrub_ssn(self):
        text = "SSN: 123-45-6789"
        scrubbed, summary = PIIScrubber.scrub(text)

        assert "[NATIONAL_ID]" in scrubbed
        assert summary["redaction_summary"]["national_id"] >= 1

    def test_scrub_empty_text(self):
        text = ""
        scrubbed, summary = PIIScrubber.scrub(text)

        assert scrubbed == ""
        assert summary["total_detected"] == 0

    def test_scrub_multiple_entities(self):
        text = "User John Doe (john@example.com) from 192.168.1.1 called 555-123-4567"
        scrubbed, summary = PIIScrubber.scrub(text)

        assert "[EMAIL]" in scrubbed
        assert "[IP]" in scrubbed
        assert "[PHONE]" in scrubbed
        assert summary["total_detected"] >= 3


class TestClassifierValidation:
    def test_category_definitions_complete(self):
        from ml.classifier import CATEGORY_DEFINITIONS

        required_categories = [
            "Infrastructure",
            "Application",
            "Security",
            "Database",
            "Storage",
            "Network",
            "Access Management",
        ]

        for category in required_categories:
            assert category in CATEGORY_DEFINITIONS


class TestRAGServiceValidation:
    def test_similarity_threshold_config(self):
        from ml.rag_service import rag_service

        assert rag_service.similarity_threshold >= 0.0
        assert rag_service.similarity_threshold <= 1.0
        assert rag_service.similarity_threshold == 0.70

    def test_top_k_config(self):
        from ml.rag_service import rag_service

        assert rag_service.top_k > 0
        assert rag_service.top_k == 5
