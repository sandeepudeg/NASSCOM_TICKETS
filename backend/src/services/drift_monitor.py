"""
drift_monitor.py — Production category distribution drift monitoring.

Monitors predicted category distribution over a rolling 24-hour window and alerts
when any category deviates by more than 20 percentage points from the training
distribution baseline.

Requirements: 15.4
"""

import json
from collections import Counter
from datetime import datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.models import AuditLog, Ticket
from src.schemas.settings import settings

# Training distribution baseline (to be loaded from MLflow or config)
# This should be updated whenever a new model is promoted
TRAINING_DISTRIBUTION = {
    "Infrastructure": 0.18,
    "Application": 0.22,
    "Security": 0.12,
    "Database": 0.15,
    "Storage": 0.10,
    "Network": 0.13,
    "Access": 0.10,
}

DRIFT_THRESHOLD = 0.20  # 20 percentage points


class DriftMonitor:
    """Monitor production category distribution for drift."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_production_distribution(
        self,
        window_hours: int = 24,
    ) -> dict[str, float]:
        """
        Get predicted category distribution over the last N hours.

        Returns:
            Dict mapping category name to proportion (0.0-1.0)
        """
        cutoff = datetime.utcnow() - timedelta(hours=window_hours)

        # Query tickets classified in the window
        result = await self.session.execute(
            select(Ticket.category).where(
                and_(
                    Ticket.created_at >= cutoff,
                    Ticket.category.isnot(None),
                    Ticket.routing_status != "pending_classification",
                )
            )
        )

        categories = [row[0] for row in result.fetchall()]

        if not categories:
            return {}

        # Compute distribution
        counts = Counter(categories)
        total = len(categories)
        distribution = {cat: count / total for cat, count in counts.items()}

        return distribution

    async def check_drift(
        self,
        training_distribution: dict[str, float] | None = None,
        window_hours: int = 24,
    ) -> tuple[bool, list[dict]]:
        """
        Check if production distribution has drifted from training distribution.

        Args:
            training_distribution: Baseline distribution from training data.
                                  If None, uses TRAINING_DISTRIBUTION constant.
            window_hours: Rolling window size in hours (default: 24)

        Returns:
            Tuple of (has_drift, list_of_drift_details)

            drift_details format:
            [
                {
                    "category": "Infrastructure",
                    "training_proportion": 0.18,
                    "production_proportion": 0.42,
                    "deviation": 0.24,
                    "threshold": 0.20
                },
                ...
            ]
        """
        if training_distribution is None:
            training_distribution = TRAINING_DISTRIBUTION

        prod_dist = await self.get_production_distribution(window_hours)

        if not prod_dist:
            # Not enough data yet
            return False, []

        drift_details = []
        has_drift = False

        for category, train_prop in training_distribution.items():
            prod_prop = prod_dist.get(category, 0.0)
            deviation = abs(prod_prop - train_prop)

            if deviation > DRIFT_THRESHOLD:
                has_drift = True
                drift_details.append(
                    {
                        "category": category,
                        "training_proportion": round(train_prop, 4),
                        "production_proportion": round(prod_prop, 4),
                        "deviation": round(deviation, 4),
                        "threshold": DRIFT_THRESHOLD,
                    }
                )

        return has_drift, drift_details
