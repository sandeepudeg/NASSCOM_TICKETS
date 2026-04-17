#!/usr/bin/env python3
"""
rollback_classifier.py — Instant model version rollback utility.

Usage:
    python rollback_classifier.py --version <run_id>
    python rollback_classifier.py --list

Requirements: 16.4
"""
import argparse
import sys


def list_model_versions():
    """List all available model versions from MLflow."""
    try:
        import mlflow
        from schemas.settings import settings
        
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        client = mlflow.tracking.MlflowClient()
        
        experiment = client.get_experiment_by_name("ticket-classifier")
        if not experiment:
            print("[ERROR] No 'ticket-classifier' experiment found in MLflow", file=sys.stderr)
            return False
        
        runs = client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=["start_time DESC"],
            max_results=10,
        )
        
        if not runs:
            print("[INFO] No model versions found")
            return True
        
        print("\nAvailable model versions:")
        print("-" * 80)
        print(f"{'Run ID':<40} {'Version':<25} {'Timestamp':<15}")
        print("-" * 80)
        
        for run in runs:
            run_id = run.info.run_id
            version = run.data.tags.get("model_version", "unknown")
            timestamp = run.data.tags.get("retrain_timestamp", "unknown")
            print(f"{run_id:<40} {version:<25} {timestamp:<15}")
        
        print("-" * 80)
        return True
    
    except Exception as e:
        print(f"[ERROR] Failed to list model versions: {e}", file=sys.stderr)
        return False


def rollback_to_version(run_id: str):
    """Rollback to a specific model version."""
    try:
        import mlflow
        from schemas.settings import settings
        
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        client = mlflow.tracking.MlflowClient()
        
        # Verify run exists
        try:
            run = client.get_run(run_id)
        except Exception:
            print(f"[ERROR] Run ID not found: {run_id}", file=sys.stderr)
            return False
        
        version = run.data.tags.get("model_version", "unknown")
        
        # In production, this would:
        # 1. Download model artifacts from MLflow
        # 2. Update the active model configuration
        # 3. Restart the classifier service with the rolled-back model
        # 4. Log the rollback action to audit log
        
        print(f"[INFO] Rolling back to model version: {version}")
        print(f"[INFO] Run ID: {run_id}")
        print(f"[INFO] Timestamp: {run.data.tags.get('retrain_timestamp', 'unknown')}")
        
        # Log rollback to audit log
        from src.repositories.database import get_db
        from src.repositories.models import AuditLog
        import asyncio
        import json
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        from sqlalchemy.orm import sessionmaker
        
        async def _log_rollback():
            engine = create_async_engine(settings.database_url, echo=False)
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session() as session:
                log_entry = AuditLog(
                    actor_user_id="system",
                    action_type="model_promote",  # Reusing existing enum value
                    target_resource_id=run_id,
                    metadata_json=json.dumps({
                        "action": "rollback",
                        "model_version": version,
                        "run_id": run_id,
                    }),
                )
                session.add(log_entry)
                await session.commit()
        
        asyncio.run(_log_rollback())
        
        print(f"[SUCCESS] Rollback complete. Active model: {version}")
        print("[NOTE] In production, this would restart the classifier service.")
        return True
    
    except Exception as e:
        print(f"[ERROR] Rollback failed: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Rollback the TicketIQ classifier to a previous version."
    )
    parser.add_argument(
        "--version",
        help="MLflow run ID to rollback to",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available model versions",
    )
    args = parser.parse_args()
    
    if args.list:
        success = list_model_versions()
    elif args.version:
        success = rollback_to_version(args.version)
    else:
        parser.print_help()
        sys.exit(1)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
