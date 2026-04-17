import asyncio
import httpx
from typing import Optional

from src.schemas.settings import settings
from config.observability import record_webhook_attempt
from opentelemetry import trace


class EscalationService:
    def __init__(self):
        self.webhook_url = settings.escalation_webhook_url
        self.max_retries = settings.webhook_retry_max
        self.initial_delay = settings.webhook_retry_initial_delay_seconds

    async def notify_escalation(
        self,
        ticket_id: str,
        title: str,
        category: str,
        confidence_score: float,
    ) -> bool:
        if not self.webhook_url:
            return False

        payload = {
            "ticket_id": ticket_id,
            "title": title,
            "category": category,
            "confidence_score": confidence_score,
            "timestamp": str(asyncio.get_event_loop().time()),
        }

        delay = self.initial_delay
        tracer = trace.get_tracer("tickets.escalation")
        span = tracer.start_span(
            "escalation.webhook",
            attributes={
                "ticket.id": ticket_id,
                "ticket.title": title,
                "category": category,
            },
        )
        for attempt in range(self.max_retries):
            from time import perf_counter

            start = perf_counter()
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(self.webhook_url, json=payload)
                    success = response.status_code < 400
                    span.add_event(
                        "webhook.attempt",
                        {
                            "attempt": attempt + 1,
                            "status_code": response.status_code,
                            "success": success,
                        },
                    )
                    record_webhook_attempt(perf_counter() - start, success)
                    if success:
                        span.set_attribute("webhook.outcome", "success")
                        span.end()
                        return True
            except Exception as e:
                span.add_event(
                    "webhook.error",
                    {"attempt": attempt + 1, "error": str(e)},
                )
                record_webhook_attempt(perf_counter() - start, False)

            if attempt < self.max_retries - 1:
                await asyncio.sleep(delay)
                delay *= 2

        span.set_attribute("webhook.outcome", "failure")
        span.end()
        return False


escalation_service = EscalationService()
