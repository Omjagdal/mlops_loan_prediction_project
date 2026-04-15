"""
Model training pipeline with MLflow experiment tracking.
Trains Random Forest, Gradient Boosting, and Logistic Regression.
Selects and saves the best model.
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
import joblib
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
)

warnings.filterwarnings("ignore")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "backend", "models")
EXPERIMENTS_DIR = os.path.join(BASE_DIR, "experiments")

# MLflow setup
MLFLOW_TRACKING_URI = os.environ.get("MLFLOW_TRACKING_URI", "sqlite:///mlflow.db")
EXPERIMENT_NAME = "loan_prediction"


def setup_mlflow():
    """Initialize MLflow tracking."""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)
    print(f"📡 MLflow tracking URI: {MLFLOW_TRACKING_URI}")
    print(f"🧪 Experiment: {EXPERIMENT_NAME}")


def load_processed_data() -> dict:
    """Load preprocessed train/test data."""
    data = {
        "X_train": pd.read_csv(os.path.join(PROCESSED_DIR, "X_train.csv")),
        "X_test": pd.read_csv(os.path.join(PROCESSED_DIR, "X_test.csv")),
        "y_train": pd.read_csv(os.path.join(PROCESSED_DIR, "y_train.csv")).squeeze(),
        "y_test": pd.read_csv(os.path.join(PROCESSED_DIR, "y_test.csv")).squeeze(),
        "feature_names": joblib.load(os.path.join(PROCESSED_DIR, "feature_names.pkl")),
    }
    print(f"✅ Loaded processed data: {data['X_train'].shape[0]} train, {data['X_test'].shape[0]} test")
    return data


def get_models() -> dict:
    """Define models and their hyperparameter grids."""
    return {
        "RandomForest": {
            "model": RandomForestClassifier(random_state=42, n_jobs=-1),
            "params": {
                "n_estimators": [100, 200, 300],
                "max_depth": [5, 10, 15, None],
                "min_samples_split": [2, 5, 10],
                "min_samples_leaf": [1, 2, 4],
            },
        },
        "GradientBoosting": {
            "model": GradientBoostingClassifier(random_state=42),
            "params": {
                "n_estimators": [100, 200],
                "max_depth": [3, 5, 7],
                "learning_rate": [0.01, 0.1, 0.2],
                "subsample": [0.8, 1.0],
            },
        },
        "LogisticRegression": {
            "model": LogisticRegression(random_state=42, max_iter=1000),
            "params": {
                "C": [0.01, 0.1, 1, 10],
                "penalty": ["l2"],
                "solver": ["lbfgs"],
            },
        },
    }


def train_model(name: str, model_config: dict, data: dict) -> dict:
    """Train a single model with hyperparameter tuning and MLflow logging."""
    print(f"\n{'='*60}")
    print(f"🏋️ Training: {name}")
    print(f"{'='*60}")

    with mlflow.start_run(run_name=name) as run:
        # Hyperparameter tuning with GridSearchCV
        grid_search = GridSearchCV(
            model_config["model"],
            model_config["params"],
            cv=5,
            scoring="f1",
            n_jobs=-1,
            verbose=0,
        )
        grid_search.fit(data["X_train"], data["y_train"])

        best_model = grid_search.best_estimator_
        best_params = grid_search.best_params_

        # Predictions
        y_pred = best_model.predict(data["X_test"])
        y_pred_proba = best_model.predict_proba(data["X_test"])[:, 1]

        # Cross-validation score
        cv_scores = cross_val_score(best_model, data["X_train"], data["y_train"], cv=5, scoring="f1")

        # Calculate metrics
        metrics = {
            "accuracy": accuracy_score(data["y_test"], y_pred),
            "precision": precision_score(data["y_test"], y_pred),
            "recall": recall_score(data["y_test"], y_pred),
            "f1_score": f1_score(data["y_test"], y_pred),
            "roc_auc": roc_auc_score(data["y_test"], y_pred_proba),
            "cv_f1_mean": cv_scores.mean(),
            "cv_f1_std": cv_scores.std(),
        }

        # Log to MLflow
        mlflow.log_params(best_params)
        mlflow.log_params({"model_type": name})
        mlflow.log_metrics(metrics)

        # Feature importance
        feature_importance = {}
        if hasattr(best_model, "feature_importances_"):
            importances = best_model.feature_importances_
            feature_importance = dict(zip(data["feature_names"], importances.tolist()))
            # Log top 10 feature importances
            sorted_imp = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            for feat, imp in sorted_imp[:10]:
                mlflow.log_metric(f"importance_{feat}", imp)
        elif hasattr(best_model, "coef_"):
            coefs = np.abs(best_model.coef_[0])
            feature_importance = dict(zip(data["feature_names"], coefs.tolist()))

        # Log model
        mlflow.sklearn.log_model(best_model, f"{name}_model")

        # Print results
        print(f"  Best Params: {best_params}")
        print(f"  Accuracy:  {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall:    {metrics['recall']:.4f}")
        print(f"  F1 Score:  {metrics['f1_score']:.4f}")
        print(f"  ROC AUC:   {metrics['roc_auc']:.4f}")
        print(f"  CV F1:     {metrics['cv_f1_mean']:.4f} ± {metrics['cv_f1_std']:.4f}")

        return {
            "name": name,
            "model": best_model,
            "params": best_params,
            "metrics": metrics,
            "feature_importance": feature_importance,
            "run_id": run.info.run_id,
        }


def save_best_model(result: dict, data: dict):
    """Save the best model and metadata."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(EXPERIMENTS_DIR, exist_ok=True)

    # Save model
    model_path = os.path.join(MODELS_DIR, "model.pkl")
    joblib.dump(result["model"], model_path)
    print(f"\n💾 Best model saved to: {model_path}")

    # Save model metadata
    metadata = {
        "model_name": result["name"],
        "model_params": result["params"],
        "metrics": result["metrics"],
        "feature_importance": result["feature_importance"],
        "feature_names": data["feature_names"],
        "mlflow_run_id": result["run_id"],
        "training_samples": data["X_train"].shape[0],
        "test_samples": data["X_test"].shape[0],
        "n_features": len(data["feature_names"]),
    }

    metadata_path = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"📋 Model metadata saved to: {metadata_path}")

    # Save experiment results
    results_path = os.path.join(EXPERIMENTS_DIR, "training_results.json")
    with open(results_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"🧪 Experiment results saved to: {results_path}")


