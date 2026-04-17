#!/usr/bin/env python3
"""
evaluate_classifier.py — Automated classifier evaluation pipeline.

Computes:
  - Macro-averaged F1 score (threshold: >= 0.80)
  - Per-category F1 scores (flag if any < 0.65)
  - Semantic similarity score for resolution suggestions (threshold: >= 0.72)
  - LLM-as-judge scores: routing correctness + resolution relevance (threshold: >= 3.5/5)
  - Equitable recall spread (threshold: <= 0.25)
  - Class imbalance report (warn if any category < 100 samples)

Outputs a structured JSON report and logs the run to MLflow.

Requirements: 14.1–14.6, 15.1, 15.2
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Optional

VALID_CATEGORIES = [
    "Infrastructure",
    "Application",
    "Security",
    "Database",
    "Storage",
    "Network",
    "Access Management",
]

MACRO_F1_THRESHOLD = 0.80
PER_CATEGORY_F1_THRESHOLD = 0.65
SEMANTIC_SIMILARITY_THRESHOLD = 0.72
JUDGE_SCORE_THRESHOLD = 3.5
EQUITABLE_RECALL_THRESHOLD = 0.25
MIN_SAMPLES_PER_CATEGORY = 100


# ---------------------------------------------------------------------------
# Metric computation
# ---------------------------------------------------------------------------


def compute_f1_scores(y_true: list, y_pred: list) -> dict:
    """Compute per-category and macro-averaged F1 scores."""
    from collections import defaultdict

    tp = defaultdict(int)
    fp = defaultdict(int)
    fn = defaultdict(int)

    for true, pred in zip(y_true, y_pred):
        if true == pred:
            tp[true] += 1
        else:
            fp[pred] += 1
            fn[true] += 1

    per_category_f1 = {}
    for cat in VALID_CATEGORIES:
        precision = tp[cat] / (tp[cat] + fp[cat]) if (tp[cat] + fp[cat]) > 0 else 0.0
        recall = tp[cat] / (tp[cat] + fn[cat]) if (tp[cat] + fn[cat]) > 0 else 0.0
        f1 = (
            (2 * precision * recall / (precision + recall))
            if (precision + recall) > 0
            else 0.0
        )
        per_category_f1[cat] = round(f1, 4)

    macro_f1 = round(sum(per_category_f1.values()) / len(VALID_CATEGORIES), 4)
    return {"macro_f1": macro_f1, "per_category_f1": per_category_f1}


def compute_recall_per_category(y_true: list, y_pred: list) -> dict:
    """Compute per-category recall."""
    from collections import defaultdict

    tp = defaultdict(int)
    fn = defaultdict(int)
    for true, pred in zip(y_true, y_pred):
        if true == pred:
            tp[true] += 1
        else:
            fn[true] += 1
    recalls = {}
    for cat in VALID_CATEGORIES:
        total = tp[cat] + fn[cat]
        recalls[cat] = round(tp[cat] / total, 4) if total > 0 else 0.0
    return recalls


def compute_class_imbalance(y_true: list) -> dict:
    """Count samples per category and flag categories below minimum."""
    from collections import Counter

    counts = Counter(y_true)
    report = {}
    warnings = []
    for cat in VALID_CATEGORIES:
        count = counts.get(cat, 0)
        report[cat] = count
        if count < MIN_SAMPLES_PER_CATEGORY:
            warnings.append(
                f"{cat}: only {count} samples (minimum {MIN_SAMPLES_PER_CATEGORY})"
            )
    return {"counts": report, "warnings": warnings}


def compute_semantic_similarity(predictions: list, ground_truths: list) -> float:
    """Compute mean cosine similarity between prediction and ground-truth embeddings."""
    try:
        import numpy as np
        from ml.embedding_service import embedding_service

        if not predictions or not ground_truths:
            return 0.0

        pred_embeddings = embedding_service.get_embeddings(predictions)
        gt_embeddings = embedding_service.get_embeddings(ground_truths)

        similarities = []
        for p, g in zip(pred_embeddings, gt_embeddings):
            norm_p = np.linalg.norm(p)
            norm_g = np.linalg.norm(g)
            if norm_p > 0 and norm_g > 0:
                sim = float(np.dot(p, g) / (norm_p * norm_g))
                similarities.append(sim)

        return round(sum(similarities) / len(similarities), 4) if similarities else 0.0
    except Exception as e:
        print(f"[WARN] Semantic similarity computation failed: {e}", file=sys.stderr)
        return 0.0


async def run_llm_as_judge(
    tickets: list[dict],
    predictions: list[str],
    resolution_suggestions: list[str],
    ground_truths: list[str],
) -> dict:
    """Run LLM-as-judge evaluation. Returns mean routing and resolution scores."""
    try:
        from ml.classifier import TicketClassifier
        from schemas.settings import settings

        TicketClassifier()
        routing_scores = []
        resolution_scores = []

        for ticket, pred, suggestion, truth in zip(
            tickets, predictions, resolution_suggestions, ground_truths
        ):
            prompt = f"""You are an evaluation judge. Score the following ticket classification on two dimensions.

