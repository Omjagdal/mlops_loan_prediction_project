"""
Data preprocessing pipeline for loan prediction.
Handles missing values, encoding, feature engineering, and train/test split.
Adapted for the loan_dataset_20000.csv dataset.

V2: Enhanced feature engineering with 12 new financial intelligence features.
"""

import os
import warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib

warnings.filterwarnings("ignore")

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "data", "processed")


def load_data(filepath: str = None) -> pd.DataFrame:
    """Load the loan dataset."""
    if filepath is None:
        filepath = os.path.join(RAW_DATA_DIR, "loan_dataset_20000.csv")

    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Dataset not found at {filepath}. "
            "Please place loan_dataset_20000.csv in ml_pipeline/data/raw/"
        )

    df = pd.read_csv(filepath)
    print(f"✅ Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"   Columns: {list(df.columns)}")
    return df


def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Handle missing values with appropriate strategies."""
    df = df.copy()
    initial_missing = df.isnull().sum().sum()

    # Categorical columns: fill with mode
    categorical_cols = df.select_dtypes(include=["object"]).columns
    for col in categorical_cols:
        if df[col].isnull().any():
            df[col].fillna(df[col].mode()[0], inplace=True)

    # Numerical columns: fill with median
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    for col in numerical_cols:
        if df[col].isnull().any():
            df[col].fillna(df[col].median(), inplace=True)

    final_missing = df.isnull().sum().sum()
    print(f"🔧 Missing values: {initial_missing} → {final_missing}")
    return df


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create new features for better prediction.
    V2: Enhanced with 12 new financial intelligence features.
    """
    df = df.copy()

    # ══════════════════════════════════════════════
    # === ORIGINAL FEATURES (V1) ===
    # ══════════════════════════════════════════════

    # --- Income-based features ---
    df["loan_to_income_ratio"] = df["loan_amount"] / (df["annual_income"] + 1)
    df["payment_to_income_ratio"] = df["installment"] / (df["monthly_income"] + 1)
    df["remaining_income"] = df["monthly_income"] - df["installment"]

    # --- Credit-based features ---
    df["credit_utilization"] = df["current_balance"] / (df["total_credit_limit"] + 1)
    df["available_credit"] = df["total_credit_limit"] - df["current_balance"]

    # --- Risk-based features ---
    df["delinquency_rate"] = df["num_of_delinquencies"] / (df["num_of_open_accounts"] + 1)
    df["risk_composite"] = (
        df["debt_to_income_ratio"] * 0.3
        + (1 - df["credit_score"] / 850) * 0.3
        + df["delinquency_rate"] * 0.2
        + df["public_records"] * 0.2
    )

    # --- Log transforms ---
    for col in ["annual_income", "monthly_income", "loan_amount", "total_credit_limit", "current_balance"]:
        df[f"log_{col}"] = np.log1p(df[col])

    # --- Categorical bins ---
    df["age_group"] = pd.cut(df["age"], bins=[0, 25, 35, 50, 65, 100],
                             labels=["Young", "Early_Career", "Mid_Career", "Senior", "Retired"])
    df["credit_tier"] = pd.cut(df["credit_score"],
                               bins=[0, 580, 670, 740, 800, 850],
                               labels=["Poor", "Fair", "Good", "Very_Good", "Excellent"])

    # ══════════════════════════════════════════════
    # === NEW FEATURES (V2) — Financial Intelligence ===
    # ══════════════════════════════════════════════

    # 1. INCOME STABILITY INDEX
    #    Ratio of monthly to annual/12 — indicates income consistency
    expected_monthly = df["annual_income"] / 12
    df["income_stability_index"] = df["monthly_income"] / (expected_monthly + 1)

    # 2. CREDIT HEALTH SCORE — composite credit quality
    #    Combines credit score, utilization, delinquency, and records
    df["credit_health_score"] = (
        (df["credit_score"] / 850) * 0.4                          # Credit score factor
        + (1 - df["credit_utilization"].clip(0, 1)) * 0.25        # Low utilization = good
        + (1 / (1 + df["num_of_delinquencies"])) * 0.2            # Fewer delinquencies = good
        + (1 / (1 + df["public_records"])) * 0.15                 # Fewer records = good
    )

    # 3. LOAN AFFORDABILITY SCORE
    #    How easily the applicant can absorb the monthly installment
    df["loan_affordability_score"] = (df["monthly_income"] - df["installment"]) / (df["monthly_income"] + 1)

    # 4. FINANCIAL STRESS INDEX
    #    High DTI + high utilization + delinquencies = stress
    df["financial_stress_index"] = (
        df["debt_to_income_ratio"] * 0.35
        + df["credit_utilization"].clip(0, 1) * 0.35
        + (df["num_of_delinquencies"] / (df["num_of_delinquencies"].max() + 1)) * 0.3
    )

    # 5. CREDIT AGE PROXY
    #    Older applicants with more accounts tend to have longer credit history
    df["credit_age_proxy"] = df["age"] * df["num_of_open_accounts"]

    # 6. DEBT COVERAGE RATIO
    #    Annual income relative to total outstanding debt
    df["debt_coverage_ratio"] = df["annual_income"] / (df["current_balance"] + 1)

    # 7. PAYMENT SHOCK INDICATOR
    #    How much the installment would impact monthly budget
    #    > 0.35 means "payment shock" — common lending rule
    df["payment_shock"] = (df["installment"] / (df["monthly_income"] + 1)).apply(
        lambda x: 1 if x > 0.35 else 0
    )

    # 8. RISK-ADJUSTED RATE
    #    Interest rate normalized by credit score — high rate + low score = danger
    df["risk_adjusted_rate"] = df["interest_rate"] / (df["credit_score"] / 100 + 1)

    # 9. INCOME ADEQUACY RATIO
    #    Does income exceed both loan payments and existing debt burden?
    monthly_debt = df["current_balance"] * (df["interest_rate"] / 100 / 12)
    df["income_adequacy_ratio"] = df["monthly_income"] / (df["installment"] + monthly_debt + 1)

    # 10. CREDIT HEADROOM
    #     Available credit as % of total limit — breathing room indicator
    df["credit_headroom"] = df["available_credit"] / (df["total_credit_limit"] + 1)

    # 11. BEHAVIORAL RISK SCORE
    #     Weighted composite of past negative behaviors
    df["behavioral_risk_score"] = (
        df["delinquency_history"] * 0.3
        + (df["num_of_delinquencies"] / (df["num_of_delinquencies"].max() + 1)) * 0.4
        + (df["public_records"] / (df["public_records"].max() + 1)) * 0.3
    )

    # 12. FINANCIAL PROFILE CLUSTER
    #     Interaction features capturing applicant "archetype"
    #     age × income quintile × credit tier interaction
    df["income_quintile"] = pd.qcut(df["annual_income"], q=5, labels=[1, 2, 3, 4, 5]).astype(int)
    df["loan_amount_quintile"] = pd.qcut(df["loan_amount"], q=5, labels=[1, 2, 3, 4, 5], duplicates='drop').astype(int)
    df["profile_interaction"] = df["income_quintile"] * df["loan_amount_quintile"]

    # --- POLYNOMIAL FEATURES for top predictors ---
    df["credit_score_sq"] = df["credit_score"] ** 2
    df["dti_sq"] = df["debt_to_income_ratio"] ** 2
    df["credit_util_sq"] = df["credit_utilization"] ** 2

    # --- INTERACTION FEATURES ---
    df["score_x_dti"] = df["credit_score"] * df["debt_to_income_ratio"]
    df["income_x_term"] = df["annual_income"] * df["loan_term"]
    df["rate_x_amount"] = df["interest_rate"] * df["loan_amount"]

    print(f"✨ Feature engineering V2 complete: {df.shape[1]} total features")
    print(f"   New V2 features: income_stability_index, credit_health_score,")
    print(f"   loan_affordability_score, financial_stress_index, credit_age_proxy,")
    print(f"   debt_coverage_ratio, payment_shock, risk_adjusted_rate,")
    print(f"   income_adequacy_ratio, credit_headroom, behavioral_risk_score,")
    print(f"   profile_interaction + 3 polynomial + 3 interaction features")
    return df


def encode_features(df: pd.DataFrame) -> tuple:
    """Encode categorical features and prepare for modeling."""
    df = df.copy()

    # Encode target variable
    target_col = "loan_paid_back"
    target_encoder = LabelEncoder()
    df[target_col] = target_encoder.fit_transform(df[target_col])

    # Identify categorical columns to encode
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

    print(f"🏷️  Encoded {len(label_encoders)} categorical features: {categorical_cols}")
    return df, label_encoders, target_encoder


def split_and_scale(df: pd.DataFrame, test_size: float = 0.2, random_state: int = 42) -> dict:
    """Split data into train/test sets and scale features."""
    target_col = "loan_paid_back"
    feature_cols = [col for col in df.columns if col != target_col]

    X = df[feature_cols]
    y = df[target_col]

    # Train/test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train), columns=feature_cols, index=X_train.index
    )
    X_test_scaled = pd.DataFrame(
        scaler.transform(X_test), columns=feature_cols, index=X_test.index
    )

    print(f"📊 Train set: {X_train.shape[0]} samples")
    print(f"📊 Test set: {X_test.shape[0]} samples")
    print(f"📊 Approval rate (train): {y_train.mean():.1%}")
    print(f"📊 Approval rate (test): {y_test.mean():.1%}")
    print(f"📊 Total features: {len(feature_cols)}")

    return {
        "X_train": X_train_scaled,
        "X_test": X_test_scaled,
        "X_train_unscaled": X_train,
        "X_test_unscaled": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "scaler": scaler,
        "feature_names": feature_cols,
    }


