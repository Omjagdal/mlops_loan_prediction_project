"""
Generate synthetic loan dataset for training.
Creates a realistic dataset with 20,000 loan applications.
Schema matches the loan_dataset_20000.csv format used by data_preprocessing.py.
"""

import numpy as np
import pandas as pd
import os


def generate_loan_dataset(n_samples: int = 20000, seed: int = 42) -> pd.DataFrame:
    """Generate a realistic synthetic loan dataset matching the production schema."""
    np.random.seed(seed)

    # --- Applicant Demographics ---
    age = np.random.randint(18, 75, n_samples)
    gender = np.random.choice(["Male", "Female"], n_samples, p=[0.6, 0.4])
    marital_status = np.random.choice(
        ["Single", "Married", "Divorced"], n_samples, p=[0.30, 0.55, 0.15]
    )
    education_level = np.random.choice(
        ["High School", "Bachelor's", "Master's", "PhD"],
        n_samples, p=[0.25, 0.45, 0.22, 0.08],
    )
    employment_status = np.random.choice(
        ["Employed", "Self-employed", "Unemployed", "Retired"],
        n_samples, p=[0.65, 0.18, 0.07, 0.10],
    )

    # --- Financial Features ---
    annual_income = np.random.lognormal(mean=10.8, sigma=0.5, size=n_samples).astype(int)
    annual_income = np.clip(annual_income, 15000, 500000)
    monthly_income = (annual_income / 12).astype(int)

    # Debt-to-income ratio (0 to 1)
    debt_to_income_ratio = np.clip(
        np.random.beta(2, 5, n_samples), 0.01, 0.95
    ).round(4)

    # Credit Score (300–850)
    credit_score = np.random.normal(700, 70, n_samples).astype(int)
    credit_score = np.clip(credit_score, 300, 850)

    # Loan details
    loan_purpose = np.random.choice(
        ["Car", "Home", "Business", "Education", "Debt consolidation", "Other"],
        n_samples, p=[0.20, 0.30, 0.15, 0.15, 0.12, 0.08],
    )
    loan_amount = np.random.lognormal(mean=9.5, sigma=0.7, size=n_samples).astype(int)
    loan_amount = np.clip(loan_amount, 1000, 500000)

    interest_rate = np.clip(
        np.random.normal(12, 4, n_samples), 2, 30
    ).round(2)

    loan_term = np.random.choice(
        [12, 24, 36, 48, 60, 84, 120],
        n_samples, p=[0.05, 0.10, 0.30, 0.20, 0.20, 0.10, 0.05],
    )

    # Monthly installment (PMT approximation)
    monthly_rate = interest_rate / 100 / 12
    installment = (
        loan_amount * monthly_rate / (1 - (1 + monthly_rate) ** (-loan_term))
    ).round(2)
    installment = np.clip(installment, 50, 50000)

    # Grade subgrade (e.g., A1, B3, C5)
    grades = np.random.choice(["A", "B", "C", "D", "E", "F", "G"], n_samples, p=[0.15, 0.25, 0.25, 0.15, 0.10, 0.06, 0.04])
    subgrades = np.random.randint(1, 6, n_samples)
    grade_subgrade = np.array([f"{g}{s}" for g, s in zip(grades, subgrades)])

    # Credit accounts & history
    num_of_open_accounts = np.random.poisson(8, n_samples)
    num_of_open_accounts = np.clip(num_of_open_accounts, 0, 40)

    total_credit_limit = np.random.lognormal(mean=10.2, sigma=0.5, size=n_samples).astype(int)
    total_credit_limit = np.clip(total_credit_limit, 1000, 500000)

    # Current balance (fraction of credit limit)
    utilization = np.clip(np.random.beta(2, 4, n_samples), 0, 0.99)
    current_balance = (total_credit_limit * utilization).astype(int)

    delinquency_history = np.random.choice(range(0, 6), n_samples, p=[0.65, 0.15, 0.10, 0.05, 0.03, 0.02])
    public_records = np.random.choice(range(0, 5), n_samples, p=[0.80, 0.12, 0.05, 0.02, 0.01])
    num_of_delinquencies = np.random.poisson(0.5, n_samples)
    num_of_delinquencies = np.clip(num_of_delinquencies, 0, 15)

    # --- Generate Target: loan_paid_back ---
    # V2: Balanced probability — no single feature should dominate (>30%)
    # Each factor contributes 10-20% of signal for a well-distributed model
    approval_prob = np.zeros(n_samples, dtype=float)

    # 1. Credit score — 20% contribution (strongest, but not dominant)
    credit_norm = (credit_score - 300) / 550  # 0-1 scale
    approval_prob += credit_norm * 0.20

    # 2. Debt-to-income ratio — 18% contribution
    dti_signal = 1 - debt_to_income_ratio  # lower DTI = better
    approval_prob += dti_signal * 0.18

    # 3. Income adequacy — 15% contribution
    pti = installment / (monthly_income + 1)
    income_signal = np.clip(1 - pti * 2, 0, 1)  # lower payment-to-income = better
    approval_prob += income_signal * 0.15

    # 4. Credit utilization — 12% contribution
    util_signal = 1 - np.clip(utilization, 0, 1)
    approval_prob += util_signal * 0.12

    # 5. Delinquency & public records — 12% contribution
    delinq_signal = 1 / (1 + delinquency_history + num_of_delinquencies)
    records_signal = 1 / (1 + public_records)
    approval_prob += (delinq_signal * 0.6 + records_signal * 0.4) * 0.12

    # 6. Employment status — 10% contribution (NOT dominant)
    emp_arr = np.array(employment_status)
    approval_prob += np.where(
        emp_arr == "Employed", 0.10,
        np.where(emp_arr == "Self-employed", 0.07,
        np.where(emp_arr == "Retired", 0.05, 0.00))
    )

    # 7. Loan grade — 8% contribution
    grade_arr = np.array([g[0] for g in grade_subgrade])
    grade_map = {"A": 0.08, "B": 0.06, "C": 0.04, "D": 0.02, "E": 0.01, "F": 0.0, "G": 0.0}
    approval_prob += np.array([grade_map.get(g, 0.02) for g in grade_arr])

    # 8. Education & age — 5% contribution
    edu_arr = np.array(education_level)
    approval_prob += np.where(
        np.isin(edu_arr, ["Master's", "PhD"]), 0.03,
        np.where(edu_arr == "Bachelor's", 0.02, 0.0)
    )
    age_signal = np.where((age >= 25) & (age <= 55), 0.02, 0.0)
    approval_prob += age_signal

    # Add noise for realistic variation
    approval_prob += np.random.normal(0, 0.06, n_samples)
    approval_prob = np.clip(approval_prob, 0, 1)

    # Binary target (~65-70% approval rate)
    loan_paid_back = np.where(approval_prob > 0.68, "Yes", "No")

    # --- Create DataFrame ---
    df = pd.DataFrame({
        "age": age,
        "gender": gender,
        "marital_status": marital_status,
        "education_level": education_level,
        "annual_income": annual_income,
        "monthly_income": monthly_income,
        "employment_status": employment_status,
        "debt_to_income_ratio": debt_to_income_ratio,
        "credit_score": credit_score,
        "loan_amount": loan_amount,
        "loan_purpose": loan_purpose,
        "interest_rate": interest_rate,
        "loan_term": loan_term,
        "installment": installment,
        "grade_subgrade": grade_subgrade,
        "num_of_open_accounts": num_of_open_accounts,
        "total_credit_limit": total_credit_limit,
        "current_balance": current_balance,
        "delinquency_history": delinquency_history,
        "public_records": public_records,
        "num_of_delinquencies": num_of_delinquencies,
        "loan_paid_back": loan_paid_back,
    })

    return df


def main():
    """Generate and save the dataset."""
    # Create output directory
    raw_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    os.makedirs(raw_dir, exist_ok=True)

    # Generate dataset
    print("Generating synthetic loan dataset (20,000 records)...")
    df = generate_loan_dataset(n_samples=20000)

    # Save to CSV — filename must match what data_preprocessing.py expects
    output_path = os.path.join(raw_dir, "loan_dataset_20000.csv")
    df.to_csv(output_path, index=False)

    # Print summary stats
    print(f"Dataset saved to: {output_path}")
    print(f"   Shape: {df.shape}")
    print(f"   Columns: {list(df.columns)}")
    print(f"   Approval Rate: {(df['loan_paid_back'] == 'Yes').mean():.1%}")
    print(f"   Missing Values: {df.isnull().sum().sum()} total")
    print(f"\nFeature Summary:")
    print(df.describe())
    print(f"\nColumn Types:")
    print(df.dtypes)

    return df


if __name__ == "__main__":
    main()
