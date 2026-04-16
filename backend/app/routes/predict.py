"""
API routes for loan prediction.
"""

import time
from fastapi import APIRouter, HTTPException
from typing import List

from ..schemas.request_schema import (
    LoanApplication,
    PredictionResponse,
    ModelInfo,
    HealthResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    FeatureContribution,
)
from ..services.model_service import model_service
from ..utils.preprocessing import calculate_risk_factors

router = APIRouter()
START_TIME = time.time()


@router.post("/predict", response_model=PredictionResponse)
async def predict_loan(application: LoanApplication):
    """
    Predict loan approval for a single application.
    Returns prediction, probability, confidence, risk level, and explainability data.
    """
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded. Please try again later.")

    try:
        # Convert to dict
        app_dict = application.model_dump()

        # Predict directly using Pydantic validated schema
        result = model_service.predict(app_dict)

        return PredictionResponse(
            prediction=result["prediction"],
            probability=result["probability"],
            confidence=result["confidence"],
            risk_level=result["risk_level"],
            feature_contributions=[
                FeatureContribution(**fc) for fc in result["feature_contributions"]
            ],
            explanation=result["explanation"],
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    """Predict loan approval for multiple applications."""
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    predictions = []
    approved_count = 0

    for application in request.applications:
        try:
            app_dict = application.model_dump()
            result = model_service.predict(app_dict)

            pred = PredictionResponse(
                prediction=result["prediction"],
                probability=result["probability"],
                confidence=result["confidence"],
                risk_level=result["risk_level"],
                feature_contributions=[
                    FeatureContribution(**fc) for fc in result["feature_contributions"]
                ],
                explanation=result["explanation"],
            )
            predictions.append(pred)

            if result["prediction"] == "Approved":
                approved_count += 1

        except Exception as e:
            predictions.append(
                PredictionResponse(
                    prediction="Error",
                    probability=0.0,
                    confidence=0.0,
                    risk_level="Unknown",
                    feature_contributions=[],
                    explanation=f"Error processing application: {str(e)}",
                )
            )

    total = len(predictions)
    avg_prob = sum(p.probability for p in predictions) / max(total, 1)

    return BatchPredictionResponse(
        predictions=predictions,
        total=total,
        approved=approved_count,
        rejected=total - approved_count,
        avg_probability=round(avg_prob, 4),
    )


@router.get("/model/info", response_model=ModelInfo)
async def get_model_info():
    """Get information about the loaded model."""
    info = model_service.get_model_info()
    return ModelInfo(**info)


@router.get("/model/features")
async def get_feature_importance():
    """Get feature importance for explainability."""
    importance = model_service.get_feature_importance()
    if not importance:
        raise HTTPException(status_code=404, detail="Feature importance not available.")

    # Sort by importance
    sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
    return {
        "features": [
            {"name": name, "importance": round(imp, 4)}
            for name, imp in sorted_features
        ]
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """API health check endpoint."""
    return HealthResponse(
        status="healthy" if model_service.is_loaded else "degraded",
        model_loaded=model_service.is_loaded,
        uptime_seconds=round(time.time() - START_TIME, 2),
        version="1.0.0",
    )


@router.get("/risk-factors")
async def get_risk_factors(
    annual_income: float = 55000,
    monthly_income: float = 4583,
    loan_amount: float = 15000,
    installment: float = 487.5,
    credit_score: int = 720,
    debt_to_income_ratio: float = 0.25,
    current_balance: float = 12000,
    total_credit_limit: float = 35000,
):
    """Calculate risk factors for a given set of inputs."""
    data = {
        "annual_income": annual_income,
        "monthly_income": monthly_income,
        "loan_amount": loan_amount,
        "installment": installment,
        "credit_score": credit_score,
        "debt_to_income_ratio": debt_to_income_ratio,
        "current_balance": current_balance,
        "total_credit_limit": total_credit_limit,
    }
    factors = calculate_risk_factors(data)
    return factors
