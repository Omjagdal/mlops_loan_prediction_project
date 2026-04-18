"""
Model training pipeline with MLflow experiment tracking.
Trains Random Forest, Gradient Boosting, and Logistic Regression.
Selects and saves the best model.

V2: Added class_weight='balanced', overfitting detection,
    reduced hyperparameter space to prevent overfitting.
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

# Overfitting thresholds
MAX_TRAIN_TEST_GAP = 0.05  # Max allowed gap between train and test accuracy
MIN_CLASS_RECALL = 0.65    # Minimum recall for any class


def setup_mlflow():
    """Initialize MLflow tracking."""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)
    print(f"MLflow tracking URI: {MLFLOW_TRACKING_URI}")
    print(f"Experiment: {EXPERIMENT_NAME}")


def load_processed_data() -> dict:
    """Load preprocessed train/test data."""
    data = {
        "X_train": pd.read_csv(os.path.join(PROCESSED_DIR, "X_train.csv")),
        "X_test": pd.read_csv(os.path.join(PROCESSED_DIR, "X_test.csv")),
        "y_train": pd.read_csv(os.path.join(PROCESSED_DIR, "y_train.csv")).squeeze(),
        "y_test": pd.read_csv(os.path.join(PROCESSED_DIR, "y_test.csv")).squeeze(),
        "feature_names": joblib.load(os.path.join(PROCESSED_DIR, "feature_names.pkl")),
    }
    print(f"Loaded processed data: {data['X_train'].shape[0]} train, {data['X_test'].shape[0]} test")

    # Print class distribution
    train_pos = data["y_train"].mean()
    test_pos = data["y_test"].mean()
    print(f"Class distribution — Train: {train_pos:.1%} positive | Test: {test_pos:.1%} positive")

    return data


def get_models() -> dict:
    """Define models and their hyperparameter grids.
    V2: Added class_weight='balanced' and constrained hyperparameters.
    """
    return {
        "RandomForest": {
            "model": RandomForestClassifier(
                random_state=42, n_jobs=-1, class_weight="balanced"
            ),
            "params": {
                "n_estimators": [100, 200],
                "max_depth": [5, 8, 12],
                "min_samples_split": [5, 10],
                "min_samples_leaf": [2, 4],
            },
        },
        "GradientBoosting": {
            "model": GradientBoostingClassifier(random_state=42),
            "params": {
                "n_estimators": [100, 200],
                "max_depth": [3, 5],
                "learning_rate": [0.01, 0.1],
                "subsample": [0.8],
                "min_samples_leaf": [4, 8],
            },
        },
        "LogisticRegression": {
            "model": LogisticRegression(
                random_state=42, max_iter=1000, class_weight="balanced"
            ),
            "params": {
                "C": [0.01, 0.1, 1, 10],
                "penalty": ["l2"],
                "solver": ["lbfgs"],
            },
        },
    }


def check_overfitting(model, data, metrics, name) -> dict:
    """Detect overfitting by comparing train vs test performance."""
    # Train accuracy
    y_train_pred = model.predict(data["X_train"])
    train_accuracy = accuracy_score(data["y_train"], y_train_pred)
    train_f1 = f1_score(data["y_train"], y_train_pred)

    test_accuracy = metrics["accuracy"]
    test_f1 = metrics["f1_score"]

    acc_gap = train_accuracy - test_accuracy
    f1_gap = train_f1 - test_f1

    # Per-class recall
    y_pred = model.predict(data["X_test"])
    class_0_mask = data["y_test"] == 0
    class_1_mask = data["y_test"] == 1
    recall_0 = recall_score(data["y_test"][class_0_mask], y_pred[class_0_mask], pos_label=0, zero_division=0) if class_0_mask.sum() > 0 else 0
    recall_1 = recall_score(data["y_test"][class_1_mask], y_pred[class_1_mask], pos_label=1, zero_division=0) if class_1_mask.sum() > 0 else 0

    # Actually compute per-class recall properly
    from sklearn.metrics import recall_score as rs
    recall_0 = rs(data["y_test"], y_pred, pos_label=0)
    recall_1 = rs(data["y_test"], y_pred, pos_label=1)

    overfitting_report = {
        "train_accuracy": round(train_accuracy, 4),
        "test_accuracy": round(test_accuracy, 4),
        "accuracy_gap": round(acc_gap, 4),
        "train_f1": round(train_f1, 4),
        "test_f1": round(test_f1, 4),
        "f1_gap": round(f1_gap, 4),
        "class_0_recall": round(recall_0, 4),
        "class_1_recall": round(recall_1, 4),
        "is_overfitting": acc_gap > MAX_TRAIN_TEST_GAP,
        "has_class_bias": min(recall_0, recall_1) < MIN_CLASS_RECALL,
    }

    # Print report
    status = "PASS" if not overfitting_report["is_overfitting"] else "FAIL"
    bias_status = "PASS" if not overfitting_report["has_class_bias"] else "FAIL"

    print(f"\n  OVERFITTING CHECK [{status}]:")
    print(f"    Train Acc: {train_accuracy:.4f} | Test Acc: {test_accuracy:.4f} | Gap: {acc_gap:.4f} (max: {MAX_TRAIN_TEST_GAP})")
    print(f"    Train F1:  {train_f1:.4f} | Test F1:  {test_f1:.4f} | Gap: {f1_gap:.4f}")
    print(f"  CLASS BALANCE CHECK [{bias_status}]:")
    print(f"    Class 0 (Rejected) Recall: {recall_0:.4f} (min: {MIN_CLASS_RECALL})")
    print(f"    Class 1 (Approved) Recall: {recall_1:.4f} (min: {MIN_CLASS_RECALL})")

    if overfitting_report["is_overfitting"]:
        print(f"    WARNING: Model may be overfitting (gap > {MAX_TRAIN_TEST_GAP})")
    if overfitting_report["has_class_bias"]:
        print(f"    WARNING: Model shows class bias (min recall < {MIN_CLASS_RECALL})")

    return overfitting_report


def train_model(name: str, model_config: dict, data: dict) -> dict:
    """Train a single model with hyperparameter tuning and MLflow logging."""
    print(f"\n{'='*60}")
    print(f"Training: {name}")
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

        # Overfitting check
        overfit_report = check_overfitting(best_model, data, metrics, name)

        # Log to MLflow
        mlflow.log_params(best_params)
        mlflow.log_params({"model_type": name})
        mlflow.log_metrics(metrics)
        mlflow.log_metrics({
            "train_test_accuracy_gap": overfit_report["accuracy_gap"],
            "class_0_recall": overfit_report["class_0_recall"],
            "class_1_recall": overfit_report["class_1_recall"],
        })

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
        print(f"  CV F1:     {metrics['cv_f1_mean']:.4f} +/- {metrics['cv_f1_std']:.4f}")

        # Check top feature dominance
        if feature_importance:
            sorted_imp = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            top_feat, top_imp = sorted_imp[0]
            if top_imp > 0.30:
                print(f"  WARNING: '{top_feat}' dominates with {top_imp:.1%} importance — model may be a single-feature classifier")

        return {
            "name": name,
            "model": best_model,
            "params": best_params,
            "metrics": metrics,
            "feature_importance": feature_importance,
            "run_id": run.info.run_id,
            "overfitting_report": overfit_report,
        }


def save_best_model(result: dict, data: dict):
    """Save the best model and metadata."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(EXPERIMENTS_DIR, exist_ok=True)

    # Save model
    model_path = os.path.join(MODELS_DIR, "model.pkl")
    joblib.dump(result["model"], model_path)
    print(f"\nBest model saved to: {model_path}")

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
        "overfitting_report": result["overfitting_report"],
    }

    metadata_path = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"Model metadata saved to: {metadata_path}")

    # Save experiment results
    results_path = os.path.join(EXPERIMENTS_DIR, "training_results.json")
    with open(results_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"Experiment results saved to: {results_path}")


