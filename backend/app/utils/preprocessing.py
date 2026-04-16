"""
Input preprocessing utilities for the API.
Adapted for the loan_dataset_20000.csv schema.
"""

import numpy as np
from typing import Dict, Any


def validate_and_clean_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and clean raw input data (new schema)."""
    cleaned = {}

    # String fields with allowed values
    string_fields = {
        "gender": ["Male", "Female"],
        "marital_status": ["Single", "Married", "Divorced"],
        "education_level": ["High School", "Bachelor's", "Master's", "PhD"],
        "employment_status": ["Employed", "Self-employed", "Unemployed", "Retired"],
        "loan_purpose": ["Car", "Home", "Business", "Education", "Debt consolidation", "Other"],
    }

    for field, valid_values in string_fields.items():
        value = data.get(field, "")
        if value not in valid_values:
            raise ValueError(f"Invalid {field}: {value}. Must be one of {valid_values}")
        cleaned[field] = value

    # Numeric fields with (min, max) ranges
    numeric_fields = {
        "age": (18, 100),
        "annual_income": (1, 10000000),
        "monthly_income": (1, 1000000),
        "debt_to_income_ratio": (0, 1),
        "credit_score": (300, 850),
        "loan_amount": (1, 10000000),
        "interest_rate": (0.1, 40),
        "loan_term": (1, 600),
        "installment": (1, 1000000),
        "num_of_open_accounts": (0, 100),
        "total_credit_limit": (0, 10000000),
        "current_balance": (0, 10000000),
        "delinquency_history": (0, 10),
        "public_records": (0, 50),
        "num_of_delinquencies": (0, 100),
    }

    for field, (min_val, max_val) in numeric_fields.items():
        value = data.get(field)
        if value is None:
            raise ValueError(f"Missing required field: {field}")
        value = float(value)
        if value < min_val or value > max_val:
            raise ValueError(f"{field} must be between {min_val} and {max_val}")
        cleaned[field] = value

    # String fields without strict validation
    cleaned["grade_subgrade"] = str(data.get("grade_subgrade", "B3"))

    return cleaned


def calculate_risk_factors(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate risk factors from input data (new schema)."""
    annual_income = float(data.get("annual_income", 0))
    monthly_income = float(data.get("monthly_income", 0))
    loan_amount = float(data.get("loan_amount", 0))
    installment = float(data.get("installment", 0))
    credit_score = int(data.get("credit_score", 650))
    debt_to_income_ratio = float(data.get("debt_to_income_ratio", 0))
    current_balance = float(data.get("current_balance", 0))
    total_credit_limit = float(data.get("total_credit_limit", 1))

    loan_to_income = loan_amount / (annual_income + 1)
    payment_to_income = installment / (monthly_income + 1)
    remaining_income = monthly_income - installment
    credit_utilization = current_balance / (total_credit_limit + 1)

    factors = {
        "loan_to_income_ratio": round(loan_to_income, 4),
        "payment_to_income_ratio": round(payment_to_income, 4),
        "remaining_monthly_income": round(remaining_income, 2),
        "credit_utilization": round(credit_utilization, 4),
        "debt_to_income_ratio": round(debt_to_income_ratio, 4),
        "affordability_pct": round(
            (remaining_income / (monthly_income + 1)) * 100, 1
        ),
        "credit_risk": (
            "Low" if credit_score >= 740
            else "Medium" if credit_score >= 670
            else "High"
        ),
        "income_stability": (
            "Healthy" if payment_to_income < 0.3
            else "Strained" if payment_to_income < 0.5
            else "Critical"
        ),
    }

    return factors
