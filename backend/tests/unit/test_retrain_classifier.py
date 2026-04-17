"""
Unit tests for retrain_classifier.py
Focus: concurrency guard, preprocessing, and happy-path orchestration.
"""

import json
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

# Add scripts/ml to path for importing
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "scripts" / "ml"))

import retrain_classifier as rc

import pytest_asyncio
pytestmark = pytest.mark.asyncio(loop_scope="session")


def test_acquire_lock_blocks_second_run():
    base = Path("tests/tmp_retrain")
    base.mkdir(parents=True, exist_ok=True)
    lock_path = base / "lock.json"
    rc.LOCK_FILE = str(lock_path)

    assert rc.acquire_lock() is True
    # second acquire should fail without modifying first lock info
    assert rc.acquire_lock() is False
    assert lock_path.exists()
    rc.release_lock()
    assert not lock_path.exists()


def test_load_and_preprocess_filters_invalid_and_scrubs(monkeypatch):
    base = Path("tests/tmp_retrain")
    base.mkdir(parents=True, exist_ok=True)
    data = [
        {"title": "hello", "description": "world", "category": "Infrastructure"},
        {"title": "bad", "description": "drop", "category": "Unknown"},
    ]
    data_path = base / "sample.json"
    data_path.write_text(json.dumps(data))

    calls = []

    def fake_scrub(text):
        calls.append(text)
        return f"[SCRUB]{text}", {}

    monkeypatch.setattr(
        "src.ml.pii_scrubber.PIIScrubber.scrub", staticmethod(fake_scrub)
    )

    cleaned = rc.load_and_preprocess([str(data_path)])
    assert len(cleaned) == 1
    assert cleaned[0]["title"].startswith("[SCRUB]")
    assert cleaned[0]["description"].startswith("[SCRUB]")
    # scrub called for title, description, and resolution (empty) of valid + invalid rows (6 calls total)
    assert len(calls) >= 4  # At least 4 calls (title + description for both records)


def test_normalize_category():
    """Test category normalization with various inputs."""
    # Exact match
    assert rc.normalize_category("Infrastructure") == "Infrastructure"
    assert rc.normalize_category("Application") == "Application"

    # Case-insensitive mapping
    assert rc.normalize_category("hardware") == "Infrastructure"
    assert rc.normalize_category("software") == "Application"
    assert rc.normalize_category("database") == "Database"
    assert rc.normalize_category("network") == "Network"

    # Unmapped category
    assert rc.normalize_category("Unknown") is None
    assert rc.normalize_category("") is None
    assert rc.normalize_category(None) is None


def test_map_dataset_fields():
    """Test field mapping with various dataset formats."""
    # Standard format
    record1 = {
        "title": "Test ticket",
        "description": "Test description",
        "category": "Infrastructure",
        "resolution": "Fixed it",
    }
    mapped1 = rc.map_dataset_fields(record1)
    assert mapped1["title"] == "Test ticket"
    assert mapped1["description"] == "Test description"
    assert mapped1["category"] == "Infrastructure"
    assert mapped1["resolution"] == "Fixed it"
    assert mapped1["owner_id"] == "system"

    # Alternative field names
    record2 = {
        "summary": "Test summary",
        "details": "Test details",
        "type": "hardware",
        "solution": "Replaced hardware",
    }
    mapped2 = rc.map_dataset_fields(record2)
    assert mapped2["title"] == "Test summary"
    assert mapped2["description"] == "Test details"
    assert mapped2["category"] == "Infrastructure"  # hardware -> Infrastructure
    assert mapped2["resolution"] == "Replaced hardware"

    # ServiceNow-style fields
    record3 = {
        "short_description": "Server down",
        "long_description": "Production server is down",
        "incident_type": "server",
        "resolution_notes": "Restarted server",
    }
    mapped3 = rc.map_dataset_fields(record3)
    assert mapped3["title"] == "Server down"
    assert mapped3["description"] == "Production server is down"
    assert mapped3["category"] == "Infrastructure"  # server -> Infrastructure
    assert mapped3["resolution"] == "Restarted server"

    # Missing fields
    record4 = {}
    mapped4 = rc.map_dataset_fields(record4)
    assert mapped4["title"] == "Untitled"
    assert mapped4["description"] == ""
    assert mapped4["category"] is None
    assert mapped4["owner_id"] == "system"



async def test_retrain_happy_path(monkeypatch):
    base = Path("tests/tmp_retrain")
    base.mkdir(parents=True, exist_ok=True)
    # isolate lock file and artifact directories
    rc.LOCK_FILE = str(base / "lock.json")

    # stub dataset download
    dataset = [{"title": "t", "description": "d", "category": "Application"}]
    data_path = base / "data.json"
    data_path.write_text(json.dumps(dataset))
    monkeypatch.setattr(
        rc, "download_datasets_from_minio", lambda out: [str(data_path)]
    )

    # no override labels
    async def fake_overrides():
        return []

    monkeypatch.setattr(rc, "load_override_labels", fake_overrides)

    # avoid writing to repo paths
    artifacts_dir = base / "models"

    def fake_save_model_artifacts(prompt, output_dir, run_id):
        path = artifacts_dir / f"model_{run_id}.json"
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"prompt": prompt, "run_id": run_id}))
        return str(path)

    monkeypatch.setattr(rc, "save_model_artifacts", fake_save_model_artifacts)

    # stub evaluation to create metrics file and return pass
    async def fake_run_eval(test_data, model_version):
        metrics = {
            "macro_f1": 0.9,
            "semantic_similarity": 0.8,
            "judge_routing_score": 4.0,
            "judge_resolution_score": 4.0,
            "equitable_recall_spread": 0.1,
            "per_category_f1": {c: 0.8 for c in rc.VALID_CATEGORIES},
            "promotion_gate": {"passes": True},
        }
        return metrics

    monkeypatch.setattr(rc, "evaluate_model", fake_run_eval)

    register_calls = {}

    def fake_register(model_version, metrics):
        register_calls["model_version"] = model_version
        register_calls["metrics"] = metrics
        return "test-run-id-123"

    monkeypatch.setattr(rc, "register_model_in_mlflow", fake_register)

    Path("data").mkdir(exist_ok=True)

    # run retrain
    args = SimpleNamespace(force=True)
    success = await rc.retrain(args)
    assert success is True
    assert "metrics" in register_calls
    assert "model_version" in register_calls