def run_training_pipeline():
    """Run the complete training pipeline."""
    print("=" * 60)
    print("LOAN PREDICTION - MODEL TRAINING PIPELINE V2")
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

    # Select best model by F1 score (but penalize overfitting)
    valid_results = [r for r in results if not r["overfitting_report"]["is_overfitting"]]

    if valid_results:
        best_result = max(valid_results, key=lambda x: x["metrics"]["f1_score"])
    else:
        print("\nWARNING: All models show overfitting. Selecting least overfit model.")
        best_result = min(results, key=lambda x: x["overfitting_report"]["accuracy_gap"])

    print(f"\n{'='*60}")
    print(f"BEST MODEL: {best_result['name']}")
    print(f"   F1 Score: {best_result['metrics']['f1_score']:.4f}")
    print(f"   ROC AUC:  {best_result['metrics']['roc_auc']:.4f}")
    print(f"   Overfitting: {'YES' if best_result['overfitting_report']['is_overfitting'] else 'NO'}")
    print(f"   Class Bias:  {'YES' if best_result['overfitting_report']['has_class_bias'] else 'NO'}")
    print(f"{'='*60}")

    # Save best model
    save_best_model(best_result, data)

    # Summary table
    print(f"\nMODEL COMPARISON:")
    print(f"{'Model':<20} {'Accuracy':<10} {'Precision':<10} {'Recall':<10} {'F1':<10} {'AUC':<10} {'Overfit?':<10}")
    print("-" * 80)
    for r in results:
        m = r["metrics"]
        of = "YES" if r["overfitting_report"]["is_overfitting"] else "NO"
        marker = " *" if r["name"] == best_result["name"] else ""
        print(
            f"{r['name']:<20} {m['accuracy']:<10.4f} {m['precision']:<10.4f} "
            f"{m['recall']:<10.4f} {m['f1_score']:<10.4f} {m['roc_auc']:<10.4f} {of:<10}{marker}"
        )

    # Feature importance dominance check
    if best_result["feature_importance"]:
        sorted_imp = sorted(best_result["feature_importance"].items(), key=lambda x: x[1], reverse=True)
        print(f"\nTOP 5 FEATURES:")
        for feat, imp in sorted_imp[:5]:
            bar = "=" * int(imp * 100)
            print(f"  {feat:<30} {imp:.4f} {bar}")
        top_imp = sorted_imp[0][1]
        if top_imp > 0.30:
            print(f"\n  ALERT: Top feature has {top_imp:.1%} importance — consider feature selection")

    print(f"\nTRAINING PIPELINE V2 COMPLETE")
    return best_result


if __name__ == "__main__":
    run_training_pipeline()
