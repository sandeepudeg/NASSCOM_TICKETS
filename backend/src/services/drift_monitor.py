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
    "Access Management": 0.10,
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

    async def log_drift_event(self, drift_details: list[dict]):
        """Log drift detection event to audit log."""
        audit_entry = AuditLog(
            actor_user_id="system",
            action_type="category_distribution_drift_detected",
            target_resource_id="classifier",
            metadata_json=json.dumps(
                {
                    "drift_details": drift_details,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
        )
        self.session.add(audit_entry)
        await self.session.commit()

    async def send_drift_alert(self, drift_details: list[dict]):
        """Send drift alert via observability webhook."""
        if not settings.observability_webhook_url:
            print(
                "[WARN] No observability webhook URL configured, skipping drift alert"
            )
            return

        payload = {
            "alert_type": "category_distribution_drift",
            "severity": "warning",
            "message": f"Category distribution drift detected: {len(drift_details)} categories deviated",
            "details": drift_details,
            "timestamp": datetime.utcnow().isoformat(),
        }

        try:
            import httpx

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    settings.observability_webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code >= 200 and response.status_code < 300:
                    print(
                        f"[INFO] Drift alert sent successfully: {response.status_code}"
                    )
                else:
                    print(f"[WARN] Drift alert webhook returned {response.status_code}")

        except Exception as e:
            print(f"[ERROR] Failed to send drift alert: {e}")

    async def monitor_and_alert(
        self,
        training_distribution: dict[str, float] | None = None,
        window_hours: int = 24,
    ):
        """
        Check for drift and send alert if detected.

        This is the main entry point for scheduled drift monitoring.
        """
        has_drift, drift_details = await self.check_drift(
            training_distribution, window_hours
        )

        if has_drift:
            print("[ALERT] Category distribution drift detected:")
            for detail in drift_details:
                print(
                    f"  - {detail['category']}: "
                    f"training={detail['training_proportion']:.2%}, "
                    f"production={detail['production_proportion']:.2%}, "
                    f"deviation={detail['deviation']:.2%}"
                )

            # Log to audit log
            await self.log_drift_event(drift_details)

            # Send webhook alert
            await self.send_drift_alert(drift_details)
        else:
            print("[INFO] No category distribution drift detected")


async def load_training_distribution_from_mlflow() -> dict[str, float] | None:
    """
    Load the training distribution from the latest promoted model in MLflow.

    Returns:
        Training distribution dict, or None if not available
    """
    if not settings.mlflow_enabled:
        return None
    try:
        import mlflow

        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        client = mlflow.tracking.MlflowClient()

        experiment = client.get_experiment_by_name("ticket-classifier")
        if not experiment:
            return None

        # Get latest run with promotion_gate.passes = true
        runs = client.search_runs(
            experiment_ids=[experiment.experiment_id],
            filter_string="tags.promotion_gate = 'passed'",
            order_by=["start_time DESC"],
            max_results=1,
        )

        if not runs:
            return None

        runs[0]

        # Try to load training distribution from run metrics or artifacts
        # This is a stub - in production, the training distribution would be
        # logged as a metric or artifact during model training

        # For now, return None to fall back to the constant
        return None

    except Exception as e:
        print(f"[WARN] Failed to load training distribution from MLflow: {e}")
        return None
