"""
Input preprocessing utilities for the API.
Transforms raw API input into model-ready format.
"""

import numpy as np
from typing import Dict, Any


def validate_and_clean_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and clean raw input data."""
    cleaned = {}

    # String fields
    string_fields = {
        "gender": ["Male", "Female"],
        "married": ["Yes", "No"],
        "dependents": ["0", "1", "2", "3+"],
        "education": ["Graduate", "Not Graduate"],
        "self_employed": ["Yes", "No"],
        "property_area": ["Urban", "Semiurban", "Rural"],
    }

    for field, valid_values in string_fields.items():
        value = data.get(field, "")
        if value not in valid_values:
            raise ValueError(f"Invalid {field}: {value}. Must be one of {valid_values}")
        cleaned[field] = value

    # Numeric fields
    numeric_fields = {
        "applicant_income": (1, 1000000),
        "coapplicant_income": (0, 1000000),
        "loan_amount": (1, 10000),
        "loan_amount_term": (12, 480),
        "credit_history": (0, 1),
        "credit_score": (550, 850),
        "employment_years": (0, 50),
    }

    for field, (min_val, max_val) in numeric_fields.items():
        value = data.get(field)
        if value is None:
            raise ValueError(f"Missing required field: {field}")
        value = float(value)
        if value < min_val or value > max_val:
            raise ValueError(f"{field} must be between {min_val} and {max_val}")
        cleaned[field] = value

    return cleaned


def calculate_risk_factors(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate additional risk factors from input data."""
    total_income = data["applicant_income"] + data["coapplicant_income"]
    loan_amount = data["loan_amount"] * 1000  # Convert from thousands

    factors = {
        "total_income": total_income,
        "debt_to_income_ratio": loan_amount / (total_income + 1),
        "monthly_emi_estimate": loan_amount / max(data["loan_amount_term"], 1),
        "income_stability": "High" if data["employment_years"] >= 5 else ("Medium" if data["employment_years"] >= 2 else "Low"),
        "credit_risk": "Low" if data["credit_score"] >= 750 else ("Medium" if data["credit_score"] >= 650 else "High"),
    }

    return factors
