import json
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.models import Ticket
from src.ml.rag_service import rag_service

logger = structlog.get_logger("services.copilot")

class CopilotService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def generate_summary(self, ticket_id: str) -> dict:
        """
        Generates a concise 3-bullet summary of the ticket.
        """
        ticket = await self._get_ticket(ticket_id)
        if not ticket:
            return {"summary": "Ticket not found."}

        prompt = f"""Summarize the following support ticket into exactly 3 bullet points.
- Bullet 1: Core issue/request (The "What").
- Bullet 2: Context/Technical details (The "Why").
- Bullet 3: Actionable next step or root cause (The "How").

Ticket Title: {ticket.title}
Description: {ticket.description}
Category: {ticket.category}
Complexity: {getattr(ticket, 'complexity_score', 'N/A')}

Return ONLY the 3 bullet points, each on a new line starting with a dash (-).
"""
        
        try:
            summary = await rag_service._get_llm_response(prompt)
            return {"summary": summary.strip()}
        except Exception as e:
            logger.error("copilot.summary_failed", error=str(e), ticket_id=ticket_id)
            return {"summary": "Failed to generate summary. Please try again."}

    async def generate_draft_reply(self, ticket_id: str, audience: str) -> dict:
        """
        Generates a draft reply based on the audience (customer or engineer).
        """
        ticket = await self._get_ticket(ticket_id)
        if not ticket:
            return {"draft": "Ticket not found."}

        if audience == "customer":
            prompt = f"Write a polite, empathetic, and jargon-free reply to the customer who submitted this ticket. Reassure them we are working on it and provide an update based on the title/description.\n\nTicket: {ticket.title}\nDescription: {ticket.description}"
        else:
            prompt = f"Write a technical handover note for a senior engineer about this ticket. Be brief, include the detected complexity ({getattr(ticket, 'complexity_score', 1)}) and impact ({getattr(ticket, 'impact_score', 0.0)}), and summarize the technical problem.\n\nTicket: {ticket.title}\nDescription: {ticket.description}"

        try:
            draft = await rag_service._get_llm_response(prompt)
            return {"draft": draft.strip()}
        except Exception as e:
            logger.error("copilot.draft_failed", error=str(e), ticket_id=ticket_id)
            return {"draft": "Failed to generate draft. Please try again."}

    async def polish_text(self, text: str) -> dict:
        """
        Refines and polishes a ticket description to be more professional and readable.
        """
        if not text:
            return {"polished_text": ""}

        prompt = f"""You are a professional IT support coordinator. Polish the following ticket description to be more professional, concise, and technically clear. 
Improve the formatting (use bullet points if applicable) and fix any grammatical errors. 

Original Description:
{text}

Return ONLY the polished description text.
"""
        try:
            polished = await rag_service._get_llm_response(prompt)
            return {"polished_text": polished.strip()}
        except Exception as e:
            logger.error("copilot.polish_failed", error=str(e))
            return {"polished_text": text}  # Fallback to original

    async def _get_ticket(self, ticket_id: str) -> Ticket:
        result = await self.session.execute(select(Ticket).where(Ticket.id == ticket_id))
        return result.scalar_one_or_none()

copilot_service = CopilotService
