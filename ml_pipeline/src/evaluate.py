"""
Model evaluation pipeline.
Loads trained model and generates comprehensive evaluation metrics.
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    roc_curve
)

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "backend", "models")
EXPERIMENTS_DIR = os.path.join(BASE_DIR, "experiments")


def load_model_and_data() -> tuple:
    """Load the trained model and test data."""
    model_path = os.path.join(MODELS_DIR, "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Run train.py first.")

    model = joblib.load(model_path)
    X_test = pd.read_csv(os.path.join(PROCESSED_DIR, "X_test.csv"))
    y_test = pd.read_csv(os.path.join(PROCESSED_DIR, "y_test.csv")).squeeze()
    feature_names = joblib.load(os.path.join(PROCESSED_DIR, "feature_names.pkl"))

    print(f"✅ Loaded model: {type(model).__name__}")
    print(f"✅ Test set: {X_test.shape[0]} samples")
    return model, X_test, y_test, feature_names


def evaluate_model(model, X_test, y_test, feature_names) -> dict:
    """Run comprehensive model evaluation."""
    print("\n" + "=" * 60)
    print("🔍 MODEL EVALUATION")
    print("=" * 60)

    # Predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    # Core metrics
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_pred_proba)),
    }

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    confusion = {
        "true_negatives": int(tn),
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_positives": int(tp),
        "matrix": cm.tolist(),
    }

    # Classification report
    report = classification_report(y_test, y_pred, output_dict=True)

    # ROC curve data
    fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
    roc_data = {
        "fpr": fpr[::max(1, len(fpr)//50)].tolist(),  # Downsample for JSON
        "tpr": tpr[::max(1, len(tpr)//50)].tolist(),
        "thresholds": thresholds[::max(1, len(thresholds)//50)].tolist(),
    }

    # Feature importance
    feature_importance = {}
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feature_importance = dict(zip(feature_names, importances.tolist()))
    elif hasattr(model, "coef_"):
        coefs = np.abs(model.coef_[0])
        feature_importance = dict(zip(feature_names, coefs.tolist()))

    # Prediction distribution
    pred_dist = {
        "approved": int(np.sum(y_pred == 1)),
        "rejected": int(np.sum(y_pred == 0)),
        "approval_rate": float(np.mean(y_pred)),
    }

    # Probability distribution stats
    prob_stats = {
        "mean": float(np.mean(y_pred_proba)),
        "std": float(np.std(y_pred_proba)),
        "median": float(np.median(y_pred_proba)),
        "min": float(np.min(y_pred_proba)),
        "max": float(np.max(y_pred_proba)),
    }

    # Print results
    print(f"\n📊 METRICS:")
    print(f"  Accuracy:  {metrics['accuracy']:.4f}")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    print(f"  F1 Score:  {metrics['f1_score']:.4f}")
    print(f"  ROC AUC:   {metrics['roc_auc']:.4f}")

    print(f"\n📋 CONFUSION MATRIX:")
    print(f"  TN: {tn}  FP: {fp}")
    print(f"  FN: {fn}  TP: {tp}")

    print(f"\n📊 PREDICTION DISTRIBUTION:")
    print(f"  Approved: {pred_dist['approved']} ({pred_dist['approval_rate']:.1%})")
    print(f"  Rejected: {pred_dist['rejected']} ({1-pred_dist['approval_rate']:.1%})")

    if feature_importance:
        print(f"\n🔑 TOP 10 FEATURES:")
        sorted_imp = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        for feat, imp in sorted_imp[:10]:
            bar = "█" * int(imp * 50)
            print(f"  {feat:<25} {imp:.4f} {bar}")

    return {
        "metrics": metrics,
        "confusion_matrix": confusion,
        "classification_report": report,
        "roc_curve": roc_data,
        "feature_importance": feature_importance,
        "prediction_distribution": pred_dist,
        "probability_stats": prob_stats,
    }


def save_evaluation(results: dict):
    """Save evaluation results."""
    os.makedirs(EXPERIMENTS_DIR, exist_ok=True)

    eval_path = os.path.join(EXPERIMENTS_DIR, "evaluation_results.json")
    with open(eval_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n💾 Evaluation saved to: {eval_path}")


def run_evaluation_pipeline():
    """Run the complete evaluation pipeline."""
    print("=" * 60)
    print("🚀 LOAN PREDICTION - MODEL EVALUATION PIPELINE")
    print("=" * 60)

    model, X_test, y_test, feature_names = load_model_and_data()
    results = evaluate_model(model, X_test, y_test, feature_names)
    save_evaluation(results)

    print("\n✅ EVALUATION COMPLETE")
    return results


if __name__ == "__main__":
    run_evaluation_pipeline()
