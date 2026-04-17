import asyncio
import json
from pathlib import Path

import yaml
from ollama import AsyncClient
from openai import AsyncOpenAI
from opentelemetry import trace

from config.observability import record_classifier_prediction
from src.ml.evaluation_service import evaluation_service
from src.ml.pii_scrubber import PIIScrubber
from src.ml.structured_input_parser import StructuredInputParser
from src.schemas.settings import settings
from src.schemas.ticket import (
    Category,
    CausalContext,
    ClassificationResult,
    RoutingStatus,
)


def load_category_config(config_path: str = "config/classifier_config.yaml") -> dict:
    """Load category taxonomy from YAML configuration file."""
    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(
            f"Classifier config not found at {config_path}. "
            "Please create config/classifier_config.yaml with category definitions."
        )

    with open(config_file, encoding="utf-8") as f:
        config = yaml.safe_load(f)

    return config


def build_category_definitions(config: dict) -> str:
    """Build category definitions string from config."""
    lines = ["Categories:"]
    for cat in config.get("categories", []):
        name = cat["name"]
        desc = cat["description"]
        lines.append(f"- {name}: {desc}")
    return "\n".join(lines)


# Load configuration at module initialization
_classifier_config = load_category_config()
CATEGORY_DEFINITIONS = build_category_definitions(_classifier_config)


class TicketClassifier:
    _client: AsyncClient | None = None
    _groq_client: AsyncOpenAI | None = None

    def __init__(self):
        self.timeout = settings.classification_timeout_seconds
        self.escalation_threshold = settings.escalation_threshold
        self.disable_pii_scrubbing = settings.disable_pii_scrubbing
        self.config = _classifier_config

    @property
    def client(self) -> AsyncClient:
        if self._client is None:
            self._client = AsyncClient(
                host=settings.ollama_base_url, timeout=self.timeout
            )
        return self._client

    @property
    def groq_client(self) -> AsyncOpenAI:
        if self._groq_client is None:
            self._groq_client = AsyncOpenAI(
                api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1"
            )
        return self._groq_client

    async def _get_llm_response(self, prompt: str) -> str:
        """Get response from the configured LLM provider (Groq or Ollama)."""
        if settings.groq_api_key:
            response = await self.groq_client.chat.completions.create(
                model=settings.ollama_model,  # We use the same setting for model name
                messages=[{"role": "user", "content": prompt}],
                response_format=(
                    {"type": "json_object"}
                    if "llama-3" in settings.ollama_model.lower()
                    else None
                ),
            )
            return response.choices[0].message.content
        else:
            response = await self.client.chat(
                model=settings.ollama_model,
                messages=[{"role": "user", "content": prompt}],
            )
            if isinstance(response, dict):
                return response.get("message", {}).get("content", "")
            else:
                return response.message.content

    async def classify(
        self,
        title: str,
        description: str,
        structured_payload: dict | None = None,
        enable_judge: bool = False,
    ) -> ClassificationResult:
        tracer = trace.get_tracer("ml.classifier")

        causal_context = None
        causal_signal = None
        parse_warning = None
        inference_outcome = "success"

        with tracer.start_as_current_span("pii.scrub"):
            if structured_payload:
                payload_str = json.dumps(structured_payload)

                if not self.disable_pii_scrubbing:
                    payload_str, _ = PIIScrubber.scrub(payload_str)

                context, fmt, parse_warning, causal_signal = (
                    StructuredInputParser.parse(payload_str)
                )
                causal_context = CausalContext(
                    error_codes=context.get("error_codes", []),
                    service_names=context.get("service_names", []),
                    severity=context.get("severity"),
                    timestamps=context.get("timestamps", []),
                )

            full_text = f"{title}. {description}"

            if not self.disable_pii_scrubbing:
                full_text, _ = PIIScrubber.scrub(full_text)

        with tracer.start_as_current_span("embed.generate"):
            # Embedding generation happens in the prompt construction
            prompt = f"""You are a ticket classification assistant.
Classify the following support ticket into exactly one of the seven categories.

{CATEGORY_DEFINITIONS}

Ticket:
Title: {title}
Description: {description}

Return ONLY a JSON object with:
- "category": one of Infrastructure, Application, Security, Database, Storage, Network, Access Management
- "confidence": confidence in category (0.0-1.0)

Example: {{"category": "Application", "confidence": 0.85}}
"""

        try:
            with tracer.start_as_current_span("llm.infer"):
                content = await asyncio.wait_for(
                    self._get_llm_response(prompt),
                    timeout=self.timeout,
                )

                import structlog

                logger = structlog.get_logger("ml.classifier")
                logger.info("llm.raw_response", content=content)

                result = json.loads(content)

                category = Category(result.get("category", "Application"))
                confidence = float(result.get("confidence", 0.5))
                confidence = max(0.0, min(1.0, confidence))

                # Record metrics
                record_classifier_prediction(category.value, confidence)

                # Shadow Evaluation (Judge) - optional: could be deferred but requested for creation flow
                # We only evaluate if we have a successful classification
                evaluation_matrix = await evaluation_service.evaluate_ticket_processing(
                    title=title,
                    description=description,
                    category=category,
                    resolution_steps=[],  # Will be filled if RAG runs, or just empty for now
                    confidence_score=confidence,
                    enable_judge=enable_judge,
                )

        except TimeoutError:
            category = Category.APPLICATION
            confidence = 0.0
            routing_status = RoutingStatus.PENDING_CLASSIFICATION
            inference_outcome = "timeout"
            record_classifier_prediction(category.value, confidence)
            return ClassificationResult(
                category=category,
                confidence_score=confidence,
                routing_status=routing_status,
                causal_context=causal_context,
                causal_signal=causal_signal,
                parse_warning=parse_warning,
                inference_outcome=inference_outcome,
            )
        except Exception as e:
            import structlog

            logger = structlog.get_logger("ml.classifier")
            logger.exception("classifier.error", error=str(e))
            category = Category.APPLICATION
            confidence = 0.0
            inference_outcome = "error"
            record_classifier_prediction(category.value, confidence)
            evaluation_matrix = None

        if confidence < self.escalation_threshold:
            routing_status = RoutingStatus.ESCALATED
        else:
            routing_status = RoutingStatus.CLASSIFIED

        return ClassificationResult(
            category=category,
            confidence_score=confidence,
            routing_status=routing_status,
            causal_context=causal_context,
            causal_signal=causal_signal,
            parse_warning=parse_warning,
            inference_outcome=inference_outcome,
            evaluation_matrix=evaluation_matrix,
        )


classifier = TicketClassifier()
