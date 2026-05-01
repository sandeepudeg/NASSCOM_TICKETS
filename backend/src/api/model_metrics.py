import os
from datetime import datetime

from fastapi import APIRouter, Query

router = APIRouter(prefix="/model", tags=["model"])


@router.get("/metrics")
async def get_model_metrics(version: str | None = Query(None)):
    """
    Return the latest AI classifier evaluation metrics from MLflow.
    Falls back to placeholder values when MLflow is unreachable.
    """
    try:
        from src.schemas.settings import settings
        import mlflow

        tracking_uri = os.getenv("MLFLOW_TRACKING_URI", settings.mlflow_tracking_uri)
        
        # Skip connection attempt if on HF Spaces and pointing to localhost
        if (os.getenv("SPACE_ID") or os.getenv("HF_SPACE")) and "localhost" in tracking_uri:
            raise Exception("MLflow tracking on localhost ignored in Spaces")

        mlflow.set_tracking_uri(tracking_uri)
        client = mlflow.tracking.MlflowClient()

        # Find the most recent run tagged as 'production' or just the latest run
        experiment = client.get_experiment_by_name("ticket-classifier")
        if experiment:
            runs = client.search_runs(
                experiment_ids=[experiment.experiment_id],
                order_by=["start_time DESC"],
                max_results=1,
            )
            if runs:
                run = runs[0]
                metrics = run.data.metrics
                return {
                    "model_version": run.info.run_id[:8],
                    "macro_f1": metrics.get("macro_f1", 0.0),
                    "semantic_similarity": metrics.get("semantic_similarity", 0.0),
                    "llm_judge_routing_correctness": metrics.get(
                        "judge_routing_score", 0.0
                    ),
                    "llm_judge_resolution_relevance": metrics.get(
                        "judge_resolution_score", 0.0
                    ),
                    "hallucination_rate": metrics.get("hallucination_rate", 0.0),
                    "equitable_recall_spread": metrics.get(
                        "equitable_recall_spread", 0.0
                    ),
                    "per_category_f1": {
                        "Infrastructure": metrics.get("f1_infrastructure", 0.0),
                        "Application": metrics.get("f1_application", 0.0),
                        "Security": metrics.get("f1_security", 0.0),
                        "Database": metrics.get("f1_database", 0.0),
                        "Storage": metrics.get("f1_storage", 0.0),
                        "Network": metrics.get("f1_network", 0.0),
                        "Access": metrics.get("f1_access", 0.0),
                    },
                    "last_updated": datetime.fromtimestamp(
                        run.info.start_time / 1000
                    ).isoformat(),
                    "source": "mlflow",
                }
    except Exception:
        pass

    # Fallback — return placeholder structure when MLflow is unavailable
    return {
        "model_version": "not-evaluated",
        "macro_f1": 0.85,  # Default placeholder for UI visualization
        "semantic_similarity": 0.78,
        "llm_judge_routing_correctness": 4.2,
        "llm_judge_resolution_relevance": 4.5,
        "hallucination_rate": 0.02,
        "equitable_recall_spread": 0.05,
        "per_category_f1": {
            "Infrastructure": 0.82,
            "Application": 0.88,
            "Security": 0.81,
            "Database": 0.84,
            "Storage": 0.86,
            "Network": 0.83,
            "Access": 0.87,
        },
        "last_updated": datetime.utcnow().isoformat(),
        "source": "unavailable",
        "message": "MLflow tracking server is unreachable. Run evaluate_classifier.py to populate metrics.",
    }
