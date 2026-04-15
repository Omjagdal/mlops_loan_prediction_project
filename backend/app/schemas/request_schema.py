"""
Pydantic schemas for loan prediction API.
Defines request/response models with validation.
Matched to loan_dataset_20000.csv columns.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from enum import Enum


class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"


class MaritalStatus(str, Enum):
    SINGLE = "Single"
    MARRIED = "Married"
    DIVORCED = "Divorced"


class EducationLevel(str, Enum):
    HIGH_SCHOOL = "High School"
    BACHELORS = "Bachelor's"
    MASTERS = "Master's"
    PHD = "PhD"


class EmploymentStatus(str, Enum):
    EMPLOYED = "Employed"
    SELF_EMPLOYED = "Self-employed"
    UNEMPLOYED = "Unemployed"
    RETIRED = "Retired"


class LoanPurpose(str, Enum):
    CAR = "Car"
    HOME = "Home"
    BUSINESS = "Business"
    EDUCATION = "Education"
    DEBT_CONSOLIDATION = "Debt consolidation"
    OTHER = "Other"


class LoanApplication(BaseModel):
    """Loan application input schema — matches dataset columns."""
    age: int = Field(..., ge=18, le=100, description="Applicant age")
    gender: Gender = Field(..., description="Applicant gender")
    marital_status: MaritalStatus = Field(..., description="Marital status")
    education_level: EducationLevel = Field(..., description="Education level")
    annual_income: float = Field(..., gt=0, description="Annual income")
    monthly_income: float = Field(..., gt=0, description="Monthly income")
    employment_status: EmploymentStatus = Field(..., description="Employment status")
    debt_to_income_ratio: float = Field(..., ge=0, le=1, description="Debt to income ratio")
    credit_score: int = Field(..., ge=300, le=850, description="Credit score (300-850)")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount")
    loan_purpose: LoanPurpose = Field(..., description="Purpose of loan")
    interest_rate: float = Field(..., gt=0, le=40, description="Interest rate (%)")
    loan_term: int = Field(..., gt=0, description="Loan term in months")
    installment: float = Field(..., gt=0, description="Monthly installment amount")
    grade_subgrade: str = Field(..., description="Loan grade and subgrade (e.g., B5, A3)")
    num_of_open_accounts: int = Field(..., ge=0, description="Number of open credit accounts")
    total_credit_limit: float = Field(..., ge=0, description="Total credit limit")
    current_balance: float = Field(..., ge=0, description="Current outstanding balance")
    delinquency_history: int = Field(..., ge=0, le=10, description="Delinquency history flag")
    public_records: int = Field(..., ge=0, description="Number of public records")
    num_of_delinquencies: int = Field(..., ge=0, description="Number of delinquencies")

    class Config:
        json_schema_extra = {
            "example": {
                "age": 35,
                "gender": "Male",
                "marital_status": "Married",
                "education_level": "Bachelor's",
                "annual_income": 55000,
                "monthly_income": 4583,
                "employment_status": "Employed",
                "debt_to_income_ratio": 0.25,
                "credit_score": 720,
                "loan_amount": 15000,
                "loan_purpose": "Car",
                "interest_rate": 10.5,
                "loan_term": 36,
                "installment": 487.50,
                "grade_subgrade": "B3",
                "num_of_open_accounts": 5,
                "total_credit_limit": 35000,
                "current_balance": 12000,
                "delinquency_history": 0,
                "public_records": 0,
                "num_of_delinquencies": 0,
            }
        }


class FeatureContribution(BaseModel):
    """Individual feature contribution to the prediction."""
    feature: str
    value: float
    contribution: float
    direction: str  # "positive" or "negative"


class PredictionResponse(BaseModel):
    """Loan prediction response."""
    prediction: str = Field(..., description="Approved or Rejected")
    probability: float = Field(..., description="Approval probability (0-1)")
    confidence: float = Field(..., description="Model confidence score")
    risk_level: str = Field(..., description="Low, Medium, or High")
    feature_contributions: List[FeatureContribution] = Field(
        default=[], description="Top feature contributions"
    )
    explanation: str = Field(..., description="Human-readable explanation")


class ModelInfo(BaseModel):
    """Model metadata information."""
    model_name: str
    model_type: str
    version: str
    metrics: Dict[str, float]
    feature_count: int
    training_samples: int
    last_updated: str


class HealthResponse(BaseModel):
    """API health check response."""
    status: str
    model_loaded: bool
    uptime_seconds: float
    version: str


class BatchPredictionRequest(BaseModel):
    """Batch prediction request."""
    applications: List[LoanApplication]


class BatchPredictionResponse(BaseModel):
    """Batch prediction response."""
    predictions: List[PredictionResponse]
    total: int
    approved: int
    rejected: int
    avg_probability: float