def run_preprocessing_pipeline(filepath: str = None) -> dict:
    """Run the complete preprocessing pipeline."""
    print("=" * 60)
    print("🚀 LOAN PREDICTION - DATA PREPROCESSING PIPELINE V2")
    print("=" * 60)

    # 1. Load data
    df = load_data(filepath)

    # 2. Handle missing values
    df = handle_missing_values(df)

    # 3. Feature engineering (V2 — enhanced)
    df = feature_engineering(df)

    # 4. Encode features
    df, label_encoders, target_encoder = encode_features(df)

    # 5. Split and scale
    data = split_and_scale(df)

    # 6. Save processed data and artifacts
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)

    data["X_train"].to_csv(os.path.join(PROCESSED_DATA_DIR, "X_train.csv"), index=False)
    data["X_test"].to_csv(os.path.join(PROCESSED_DATA_DIR, "X_test.csv"), index=False)
    data["y_train"].to_csv(os.path.join(PROCESSED_DATA_DIR, "y_train.csv"), index=False)
    data["y_test"].to_csv(os.path.join(PROCESSED_DATA_DIR, "y_test.csv"), index=False)

    joblib.dump(data["scaler"], os.path.join(PROCESSED_DATA_DIR, "scaler.pkl"))
    joblib.dump(label_encoders, os.path.join(PROCESSED_DATA_DIR, "label_encoders.pkl"))
    joblib.dump(target_encoder, os.path.join(PROCESSED_DATA_DIR, "target_encoder.pkl"))
    joblib.dump(data["feature_names"], os.path.join(PROCESSED_DATA_DIR, "feature_names.pkl"))

    print(f"\n💾 Saved processed data to: {PROCESSED_DATA_DIR}")
    print("=" * 60)
    print("✅ PREPROCESSING V2 COMPLETE")
    print("=" * 60)

    return {**data, "label_encoders": label_encoders, "target_encoder": target_encoder}


if __name__ == "__main__":
    run_preprocessing_pipeline()
