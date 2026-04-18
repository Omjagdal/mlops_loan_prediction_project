#!/bin/bash
# ============================================
# Loan Prediction - Deployment Script
# Targets: Vercel (frontend), Render (backend), Supabase (storage)
# ============================================
set -e

echo "======================================"
echo "LOAN PREDICTION DEPLOYMENT"
echo "======================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# ============================================
# Mode: local | render | full
# ============================================
MODE="${1:-local}"

echo "Mode: $MODE"
echo ""

# -------------------------------------------
# LOCAL: Start backend + frontend locally
# -------------------------------------------
if [ "$MODE" = "local" ]; then
    echo "Starting local development..."

    # Check if model exists
    if [ ! -f "backend/models/model.pkl" ]; then
        echo "No trained model found. Running training pipeline first..."
        bash scripts/train.sh
    fi

    echo ""
    echo "Starting backend (port 8000)..."
    cd backend && uvicorn app.main:app --reload --port 8000 &
    BACKEND_PID=$!
    cd "$PROJECT_ROOT"

    echo "Starting frontend (port 5173)..."
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    cd "$PROJECT_ROOT"

    echo ""
    echo "======================================"
    echo "LOCAL DEPLOYMENT RUNNING"
    echo "======================================"
    echo "  Backend:  http://localhost:8000"
    echo "  Frontend: http://localhost:5173"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo "Press Ctrl+C to stop..."

    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
    wait
    exit 0
fi

# -------------------------------------------
# RENDER: Trigger Render deploy via hook
# -------------------------------------------
if [ "$MODE" = "render" ]; then
    if [ -z "$RENDER_DEPLOY_HOOK_URL" ]; then
        echo "ERROR: RENDER_DEPLOY_HOOK_URL not set"
        echo "Get your deploy hook from Render Dashboard > Settings > Deploy Hook"
        exit 1
    fi

    echo "Triggering Render deploy..."
    curl -s "$RENDER_DEPLOY_HOOK_URL"
    echo ""
    echo "Render deploy triggered. Check Render Dashboard for status."
    exit 0
fi

# -------------------------------------------
# UPLOAD: Upload ML artifacts to Supabase
# -------------------------------------------
if [ "$MODE" = "upload" ]; then
    echo "Uploading ML artifacts to Supabase..."
    python -m ml_pipeline.src.upload_artifacts
    exit 0
fi

# -------------------------------------------
# FULL: Train + Upload + Deploy
# -------------------------------------------
if [ "$MODE" = "full" ]; then
    echo "Step 1: Training ML pipeline..."
    bash scripts/train.sh

    echo ""
    echo "Step 2: Uploading artifacts to Supabase..."
    python -m ml_pipeline.src.upload_artifacts

    echo ""
    echo "Step 3: Triggering Render backend deploy..."
    if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then
        curl -s "$RENDER_DEPLOY_HOOK_URL"
        echo "Render deploy triggered."
    else
        echo "RENDER_DEPLOY_HOOK_URL not set — skipping Render deploy."
    fi

    echo ""
    echo "======================================"
    echo "FULL DEPLOYMENT COMPLETE"
    echo "======================================"
    echo "  Frontend: Deploy via 'git push' (Vercel auto-deploys)"
    echo "  Backend:  Render deploy triggered"
    echo "  Model:    Uploaded to Supabase Storage"
    exit 0
fi

echo "Usage: ./scripts/deploy.sh [local|render|upload|full]"
echo ""
echo "Modes:"
echo "  local   - Start backend + frontend locally (default)"
echo "  render  - Trigger Render deploy via webhook"
echo "  upload  - Upload ML artifacts to Supabase"
echo "  full    - Train + Upload + Deploy"