Ticket: {ticket.get('title', '')} — {ticket.get('description', '')[:300]}
Predicted category: {pred}
Ground-truth category: {truth}
Resolution suggestion: {suggestion[:500] if suggestion else 'None'}

Return ONLY a JSON object with:
- "routing_score": integer 1-5 (1=completely wrong, 5=perfect)
- "resolution_score": integer 1-5 (1=irrelevant, 5=highly actionable)
"""
            try:
                from ollama import AsyncClient

                client = AsyncClient(
                    host=settings.ollama_base_url.replace("http://", "").replace(
                        "https://", ""
                    ),
                    timeout=10,
                )
                response = await asyncio.wait_for(
                    client.chat(
                        model=settings.ollama_model,
                        messages=[{"role": "user", "content": prompt}],
                        format="json",
                    ),
                    timeout=10,
                )
                result = json.loads(response.message.content)
                routing_scores.append(
                    max(1, min(5, int(result.get("routing_score", 3))))
                )
                resolution_scores.append(
                    max(1, min(5, int(result.get("resolution_score", 3))))
                )
            except Exception:
                # If judge unavailable, use neutral score
                routing_scores.append(3)
                resolution_scores.append(3)

        mean_routing = (
            round(sum(routing_scores) / len(routing_scores), 2)
            if routing_scores
            else 0.0
        )
        mean_resolution = (
            round(sum(resolution_scores) / len(resolution_scores), 2)
            if resolution_scores
            else 0.0
        )
        return {
            "mean_routing_score": mean_routing,
            "mean_resolution_score": mean_resolution,
        }

    except Exception as e:
        print(f"[WARN] LLM-as-judge failed: {e}", file=sys.stderr)
        return {"mean_routing_score": 0.0, "mean_resolution_score": 0.0}


# ---------------------------------------------------------------------------
# MLflow logging
# ---------------------------------------------------------------------------


def log_to_mlflow(
    metrics: dict, model_version: str, dataset_version: str
) -> Optional[str]:
    """Log evaluation run to MLflow. Returns run_id or None on failure."""
    try:
        import mlflow
        from schemas.settings import settings

        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        mlflow.set_experiment("ticket-classifier")

        with mlflow.start_run(
            run_name=f"eval-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
        ) as run:
            mlflow.set_tag("model_version", model_version)
            mlflow.set_tag("dataset_version", dataset_version)
            mlflow.log_metric("macro_f1", metrics["macro_f1"])
            mlflow.log_metric("semantic_similarity", metrics["semantic_similarity"])
            mlflow.log_metric("judge_routing_score", metrics["judge_routing_score"])
            mlflow.log_metric(
                "judge_resolution_score", metrics["judge_resolution_score"]
            )
            mlflow.log_metric(
                "equitable_recall_spread", metrics["equitable_recall_spread"]
            )
            for cat, score in metrics["per_category_f1"].items():
                key = cat.lower().replace(" ", "_")
                mlflow.log_metric(f"f1_{key}", score)
            return run.info.run_id
    except Exception as e:
        print(f"[WARN] MLflow logging failed: {e}", file=sys.stderr)
        return None


# ---------------------------------------------------------------------------
# Promotion gate
# ---------------------------------------------------------------------------


def check_promotion_gate(metrics: dict) -> tuple[bool, list[str]]:
    """Return (passes, list_of_failures)."""
    failures = []

    if metrics["macro_f1"] < MACRO_F1_THRESHOLD:
        failures.append(
            f"Macro F1 {metrics['macro_f1']} < threshold {MACRO_F1_THRESHOLD}"
        )

    for cat, score in metrics["per_category_f1"].items():
        if score < PER_CATEGORY_F1_THRESHOLD:
            failures.append(
                f"Category '{cat}' F1 {score} < threshold {PER_CATEGORY_F1_THRESHOLD}"
            )

    if metrics["semantic_similarity"] < SEMANTIC_SIMILARITY_THRESHOLD:
        failures.append(
            f"Semantic similarity {metrics['semantic_similarity']} < threshold {SEMANTIC_SIMILARITY_THRESHOLD}"
        )

    if metrics["judge_routing_score"] < JUDGE_SCORE_THRESHOLD:
        failures.append(
            f"Judge routing score {metrics['judge_routing_score']} < threshold {JUDGE_SCORE_THRESHOLD}"
        )

    if metrics["judge_resolution_score"] < JUDGE_SCORE_THRESHOLD:
        failures.append(
            f"Judge resolution score {metrics['judge_resolution_score']} < threshold {JUDGE_SCORE_THRESHOLD}"
        )

    if metrics["equitable_recall_spread"] > EQUITABLE_RECALL_THRESHOLD:
        failures.append(
            f"Equitable recall spread {metrics['equitable_recall_spread']} > threshold {EQUITABLE_RECALL_THRESHOLD}"
        )

    return len(failures) == 0, failures


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def evaluate(
    test_data_path: str, model_version: str, dataset_version: str, output_path: str
):
    """Run full evaluation pipeline."""
    print(f"[INFO] Loading test data from {test_data_path}")

    with open(test_data_path, "r", encoding="utf-8") as f:
        test_data = json.load(f)

    # Expected format: list of {"title": str, "description": str, "category": str, "resolution": str}
    y_true = [item["category"] for item in test_data]
    resolutions_gt = [item.get("resolution", "") for item in test_data]

    print(f"[INFO] Evaluating {len(test_data)} test samples...")

    # Run classifier on test set
    from ml.classifier import TicketClassifier

    clf = TicketClassifier()
    y_pred = []
    resolution_suggestions = []

    for item in test_data:
        try:
            result = await clf.classify(
                title=item["title"],
                description=item["description"],
            )
            y_pred.append(result.category.value)
            resolution_suggestions.append("")  # RAG not run in eval mode
        except Exception:
            y_pred.append("Application")  # fallback
            resolution_suggestions.append("")

    # Compute metrics
    f1_results = compute_f1_scores(y_true, y_pred)
    recalls = compute_recall_per_category(y_true, y_pred)
    recall_values = list(recalls.values())
    equitable_recall_spread = (
        round(max(recall_values) - min(recall_values), 4) if recall_values else 0.0
    )

    semantic_sim = compute_semantic_similarity(resolution_suggestions, resolutions_gt)
    judge_scores = await run_llm_as_judge(
        test_data, y_pred, resolution_suggestions, y_true
    )
    imbalance = compute_class_imbalance(y_true)

    metrics = {
        "macro_f1": f1_results["macro_f1"],
        "per_category_f1": f1_results["per_category_f1"],
        "semantic_similarity": semantic_sim,
        "judge_routing_score": judge_scores["mean_routing_score"],
        "judge_resolution_score": judge_scores["mean_resolution_score"],
        "equitable_recall_spread": equitable_recall_spread,
        "per_category_recall": recalls,
        "class_imbalance": imbalance,
        "model_version": model_version,
        "dataset_version": dataset_version,
        "evaluated_at": datetime.utcnow().isoformat(),
        "sample_count": len(test_data),
    }

    # Promotion gate
    passes, failures = check_promotion_gate(metrics)
    metrics["promotion_gate"] = {"passes": passes, "failures": failures}

    # Class imbalance warnings
    if imbalance["warnings"]:
        print("[WARN] Class imbalance detected:")
        for w in imbalance["warnings"]:
            print(f"  - {w}")

    # Log to MLflow
    run_id = log_to_mlflow(metrics, model_version, dataset_version)
    if run_id:
        metrics["mlflow_run_id"] = run_id
        print(f"[INFO] MLflow run logged: {run_id}")

    # Write report
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(
        f"\n[RESULT] Macro F1: {metrics['macro_f1']} | "
        f"Semantic similarity: {metrics['semantic_similarity']} | "
        f"Judge routing: {metrics['judge_routing_score']} | "
        f"Judge resolution: {metrics['judge_resolution_score']}"
    )
    print(f"[RESULT] Promotion gate: {'PASS ✓' if passes else 'FAIL ✗'}")
    if failures:
        for f in failures:
            print(f"  ✗ {f}")
    print(f"[INFO] Report written to {output_path}")

    return passes


def main():
    parser = argparse.ArgumentParser(description="Evaluate the TicketIQ classifier.")
    parser.add_argument(
        "--test-data",
        default="data/test_set.json",
        help="Path to test dataset JSON (list of {title, description, category, resolution})",
    )
    parser.add_argument("--model-version", default="latest", help="Model version tag")
    parser.add_argument("--dataset-version", default="v1", help="Dataset version tag")
    parser.add_argument(
        "--output",
        default="evaluation_report.json",
        help="Output path for the JSON report",
    )
    args = parser.parse_args()

    if not os.path.exists(args.test_data):
        print(f"[ERROR] Test data not found: {args.test_data}", file=sys.stderr)
        sys.exit(1)

    passes = asyncio.run(
        evaluate(args.test_data, args.model_version, args.dataset_version, args.output)
    )
    sys.exit(0 if passes else 1)


if __name__ == "__main__":
    main()
