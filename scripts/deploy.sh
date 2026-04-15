#!/bin/bash
# ============================================
# Loan Prediction - Deployment Script
# ============================================
set -e

echo "======================================"
echo "🚀 LOAN PREDICTION DEPLOYMENT"
echo "======================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="${ECR_REPO:-loan-prediction}"
K8S_NAMESPACE="${K8S_NAMESPACE:-loan-prediction}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"

echo "📋 Configuration:"
echo "   Region: $AWS_REGION"
echo "   ECR Repo: $ECR_REPO"
echo "   Tag: $IMAGE_TAG"
echo "   Namespace: $K8S_NAMESPACE"
echo ""

# Step 1: Build Docker images
echo "🐳 Step 1: Building Docker images..."
docker build -t ${ECR_REPO}-backend:${IMAGE_TAG} ./backend
docker build -t ${ECR_REPO}-frontend:${IMAGE_TAG} ./frontend
echo "✅ Images built successfully"

# Step 2: Run with Docker Compose (local)
if [ "$1" = "local" ]; then
    echo ""
    echo "🏠 Deploying locally with Docker Compose..."
    docker-compose up -d
    echo "✅ Local deployment complete"
    echo "   Backend: http://localhost:8000"
    echo "   Frontend: http://localhost:3000"
    echo "   MLflow: http://localhost:5000"
    echo "   Prometheus: http://localhost:9090"
    echo "   Grafana: http://localhost:3001"
    exit 0
fi

# Step 3: Push to ECR (cloud deployment)
echo ""
echo "📤 Step 2: Pushing to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
docker tag ${ECR_REPO}-backend:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}-backend:${IMAGE_TAG}
docker tag ${ECR_REPO}-frontend:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}-frontend:${IMAGE_TAG}
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}-backend:${IMAGE_TAG}
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}-frontend:${IMAGE_TAG}

# Step 4: Deploy to Kubernetes
echo ""
echo "☸️  Step 3: Deploying to Kubernetes..."
kubectl create namespace $K8S_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/ -n $K8S_NAMESPACE
kubectl set image deployment/loan-prediction-backend backend=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}-backend:${IMAGE_TAG} -n $K8S_NAMESPACE
kubectl set image deployment/loan-prediction-frontend frontend=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}-frontend:${IMAGE_TAG} -n $K8S_NAMESPACE

# Step 5: Wait for rollout
echo ""
echo "⏳ Step 4: Waiting for rollout..."
kubectl rollout status deployment/loan-prediction-backend -n $K8S_NAMESPACE --timeout=300s
kubectl rollout status deployment/loan-prediction-frontend -n $K8S_NAMESPACE --timeout=300s

echo ""
echo "======================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "======================================"
kubectl get pods -n $K8S_NAMESPACE
echo ""
kubectl get services -n $K8S_NAMESPACE
