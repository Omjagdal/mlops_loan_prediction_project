"""
FastAPI main application entry point.
Loan Prediction API with MLflow tracking and Prometheus metrics.
"""

import time
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from .routes.predict import router as predict_router
from .services.model_service import model_service


# Prometheus metrics
REQUEST_COUNT = Counter(
    "loan_api_requests_total",
    "Total API requests",
    ["method", "endpoint", "status"],
)
REQUEST_LATENCY = Histogram(
    "loan_api_request_duration_seconds",
    "Request latency in seconds",
    ["method", "endpoint"],
)
PREDICTION_COUNT = Counter(
    "loan_predictions_total",
    "Total predictions made",
    ["result"],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    print("🚀 Starting Loan Prediction API...")
    success = model_service.load_model()
    if success:
        print("✅ Model loaded successfully")
    else:
        print("⚠️  Model failed to load — API will run in degraded mode")
    yield
    # Shutdown
    print("👋 Shutting down Loan Prediction API...")


app = FastAPI(
    title="Loan Prediction API",
    description=(
        "AI-Driven Loan Approval Prediction System with Explainable AI. "
        "Predicts loan approval/rejection based on applicant details with "
        "full feature contribution explanations."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration — supports Vercel frontend + local dev
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
cors_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
# Add Vercel deployment URL if configured
if FRONTEND_URL:
    cors_origins.append(FRONTEND_URL)
# Allow all *.vercel.app subdomains in development
cors_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Track request metrics for Prometheus."""
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code,
    ).inc()

    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path,
    ).observe(duration)

    return response


# Include routes
app.include_router(predict_router, prefix="/api", tags=["Predictions"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Loan Prediction API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
            "path": str(request.url),
        },
    )
