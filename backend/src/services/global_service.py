import json
import numpy as np
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.models import Ticket, TicketEmbedding
from src.ml.rag_service import rag_service
from src.schemas.ticket import SimilarTicket, Category

class GlobalService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def translate_text(self, text: str, target_lang: str = "English") -> dict:
        """
        Translates text to the target language using the LLM.
        """
        if not text:
            return {"translated_text": ""}

        prompt = f"Translate the following text into {target_lang}. Return ONLY the translated text.\n\nText: {text}"
        
        try:
            translation = await rag_service._get_llm_response(prompt)
            return {"translated_text": translation.strip()}
        except Exception:
            return {"translated_text": "Translation failed."}

    async def get_cross_tenant_insights(self, ticket_id: str, limit: int = 3) -> list[dict]:
        """
        Finds similar tickets across ALL tenants, excluding the current one.
        Returns anonymized data for privacy.
        """
        # 1. Get current ticket and its embedding
        query = select(Ticket, TicketEmbedding.embedding).join(
            TicketEmbedding, Ticket.id == TicketEmbedding.ticket_id
        ).where(Ticket.id == ticket_id)
        
        result = await self.session.execute(query)
        row = result.first()
        if not row:
            return []

        target_ticket, target_emb_json = row
        target_emb = np.array(json.loads(target_emb_json))

        # 2. Get embeddings from OTHER tenants
        other_query = select(Ticket, TicketEmbedding.embedding).join(
            TicketEmbedding, Ticket.id == TicketEmbedding.ticket_id
        ).where(
            and_(
                Ticket.owner_id != target_ticket.owner_id,
                Ticket.status == "resolved"
            )
        ).limit(100) # Scan limited candidates for performance
        
        other_result = await self.session.execute(other_query)
        other_rows = other_result.all()

        similarities = []
        for other_ticket, other_emb_json in other_rows:
            other_emb = np.array(json.loads(other_emb_json))
            
            # Cosine similarity
            dot = np.dot(target_emb, other_emb)
            sim = dot / (np.linalg.norm(target_emb) * np.linalg.norm(other_emb))

            if sim > 0.82: # Lower threshold for global discovery
                similarities.append({
                    "title": other_ticket.title,
                    "category": other_ticket.category,
                    "resolution_summary": "Anonymized solution discovered in external department.",
                    "matching_score": float(sim),
                    "tenant_hint": "External Entity" # Don't expose actual owner_id
                })

        similarities.sort(key=lambda x: x["matching_score"], reverse=True)
        return similarities[:limit]