def run_training_pipeline():
    """Run the complete training pipeline."""
    print("=" * 60)
    print("🚀 LOAN PREDICTION - MODEL TRAINING PIPELINE")
    print("=" * 60)

    # Setup MLflow
    setup_mlflow()

    # Load data
    data = load_processed_data()

    # Train all models
    models = get_models()
    results = []

    for name, config in models.items():
        result = train_model(name, config, data)
        results.append(result)

    # Select best model by F1 score
    best_result = max(results, key=lambda x: x["metrics"]["f1_score"])

    print(f"\n{'='*60}")
    print(f"🏆 BEST MODEL: {best_result['name']}")
    print(f"   F1 Score: {best_result['metrics']['f1_score']:.4f}")
    print(f"   ROC AUC:  {best_result['metrics']['roc_auc']:.4f}")
    print(f"{'='*60}")

    # Save best model
    save_best_model(best_result, data)

    # Summary table
    print(f"\n📊 MODEL COMPARISON:")
    print(f"{'Model':<20} {'Accuracy':<10} {'Precision':<10} {'Recall':<10} {'F1':<10} {'AUC':<10}")
    print("-" * 70)
    for r in results:
        m = r["metrics"]
        marker = " ⭐" if r["name"] == best_result["name"] else ""
        print(
            f"{r['name']:<20} {m['accuracy']:<10.4f} {m['precision']:<10.4f} "
            f"{m['recall']:<10.4f} {m['f1_score']:<10.4f} {m['roc_auc']:<10.4f}{marker}"
        )

    print(f"\n✅ TRAINING PIPELINE COMPLETE")
    return best_result


if __name__ == "__main__":
    run_training_pipeline()
