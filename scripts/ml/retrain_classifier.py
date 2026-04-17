#!/usr/bin/env python3
"""
retrain_classifier.py — Automated model retraining pipeline.

Workflow:
  1. Check for concurrent runs (reject with HTTP 409 if active)
  2. Download raw datasets from MinIO cache
  3. Apply PII scrubbing to all text fields
  4. Merge agent override labels (2× weight)
  5. Split train/validation/test
  6. Fine-tune or prompt-tune base model
  7. Evaluate against all metrics (Requirement 14)
  8. Register in MLflow if all thresholds pass
  9. Retain 3 previous model versions

Requirements: 16.1–16.5
"""
import argparse
import asyncio
import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional
import httpx

# Lock file for concurrent run detection
LOCK_FILE = Path("/tmp/retrain_classifier.lock")

VALID_CATEGORIES = [
    "Infrastructure", "Application", "Security", "Database",
    "Storage", "Network", "Access Management"
]

# Category mapping for dataset normalization
CATEGORY_MAPPING = {
    # Infrastructure variations
    "hardware": "Infrastructure",
    "infrastructure": "Infrastructure",
    "server": "Infrastructure",
    "servers": "Infrastructure",
    "compute": "Infrastructure",
    "vm": "Infrastructure",
    "virtual machine": "Infrastructure",
    "cloud": "Infrastructure",
    
    # Application variations
    "software": "Application",
    "application": "Application",
    "app": "Application",
    "applications": "Application",
    "service": "Application",
    "services": "Application",
    "api": "Application",
    
    # Security variations
    "security": "Security",
    "security incident": "Security",
    "vulnerability": "Security",
    "breach": "Security",
    "malware": "Security",
    "virus": "Security",
    "threat": "Security",
    
    # Database variations
    "database": "Database",
    "db": "Database",
    "databases": "Database",
    "sql": "Database",
    "nosql": "Database",
    "data": "Database",
    
    # Storage variations
    "storage": "Storage",
    "disk": "Storage",
    "disks": "Storage",
    "volume": "Storage",
    "backup": "Storage",
    "file system": "Storage",
    "filesystem": "Storage",
    
    # Network variations
    "network": "Network",
    "networking": "Network",
    "connectivity": "Network",
    "internet": "Network",
    "vpn": "Network",
    "firewall": "Network",
    "dns": "Network",
    "load balancer": "Network",
    
    # Access Management variations
    "access": "Access Management",
    "access management": "Access Management",
    "permissions": "Access Management",
    "authentication": "Access Management",
    "authorization": "Access Management",
    "identity": "Access Management",
    "iam": "Access Management",
    "user": "Access Management",
    "account": "Access Management",
}


# ---------------------------------------------------------------------------
# Concurrent run detection
# ---------------------------------------------------------------------------

def acquire_lock() -> bool:
    """Attempt to acquire the retraining lock. Returns True if acquired."""
    lock_file = Path(LOCK_FILE) if isinstance(LOCK_FILE, str) else LOCK_FILE
    if lock_file.exists():
        # Check if lock is stale (> 24 hours old)
        try:
            age_hours = (datetime.now().timestamp() - lock_file.stat().st_mtime) / 3600
            if age_hours > 24:
                print("[WARN] Stale lock detected (>24h), removing...", file=sys.stderr)
                lock_file.unlink()
            else:
                return False
        except Exception:
            return False
    
    try:
        lock_file.write_text(str(os.getpid()))
        return True
    except Exception as e:
        print(f"[ERROR] Failed to acquire lock: {e}", file=sys.stderr)
        return False


def release_lock():
    """Release the retraining lock."""
    lock_file = Path(LOCK_FILE) if isinstance(LOCK_FILE, str) else LOCK_FILE
    try:
        if lock_file.exists():
            lock_file.unlink()
    except Exception as e:
        print(f"[WARN] Failed to release lock: {e}", file=sys.stderr)


