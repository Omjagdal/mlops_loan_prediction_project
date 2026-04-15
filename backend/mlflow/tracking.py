"""
MLflow tracking configuration and utilities.
"""

import os
import mlflow
from mlflow.tracking import MlflowClient

# Configuration
MLFLOW_TRACKING_URI = os.environ.get("MLFLOW_TRACKING_URI", "sqlite:///mlflow.db")
EXPERIMENT_NAME = "loan_prediction"
MODEL_NAME = "loan_prediction_model"


def setup_mlflow():
    """Initialize MLflow tracking."""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)
    return MlflowClient(MLFLOW_TRACKING_URI)


def get_production_model_uri():
    """Get the URI of the current production model."""
    client = MlflowClient(MLFLOW_TRACKING_URI)
    try:
        versions = client.get_latest_versions(MODEL_NAME, stages=["Production"])
        if versions:
            return f"models:/{MODEL_NAME}/Production"
    except Exception:
        pass
    return None


def log_prediction(run_name: str, inputs: dict, prediction: str, probability: float):
    """Log a prediction to MLflow for monitoring."""
    try:
        mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
        mlflow.set_experiment(f"{EXPERIMENT_NAME}_predictions")

        with mlflow.start_run(run_name=run_name):
            mlflow.log_params({k: str(v)[:250] for k, v in inputs.items()})
            mlflow.log_metric("prediction_probability", probability)
            mlflow.log_param("prediction_result", prediction)
    except Exception as e:
        print(f"⚠️  MLflow logging failed: {e}")


def get_experiment_history():
    """Get experiment run history."""
    client = MlflowClient(MLFLOW_TRACKING_URI)
    try:
        experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
        if experiment:
            runs = client.search_runs(
                experiment_ids=[experiment.experiment_id],
                order_by=["start_time DESC"],
                max_results=50,
            )
            return [
                {
                    "run_id": run.info.run_id,
                    "run_name": run.data.tags.get("mlflow.runName", ""),
                    "status": run.info.status,
                    "start_time": run.info.start_time,
                    "end_time": run.info.end_time,
                    "metrics": dict(run.data.metrics),
                    "params": dict(run.data.params),
                }
                for run in runs
            ]
    except Exception as e:
        print(f"⚠️  Failed to get experiment history: {e}")
    return []
