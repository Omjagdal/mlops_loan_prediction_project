"""
Model registry management with MLflow.
Registers models and manages production stage transitions.
"""

import os
import warnings
import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient

warnings.filterwarnings("ignore")

MLFLOW_TRACKING_URI = os.environ.get("MLFLOW_TRACKING_URI", "sqlite:///mlflow.db")
EXPERIMENT_NAME = "loan_prediction"
MODEL_NAME = "loan_prediction_model"


def setup_client() -> MlflowClient:
    """Setup MLflow client."""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    return MlflowClient(MLFLOW_TRACKING_URI)


def get_best_run(client: MlflowClient) -> dict:
    """Find the best run from the experiment."""
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
    if experiment is None:
        raise ValueError(f"Experiment '{EXPERIMENT_NAME}' not found. Run train.py first.")

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["metrics.f1_score DESC"],
        max_results=1,
    )

    if not runs:
        raise ValueError("No runs found in the experiment.")

    best_run = runs[0]
    print(f"🏆 Best run: {best_run.info.run_id}")
    print(f"   Model: {best_run.data.params.get('model_type', 'Unknown')}")
    print(f"   F1 Score: {best_run.data.metrics.get('f1_score', 0):.4f}")
    print(f"   ROC AUC: {best_run.data.metrics.get('roc_auc', 0):.4f}")

    return best_run


def register_model(client: MlflowClient, run) -> str:
    """Register the best model in MLflow Model Registry."""
    model_type = run.data.params.get("model_type", "model")
    model_uri = f"runs:/{run.info.run_id}/{model_type}_model"

    # Register model
    try:
        result = mlflow.register_model(model_uri, MODEL_NAME)
        version = result.version
        print(f"\n📝 Registered model: {MODEL_NAME} v{version}")
    except Exception as e:
        print(f"⚠️  Registration note: {e}")
        # Get latest version
        versions = client.search_model_versions(f"name='{MODEL_NAME}'")
        version = max([int(v.version) for v in versions]) if versions else 1

    return str(version)


def promote_to_production(client: MlflowClient, version: str):
    """Transition model version to Production stage."""
    try:
        # Archive existing production models
        prod_versions = client.get_latest_versions(MODEL_NAME, stages=["Production"])
        for pv in prod_versions:
            client.transition_model_version_stage(
                name=MODEL_NAME,
                version=pv.version,
                stage="Archived",
            )
            print(f"📦 Archived v{pv.version}")

        # Promote new version to Production
        client.transition_model_version_stage(
            name=MODEL_NAME,
            version=version,
            stage="Production",
        )
        print(f"🚀 Promoted v{version} to Production")

    except Exception as e:
        print(f"⚠️  Stage transition note: {e}")
        print(f"   Model v{version} is registered and available")


def run_registration_pipeline():
    """Run the complete model registration pipeline."""
    print("=" * 60)
    print("🚀 LOAN PREDICTION - MODEL REGISTRATION PIPELINE")
    print("=" * 60)

    client = setup_client()
    best_run = get_best_run(client)
    version = register_model(client, best_run)
    promote_to_production(client, version)

    print(f"\n✅ MODEL REGISTRATION COMPLETE")
    print(f"   Model: {MODEL_NAME}")
    print(f"   Version: {version}")
    print(f"   Stage: Production")


if __name__ == "__main__":
    run_registration_pipeline()