def log_concurrent_skip():
    """Log retrain_skipped_concurrent event to audit log."""
    try:
        from src.repositories.database import get_db
        from src.repositories.models import AuditLog
        from sqlalchemy import text
        
        # Synchronous audit log write
        import asyncio
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        from sqlalchemy.orm import sessionmaker
        from schemas.settings import settings
        
        async def _log():
            engine = create_async_engine(settings.database_url, echo=False)
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session() as session:
                log_entry = AuditLog(
                    actor_user_id="system",
                    action_type="retrain_skipped_concurrent",
                    target_resource_id="classifier",
                    metadata_json=json.dumps({"reason": "concurrent_run_active"}),
                )
                session.add(log_entry)
                await session.commit()
        
        asyncio.run(_log())
    except Exception as e:
        print(f"[WARN] Failed to log concurrent skip: {e}", file=sys.stderr)


# ---------------------------------------------------------------------------
# MinIO dataset download
# ---------------------------------------------------------------------------

def download_datasets_from_minio(output_dir: Path) -> list[Path]:
    """Download raw datasets from MinIO. Returns list of downloaded file paths."""
    from schemas.settings import settings
    
    try:
        from minio import Minio
        
        client = Minio(
            settings.object_storage_endpoint.replace("http://", "").replace("https://", ""),
            access_key=settings.object_storage_access_key,
            secret_key=settings.object_storage_secret_key,
            secure=False,
        )
        
        bucket = settings.object_storage_bucket
        prefix = "datasets/raw/"
        
        downloaded = []
        objects = client.list_objects(bucket, prefix=prefix, recursive=True)
        
        for obj in objects:
            if obj.object_name.endswith(".json"):
                local_path = output_dir / Path(obj.object_name).name
                client.fget_object(bucket, obj.object_name, str(local_path))
                downloaded.append(local_path)
                print(f"[INFO] Downloaded: {obj.object_name} -> {local_path}")
        
        return downloaded
    
    except Exception as e:
        print(f"[ERROR] MinIO download failed: {e}", file=sys.stderr)
        return []


# ---------------------------------------------------------------------------
# Agent override labels
# ---------------------------------------------------------------------------

async def fetch_agent_overrides() -> list[dict]:
    """Fetch all agent override labels from the database."""
    from src.repositories.database import get_db
    from src.repositories.models import AgentOverride
    from sqlalchemy import select
    
    overrides = []
    async for session in get_db():
        result = await session.execute(select(AgentOverride))
        records = result.scalars().all()
        for record in records:
            overrides.append({
                "ticket_id": record.ticket_id,
                "original_category": record.original_category,
                "corrected_category": record.corrected_category,
                "agent_user_id": record.agent_user_id,
                "timestamp": record.timestamp.isoformat(),
            })
        break  # Only need one session
    
    return overrides


# Alias for backward compatibility with tests
load_override_labels = fetch_agent_overrides


# ---------------------------------------------------------------------------
# Category and field mapping
# ---------------------------------------------------------------------------

def normalize_category(raw_category: str) -> Optional[str]:
    """
    Map dataset category to valid database category.
    
    Args:
        raw_category: Category value from dataset
        
    Returns:
        Normalized category from VALID_CATEGORIES, or None if unmapped
    """
    if not raw_category:
        return None
    
    # Try exact match first (case-sensitive)
    if raw_category in VALID_CATEGORIES:
        return raw_category
    
    # Try case-insensitive mapping
    normalized = CATEGORY_MAPPING.get(raw_category.lower())
    if normalized:
        return normalized
    
    # Log unmapped categories for manual review
    print(f"[WARN] Unmapped category: '{raw_category}'", file=sys.stderr)
    return None


