"""
Model service for loan prediction.
Handles model loading, prediction, and explainability.
Adapted for loan_dataset_20000.csv schema.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from typing import Dict, List

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Docker mounts processed data to /data/processed; local dev resolves relative path
_DOCKER_PROCESSED = "/data/processed"
_LOCAL_PROCESSED = os.path.join(os.path.dirname(BASE_DIR), "ml_pipeline", "data", "processed")
PROCESSED_DIR = _DOCKER_PROCESSED if os.path.isdir(_DOCKER_PROCESSED) else _LOCAL_PROCESSED


class ModelService:
    """Service for loan prediction model operations."""

    def __init__(self):
        self.model = None
        self.scaler = None
        self.label_encoders = None
        self.target_encoder = None
        self.feature_names = None
        self.model_metadata = None
        self._loaded = False

    def load_model(self):
        """Load the trained model and preprocessing artifacts."""
        try:
            model_path = os.path.join(MODELS_DIR, "model.pkl")
            self.model = joblib.load(model_path)

            self.scaler = joblib.load(os.path.join(PROCESSED_DIR, "scaler.pkl"))
            self.label_encoders = joblib.load(os.path.join(PROCESSED_DIR, "label_encoders.pkl"))
            self.target_encoder = joblib.load(os.path.join(PROCESSED_DIR, "target_encoder.pkl"))
            self.feature_names = joblib.load(os.path.join(PROCESSED_DIR, "feature_names.pkl"))

            metadata_path = os.path.join(MODELS_DIR, "model_metadata.json")
            if os.path.exists(metadata_path):
                with open(metadata_path, "r") as f:
                    self.model_metadata = json.load(f)

            self._loaded = True
            print(f"✅ Model loaded: {type(self.model).__name__}")
            return True

        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            self._loaded = False
            return False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def preprocess_input(self, application: dict) -> pd.DataFrame:
        """Preprocess a loan application for prediction."""
        # Build raw feature DataFrame matching dataset columns
        data = {
            "age": application["age"],
            "gender": application["gender"],
            "marital_status": application["marital_status"],
            "education_level": application["education_level"],
            "annual_income": application["annual_income"],
            "monthly_income": application["monthly_income"],
            "employment_status": application["employment_status"],
            "debt_to_income_ratio": application["debt_to_income_ratio"],
            "credit_score": application["credit_score"],
            "loan_amount": application["loan_amount"],
            "loan_purpose": application["loan_purpose"],
            "interest_rate": application["interest_rate"],
            "loan_term": application["loan_term"],
            "installment": application["installment"],
            "grade_subgrade": application["grade_subgrade"],
            "num_of_open_accounts": application["num_of_open_accounts"],
            "total_credit_limit": application["total_credit_limit"],
            "current_balance": application["current_balance"],
            "delinquency_history": application["delinquency_history"],
            "public_records": application["public_records"],
            "num_of_delinquencies": application["num_of_delinquencies"],
        }
        df = pd.DataFrame([data])

        # ---- Feature engineering (must match training pipeline) ----
        df["loan_to_income_ratio"] = df["loan_amount"] / (df["annual_income"] + 1)
        df["payment_to_income_ratio"] = df["installment"] / (df["monthly_income"] + 1)
        df["remaining_income"] = df["monthly_income"] - df["installment"]
        df["credit_utilization"] = df["current_balance"] / (df["total_credit_limit"] + 1)
        df["available_credit"] = df["total_credit_limit"] - df["current_balance"]
        df["delinquency_rate"] = df["num_of_delinquencies"] / (df["num_of_open_accounts"] + 1)
        df["risk_composite"] = (
            df["debt_to_income_ratio"] * 0.3
            + (1 - df["credit_score"] / 850) * 0.3
            + df["delinquency_rate"] * 0.2
            + df["public_records"] * 0.2
        )

        for col in ["annual_income", "monthly_income", "loan_amount", "total_credit_limit", "current_balance"]:
            df[f"log_{col}"] = np.log1p(df[col])

        # Age group
        bins = [0, 25, 35, 50, 65, 100]
        labels_ag = ["Young", "Early_Career", "Mid_Career", "Senior", "Retired"]
        df["age_group"] = pd.cut(df["age"], bins=bins, labels=labels_ag)

        # Credit tier
        bins_ct = [0, 580, 670, 740, 800, 850]
        labels_ct = ["Poor", "Fair", "Good", "Very_Good", "Excellent"]
        df["credit_tier"] = pd.cut(df["credit_score"], bins=bins_ct, labels=labels_ct)

        # ---- V2 Feature Engineering (must match data_preprocessing.py) ----

        # 1. Income stability index
        expected_monthly = df["annual_income"] / 12
        df["income_stability_index"] = df["monthly_income"] / (expected_monthly + 1)

        # 2. Credit health score
        df["credit_health_score"] = (
            (df["credit_score"] / 850) * 0.4
            + (1 - df["credit_utilization"].clip(0, 1)) * 0.25
            + (1 / (1 + df["num_of_delinquencies"])) * 0.2
            + (1 / (1 + df["public_records"])) * 0.15
        )

        # 3. Loan affordability score
        df["loan_affordability_score"] = (df["monthly_income"] - df["installment"]) / (df["monthly_income"] + 1)

        # 4. Financial stress index
        max_delinq = max(df["num_of_delinquencies"].max(), 1)
        df["financial_stress_index"] = (
            df["debt_to_income_ratio"] * 0.35
            + df["credit_utilization"].clip(0, 1) * 0.35
            + (df["num_of_delinquencies"] / (max_delinq + 1)) * 0.3
        )

        # 5. Credit age proxy
        df["credit_age_proxy"] = df["age"] * df["num_of_open_accounts"]

        # 6. Debt coverage ratio
        df["debt_coverage_ratio"] = df["annual_income"] / (df["current_balance"] + 1)

        # 7. Payment shock indicator
        df["payment_shock"] = (df["installment"] / (df["monthly_income"] + 1)).apply(
            lambda x: 1 if x > 0.35 else 0
        )

        # 8. Risk-adjusted rate
        df["risk_adjusted_rate"] = df["interest_rate"] / (df["credit_score"] / 100 + 1)

        # 9. Income adequacy ratio
        monthly_debt = df["current_balance"] * (df["interest_rate"] / 100 / 12)
        df["income_adequacy_ratio"] = df["monthly_income"] / (df["installment"] + monthly_debt + 1)

        # 10. Credit headroom
        df["credit_headroom"] = df["available_credit"] / (df["total_credit_limit"] + 1)

        # 11. Behavioral risk score
        max_delinq_br = max(df["num_of_delinquencies"].max(), 1)
        max_records = max(df["public_records"].max(), 1)
        df["behavioral_risk_score"] = (
            df["delinquency_history"] * 0.3
            + (df["num_of_delinquencies"] / (max_delinq_br + 1)) * 0.4
            + (df["public_records"] / (max_records + 1)) * 0.3
        )

        # 12. Financial profile cluster — quintile-based
        # For single-row prediction, use reasonable quintile estimates
        income_val = df["annual_income"].iloc[0]
        loan_val = df["loan_amount"].iloc[0]
        # Map to 1-5 quintile based on typical ranges
        df["income_quintile"] = int(np.clip(np.searchsorted([25000, 40000, 60000, 90000], income_val) + 1, 1, 5))
        df["loan_amount_quintile"] = int(np.clip(np.searchsorted([5000, 12000, 25000, 60000], loan_val) + 1, 1, 5))
        df["profile_interaction"] = df["income_quintile"] * df["loan_amount_quintile"]

        # Polynomial features
        df["credit_score_sq"] = df["credit_score"] ** 2
        df["dti_sq"] = df["debt_to_income_ratio"] ** 2
        df["credit_util_sq"] = df["credit_utilization"] ** 2

        # Interaction features
        df["score_x_dti"] = df["credit_score"] * df["debt_to_income_ratio"]
        df["income_x_term"] = df["annual_income"] * df["loan_term"]
        df["rate_x_amount"] = df["interest_rate"] * df["loan_amount"]

        # ---- Encode categoricals ----
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns
        for col in categorical_cols:
            if col in self.label_encoders:
                le = self.label_encoders[col]
                try:
                    df[col] = le.transform(df[col].astype(str))
                except ValueError:
                    df[col] = 0

        # Ensure correct feature order
        df = df[self.feature_names]

        # Scale
        df_scaled = pd.DataFrame(
            self.scaler.transform(df),
            columns=self.feature_names,
        )
        return df_scaled

    def predict(self, application: dict) -> dict:
        """Make a loan prediction with explainability."""
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        X = self.preprocess_input(application)

        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]

        approval_prob = float(probabilities[1])
        predicted_class = "Approved" if prediction == 1 else "Rejected"
        confidence = float(max(probabilities))

        if approval_prob >= 0.75:
            risk_level = "Low"
        elif approval_prob >= 0.50:
            risk_level = "Medium"
        else:
            risk_level = "High"

        contributions = self._get_feature_contributions(X)
        explanation = self._generate_explanation(
            predicted_class, approval_prob, risk_level, contributions
        )

        return {
            "prediction": predicted_class,
            "probability": round(approval_prob, 4),
            "confidence": round(confidence, 4),
            "risk_level": risk_level,
            "feature_contributions": contributions,
            "explanation": explanation,
        }

    def _get_feature_contributions(self, X: pd.DataFrame) -> list:
        """Calculate feature contributions to the prediction."""
        contributions = []

        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            feature_values = X.values[0]

            for feat, imp, val in zip(self.feature_names, importances, feature_values):
                if imp > 0.005:
                    contributions.append({
                        "feature": feat,
                        "value": round(float(val), 4),
                        "contribution": round(float(imp), 4),
                        "direction": "positive" if val > 0 else "negative",
                    })

            contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            contributions = contributions[:10]

        elif hasattr(self.model, "coef_"):
            coefs = self.model.coef_[0]
            feature_values = X.values[0]

            for feat, coef, val in zip(self.feature_names, coefs, feature_values):
                impact = coef * val
                if abs(coef) > 0.01:
                    contributions.append({
                        "feature": feat,
                        "value": round(float(val), 4),
                        "contribution": round(float(abs(coef)), 4),
                        "direction": "positive" if impact > 0 else "negative",
                    })
            contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            contributions = contributions[:10]

        return contributions

    def _generate_explanation(self, prediction, probability, risk_level, contributions):
        top_features = [c["feature"].replace("_", " ").title() for c in contributions[:3]]
        positive = [c["feature"].replace("_", " ").title() for c in contributions if c["direction"] == "positive"][:3]
        negative = [c["feature"].replace("_", " ").title() for c in contributions if c["direction"] == "negative"][:3]

        if prediction == "Approved":
            explanation = (
                f"The loan application is APPROVED with {probability:.0%} confidence. "
                f"Risk level: {risk_level}. "
            )
            if positive:
                explanation += f"Key factors supporting approval: {', '.join(positive)}. "
        else:
            explanation = (
                f"The loan application is REJECTED with {1-probability:.0%} confidence. "
                f"Risk level: {risk_level}. "
            )
            if negative:
                explanation += f"Key risk factors: {', '.join(negative)}. "

        explanation += f"Decision primarily influenced by: {', '.join(top_features)}."
        return explanation

    def get_model_info(self) -> dict:
        if not self._loaded or not self.model_metadata:
            return {
                "model_name": "Unknown", "model_type": "Not loaded", "version": "N/A",
                "metrics": {}, "feature_count": 0, "training_samples": 0, "last_updated": "N/A",
            }
        return {
            "model_name": self.model_metadata.get("model_name", "loan_prediction_model"),
            "model_type": type(self.model).__name__,
            "version": "1.0.0",
            "metrics": self.model_metadata.get("metrics", {}),
            "feature_count": self.model_metadata.get("n_features", 0),
            "training_samples": self.model_metadata.get("training_samples", 0),
            "last_updated": "2026-04-15",
        }

    def get_feature_importance(self) -> dict:
        if not self._loaded:
            return {}
        if self.model_metadata and "feature_importance" in self.model_metadata:
            return self.model_metadata["feature_importance"]
        if hasattr(self.model, "feature_importances_"):
            return dict(zip(self.feature_names, self.model.feature_importances_.tolist()))
        return {}


# Singleton instance
model_service = ModelService()
