"""
Model evaluation pipeline.
Loads trained model and generates comprehensive evaluation metrics.

V2: Added overfitting detection, per-class analysis,
    deployment readiness checks.
"""

import os
import json
import sys
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

# Deployment readiness thresholds
MIN_ACCURACY = 0.75
MIN_ROC_AUC = 0.78
MIN_CLASS_RECALL = 0.65
MAX_TRAIN_TEST_GAP = 0.05
MAX_FEATURE_DOMINANCE = 0.35  # No single feature should have >35% importance


def load_model_and_data() -> tuple:
    """Load the trained model and test data."""
    model_path = os.path.join(MODELS_DIR, "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Run train.py first.")

    model = joblib.load(model_path)
    X_train = pd.read_csv(os.path.join(PROCESSED_DIR, "X_train.csv"))
    X_test = pd.read_csv(os.path.join(PROCESSED_DIR, "X_test.csv"))
    y_train = pd.read_csv(os.path.join(PROCESSED_DIR, "y_train.csv")).squeeze()
    y_test = pd.read_csv(os.path.join(PROCESSED_DIR, "y_test.csv")).squeeze()
    feature_names = joblib.load(os.path.join(PROCESSED_DIR, "feature_names.pkl"))

    print(f"Loaded model: {type(model).__name__}")
    print(f"Train set: {X_train.shape[0]} samples | Test set: {X_test.shape[0]} samples")
    return model, X_train, X_test, y_train, y_test, feature_names