def map_dataset_fields(record: dict) -> dict:
    """
    Map dataset fields to database schema.
    
    Handles various field name variations from different Kaggle datasets:
    - title/summary/subject/short_description → title
    - description/details/message/issue → description
    - category/type/classification/incident_type → category
    - resolution/solution/resolution_notes → resolution
    
    Args:
        record: Raw dataset record
        
    Returns:
        Mapped record with standardized field names
    """
    # Map title field (try multiple variations)
    title = (
        record.get("title") or 
        record.get("summary") or 
        record.get("subject") or 
        record.get("short_description") or
        "Untitled"
    )
    
    # Map description field (try multiple variations)
    description = (
        record.get("description") or 
        record.get("details") or 
        record.get("message") or 
        record.get("issue") or
        record.get("long_description") or
        ""
    )
    
    # Map category field (try multiple variations)
    raw_category = (
        record.get("category") or 
        record.get("type") or 
        record.get("classification") or
        record.get("incident_type") or
        record.get("ticket_type")
    )
    
    # Normalize category to valid database value
    category = normalize_category(raw_category) if raw_category else None
    
    # Map resolution field (try multiple variations)
    resolution = (
        record.get("resolution") or 
        record.get("solution") or 
        record.get("resolution_notes") or
        record.get("fix") or
        ""
    )
    
    # Map priority field
    priority = record.get("priority", "medium")
    
    # Map status field
    status = record.get("status", "resolved")
    
    # Preserve original ticket_id if present
    ticket_id = record.get("ticket_id") or record.get("id")
    
    # Build mapped record
    mapped = {
        "title": str(title).strip() if title else "Untitled",
        "description": str(description).strip() if description else "",
        "category": category,
        "resolution": str(resolution).strip() if resolution else "",
        "priority": str(priority).strip() if priority else "medium",
        "status": str(status).strip() if status else "resolved",
        "owner_id": "system",  # Always 'system' for training data
    }
    
    # Add ticket_id if present
    if ticket_id:
        mapped["ticket_id"] = str(ticket_id)
    
    # Preserve source field if present
    if "source" in record:
        mapped["source"] = record["source"]
    
    return mapped


# ---------------------------------------------------------------------------
# Data loading and preprocessing
# ---------------------------------------------------------------------------

def load_and_preprocess(file_paths: list[str]) -> list[dict]:
    """
    Load datasets from JSON files, map fields, apply PII scrubbing, then filter invalid categories.
    
    Args:
        file_paths: List of paths to JSON files containing training data
        
    Returns:
        List of cleaned and scrubbed data records with valid categories
    """
    from src.ml.pii_scrubber import PIIScrubber
    
    all_data = []
    unmapped_categories = set()
    
    # Load all files and map fields
    for path_str in file_paths:
        path = Path(path_str)
        if not path.exists():
            print(f"[WARN] File not found: {path}", file=sys.stderr)
            continue
            
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                if isinstance(data, list):
                    # Map fields for each record
                    for record in data:
                        mapped_record = map_dataset_fields(record)
                        all_data.append(mapped_record)
                        
                        # Track unmapped categories
                        if not mapped_record.get("category"):
                            raw_cat = (
                                record.get("category") or 
                                record.get("type") or 
                                record.get("classification")
                            )
                            if raw_cat:
                                unmapped_categories.add(raw_cat)
                else:
                    # Single record
                    mapped_record = map_dataset_fields(data)
                    all_data.append(mapped_record)
                    
        except Exception as e:
            print(f"[ERROR] Failed to load {path}: {e}", file=sys.stderr)
            continue
    
    # Report unmapped categories
    if unmapped_categories:
        print(f"\n[WARN] Found {len(unmapped_categories)} unmapped categories:", file=sys.stderr)
        for cat in sorted(unmapped_categories):
            print(f"  - '{cat}'", file=sys.stderr)
        print("[INFO] These records will be filtered out. Consider adding mappings to CATEGORY_MAPPING.\n", file=sys.stderr)
    
    print(f"[INFO] Loaded {len(all_data)} records from {len(file_paths)} files")
    
    # Apply PII scrubbing to ALL items (before filtering)
    scrubbed_data = []
    for item in all_data:
        scrubbed_item = item.copy()
        
        if "title" in scrubbed_item and scrubbed_item["title"]:
            scrubbed_item["title"], _ = PIIScrubber.scrub(scrubbed_item["title"])
        
        if "description" in scrubbed_item and scrubbed_item["description"]:
            scrubbed_item["description"], _ = PIIScrubber.scrub(scrubbed_item["description"])
        
        if "resolution" in scrubbed_item and scrubbed_item["resolution"]:
            scrubbed_item["resolution"], _ = PIIScrubber.scrub(scrubbed_item["resolution"])
        
        scrubbed_data.append(scrubbed_item)
    
    print(f"[INFO] Applied PII scrubbing to {len(scrubbed_data)} records")
    
    # Filter out records with invalid/unmapped categories
    valid_data = []
    filtered_count = 0
    
    for item in scrubbed_data:
        category = item.get("category")
        if category and category in VALID_CATEGORIES:
            valid_data.append(item)
        else:
            filtered_count += 1
    
    print(f"[INFO] Filtered out {filtered_count} records with invalid/missing categories")
    print(f"[INFO] Final dataset: {len(valid_data)} valid records")
    
    # Show category distribution
    if valid_data:
        from collections import Counter
        category_counts = Counter(item.get("category") for item in valid_data)
        print("\n[INFO] Category distribution:")
        for cat in VALID_CATEGORIES:
            count = category_counts.get(cat, 0)
            percentage = (count / len(valid_data)) * 100 if valid_data else 0
            print(f"  {cat:20} : {count:5} ({percentage:5.1f}%)")
        print()
    
    return valid_data


