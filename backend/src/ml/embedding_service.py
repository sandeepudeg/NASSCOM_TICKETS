import os
from typing import Optional

import numpy as np
from sentence_transformers import SentenceTransformer

from src.schemas.settings import settings


class EmbeddingService:
    _instance: Optional["EmbeddingService"] = None
    _model: SentenceTransformer | None = None
    _allow_remote_download: bool = (
        os.getenv("ALLOW_EMBEDDING_DOWNLOAD", "false").lower() == "true"
    )

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._model is None:
            self._load_model()

    def _load_model(self) -> None:
        model_name = os.getenv("EMBEDDING_MODEL", settings.embedding_model)
        
        # 1. Check if model exists in the expected HF Spaces local cache directory
        # This path is populated during the Docker build process.
        local_cache_path = f"/app/model_cache/{model_name}"
        
        # 2. Prefer the local path if it exists to satisfy TRANSFORMERS_OFFLINE requirement
        model_to_load = local_cache_path if os.path.exists(local_cache_path) else model_name
        
        try:
            # Avoid network downloads in offline/dev by default
            self._model = SentenceTransformer(
                model_to_load, local_files_only=not self._allow_remote_download
            )
        except Exception as exc:
            # Fallback to lightweight dummy embeddings so the API can still start
            fallback_dim = settings.vector_dimension
            print(
                f"⚠️  Could not load embedding model '{model_name}' "
                f"(offline mode assumed). Using zero-vector fallback of size {fallback_dim}. "
                f"Error: {exc}"
            )

            class _DummyEmbeddingModel:
                def __init__(self, dimension: int):
                    self._dimension = dimension

                def encode(self, texts, convert_to_numpy=True, show_progress_bar=False):
                    if isinstance(texts, str):
                        texts = [texts]
                        single = True
                    else:
                        single = False
                    arr = np.zeros((len(texts), self._dimension), dtype=float)
                    return arr[0] if single else arr

                def get_sentence_embedding_dimension(self):
                    return self._dimension

                @property
                def name_or_path(self):
                    return "offline-dummy-embedding"

            self._model = _DummyEmbeddingModel(fallback_dim)

    def get_embedding(self, text: str) -> np.ndarray:
        if not text:
            return np.zeros(self._model.get_sentence_embedding_dimension())

        embedding = self._model.encode(text, convert_to_numpy=True)
        return embedding

    def get_embeddings(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.array([])

        embeddings = self._model.encode(
            texts, convert_to_numpy=True, show_progress_bar=False
        )
        return embeddings

    @property
    def dimension(self) -> int:
        return self._model.get_sentence_embedding_dimension()

    @property
    def model_name(self) -> str:
        # sentence-transformers >= 3.x stores it differently
        return getattr(
            self._model,
            "name_or_path",
            getattr(self._model, "model_card_data", {}).get(
                "model_name", "all-MiniLM-L6-v2"
            ),
        )

    def reload(self, model_name: str | None = None) -> None:
        if model_name:
            os.environ["EMBEDDING_MODEL"] = model_name
        self._model = None
        self._load_model()


embedding_service = EmbeddingService()
