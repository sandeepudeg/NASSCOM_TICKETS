import mlflow
import random
import time
from datetime import datetime

# Configure MLflow to point to the local instance
MLFLOW_TRACKING_URI = "http://localhost:5000"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

def seed_mlflow():
    print(f"Connecting to MLflow at {MLFLOW_TRACKING_URI}...")
    
    # 1. Create or get the experiment
    experiment_name = "ticket-classifier"
    try:
        experiment_id = mlflow.create_experiment(experiment_name)
        print(f"Created new experiment: {experiment_name}")
    except:
        experiment_id = mlflow.get_experiment_by_name(experiment_name).experiment_id
        print(f"Using existing experiment: {experiment_name}")

    mlflow.set_experiment(experiment_name)

    # 2. Log several "Runs" to simulate training history
    runs = [
        {"name": "Initial Baseline", "accuracy": 0.72, "latency": 1.2},
        {"name": "Add PII Scrubbing", "accuracy": 0.75, "latency": 1.5},
        {"name": "Few-Shot Tuning v1", "accuracy": 0.84, "latency": 2.1},
        {"name": "Domain Adaptation - Health", "accuracy": 0.89, "latency": 2.4},
        {"name": "Optimized Prompt v2", "accuracy": 0.94, "latency": 1.8},
    ]

    for run_data in runs:
        with mlflow.start_run(run_name=run_data["name"]):
            print(f"Logging run: {run_data['name']}...")
            mlflow.log_param("model_type", "mistral-7b-instruct")
            mlflow.log_param("tuning_method", "few-shot")
            mlflow.log_metric("accuracy", run_data["accuracy"])
            mlflow.log_metric("latency_seconds", run_data["latency"])
            mlflow.log_metric("f1_score", run_data["accuracy"] - 0.05)
            
            # Tag the run
            mlflow.set_tag("environment", "development")
            mlflow.set_tag("seeded_at", datetime.utcnow().isoformat())

    # 3. Register the best model
    print("Registering the best model version...")
    # Find the best run
    best_run = sorted(runs, key=lambda x: x["accuracy"], reverse=True)[0]
    
    # In a real scenario, we'd log the model artifact here. 
    # For seeding purposes, we'll just register a placeholder version if possible, 
    # but MLflow usually requires an artifact. 
    # Let's just finish the runs so the user can see them in the UI.

    print("\nSuccess! MLflow has been seeded with 5 training runs.")
    print("You can now see them at http://localhost:5000")

if __name__ == "__main__":
    try:
        seed_mlflow()
    except Exception as e:
        print(f"Error seeding MLflow: {e}")
        print("Make sure the MLflow container is running (docker compose up -d mlflow)")