# ---------------------------------------------------------------------------
# PII scrubbing
# ---------------------------------------------------------------------------

def scrub_dataset(data: list[dict]) -> list[dict]:
    """Apply PII scrubbing to all text fields in dataset."""
    from src.ml.pii_scrubber import PIIScrubber
    
    scrubbed = []
    for item in data:
        scrubbed_item = item.copy()
        
        if "title" in scrubbed_item:
            scrubbed_item["title"], _ = PIIScrubber.scrub(scrubbed_item["title"])
        
        if "description" in scrubbed_item:
            scrubbed_item["description"], _ = PIIScrubber.scrub(scrubbed_item["description"])
        
        if "resolution" in scrubbed_item:
            scrubbed_item["resolution"], _ = PIIScrubber.scrub(scrubbed_item["resolution"])
        
        scrubbed.append(scrubbed_item)
    
    return scrubbed


# ---------------------------------------------------------------------------
# Dataset merging and weighting
# ---------------------------------------------------------------------------

def merge_datasets_with_overrides(
    dataset_files: list[Path],
    overrides: list[dict],
    override_weight: int = 2,
) -> list[dict]:
    """
    Merge raw datasets with agent override labels.
    Override labels are duplicated `override_weight` times to increase their influence.
    """
    merged = []
    
    # Load raw datasets
    for file_path in dataset_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    merged.extend(data)
                else:
                    print(f"[WARN] Skipping non-list dataset: {file_path}", file=sys.stderr)
        except Exception as e:
            print(f"[WARN] Failed to load {file_path}: {e}", file=sys.stderr)
    
    # Add override labels with 2× weight
    for override in overrides:
        override_sample = {
            "ticket_id": override["ticket_id"],
            "category": override["corrected_category"],
            "title": f"Override sample {override['ticket_id']}",
            "description": f"Agent-corrected category: {override['corrected_category']}",
            "source": "agent_override",
        }
        # Duplicate to achieve 2× weight
        for _ in range(override_weight):
            merged.append(override_sample)
    
    print(f"[INFO] Merged dataset: {len(merged)} samples "
          f"({len(overrides) * override_weight} from overrides)")
    
    return merged


# ---------------------------------------------------------------------------
# Train/validation/test split
# ---------------------------------------------------------------------------

def split_dataset(data: list[dict], train_ratio=0.7, val_ratio=0.15) -> tuple:
    """Split dataset into train/validation/test sets."""
    import random
    random.shuffle(data)
    
    n = len(data)
    train_end = int(n * train_ratio)
    val_end = train_end + int(n * val_ratio)
    
    train = data[:train_end]
    val = data[train_end:val_end]
    test = data[val_end:]
    
    print(f"[INFO] Split: train={len(train)}, val={len(val)}, test={len(test)}")
    return train, val, test


# ---------------------------------------------------------------------------
# Model artifacts management
# ---------------------------------------------------------------------------

