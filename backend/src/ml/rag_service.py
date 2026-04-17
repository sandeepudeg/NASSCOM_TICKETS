import json
import asyncio
from typing import Optional
from time import perf_counter
import numpy as np
import ollama
from ollama import AsyncClient
from openai import AsyncOpenAI
from opentelemetry import trace
from opentelemetry.trace import Link

from src.schemas.ticket import Category, SimilarTicket, ResolutionSuggestion
from src.schemas.settings import settings
from src.ml.embedding_service import embedding_service
from config.observability import record_rag_retrieval_duration


class RAGService:
    _client: Optional[AsyncClient] = None
    _groq_client: Optional[AsyncOpenAI] = None
    similarity_threshold = settings.similarity_threshold
    top_k = settings.top_k_similar_tickets

    def __init__(self):
        self.ollama_model = settings.ollama_model

    @property
    def client(self) -> AsyncClient:
        if self._client is None:
            self._client = AsyncClient(host=settings.ollama_base_url)
        return self._client

    @property
    def groq_client(self) -> AsyncOpenAI:
        if self._groq_client is None:
            self._groq_client = AsyncOpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1"
            )
        return self._groq_client

    async def _get_llm_response(self, prompt: str) -> str:
        """Get response from the configured LLM provider (Groq or Ollama)."""
        if settings.groq_api_key:
            response = await self.groq_client.chat.completions.create(
                model=self.ollama_model, 
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"} if "llama-3" in self.ollama_model.lower() else None
            )
            return response.choices[0].message.content
        else:
            response = await self.client.chat(
                model=self.ollama_model,
                messages=[{"role": "user", "content": prompt}],
            )
            if isinstance(response, dict):
                return response.get("message", {}).get("content", "")
            else:
                return response.message.content

    async def find_similar_tickets(
        self,
        ticket_text: str,
        resolved_tickets: list[dict],
    ) -> tuple[list[SimilarTicket], bool]:
        tracer = trace.get_tracer("ml.rag_service")
        start = perf_counter()

        current_ctx = trace.get_current_span().get_span_context()
        links = [Link(current_ctx)] if current_ctx and current_ctx.is_valid else None

        with tracer.start_as_current_span("rag.retrieve", links=links) as span:
            if not resolved_tickets:
                return [], True

            query_embedding = embedding_service.get_embedding(ticket_text)

            # Generate embeddings for any tickets that don't have pre-stored vectors
            tickets_needing_embed = [
                t for t in resolved_tickets if "embedding" not in t and "text" in t
            ]
            if tickets_needing_embed:
                texts = [t["text"] for t in tickets_needing_embed]
                embeddings = embedding_service.get_embeddings(texts)
                for t, emb in zip(tickets_needing_embed, embeddings):
                    t["embedding"] = json.dumps(emb.tolist())

            similarities = []
            for ticket in resolved_tickets:
                if "embedding" not in ticket:
                    continue

                ticket_embedding = np.array(json.loads(ticket["embedding"]))
                norm_q = np.linalg.norm(query_embedding)
                norm_t = np.linalg.norm(ticket_embedding)
                if norm_q == 0 or norm_t == 0:
                    continue
                similarity = float(
                    np.dot(query_embedding, ticket_embedding) / (norm_q * norm_t)
                )
                similarity = min(max(similarity, 0.0), 1.0)

                if similarity >= self.similarity_threshold:
                    similarities.append((ticket, similarity))

            similarities.sort(key=lambda x: x[1], reverse=True)
            top_results = similarities[: self.top_k]

            similar_tickets = [
                SimilarTicket(
                    id=ticket["id"],
                    title=ticket["title"],
                    category=Category(ticket["category"]),
                    description=ticket.get("description", ""),
                    resolution_summary=ticket.get("resolution_summary", ""),
                    similarity_score=score,
                    knowledge_source=ticket.get("knowledge_source", "Internal History"),
                )
                for ticket, score in top_results
            ]

            low_retrieval_confidence = len(top_results) < 2
            
            duration = perf_counter() - start
            record_rag_retrieval_duration(duration)
            
            span.set_attribute("rag.candidates_count", len(resolved_tickets))
            span.set_attribute("rag.matches_count", len(top_results))
            span.set_attribute("rag.low_confidence", low_retrieval_confidence)

            return similar_tickets, low_retrieval_confidence

    async def generate_resolution_suggestion(
        self,
        title: str,
        description: str,
        similar_tickets: list[SimilarTicket],
    ) -> Optional[ResolutionSuggestion]:
        tracer = trace.get_tracer("ml.rag_service")

        current_ctx = trace.get_current_span().get_span_context()
        links = [Link(current_ctx)] if current_ctx and current_ctx.is_valid else None

        with tracer.start_as_current_span("rag.generate", links=links) as span:
            if not similar_tickets:
                return None

            context_parts = []
            for st in similar_tickets:
                source_label = f"[{st.knowledge_source}]" if st.knowledge_source else ""
                context_parts.append(
                    f"- Ticket {st.id} {source_label}: {st.title} ({st.category})\n  Resolution: {st.resolution_summary}"
                )

            context = "\n".join(context_parts)

            prompt = f"""Based on the following similar resolved tickets, generate:
1. Root Cause Analysis (RCA): A brief explanation of the likely underlying cause.
2. Resolution Steps: Up to 5 actionable steps to resolve the current ticket.

Current ticket:
Title: {title}
Description: {description}

Similar resolved tickets:
{context}

Return ONLY a JSON object with:
- "root_cause": a string explaining the underlying cause
- "steps": a JSON array of strings, each string being a step. 

ALWAYS cite the source at the end of every step like '(Source: [Knowledge Source Name] - [Ticket ID])'.

Example: {{
    "root_cause": "The issue is likely due to a misconfigured webhook endpoint in the production environment.",
    "steps": ["1. Check server logs for error messages (Source: Kaggle Dataset - ticket_id_1)", "2. Restart the affected service (Source: Internal History - ticket_id_2)"]
}}
"""

            try:
                content = await self._get_llm_response(prompt)
                
                if not content:
                    # Final fallback for unexpected structures
                    try:
                        content = str(response)
                    except:
                        content = ""

                try:
                    result = json.loads(content)
                    steps = result.get("steps", [])
                    root_cause = result.get("root_cause", "Likely a recurring symptoms-based failure.")
                    if not isinstance(steps, list):
                        steps = [content]
                except:
                    steps = [content]
                    root_cause = "Automatic analysis in progress."

                source_ids = [st.id for st in similar_tickets]
                
                span.set_attribute("rag.steps_generated", len(steps[:5]))
                span.set_attribute("rag.source_tickets", len(source_ids))

                return ResolutionSuggestion(
                    steps=steps[:5],
                    source_ticket_ids=source_ids,
                    root_cause=root_cause
                )

            except Exception as e:
                import structlog
                logger = structlog.get_logger()
                logger.error("rag.generation_failed", error=str(e), exc_info=True)
                return None


rag_service = RAGService()
