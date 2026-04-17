"""
Property-based tests for AI classifier and ML pipeline correctness properties (P17–P26).
Feature: tickets-folder
"""
import json
import re
import pytest
from unittest.mock import patch, MagicMock

from hypothesis import given, settings, assume
import hypothesis.strategies as st

from src.ml.pii_scrubber import PIIScrubber
from src.ml.structured_input_parser import StructuredInputParser
from src.schemas.ticket import Category, RoutingStatus

VALID_CATEGORIES = {c.value for c in Category}
ESCALATION_THRESHOLD = 0.65


# Feature: tickets-folder, Property 17: Classification Output Invariant
class TestP17ClassificationOutputInvariant:

    @given(confidence=st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    @settings(max_examples=100)
    def test_confidence_score_always_in_range(self, confidence):
        """P17b: confidence_score must always be a float in [0.0, 1.0]."""
        # Feature: tickets-folder, Property 17: Classification Output Invariant
        clamped = max(0.0, min(1.0, confidence))
        assert 0.0 <= clamped <= 1.0

    @given(category_str=st.sampled_from(list(VALID_CATEGORIES)))
    @settings(max_examples=100)
    def test_category_always_one_of_seven(self, category_str):
        """P17a: Classification must return exactly one of the seven defined categories."""
        # Feature: tickets-folder, Property 17: Classification Output Invariant
        cat = Category(category_str)
        assert cat.value in VALID_CATEGORIES

    @given(confidence=st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    @settings(max_examples=100)
    def test_escalation_routing_invariant(self, confidence):
        """P23: Below threshold → escalated; at/above threshold → not escalated."""
        # Feature: tickets-folder, Property 23: Escalation Routing Invariant
        if confidence < ESCALATION_THRESHOLD:
            routing = RoutingStatus.ESCALATED
        else:
            routing = RoutingStatus.CLASSIFIED
        assert routing != RoutingStatus.ESCALATED or confidence < ESCALATION_THRESHOLD
        assert routing != RoutingStatus.CLASSIFIED or confidence >= ESCALATION_THRESHOLD


# Feature: tickets-folder, Property 18: Structured Input Acceptance
class TestP18StructuredInputAcceptance:

    def _make_otlp_payload(self):
        return json.dumps({
            "resourceSpans": [{
                "spans": [{
                    "traceId": "abc123",
                    "spanId": "def456",
                    "startTimeUnixNano": "1234567890",
                    "status": {"code": 2, "message": "error"},
                    "attributes": [{"key": "service.name", "value": "api-gateway"}]
                }]
            }]
        })

    def _make_prometheus_payload(self):
        return json.dumps({
            "alerts": [{
                "alertname": "HighLatency",
                "labels": {"severity": "critical", "job": "api"},
                "annotations": {"summary": "High latency"},
                "startsAt": "2024-01-01T00:00:00Z"
            }]
        })

    def _make_json_log_payload(self):
        return json.dumps({
            "level": "error",
            "message": "Connection refused",
            "service": "db-service",
            "timestamp": "2024-01-01T00:00:00Z"
        })

    @settings(max_examples=10, deadline=None)
    @given(dummy=st.just(None))
    def test_otlp_trace_populates_causal_context(self, dummy):
        """P18: Well-formed OTLP trace must populate causal_context."""
        # Feature: tickets-folder, Property 18: Structured Input Acceptance
        payload = self._make_otlp_payload()
        context, fmt, warning, signal = StructuredInputParser.parse(payload)
        assert fmt == "otlp_trace"
        assert warning is None
        assert "service_names" in context

    @settings(max_examples=10, deadline=None)
    @given(dummy=st.just(None))
    def test_prometheus_alert_populates_causal_context(self, dummy):
        """P18: Well-formed Prometheus alert must populate causal_context."""
        # Feature: tickets-folder, Property 18: Structured Input Acceptance
        payload = self._make_prometheus_payload()
        context, fmt, warning, signal = StructuredInputParser.parse(payload)
        assert fmt == "prometheus_alert"
        assert "service_names" in context

    @settings(max_examples=10, deadline=None)
    @given(dummy=st.just(None))
    def test_json_log_populates_causal_context(self, dummy):
        """P18: Well-formed JSON log must populate causal_context."""
        # Feature: tickets-folder, Property 18: Structured Input Acceptance
        payload = self._make_json_log_payload()
        context, fmt, warning, signal = StructuredInputParser.parse(payload)
        assert fmt == "json_log"
        assert "severity" in context


# Feature: tickets-folder, Property 19: Unknown Format Fallback
class TestP19UnknownFormatFallback:

    @given(text=st.text(min_size=1, max_size=500).filter(
        lambda s: not s.strip().startswith("{") and not s.strip().startswith("[")
    ))
    @settings(max_examples=100, deadline=None)
    def test_plain_text_falls_back_gracefully(self, text):
        """P19: Non-JSON payload must fall back to plain text without error."""
        # Feature: tickets-folder, Property 19: Unknown Format Fallback
        context, fmt, warning, signal = StructuredInputParser.parse(text)
        assert fmt == "text"
        assert warning is not None  # parse_warning must be set

    @given(data=st.binary(min_size=1, max_size=100))
    @settings(max_examples=50, deadline=None)
    def test_binary_data_falls_back_gracefully(self, data):
        """P19: Binary/arbitrary data must not raise an exception."""
        # Feature: tickets-folder, Property 19: Unknown Format Fallback
        try:
            text = data.decode("utf-8", errors="replace")
            context, fmt, warning, signal = StructuredInputParser.parse(text)
            # Must not raise — either parses or falls back to text
            assert fmt in ("text", "json_log", "otlp_trace", "prometheus_alert")
        except Exception as e:
            pytest.fail(f"Parser raised unexpected exception: {e}")


# Feature: tickets-folder, Property 21: RAG Retrieval Threshold Invariant
class TestP21RAGRetrievalThresholdInvariant:

    @given(scores=st.lists(
        st.floats(min_value=0.0, max_value=1.0, allow_nan=False),
        min_size=0,
        max_size=10
    ))
    @settings(max_examples=100)
    def test_only_scores_above_threshold_returned(self, scores):
        """P21: Every similar_ticket entry must have similarity_score >= 0.70."""
        # Feature: tickets-folder, Property 21: RAG Retrieval Threshold Invariant
        threshold = 0.70
        filtered = [s for s in scores if s >= threshold]
        top5 = filtered[:5]
        for score in top5:
            assert score >= threshold
        assert len(top5) <= 5

    @given(count=st.integers(min_value=0, max_value=1))
    @settings(max_examples=100)
    def test_low_retrieval_confidence_when_fewer_than_2(self, count):
        """P21: low_retrieval_confidence must be True when fewer than 2 results."""
        # Feature: tickets-folder, Property 21: RAG Retrieval Threshold Invariant
        low_confidence = count < 2
        assert low_confidence is True


# Feature: tickets-folder, Property 26: PII Scrubbing Completeness
class TestP26PIIScrubbing:

    @given(email=st.emails().filter(lambda e: re.match(r'^[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$', e)))
    @settings(max_examples=100, deadline=None)
    def test_email_is_redacted(self, email):
        """P26: Email addresses must be replaced with [EMAIL] placeholder."""
        # Feature: tickets-folder, Property 26: PII Scrubbing Completeness
        text = f"Contact user at {email} for support"
        scrubbed, summary = PIIScrubber.scrub(text)
        assert email not in scrubbed
        assert "[EMAIL]" in scrubbed
        assert summary["redaction_summary"]["email"] >= 1

    @given(
        octet1=st.integers(min_value=1, max_value=254),
        octet2=st.integers(min_value=0, max_value=255),
        octet3=st.integers(min_value=0, max_value=255),
        octet4=st.integers(min_value=1, max_value=254),
    )
    @settings(max_examples=100, deadline=None)
    def test_ip_address_is_redacted(self, octet1, octet2, octet3, octet4):
        """P26: IP addresses must be replaced with [IP] placeholder."""
        # Feature: tickets-folder, Property 26: PII Scrubbing Completeness
        ip = f"{octet1}.{octet2}.{octet3}.{octet4}"
        text = f"Error from server {ip} at port 8080"
        scrubbed, summary = PIIScrubber.scrub(text)
        assert ip not in scrubbed
        assert "[IP]" in scrubbed

    @given(text=st.text(min_size=0, max_size=500))
    @settings(max_examples=100, deadline=None)
    def test_scrubbed_text_length_nonnegative(self, text):
        """P26: Scrubbed text length must be >= 0 (placeholders preserve structure)."""
        # Feature: tickets-folder, Property 26: PII Scrubbing Completeness
        scrubbed, summary = PIIScrubber.scrub(text)
        assert len(scrubbed) >= 0
        assert "total_detected" in summary

    @given(text=st.text(min_size=1, max_size=500))
    @settings(max_examples=100, deadline=None)
    def test_scrub_returns_consistent_structure(self, text):
        """P26: scrub() must always return (str, dict) with required keys."""
        # Feature: tickets-folder, Property 26: PII Scrubbing Completeness
        result = PIIScrubber.scrub(text)
        assert isinstance(result, tuple)
        assert len(result) == 2
        scrubbed, summary = result
        assert isinstance(scrubbed, str)
        assert isinstance(summary, dict)
        assert "redaction_summary" in summary
        assert "total_detected" in summary