def save_model_artifacts(prompt: str, output_dir: str, run_id: str) -> str:
    """
    Save model artifacts (prompt template, config) to disk.
    
    Args:
        prompt: The few-shot prompt template used for classification
        output_dir: Directory to save artifacts
        run_id: Unique identifier for this training run
        
    Returns:
        Path to the saved artifacts file
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    artifact_file = output_path / f"model_{run_id}.json"
    
    artifacts = {
        "prompt": prompt,
        "run_id": run_id,
        "timestamp": datetime.now().isoformat(),
        "categories": VALID_CATEGORIES,
    }
    
    artifact_file.write_text(json.dumps(artifacts, indent=2))
    print(f"[INFO] Saved model artifacts to {artifact_file}")
    
    return str(artifact_file)


# ---------------------------------------------------------------------------
# Model fine-tuning (stub)
# ---------------------------------------------------------------------------

async def fine_tune_model(
    train_data: list[dict],
    val_data: list[dict],
    use_class_weights: bool = False,
    use_oversampling: bool = False,
) -> str:
    """
    Fine-tune or prompt-tune the base model.
    
    This is a stub implementation. In production, this would:
    - Use Ollama's fine-tuning API or external tools (LoRA, QLoRA)
    - Train on the merged dataset
    - Validate on the validation set
    - Apply class-weighted loss or oversampling if requested
    - Return the new model version identifier
    
    For now, we simulate by returning a version string.
    
    Args:
        train_data: Training samples
        val_data: Validation samples
        use_class_weights: If True, apply class-weighted loss to balance categories
        use_oversampling: If True, oversample minority categories to balance dataset
    """
    print("[INFO] Fine-tuning model (stub implementation)...")
    print(f"[INFO] Training on {len(train_data)} samples, validating on {len(val_data)} samples")
    
    if use_oversampling:
        print("[INFO] Applying oversampling to balance minority categories...")
        train_data = _apply_oversampling(train_data)
        print(f"[INFO] After oversampling: {len(train_data)} samples")
    
    if use_class_weights:
        print("[INFO] Using class-weighted loss to balance categories...")
        # In production, this would compute class weights and pass to training
        # weights = compute_class_weights(train_data)
    
    # Simulate training delay
    await asyncio.sleep(2)
    
    # In production, this would return the actual model version from Ollama/MLflow
    suffix = ""
    if use_class_weights:
        suffix += "-weighted"
    if use_oversampling:
        suffix += "-oversampled"
    
    version = f"retrained-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}{suffix}"
    print(f"[INFO] Model fine-tuning complete: {version}")
    
    return version


def _apply_oversampling(data: list[dict]) -> list[dict]:
    """
    Oversample minority categories to match the majority category count.
    
    Requirements: 15.2 (equitable recall improvement)
    """
    from collections import Counter
    import random
    
    # Count samples per category
    category_counts = Counter(item.get("category") for item in data if "category" in item)
    
    if not category_counts:
        return data
    
    # Find max count
    max_count = max(category_counts.values())
    
    # Group samples by category
    by_category = {}
    for item in data:
        cat = item.get("category")
        if cat:
            by_category.setdefault(cat, []).append(item)
    
    # Oversample each category to match max_count
    oversampled = []
    for cat, samples in by_category.items():
        current_count = len(samples)
        if current_count < max_count:
            # Oversample by repeating random samples
            needed = max_count - current_count
            oversampled.extend(samples)
            oversampled.extend(random.choices(samples, k=needed))
            print(f"[INFO]   {cat}: {current_count} -> {max_count} samples")
        else:
            oversampled.extend(samples)
    
    return oversampled


# ---------------------------------------------------------------------------
# Model evaluation
# ---------------------------------------------------------------------------

async def _run_evaluation(test_path: str, model_version: str, report_path: str) -> bool:
    """
    Internal helper to run evaluation and write report.
    
    Args:
        test_path: Path to test data JSON file
        model_version: Model version identifier
        report_path: Path to write evaluation report
        
    Returns:
        True if evaluation passes promotion gates, False otherwise
    """
    from evaluate_classifier import evaluate
    
    passes = await evaluate(
        test_data_path=test_path,
        model_version=model_version,
        dataset_version="retrain",
        output_path=report_path,
    )
    
    return passes


async def evaluate_model(test_data: list[dict], model_version: str) -> dict:
    """
    Evaluate the retrained model using the evaluation pipeline.
    Returns metrics dict with promotion gate status.
    """
    print("[INFO] Evaluating retrained model...")
    
    # Write test data to temp file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(test_data, f, indent=2)
        test_file = f.name
    
    try:
        # Import and run evaluation
        from evaluate_classifier import evaluate
        
        output_file = f"evaluation_report_{model_version}.json"
        passes = await evaluate(
            test_data_path=test_file,
            model_version=model_version,
            dataset_version="retrain",
            output_path=output_file,
        )
        
        # Load metrics
        with open(output_file, "r", encoding="utf-8") as f:
            metrics = json.load(f)
        
        return metrics
    
    finally:
        # Cleanup temp file
        try:
            os.unlink(test_file)
        except Exception:
            pass


# ---------------------------------------------------------------------------
# MLflow model registration
# ---------------------------------------------------------------------------

def register_model_in_mlflow(model_version: str, metrics: dict) -> Optional[str]:
    """Register the new model version in MLflow if promotion gate passes."""
    try:
        import mlflow
        from schemas.settings import settings
        
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        mlflow.set_experiment("ticket-classifier")
        
        # Check promotion gate
        if not metrics.get("promotion_gate", {}).get("passes", False):
            print("[WARN] Model did not pass promotion gate, skipping registration")
            return None
        
        # Register model
        with mlflow.start_run(run_name=f"retrain-{model_version}") as run:
            mlflow.set_tag("model_version", model_version)
            mlflow.set_tag("retrain_timestamp", datetime.utcnow().isoformat())
            mlflow.log_metric("macro_f1", metrics["macro_f1"])
            mlflow.log_metric("semantic_similarity", metrics["semantic_similarity"])
            
            # Log model artifact (stub - in production would log actual model weights)
            model_info = {
                "version": model_version,
                "metrics": metrics,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
            with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
                json.dump(model_info, f, indent=2)
                temp_path = f.name
            
            try:
                mlflow.log_artifact(temp_path, "model_info")
            finally:
                os.unlink(temp_path)
            
            print(f"[INFO] Model registered in MLflow: run_id={run.info.run_id}")
            return run.info.run_id
    
    except Exception as e:
        print(f"[ERROR] MLflow registration failed: {e}", file=sys.stderr)
        return None


# ---------------------------------------------------------------------------
# Model version retention
# ---------------------------------------------------------------------------

def cleanup_old_model_versions(keep_count: int = 3):
    """Retain only the N most recent model versions in MLflow."""
    try:
        import mlflow
        from schemas.settings import settings
        
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        client = mlflow.tracking.MlflowClient()
        
        experiment = client.get_experiment_by_name("ticket-classifier")
        if not experiment:
            return
        
        runs = client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=["start_time DESC"],
        )
        
        if len(runs) <= keep_count:
            return
        
        # Delete old runs
        for run in runs[keep_count:]:
            try:
                client.delete_run(run.info.run_id)
                print(f"[INFO] Deleted old model version: {run.info.run_id}")
            except Exception as e:
                print(f"[WARN] Failed to delete run {run.info.run_id}: {e}", file=sys.stderr)
    
    except Exception as e:
        print(f"[WARN] Model cleanup failed: {e}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

async def retrain(args) -> bool:
    """
    Wrapper function for retraining pipeline.
    
    Args:
        args: Namespace with force, skip_download, dataset_dir, dry_run flags
        
    Returns:
        True if retraining succeeded, False otherwise
    """
    force = getattr(args, 'force', False)
    skip_download = getattr(args, 'skip_download', False)
    dataset_dir = getattr(args, 'dataset_dir', None)
    dry_run = getattr(args, 'dry_run', False)
    
    if force:
        # Force mode: release any existing lock first
        release_lock()
    
    return await retrain_pipeline(
        skip_download=skip_download,
        dataset_dir=dataset_dir,
        dry_run=dry_run,
    )


async def retrain_pipeline(
    skip_download: bool = False,
    dataset_dir: Optional[str] = None,
    dry_run: bool = False,
):
    """Execute the full retraining pipeline."""
    
    # Step 1: Acquire lock
    if not acquire_lock():
        print("[ERROR] Another retraining run is already in progress", file=sys.stderr)
        log_concurrent_skip()
        return False
    
    try:
        # Step 2: Download datasets from MinIO
        if skip_download and dataset_dir:
            print(f"[INFO] Using local datasets from {dataset_dir}")
            dataset_files = list(Path(dataset_dir).glob("*.json"))
        else:
            print("[INFO] Downloading datasets from MinIO...")
            temp_dir = Path(tempfile.mkdtemp(prefix="retrain_"))
            dataset_files = download_datasets_from_minio(temp_dir)
        
        if not dataset_files:
            print("[ERROR] No datasets found", file=sys.stderr)
            return False
        
        # Step 3: Fetch agent override labels
        print("[INFO] Fetching agent override labels...")
        overrides = await fetch_agent_overrides()
        print(f"[INFO] Found {len(overrides)} agent override labels")
        
        # Step 4: Merge datasets with overrides (2× weight)
        print("[INFO] Merging datasets with agent overrides...")
        merged_data = merge_datasets_with_overrides(dataset_files, overrides, override_weight=2)
        
        # Step 5: Apply PII scrubbing
        print("[INFO] Applying PII scrubbing...")
        scrubbed_data = scrub_dataset(merged_data)
        
        # Step 6: Split train/val/test
        print("[INFO] Splitting dataset...")
        train_data, val_data, test_data = split_dataset(scrubbed_data)
        
        if dry_run:
            print("[DRY RUN] Stopping before model training")
            print(f"[DRY RUN] Would train on {len(train_data)} samples")
            return True
        
        # Step 7: Fine-tune model (initial attempt)
        print("[INFO] Fine-tuning model (initial attempt)...")
        model_version = await fine_tune_model(train_data, val_data)
        
        # Step 8: Evaluate model
        print("[INFO] Evaluating model...")
        metrics = await evaluate_model(test_data, model_version)
        
        # Step 9: Check equitable recall spread (Requirement 15.2)
        equitable_recall_spread = metrics.get("equitable_recall_spread", 0.0)
        equitable_recall_threshold = 0.25
        
        if equitable_recall_spread > equitable_recall_threshold:
            print(f"[WARN] Equitable recall spread {equitable_recall_spread} exceeds threshold {equitable_recall_threshold}")
            print("[INFO] Attempting retraining with class-weighted loss...")
            
            # Retry with class-weighted loss
            model_version_weighted = await fine_tune_model(
                train_data, val_data, use_class_weights=True
            )
            metrics_weighted = await evaluate_model(test_data, model_version_weighted)
            
            # Check if weighted version improved
            if metrics_weighted.get("equitable_recall_spread", 1.0) < equitable_recall_spread:
                print("[INFO] Class-weighted loss improved equitable recall, using weighted model")
                model_version = model_version_weighted
                metrics = metrics_weighted
            else:
                print("[INFO] Class-weighted loss did not improve, trying oversampling...")
                
                # Retry with oversampling
                model_version_oversampled = await fine_tune_model(
                    train_data, val_data, use_oversampling=True
                )
                metrics_oversampled = await evaluate_model(test_data, model_version_oversampled)
                
                # Use best of the three
                if metrics_oversampled.get("equitable_recall_spread", 1.0) < equitable_recall_spread:
                    print("[INFO] Oversampling improved equitable recall, using oversampled model")
                    model_version = model_version_oversampled
                    metrics = metrics_oversampled
                else:
                    print("[WARN] Neither class-weighted loss nor oversampling improved equitable recall")
                    print("[WARN] Using original model, but promotion may fail")
        
        # Step 10: Register in MLflow if promotion gate passes
        print("[INFO] Checking promotion gate...")
        run_id = register_model_in_mlflow(model_version, metrics)
        
        if run_id:
            print(f"[SUCCESS] Model promoted and registered: {run_id}")
            
            # Step 11: Cleanup old versions
            print("[INFO] Cleaning up old model versions...")
            cleanup_old_model_versions(keep_count=3)
            
            return True
        else:
            print("[WARN] Model did not pass promotion gate")
            return False
    
    finally:
        # Always release lock
        release_lock()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Retrain the TicketIQ classifier with agent feedback."
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Skip MinIO download and use local datasets",
    )
    parser.add_argument(
        "--dataset-dir",
        help="Local directory containing dataset JSON files (requires --skip-download)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run pipeline without training or registration",
    )
    args = parser.parse_args()
    
    if args.skip_download and not args.dataset_dir:
        print("[ERROR] --dataset-dir required when using --skip-download", file=sys.stderr)
        sys.exit(1)
    
    success = asyncio.run(
        retrain_pipeline(
            skip_download=args.skip_download,
            dataset_dir=args.dataset_dir,
            dry_run=args.dry_run,
        )
    )
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
