"""
Generate synthetic loan dataset for training.
Creates a realistic dataset with 10,000 loan applications.
"""

import numpy as np
import pandas as pd
import os


def generate_loan_dataset(n_samples: int = 10000, seed: int = 42) -> pd.DataFrame:
    """Generate a realistic synthetic loan dataset."""
    np.random.seed(seed)

    # --- Applicant Demographics ---
    gender = np.random.choice(["Male", "Female"], n_samples, p=[0.6, 0.4])
    married = np.random.choice(["Yes", "No"], n_samples, p=[0.65, 0.35])
    dependents = np.random.choice(["0", "1", "2", "3+"], n_samples, p=[0.4, 0.25, 0.2, 0.15])
    education = np.random.choice(["Graduate", "Not Graduate"], n_samples, p=[0.7, 0.3])
    self_employed = np.random.choice(["Yes", "No"], n_samples, p=[0.15, 0.85])

    # --- Financial Features ---
    # Applicant income (log-normal distribution for realistic skew)
    applicant_income = np.random.lognormal(mean=8.5, sigma=0.6, size=n_samples).astype(int)
    applicant_income = np.clip(applicant_income, 1500, 80000)

    # Coapplicant income (many zeros, some with income)
    has_coapplicant = np.random.choice([0, 1], n_samples, p=[0.4, 0.6])
    coapplicant_income = (
        has_coapplicant * np.random.lognormal(mean=7.5, sigma=0.8, size=n_samples)
    ).astype(int)
    coapplicant_income = np.clip(coapplicant_income, 0, 50000)

    # Loan amount (correlated with income)
    total_income = applicant_income + coapplicant_income
    loan_amount = (total_income * np.random.uniform(1.5, 6.0, n_samples) / 1000).astype(int)
    loan_amount = np.clip(loan_amount, 20, 700)

    # Loan term (mostly 360 months)
    loan_amount_term = np.random.choice(
        [60, 120, 180, 240, 300, 360, 480],
        n_samples,
        p=[0.02, 0.05, 0.1, 0.08, 0.05, 0.65, 0.05],
    )

    # Credit history (1 = good, 0 = bad)
    credit_history = np.random.choice([0.0, 1.0], n_samples, p=[0.15, 0.85])

    # Property area
    property_area = np.random.choice(
        ["Urban", "Semiurban", "Rural"], n_samples, p=[0.35, 0.4, 0.25]
    )

    # --- Credit Score (550-850) ---
    base_credit = np.random.normal(700, 60, n_samples)
    credit_score = np.where(credit_history == 1.0, base_credit + 30, base_credit - 80)
    credit_score = np.clip(credit_score, 550, 850).astype(int)

    # --- Employment Years ---
    employment_years = np.random.exponential(5, n_samples).astype(int)
    employment_years = np.clip(employment_years, 0, 35)

    # --- Generate Loan Status (Target) ---
    # Create approval probability based on realistic factors
    approval_prob = np.zeros(n_samples)

    # Credit history is the strongest predictor
    approval_prob += credit_history * 0.35

    # Debt-to-income ratio
    dti = (loan_amount * 1000) / (total_income + 1)
    approval_prob += np.where(dti < 3, 0.2, np.where(dti < 5, 0.1, 0.0))

    # Education
    approval_prob += np.where(np.array(education) == "Graduate", 0.1, 0.0)

    # Credit score
    approval_prob += np.where(credit_score > 750, 0.15, np.where(credit_score > 650, 0.08, 0.0))

    # Property area
    approval_prob += np.where(
        np.array(property_area) == "Semiurban",
        0.08,
        np.where(np.array(property_area) == "Urban", 0.05, 0.02),
    )

    # Employment stability
    approval_prob += np.where(employment_years > 5, 0.07, np.where(employment_years > 2, 0.04, 0.0))

    # Married bonus
    approval_prob += np.where(np.array(married) == "Yes", 0.05, 0.0)

    # Add noise
    approval_prob += np.random.normal(0, 0.05, n_samples)
    approval_prob = np.clip(approval_prob, 0, 1)

    # Convert to binary (threshold ~0.5 for ~70% approval rate)
    loan_status = np.where(approval_prob > 0.38, "Y", "N")

    # --- Create DataFrame ---
    df = pd.DataFrame(
        {
            "Loan_ID": [f"LP{str(i).zfill(6)}" for i in range(1, n_samples + 1)],
            "Gender": gender,
            "Married": married,
            "Dependents": dependents,
            "Education": education,
            "Self_Employed": self_employed,
            "ApplicantIncome": applicant_income,
            "CoapplicantIncome": coapplicant_income,
            "LoanAmount": loan_amount,
            "Loan_Amount_Term": loan_amount_term,
            "Credit_History": credit_history,
            "Property_Area": property_area,
            "Credit_Score": credit_score,
            "Employment_Years": employment_years,
            "Loan_Status": loan_status,
        }
    )

    # Introduce ~5% missing values in select columns (realistic)
    for col in ["Gender", "Married", "Dependents", "Self_Employed", "LoanAmount", "Loan_Amount_Term", "Credit_History"]:
        mask = np.random.random(n_samples) < 0.05
        df.loc[mask, col] = np.nan

    return df


def main():
    """Generate and save the dataset."""
    # Create output directory
    raw_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    os.makedirs(raw_dir, exist_ok=True)

    # Generate dataset
    print("🔄 Generating synthetic loan dataset (10,000 records)...")
    df = generate_loan_dataset(n_samples=10000)

    # Save to CSV
    output_path = os.path.join(raw_dir, "loan_data.csv")
    df.to_csv(output_path, index=False)

    # Print summary stats
    print(f"✅ Dataset saved to: {output_path}")
    print(f"   Shape: {df.shape}")
    print(f"   Approval Rate: {(df['Loan_Status'] == 'Y').mean():.1%}")
    print(f"   Missing Values: {df.isnull().sum().sum()} total")
    print(f"\n📊 Feature Summary:")
    print(df.describe())
    print(f"\n📋 Column Types:")
    print(df.dtypes)

    return df


if __name__ == "__main__":
    main()
