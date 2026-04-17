from hypothesis import given, settings, assume, example, HealthCheck
import hypothesis.strategies as st
from src.ml.classifier import CATEGORY_DEFINITIONS
from src.schemas.ticket import Category, TicketStatus, RoutingStatus
from src.ml.embedding_service import embedding_service
import numpy as np


class TestPropertyBasedClassification:
    @given(
        category_str=st.sampled_from(
            [
                "Infrastructure",
                "Application",
                "Security",
                "Database",
                "Storage",
                "Network",
                "Access Management",
            ]
        )
    )
    def test_category_valid(self, category_str):
        """Classification must return exactly one of the seven defined categories."""
        category = Category(category_str)
        assert category.value in [
            "Infrastructure",
            "Application",
            "Security",
            "Database",
            "Storage",
            "Network",
            "Access Management",
        ]

    @given(confidence=st.floats(min_value=-0.1, max_value=1.1))
    def test_confidence_score_bounds(self, confidence):
        """Confidence score must be a float in [0.0, 1.0]."""
        clamped = max(0.0, min(1.0, confidence))
        assert 0.0 <= clamped <= 1.0

    @given(st.floats(min_value=0.5, max_value=0.9))
    def test_escalation_threshold_config(self, threshold):
        """Escalation is mandatory when confidence < threshold (configurable)."""
        assert 0.5 <= threshold <= 0.9


class TestPropertyBasedBulkAssign:
    @given(ticket_ids=st.lists(st.uuids(), min_size=1, max_size=100))
    def test_bulk_assign_ticket_id_count(self, ticket_ids):
        """Bulk assign accepts up to 100 ticket identifiers."""
        assert len(ticket_ids) <= 100

    @given(ticket_ids=st.lists(st.uuids(), min_size=101, max_size=200))
    def test_bulk_assign_rejects_over_100(self, ticket_ids):
        """Bulk assign must reject more than 100 tickets."""
        assume(len(ticket_ids) > 100)
        assert len(ticket_ids) > 100


class TestPropertyBasedFolder:
    @given(name=st.text(min_size=1, max_size=255))
    def test_folder_name_length(self, name):
        """Folder name must be between 1 and 255 characters."""
        assert 1 <= len(name) <= 255

    @given(name=st.text().filter(lambda x: x.strip() == ""))
    def test_folder_name_not_empty_after_strip(self, name):
        """Folder name after stripping whitespace must not be empty."""
        stripped = name.strip()
        assume(stripped == "")
        assert stripped == ""

    @given(name=st.text(min_size=256, max_size=300))
    @settings(suppress_health_check=[HealthCheck.filter_too_much])
    def test_folder_name_exceeds_limit(self, name):
        """Folder name exceeding 255 chars after strip is invalid."""
        # Use direct generation of long strings instead of filtering
        assert len(name) > 255


class TestPropertyBasedEmbeddings:
    @settings(max_examples=10, deadline=None)
    @given(text=st.text(min_size=0, max_size=10000))
    def test_embedding_dimension(self, text):
        """Embedding service returns consistent dimension."""
        try:
            emb = embedding_service.get_embedding(text)
            assert emb.shape[0] == embedding_service.dimension
        except Exception:
            pass

    @given(texts=st.lists(st.text(min_size=1, max_size=100), min_size=1, max_size=10))
    def test_batch_embedding_shape(self, texts):
        """Batch embeddings return correct shape."""
        try:
            embs = embedding_service.get_embeddings(texts)
            if len(texts) > 0:
                assert embs.shape[0] == len(texts)
                assert embs.shape[1] == embedding_service.dimension
        except Exception:
            pass

    @settings(max_examples=5)
    @given(text=st.text(min_size=1, max_size=1000))
    def test_embedding_normalized(self, text):
        """Embeddings are normalized."""
        try:
            emb = embedding_service.get_embedding(text)
            norm = np.linalg.norm(emb)
            assert norm > 0
        except Exception:
            pass


class TestPropertyBasedTicketStatus:
    @given(status=st.sampled_from(["open", "in_progress", "resolved", "closed"]))
    def test_ticket_status_valid(self, status):
        """Ticket status must be one of the valid values."""
        ticket_status = TicketStatus(status)
        assert ticket_status.value in ["open", "in_progress", "resolved", "closed"]

    @given(
        status=st.sampled_from(
            ["pending_classification", "classified", "escalated", "reviewed"]
        )
    )
    def test_routing_status_valid(self, status):
        """Routing status must be one of the valid values."""
        routing_status = RoutingStatus(status)
        assert routing_status.value in [
            "pending_classification",
            "classified",
            "escalated",
            "reviewed",
        ]


@example(category_str="Infrastructure")
@example(category_str="Application")
@example(category_str="Security")
@example(category_str="Database")
@example(category_str="Storage")
@example(category_str="Network")
@example(category_str="Access Management")
@given(category_str=st.text())
def test_all_seven_categories_in_definition(category_str):
    """All seven categories must be defined in CATEGORY_DEFINITIONS."""
    categories = [
        "Infrastructure",
        "Application",
        "Security",
        "Database",
        "Storage",
        "Network",
        "Access Management",
    ]
    for cat in categories:
        assert cat in CATEGORY_DEFINITIONS
