"""
Unit tests for embedding model swapping via environment variable.

Tests that the embedding service can load different models at runtime
without code changes, supporting domain adaptation.
"""

try:
    from scripts.db.archive_audit_logs import fetch_logs_to_archive
except ImportError:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))
    from scripts.db.archive_audit_logs import fetch_logs_to_archive

import os
from unittest.mock import MagicMock, patch

from src.ml.embedding_service import EmbeddingService


def test_embedding_model_reads_env_var():
    """Test that EMBEDDING_MODEL env var is read at initialization."""
    with patch.dict(os.environ, {"EMBEDDING_MODEL": "custom-model"}):
        with patch("src.ml.embedding_service.SentenceTransformer") as mock_st:
            mock_model = MagicMock()
            mock_model.get_sentence_embedding_dimension.return_value = 384
            mock_model.name_or_path = "custom-model"
            mock_st.return_value = mock_model
            # Force reload by clearing singleton
            EmbeddingService._instance = None
            EmbeddingService._model = None
            service = EmbeddingService()
            # Verify SentenceTransformer was called with custom model and offline mode
            mock_st.assert_called_once_with("custom-model", local_files_only=True)
            assert service.model_name == "custom-model"


def test_embedding_model_defaults_to_settings():
    """Test that model defaults to settings.embedding_model if env var not set."""
    with patch.dict(os.environ, {}, clear=True):
        with patch("src.ml.embedding_service.SentenceTransformer") as mock_st:
            with patch("src.ml.embedding_service.settings") as mock_settings:
                mock_settings.embedding_model = "all-MiniLM-L6-v2"
                mock_model = MagicMock()
                mock_model.get_sentence_embedding_dimension.return_value = 384
                mock_model.name_or_path = "all-MiniLM-L6-v2"
                mock_st.return_value = mock_model
                # Force reload
                EmbeddingService._instance = None
                EmbeddingService._model = None
                EmbeddingService()
                # Verify default model was used with offline mode
                mock_st.assert_called_once_with("all-MiniLM-L6-v2", local_files_only=True)


def test_embedding_model_reload():
    """Test that reload() method can swap models at runtime."""
    with patch("src.ml.embedding_service.SentenceTransformer") as mock_st:
        mock_model_1 = MagicMock()
        mock_model_1.get_sentence_embedding_dimension.return_value = 384
        mock_model_1.name_or_path = "model-1"
        mock_model_2 = MagicMock()
        mock_model_2.get_sentence_embedding_dimension.return_value = 768
        mock_model_2.name_or_path = "model-2"
        mock_st.side_effect = [mock_model_1, mock_model_2]
        # Force reload
        EmbeddingService._instance = None
        EmbeddingService._model = None
        service = EmbeddingService()
        assert service.model_name == "model-1"
        assert service.dimension == 384
        # Reload with new model
        service.reload("model-2")
        assert service.model_name == "model-2"
        assert service.dimension == 768
        assert os.environ["EMBEDDING_MODEL"] == "model-2"


def test_embedding_service_singleton():
    """Test that EmbeddingService is a singleton."""
    with patch("src.ml.embedding_service.SentenceTransformer") as mock_st:
        mock_model = MagicMock()
        mock_model.get_sentence_embedding_dimension.return_value = 384
        mock_st.return_value = mock_model
        # Force reload
        EmbeddingService._instance = None
        EmbeddingService._model = None
        service1 = EmbeddingService()
        service2 = EmbeddingService()
        assert service1 is service2
        # Model should only be loaded once
        assert mock_st.call_count == 1
