#!/bin/bash
# ============================================
# Loan Prediction - Training Pipeline Script
# V2: Enhanced with overfitting checks and Supabase upload
# ============================================
set -e

# Suppress scikit-learn warnings from flooding the logs
export PYTHONWARNINGS="ignore"

echo "======================================"
echo "LOAN PREDICTION TRAINING PIPELINE V2"
echo "======================================"

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Virtual environment activated (venv)"
elif [ -d "vnev" ]; then
    source vnev/bin/activate
    echo "Virtual environment activated (vnev)"
fi

# Step 1: Generate dataset (if needed)
if [ ! -f "ml_pipeline/data/raw/loan_dataset_20000.csv" ]; then
    echo ""
    echo "Step 1: Generating dataset..."
    python -m ml_pipeline.src.generate_dataset
else
    echo ""
    echo "Step 1: Dataset already exists, skipping generation"
fi

# Step 2: Data preprocessing
echo ""
echo "Step 2: Running data preprocessing..."
python -m ml_pipeline.src.data_preprocessing

# Step 3: Model training (V2 — with class balancing)
echo ""
echo "Step 3: Training models (V2 — balanced classes)..."
python -m ml_pipeline.src.train

# Step 4: Model evaluation (V2 — with deployment readiness check)
echo ""
echo "Step 4: Evaluating model (V2 — deployment gate)..."
python -m ml_pipeline.src.evaluate

# Step 5: Register model (optional)
echo ""
echo "Step 5: Registering model..."
python -m ml_pipeline.src.register_model || echo "Model registration skipped (MLflow server may not be running)"

# Step 6: Upload to Supabase (optional — if env vars set)
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
    echo ""
    echo "Step 6: Uploading artifacts to Supabase..."
    python -m ml_pipeline.src.upload_artifacts
else
    echo ""
    echo "Step 6: Supabase upload skipped (SUPABASE_URL/SUPABASE_KEY not set)"
fi

echo ""
echo "======================================"
echo "TRAINING PIPELINE V2 COMPLETE"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Start the backend: cd backend && uvicorn app.main:app --reload"
echo "  2. Start the frontend: cd frontend && npm run dev"
echo "  3. Open http://localhost:5173"
echo ""
echo "  Or run: bash scripts/deploy.sh local"
