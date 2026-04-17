"""
Unit tests for evaluate_classifier.py metric computation.
Requirements: 14.1–14.3
"""

import sys
import types
from pathlib import Path

import pytest

# Add scripts/ml to path for importing
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "scripts" / "ml"))

from evaluate_classifier import (
    EQUITABLE_RECALL_THRESHOLD,
    JUDGE_SCORE_THRESHOLD,
    MACRO_F1_THRESHOLD,
    MIN_SAMPLES_PER_CATEGORY,
    PER_CATEGORY_F1_THRESHOLD,
    SEMANTIC_SIMILARITY_THRESHOLD,
    VALID_CATEGORIES,
    check_promotion_gate,
    compute_class_imbalance,
    compute_f1_scores,
    compute_recall_per_category,
    compute_semantic_similarity,
)


@pytest.fixture
def fake_embedding_module(monkeypatch):
    fake = types.SimpleNamespace(
        embedding_service=types.SimpleNamespace(
            get_embeddings=lambda texts: [[1.0, 0.0, 0.0] for _ in texts]
        )
    )
    monkeypatch.setitem(sys.modules, "src.ml.embedding_service", fake)
    return fake


# ---------------------------------------------------------------------------
# compute_f1_scores
# ---------------------------------------------------------------------------


def test_perfect_predictions_give_f1_of_1():
    # Use all 7 categories so macro average is 1.0
    y_true = VALID_CATEGORIES[:]
    y_pred = VALID_CATEGORIES[:]
    result = compute_f1_scores(y_true, y_pred)
    assert result["macro_f1"] == 1.0
    for cat in VALID_CATEGORIES:
        assert result["per_category_f1"][cat] == 1.0


def test_all_wrong_predictions_give_f1_of_0():
    y_true = ["Infrastructure", "Infrastructure", "Infrastructure"]
    y_pred = ["Application", "Application", "Application"]
    result = compute_f1_scores(y_true, y_pred)
    assert result["per_category_f1"]["Infrastructure"] == 0.0
    assert result["per_category_f1"]["Application"] == 0.0


def test_f1_scores_all_seven_categories_present():
    y_true = ["Infrastructure"]
    y_pred = ["Infrastructure"]
    result = compute_f1_scores(y_true, y_pred)
    for cat in VALID_CATEGORIES:
        assert cat in result["per_category_f1"]


def test_macro_f1_is_average_of_per_category():
    y_true = ["Infrastructure", "Application"]
    y_pred = ["Infrastructure", "Application"]
    result = compute_f1_scores(y_true, y_pred)
    per_cat_values = list(result["per_category_f1"].values())
    expected_macro = round(sum(per_cat_values) / len(VALID_CATEGORIES), 4)
    assert result["macro_f1"] == expected_macro


def test_partial_correct_predictions():
    y_true = ["Infrastructure", "Infrastructure", "Application", "Application"]
    y_pred = ["Infrastructure", "Application", "Application", "Infrastructure"]
    result = compute_f1_scores(y_true, y_pred)
    assert 0.0 < result["macro_f1"] < 1.0
    assert 0.0 < result["per_category_f1"]["Infrastructure"] < 1.0


# ---------------------------------------------------------------------------
# compute_recall_per_category
# ---------------------------------------------------------------------------


def test_recall_perfect():
    y_true = ["Infrastructure", "Application"]
    y_pred = ["Infrastructure", "Application"]
    recalls = compute_recall_per_category(y_true, y_pred)
    assert recalls["Infrastructure"] == 1.0
    assert recalls["Application"] == 1.0


def test_recall_zero_for_missed_category():
    y_true = ["Infrastructure", "Infrastructure"]
    y_pred = ["Application", "Application"]
    recalls = compute_recall_per_category(y_true, y_pred)
    assert recalls["Infrastructure"] == 0.0


def test_recall_all_categories_present():
    y_true = ["Infrastructure"]
    y_pred = ["Infrastructure"]
    recalls = compute_recall_per_category(y_true, y_pred)
    for cat in VALID_CATEGORIES:
        assert cat in recalls


# ---------------------------------------------------------------------------
# compute_class_imbalance
# ---------------------------------------------------------------------------


def test_class_imbalance_no_warnings_when_sufficient():
    y_true = ["Infrastructure"] * 150 + ["Application"] * 150
    report = compute_class_imbalance(y_true)
    # Only these two categories have samples; others will warn
    assert report["counts"]["Infrastructure"] == 150
    assert report["counts"]["Application"] == 150


def test_class_imbalance_warns_when_below_minimum():
    y_true = ["Infrastructure"] * 50  # below MIN_SAMPLES_PER_CATEGORY
    report = compute_class_imbalance(y_true)
    assert len(report["warnings"]) > 0
    assert any("Infrastructure" in w for w in report["warnings"])


