"""
Unit tests for Prometheus metric registration and increment.

**Validates: Requirements design observability**
"""

import pytest
from prometheus_client import REGISTRY, CollectorRegistry
from prometheus_client.core import Counter, Histogram, Gauge

from config.observability import (
    REQUEST_COUNT,
    REQUEST_LATENCY,
    CLASSIFIER_CONFIDENCE_SCORE,
    CLASSIFIER_CATEGORY_TOTAL,
    ESCALATION_QUEUE_DEPTH,
    PATTERN_ALERT_COUNT,
    PII_REDACTIONS_TOTAL,
    RAG_RETRIEVAL_DURATION_SECONDS,
    BULK_ASSIGN_BATCH_SIZE,
    WEBHOOK_DELIVERY_FAILURES_TOTAL,
    record_classifier_prediction,
    record_pii_redaction,
    record_rag_retrieval_duration,
    record_bulk_assign_batch,
    set_escalation_queue_depth,
    set_pattern_alert_count,
    record_webhook_delivery_failure,
)


class TestPrometheusMetrics:
    """Test Prometheus metric registration and increment."""

    def test_http_requests_total_registered(self):
        """Verify http_requests_total counter is registered."""
        # Counter names don't include _total suffix in _name attribute
        assert REQUEST_COUNT._name == "http_requests"
        assert isinstance(REQUEST_COUNT, Counter)
        assert REQUEST_COUNT._labelnames == ("method", "path", "status_code")

    def test_http_request_duration_seconds_registered(self):
        """Verify http_request_duration_seconds histogram is registered."""
        assert REQUEST_LATENCY._name == "http_request_duration_seconds"
        assert isinstance(REQUEST_LATENCY, Histogram)
        assert REQUEST_LATENCY._labelnames == ("method", "path", "status_code")

    def test_classifier_confidence_score_registered(self):
        """Verify classifier_confidence_score histogram is registered."""
        assert CLASSIFIER_CONFIDENCE_SCORE._name == "classifier_confidence_score"
        assert isinstance(CLASSIFIER_CONFIDENCE_SCORE, Histogram)
        assert CLASSIFIER_CONFIDENCE_SCORE._labelnames == ("category",)

    def test_classifier_category_total_registered(self):
        """Verify classifier_category_total counter is registered."""
        assert CLASSIFIER_CATEGORY_TOTAL._name == "classifier_category"
        assert isinstance(CLASSIFIER_CATEGORY_TOTAL, Counter)
        assert CLASSIFIER_CATEGORY_TOTAL._labelnames == ("category",)

    def test_escalation_queue_depth_registered(self):
        """Verify escalation_queue_depth gauge is registered."""
        assert ESCALATION_QUEUE_DEPTH._name == "escalation_queue_depth"
        assert isinstance(ESCALATION_QUEUE_DEPTH, Gauge)

    def test_pattern_alert_count_registered(self):
        """Verify pattern_alert_count gauge is registered."""
        assert PATTERN_ALERT_COUNT._name == "pattern_alert_count"
        assert isinstance(PATTERN_ALERT_COUNT, Gauge)
        assert PATTERN_ALERT_COUNT._labelnames == ("status",)

    def test_pii_redactions_total_registered(self):
        """Verify pii_redactions_total counter is registered."""
        assert PII_REDACTIONS_TOTAL._name == "pii_redactions"
        assert isinstance(PII_REDACTIONS_TOTAL, Counter)
        assert PII_REDACTIONS_TOTAL._labelnames == ("entity_type",)

    def test_rag_retrieval_duration_seconds_registered(self):
        """Verify rag_retrieval_duration_seconds histogram is registered."""
        assert RAG_RETRIEVAL_DURATION_SECONDS._name == "rag_retrieval_duration_seconds"
        assert isinstance(RAG_RETRIEVAL_DURATION_SECONDS, Histogram)

    def test_bulk_assign_batch_size_registered(self):
        """Verify bulk_assign_batch_size histogram is registered."""
        assert BULK_ASSIGN_BATCH_SIZE._name == "bulk_assign_batch_size"
        assert isinstance(BULK_ASSIGN_BATCH_SIZE, Histogram)

    def test_webhook_delivery_failures_total_registered(self):
        """Verify webhook_delivery_failures_total counter is registered."""
        assert WEBHOOK_DELIVERY_FAILURES_TOTAL._name == "webhook_delivery_failures"
        assert isinstance(WEBHOOK_DELIVERY_FAILURES_TOTAL, Counter)

    def test_classifier_prediction_increments_metrics(self):
        """Verify record_classifier_prediction increments both histogram and counter."""
        category = "Infrastructure"
        confidence = 0.87

        # Get initial values
        initial_counter = CLASSIFIER_CATEGORY_TOTAL.labels(category=category)._value.get()
        
        # Record prediction
        record_classifier_prediction(category, confidence)

        # Verify counter incremented
        final_counter = CLASSIFIER_CATEGORY_TOTAL.labels(category=category)._value.get()
        assert final_counter == initial_counter + 1

        # Verify histogram recorded (check sample count increased)
        histogram_samples = CLASSIFIER_CONFIDENCE_SCORE.labels(category=category)._sum.get()
        assert histogram_samples >= confidence

    def test_pii_redaction_increments_counter(self):
        """Verify record_pii_redaction increments counter."""
        entity_type = "email"
        
        # Get initial value
        initial_value = PII_REDACTIONS_TOTAL.labels(entity_type=entity_type)._value.get()
        
        # Record redaction
        record_pii_redaction(entity_type, count=3)

        # Verify counter incremented by 3
        final_value = PII_REDACTIONS_TOTAL.labels(entity_type=entity_type)._value.get()
        assert final_value == initial_value + 3

    def test_rag_retrieval_duration_records_histogram(self):
        """Verify record_rag_retrieval_duration records to histogram."""
        duration = 0.123
        
        # Get initial sum (histograms track sum, not count directly)
        initial_sum = RAG_RETRIEVAL_DURATION_SECONDS._sum.get()
        
        # Record duration
        record_rag_retrieval_duration(duration)

        # Verify histogram recorded (sum increased)
        final_sum = RAG_RETRIEVAL_DURATION_SECONDS._sum.get()
        assert final_sum >= initial_sum + duration

    def test_bulk_assign_batch_records_histogram(self):
        """Verify record_bulk_assign_batch records to histogram."""
        batch_size = 50
        
        # Get initial sum
        initial_sum = BULK_ASSIGN_BATCH_SIZE._sum.get()
        
        # Record batch
        record_bulk_assign_batch(batch_size)

        # Verify histogram recorded (sum increased)
        final_sum = BULK_ASSIGN_BATCH_SIZE._sum.get()
        assert final_sum >= initial_sum + batch_size

    def test_escalation_queue_depth_sets_gauge(self):
        """Verify set_escalation_queue_depth sets gauge value."""
        depth = 42
        
        # Set gauge
        set_escalation_queue_depth(depth)

        # Verify gauge value
        assert ESCALATION_QUEUE_DEPTH._value.get() == depth

    def test_pattern_alert_count_sets_gauge(self):
        """Verify set_pattern_alert_count sets gauge value."""
        status = "active"
        count = 15
        
        # Set gauge
        set_pattern_alert_count(status, count)

        # Verify gauge value
        assert PATTERN_ALERT_COUNT.labels(status=status)._value.get() == count

    def test_webhook_delivery_failure_increments_counter(self):
        """Verify record_webhook_delivery_failure increments counter."""
        # Get initial value
        initial_value = WEBHOOK_DELIVERY_FAILURES_TOTAL._value.get()
        
        # Record failure
        record_webhook_delivery_failure()

        # Verify counter incremented
        final_value = WEBHOOK_DELIVERY_FAILURES_TOTAL._value.get()
        assert final_value == initial_value + 1

    def test_http_requests_total_increments_on_api_call(self):
        """Verify http_requests_total increments on each API call."""
        method = "POST"
        path = "/api/v1/tickets"
        status = "201"
        
        # Get initial value
        initial_value = REQUEST_COUNT.labels(method=method, path=path, status_code=status)._value.get()
        
        # Simulate API call
        REQUEST_COUNT.labels(method=method, path=path, status_code=status).inc()

        # Verify counter incremented
        final_value = REQUEST_COUNT.labels(method=method, path=path, status_code=status)._value.get()
        assert final_value == initial_value + 1

    def test_http_request_duration_records_latency(self):
        """Verify http_request_duration_seconds records latency."""
        method = "GET"
        path = "/api/v1/folders"
        status = "200"
        duration = 0.045
        
        # Get initial sum
        initial_sum = REQUEST_LATENCY.labels(method=method, path=path, status_code=status)._sum.get()
        
        # Record latency
        REQUEST_LATENCY.labels(method=method, path=path, status_code=status).observe(duration)

        # Verify histogram recorded (sum increased)
        final_sum = REQUEST_LATENCY.labels(method=method, path=path, status_code=status)._sum.get()
        assert final_sum >= initial_sum + duration

    def test_multiple_categories_tracked_independently(self):
        """Verify different categories are tracked independently."""
        categories = ["Infrastructure", "Application", "Security"]
        
        for category in categories:
            initial = CLASSIFIER_CATEGORY_TOTAL.labels(category=category)._value.get()
            record_classifier_prediction(category, 0.9)
            final = CLASSIFIER_CATEGORY_TOTAL.labels(category=category)._value.get()
            assert final == initial + 1

    def test_multiple_pii_entity_types_tracked_independently(self):
        """Verify different PII entity types are tracked independently."""
        entity_types = ["email", "phone", "ip_address"]
        
        for entity_type in entity_types:
            initial = PII_REDACTIONS_TOTAL.labels(entity_type=entity_type)._value.get()
            record_pii_redaction(entity_type, count=1)
            final = PII_REDACTIONS_TOTAL.labels(entity_type=entity_type)._value.get()
            assert final == initial + 1
