import json
import logging

from ollama import AsyncClient

from src.schemas.settings import settings
from src.schemas.ticket import Category, EvaluationMatrix

logger = logging.getLogger(__name__)


class EvaluationService:
    def __init__(self):
        self.ollama_model = settings.ollama_model
        self._client: AsyncClient | None = None

    @property
    def client(self) -> AsyncClient:
        if self._client is None:
            self._client = AsyncClient(host=settings.ollama_base_url)
        return self._client

    async def evaluate_ticket_processing(
        self,
        title: str,
        description: str,
        category: Category,
        resolution_steps: list[str],
        confidence_score: float,
        enable_judge: bool = False,
    ) -> EvaluationMatrix:
        """
        Evaluate the AI's ticket processing using LLM-as-a-judge.
        If enable_judge is True, performs a more intensive cross-reference check.
        """
        judge_type = (
            "High-Intensity Shadow Auditor" if enable_judge else "Senior Technical Lead"
        )
        extra_criteria = ""
        if enable_judge:
            extra_criteria = """
7. Ground Truth Alignment: Check how well the resolution aligns with established historical outcomes from professional datasets (Kaggle IT Support).
8. Depth of Analysis: Whether the AI identified corner cases or sub-optimal steps.
"""

        prompt = f"""You are a {judge_type} evaluating an AI-generated ticket classification and resolution plan.

Ticket Title: {title}
Ticket Description: {description}
AI-Assigned Category: {category.value}
AI-Assigned Confidence: {confidence_score}
Generated Resolution Steps:
{chr(10).join(f"- {step}" for step in resolution_steps)}

Evaluate the AI's work on a scale of 0.0 to 1.0 based on the following metrics:
1. Accuracy: How correctly the category matches the issue.
2. Solution Design: The technical logic and structure of the resolution steps.
3. Usability: How easy it is for an agent to follow the instructions.
4. Feasibility: Whether the steps are realistic in a corporate IT environment.
5. Security: Whether the resolution follows security best practices.
6. Innovation: Whether the solution suggests modern automations or smart troubleshooting.
{extra_criteria}

Return ONLY a JSON object with these keys: accuracy, solution_design, usability, feasibility, security, innovation, and judge_explanation (a short 1-2 sentence summary).

Example:
{{
  "accuracy": 0.9,
  "solution_design": 0.85,
  "usability": 0.95,
  "feasibility": 0.8,
  "security": 1.0,
  "innovation": 0.7,
  "judge_explanation": "The classification is spot on, and the steps are practical, though more automation could be suggested for this repeated issue."
}}
"""

        try:
            response = await self.client.chat(
                model=self.ollama_model,
                messages=[{"role": "user", "content": prompt}],
            )

            content = ""
            if hasattr(response, "message") and hasattr(response.message, "content"):
                content = response.message.content
            elif isinstance(response, dict):
                content = response.get("message", {}).get("content", "")

            # Extract JSON from potential markdown backticks
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[-1].split("```")[0].strip()

            data = json.loads(content)

            return EvaluationMatrix(
                accuracy=float(data.get("accuracy", confidence_score)),
                solution_design=float(data.get("solution_design", 0.0)),
                usability=float(data.get("usability", 0.0)),
                feasibility=float(data.get("feasibility", 0.0)),
                security=float(data.get("security", 0.0)),
                innovation=float(data.get("innovation", 0.0)),
                semantic_similarity=float(
                    confidence_score
                ),  # Using confidence as a proxy for similarity
                judge_explanation=data.get(
                    "judge_explanation", "Evaluation completed."
                ),
            )

        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
            return EvaluationMatrix(
                accuracy=confidence_score,
                judge_explanation=f"Shadow evaluation failed: {str(e)}",
            )


evaluation_service = EvaluationService()