def test_class_imbalance_zero_samples_warns():
    y_true = []
    report = compute_class_imbalance(y_true)
    assert len(report["warnings"]) == len(VALID_CATEGORIES)


def test_class_imbalance_counts_all_categories():
    y_true = ["Infrastructure"] * 10
    report = compute_class_imbalance(y_true)
    for cat in VALID_CATEGORIES:
        assert cat in report["counts"]


# ---------------------------------------------------------------------------
# compute_semantic_similarity
# ---------------------------------------------------------------------------


def test_semantic_similarity_returns_zero_on_empty(fake_embedding_module):
    assert compute_semantic_similarity([], []) == 0.0


def test_semantic_similarity_uses_embeddings(monkeypatch, fake_embedding_module):
    calls = []

    def fake_get_embeddings(texts):
        calls.append(list(texts))
        # cosine between these two vectors is ~0.5
        if texts == ["a"]:
            return [[1, 0, 0]]
        if texts == ["b"]:
            return [[0.5, 0.866, 0]]
        return [[1, 0, 0] for _ in texts]

    monkeypatch.setattr(
        fake_embedding_module.embedding_service, "get_embeddings", fake_get_embeddings
    )
    sim = compute_semantic_similarity(["a"], ["b"])
    assert 0.49 < sim < 0.51  # approx 0.5
    # embedding service should be called twice (preds and ground truths)
    assert len(calls) == 2


def test_semantic_similarity_handles_exception(monkeypatch, fake_embedding_module):
    def broken(_):
        raise RuntimeError("boom")

    monkeypatch.setattr(
        fake_embedding_module.embedding_service, "get_embeddings", broken
    )
    sim = compute_semantic_similarity(["a"], ["b"])
    assert sim == 0.0


# ---------------------------------------------------------------------------
# check_promotion_gate
# ---------------------------------------------------------------------------


def _passing_metrics():
    return {
        "macro_f1": 0.85,
        "per_category_f1": {cat: 0.80 for cat in VALID_CATEGORIES},
        "semantic_similarity": 0.75,
        "judge_routing_score": 4.0,
        "judge_resolution_score": 4.0,
        "equitable_recall_spread": 0.10,
    }


def test_promotion_gate_passes_with_good_metrics():
    passes, failures = check_promotion_gate(_passing_metrics())
    assert passes is True
    assert failures == []


def test_promotion_gate_fails_low_macro_f1():
    metrics = _passing_metrics()
    metrics["macro_f1"] = 0.75  # below 0.80
    passes, failures = check_promotion_gate(metrics)
    assert passes is False
    assert any("Macro F1" in f for f in failures)


def test_promotion_gate_fails_low_per_category_f1():
    metrics = _passing_metrics()
    metrics["per_category_f1"]["Security"] = 0.60  # below 0.65
    passes, failures = check_promotion_gate(metrics)
    assert passes is False
    assert any("Security" in f for f in failures)


def test_promotion_gate_fails_low_semantic_similarity():
    metrics = _passing_metrics()
    metrics["semantic_similarity"] = 0.65  # below 0.72
    passes, failures = check_promotion_gate(metrics)
    assert passes is False
    assert any("semantic similarity" in f.lower() for f in failures)


def test_promotion_gate_fails_low_judge_routing():
    metrics = _passing_metrics()
    metrics["judge_routing_score"] = 3.0  # below 3.5
    passes, failures = check_promotion_gate(metrics)
    assert passes is False
    assert any("routing" in f.lower() for f in failures)


def test_promotion_gate_fails_low_judge_resolution():
    metrics = _passing_metrics()
    metrics["judge_resolution_score"] = 3.0  # below 3.5
    passes, failures = check_promotion_gate(metrics)
    assert passes is False
    assert any("resolution" in f.lower() for f in failures)


def test_promotion_gate_fails_high_equitable_recall_spread():
    metrics = _passing_metrics()
    metrics["equitable_recall_spread"] = 0.30  # above 0.25
    passes, failures = check_promotion_gate(metrics)
    assert passes is False
    assert any("recall spread" in f.lower() for f in failures)


def test_promotion_gate_multiple_failures():
    metrics = _passing_metrics()
    metrics["macro_f1"] = 0.70
    metrics["semantic_similarity"] = 0.60
    passes, failures = check_promotion_gate(metrics)
    assert passes is False
    assert len(failures) >= 2


# ---------------------------------------------------------------------------
# Threshold constants
# ---------------------------------------------------------------------------


def test_threshold_values_match_requirements():
    """Verify thresholds match requirements_v2_1.md."""
    assert MACRO_F1_THRESHOLD == 0.80
    assert PER_CATEGORY_F1_THRESHOLD == 0.65
    assert SEMANTIC_SIMILARITY_THRESHOLD == 0.72
    assert JUDGE_SCORE_THRESHOLD == 3.5
    assert EQUITABLE_RECALL_THRESHOLD == 0.25
    assert MIN_SAMPLES_PER_CATEGORY == 100