def evaluate_model(model, X_train, X_test, y_train, y_test, feature_names) -> dict:
    """Run comprehensive model evaluation with overfitting detection."""
    print("\n" + "=" * 60)
    print("MODEL EVALUATION V2")
    print("=" * 60)

    # Predictions (both train and test for overfitting check)
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_train_pred = model.predict(X_train)

    # Core metrics
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_pred_proba)),
    }

    # Train metrics for overfitting detection
    train_metrics = {
        "train_accuracy": float(accuracy_score(y_train, y_train_pred)),
        "train_f1": float(f1_score(y_train, y_train_pred)),
    }

    # Overfitting analysis
    acc_gap = train_metrics["train_accuracy"] - metrics["accuracy"]
    f1_gap = train_metrics["train_f1"] - metrics["f1_score"]
    overfitting = {
        "train_accuracy": train_metrics["train_accuracy"],
        "test_accuracy": metrics["accuracy"],
        "accuracy_gap": round(acc_gap, 4),
        "f1_gap": round(f1_gap, 4),
        "is_overfitting": acc_gap > MAX_TRAIN_TEST_GAP,
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

    # Per-class recall
    recall_class_0 = float(recall_score(y_test, y_pred, pos_label=0))
    recall_class_1 = float(recall_score(y_test, y_pred, pos_label=1))

    # Classification report
    report = classification_report(y_test, y_pred, output_dict=True)

    # ROC curve data
    fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
    roc_data = {
        "fpr": fpr[::max(1, len(fpr)//50)].tolist(),
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

    # Feature dominance check
    max_importance = max(feature_importance.values()) if feature_importance else 0
    top_feature = max(feature_importance, key=feature_importance.get) if feature_importance else "N/A"

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

    # ============================================
    # PRINT RESULTS
    # ============================================
    print(f"\nMETRICS:")
    print(f"  Accuracy:  {metrics['accuracy']:.4f}")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    print(f"  F1 Score:  {metrics['f1_score']:.4f}")
    print(f"  ROC AUC:   {metrics['roc_auc']:.4f}")

    print(f"\nOVERFITTING ANALYSIS:")
    print(f"  Train Accuracy: {overfitting['train_accuracy']:.4f}")
    print(f"  Test Accuracy:  {overfitting['test_accuracy']:.4f}")
    print(f"  Gap:            {overfitting['accuracy_gap']:.4f} (max allowed: {MAX_TRAIN_TEST_GAP})")
    print(f"  Status:         {'OVERFITTING DETECTED' if overfitting['is_overfitting'] else 'HEALTHY'}")

    print(f"\nPER-CLASS RECALL:")
    print(f"  Class 0 (Rejected): {recall_class_0:.4f} (min: {MIN_CLASS_RECALL})")
    print(f"  Class 1 (Approved): {recall_class_1:.4f} (min: {MIN_CLASS_RECALL})")
    class_bias = min(recall_class_0, recall_class_1) < MIN_CLASS_RECALL
    print(f"  Status:             {'CLASS BIAS DETECTED' if class_bias else 'BALANCED'}")

    print(f"\nCONFUSION MATRIX:")
    print(f"  TN: {tn}  FP: {fp}")
    print(f"  FN: {fn}  TP: {tp}")

    print(f"\nPREDICTION DISTRIBUTION:")
    print(f"  Approved: {pred_dist['approved']} ({pred_dist['approval_rate']:.1%})")
    print(f"  Rejected: {pred_dist['rejected']} ({1-pred_dist['approval_rate']:.1%})")

    if feature_importance:
        print(f"\nTOP 10 FEATURES:")
        sorted_imp = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        for feat, imp in sorted_imp[:10]:
            bar = "=" * int(imp * 80)
            print(f"  {feat:<30} {imp:.4f} {bar}")
        print(f"\n  Top feature: '{top_feature}' ({max_importance:.1%})")
        if max_importance > MAX_FEATURE_DOMINANCE:
            print(f"  WARNING: Feature dominance exceeds {MAX_FEATURE_DOMINANCE:.0%} threshold")

    # ============================================
    # DEPLOYMENT READINESS CHECK
    # ============================================
    print(f"\n{'='*60}")
    print("DEPLOYMENT READINESS CHECK")
    print(f"{'='*60}")

    checks = {
        "accuracy": (metrics["accuracy"] >= MIN_ACCURACY, f"Accuracy {metrics['accuracy']:.4f} >= {MIN_ACCURACY}"),
        "roc_auc": (metrics["roc_auc"] >= MIN_ROC_AUC, f"ROC AUC {metrics['roc_auc']:.4f} >= {MIN_ROC_AUC}"),
        "no_overfitting": (not overfitting["is_overfitting"], f"Train-Test gap {overfitting['accuracy_gap']:.4f} <= {MAX_TRAIN_TEST_GAP}"),
        "class_balance": (not class_bias, f"Min class recall {min(recall_class_0, recall_class_1):.4f} >= {MIN_CLASS_RECALL}"),
        "no_feature_dominance": (max_importance <= MAX_FEATURE_DOMINANCE, f"Max importance {max_importance:.4f} <= {MAX_FEATURE_DOMINANCE}"),
    }

    all_pass = True
    for check_name, (passed, description) in checks.items():
        status = "PASS" if passed else "FAIL"
        symbol = "[PASS]" if passed else "[FAIL]"
        print(f"  {symbol} {check_name}: {description}")
        if not passed:
            all_pass = False

    deployment_ready = all_pass
    print(f"\n  {'DEPLOYMENT READY' if deployment_ready else 'NOT READY FOR DEPLOYMENT'}")

    return {
        "metrics": metrics,
        "train_metrics": train_metrics,
        "overfitting": overfitting,
        "per_class_recall": {
            "class_0_rejected": recall_class_0,
            "class_1_approved": recall_class_1,
        },
        "confusion_matrix": confusion,
        "classification_report": report,
        "roc_curve": roc_data,
        "feature_importance": feature_importance,
        "prediction_distribution": pred_dist,
        "probability_stats": prob_stats,
        "deployment_readiness": {
            "ready": deployment_ready,
            "checks": {k: v[0] for k, v in checks.items()},
        },
    }


def save_evaluation(results: dict):
    """Save evaluation results."""
    os.makedirs(EXPERIMENTS_DIR, exist_ok=True)

    eval_path = os.path.join(EXPERIMENTS_DIR, "evaluation_results.json")
    with open(eval_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nEvaluation saved to: {eval_path}")


def run_evaluation_pipeline():
    """Run the complete evaluation pipeline."""
    print("=" * 60)
    print("LOAN PREDICTION - MODEL EVALUATION PIPELINE V2")
    print("=" * 60)

    model, X_train, X_test, y_train, y_test, feature_names = load_model_and_data()
    results = evaluate_model(model, X_train, X_test, y_train, y_test, feature_names)
    save_evaluation(results)

    print("\nEVALUATION COMPLETE")

    # Exit with error if not deployment ready (for CI/CD gates)
    if not results["deployment_readiness"]["ready"]:
        print("WARNING: Model did not pass all deployment readiness checks.")
        # Don't exit with error in local dev — only fail in CI
        if os.environ.get("CI") == "true":
            sys.exit(1)

    return results


if __name__ == "__main__":
    run_evaluation_pipeline()
