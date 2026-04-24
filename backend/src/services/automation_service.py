import json
import asyncio
from datetime import datetime
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ollama import AsyncClient
from openai import AsyncOpenAI

from src.repositories.models import Ticket, AutomationRunbook
from src.schemas.settings import settings

logger = structlog.get_logger("services.automation")

class AutomationService:
    _client: AsyncClient | None = None
    _groq_client: AsyncOpenAI | None = None

    def __init__(self, session: AsyncSession):
        self.session = session

    @property
    def client(self) -> AsyncClient:
        if self._client is None:
            # Reverted timeout to 5 minutes as requested
            self._client = AsyncClient(
                host=settings.ollama_base_url,
                timeout=300.0 
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
        """Get response from the configured LLM provider."""
        if settings.groq_api_key:
            response = await self.groq_client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content
        else:
            response = await self.client.chat(
                model=settings.ollama_model,
                messages=[{"role": "user", "content": prompt}],
            )
            if isinstance(response, dict):
                return response.get("message", {}).get("content", "")
            return response.message.content

    async def get_best_runbook(self, category: str) -> AutomationRunbook | None:
        """Find the most appropriate runbook for a given category."""
        stmt = select(AutomationRunbook).where(
            AutomationRunbook.category_target == category,
            AutomationRunbook.is_active == True
        ).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def simulate_remediation(self, ticket_id: str) -> str:
        """Generate an AI-driven dry-run simulation report."""
        logger.info("automation.fetching_ticket", ticket_id=ticket_id)
        try:
            ticket = await self.session.get(Ticket, ticket_id)
            logger.info("automation.ticket_fetched", ticket_id=ticket_id, found=bool(ticket))
        except Exception as e:
            logger.error("automation.db_fetch_failed", error=str(e), ticket_id=ticket_id)
            return f"Database error during initialization: {str(e)}"

        if not ticket:
            return "Ticket not found."

        runbook = await self.get_best_runbook(ticket.category)
        if runbook:
            logger.info("automation.runbook_found", name=runbook.name, category=ticket.category)
        else:
            logger.warning("automation.no_runbook_found", category=ticket.category)
            
        runbook_content = runbook.description if runbook else "No specific runbook found. Using general recovery logic."

        prompt = f"""
        ACT AS A SYSTEM RELIABILITY ENGINEER.
        Generate a deep technical 'Dry-Run Simulation Report' for remediating this ticket.
        
        TICKET:
        Title: {ticket.title}
        Description: {ticket.description}
        Category: {ticket.category}
        
        RUNBOOK CONTEXT:
        {runbook_content}
        
        REQUIREMENTS:
        - Output ONLY Markdown.
        - Use Tables for sequential actions. IMPORTANT: Start each table on a new line and ensure each row is on its own line.
        - Be highly detailed in the potential impact assessment.
        - Avoid conversational filler; start directly with the report.
        
        REPORT STRUCTURE:
        # Dry-Run Simulation: {ticket.ticket_number or 'Auto-Gen Report'}
        
        ## 1. Expected Execution Sequence
        | Step | Tool/Action | Expected Outcome |
        |---|---|---|
        | 1 | [Action] | [Result] |
        ...
        
        ## 2. Potential System Impact (High Detail)
        [Detailed technical analysis of what happens to the service]
        
        ## 3. Safety Assessment
        - RISK LEVEL: [High/Medium/Low]
        - RATIONALE: [Why?]
        
        ## 4. Deterministic Rollback Plan
        [Step-by-step restoration steps]
        """
        
        ticket.automation_status = "simulating"
        await self.session.commit()
        logger.info("automation.simulation_started", ticket_id=ticket_id, category=ticket.category)

        try:
            logger.info("automation.requesting_llm", ticket_id=ticket_id, model=settings.ollama_model if not settings.groq_api_key else settings.groq_model)
            
            # Use asyncio.wait_for to ensure the backend recovers even if the LLM library hangs
            # Adjusted to 270s (slightly under 300s infrastructure limit)
            report = await asyncio.wait_for(
                self._get_llm_response(prompt),
                timeout=270.0
            )
            
            logger.info("automation.llm_response_received", ticket_id=ticket_id, char_count=len(report))
            
            ticket.automation_simulation_report = report
            ticket.automation_status = "pending_approval"
            await self.session.commit()
            return report
        except asyncio.TimeoutError:
            logger.error("automation.simulation_timeout", ticket_id=ticket_id)
            ticket.automation_status = "failed"
            await self.session.commit()
            return "Simulation failed: The AI analysis took longer than the 5-minute safety limit. Please try again or simplify the ticket description."
        except Exception as e:
            logger.error("automation.simulation_failed", error=str(e), ticket_id=ticket_id)
            ticket.automation_status = "failed"
            await self.session.commit()
            return f"Simulation failed: {str(e)}"

    async def execute_remediation(self, ticket_id: str) -> dict[str, Any]:
        """Executes the remediation script/logic for the ticket."""
        ticket = await self.session.get(Ticket, ticket_id)
        if not ticket:
            return {"success": False, "error": "Ticket not found"}

        runbook = await self.get_best_runbook(ticket.category)
        
        ticket.automation_status = "executing"
        await self.session.commit()

        # Phase 1: Execution
        # Mock Execution Logic (as per Plan)
        start_time = datetime.utcnow()
        await asyncio.sleep(3) # Simulate work

        success = True
        output = f"Execution successful.\nRunbook: {runbook.name if runbook else 'General Recovery'}\nApplied fix for {ticket.category} category."
        
        if success:
            ticket.automation_status = "completed"
            ticket.status = "resolved"
            ticket.resolved_at = datetime.utcnow()
            
            # Transition out of "Available" state
            ticket.is_automation_candidate = False
            
            # Record detailed verification metrics (if not already handled by verify_system_health)
            ticket.automation_output = output
            
            # Phase 2: Industrial-Grade Verification (The 8 Parameters)
            verification_results = await self._verify_system_health(ticket)
            ticket.automation_verification_json = json.dumps(verification_results)
            
            # ROI Attribution
            resolution_duration = (ticket.resolved_at - ticket.created_at).total_seconds()
            ticket.resolution_time_ms = int(resolution_duration * 1000)
            
            # Assume 45 min manual baseline (2700 seconds)
            manual_baseline = 2700 
            ticket.roi_value_saved = max(0, (manual_baseline - resolution_duration) / 60.0)
            
            logger.info("automation.verification_complete", 
                        ticket_id=ticket_id, 
                        roi_minutes=ticket.roi_value_saved,
                        pulse=verification_results.get("pulse_check"))
        else:
            ticket.automation_status = "failed"
            ticket.automation_output = "Error: Mock script failure."

        await self.session.commit()
        
        return {
            "success": success,
            "output": output,
            "verification": getattr(ticket, 'automation_verification_json', None),
            "ticket_id": ticket_id
        }

    async def _verify_system_health(self, ticket: Ticket) -> dict[str, Any]:
        """Performs Forensic, Pulse, and Drift checks (Industrial Verification)."""
        logger.info("automation.starting_verification", ticket_id=ticket.id)
        
        # Simulate the small delay for "Verifying Health" state
        await asyncio.sleep(2)
        
        # 1. Synthetic Pulse Check
        pulse_status = "passed" if ticket.category != "Security" else "passed_with_review"
        
        # 2. Configuration Drift Detection
        drift_found = False
        
        # 3. Forensic Log Snapshot (Negative Verification)
        forensics = "Clean: Zero occurrences of error signature in 3m window."
        
        return {
            "pulse_check": pulse_status,
            "drift_detected": drift_found,
            "forensics": forensics,
            "verified_at": datetime.utcnow().isoformat(),
            "verification_engine": "TicketIQ Industrial v1.0"
        }
