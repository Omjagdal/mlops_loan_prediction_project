# 🏦 AI-Driven Loan Approval Prediction System

<p align="center">
  <strong>End-to-End MLOps Pipeline | Explainable AI | Production-Ready</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/MLflow-2.15-0194E2?style=flat-square&logo=mlflow" alt="MLflow">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Kubernetes-Ready-326CE5?style=flat-square&logo=kubernetes" alt="K8s">
</p>

---

## 📋 Overview

A **production-ready machine learning system** that predicts loan approval/rejection using applicant details (income, credit history, loan amount, etc.) with an end-to-end MLOps lifecycle.

### ✨ Key Features

- 🎯 **Real-time Predictions** — Submit loan applications via a premium web interface
- 🧠 **Explainable AI** — Feature contribution analysis for every prediction
- 📊 **Model Performance Dashboard** — Accuracy, ROC curves, confusion matrices
- 🧪 **MLflow Experiment Tracking** — Version models, compare runs, manage registry
- 🐳 **Containerized** — Full Docker Compose stack with 5 services
- ☸️ **Kubernetes-Ready** — Deployments, services, HPA auto-scaling
- 📈 **Prometheus + Grafana** — Live monitoring dashboards
- 🔄 **CI/CD Pipeline** — GitHub Actions → ECR → EKS

---

## 🏗️ Architecture

```
React Frontend (Carbon Mint Dark Mode)
        │
        ▼
   FastAPI Backend ──► ML Model (scikit-learn)
        │
        ▼
   MLflow (Tracking & Versioning)
        │
        ▼
   Docker Containers
        │
        ▼
   Kubernetes Cluster (AWS EKS)
        │
        ▼
   Prometheus → Grafana (Monitoring)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)

### 1. Clone & Install

```bash
# Clone the repository
git clone <repo-url>
cd "MLOPS LOAN PREICCTION PROJECT"

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Run ML Pipeline

```bash
# Run complete training pipeline
bash scripts/train.sh

# Or run steps individually:
python -m ml_pipeline.src.data_preprocessing
python -m ml_pipeline.src.train
python -m ml_pipeline.src.evaluate
```

### 3. Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open Dashboard
Navigate to **http://localhost:5173**

---

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# Services:
# Backend:    http://localhost:8000
# Frontend:   http://localhost:3000
# MLflow:     http://localhost:5000
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3001
```

---

## 📁 Project Structure

```
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # App entry point
│   │   ├── routes/            # API endpoints
│   │   ├── schemas/           # Pydantic models
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   ├── models/                # Trained model files
│   ├── mlflow/                # MLflow configuration
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # Reusable components
│   │   ├── context/           # React context
│   │   ├── pages/             # 6 dashboard pages
│   │   └── index.css          # Carbon Mint design system
│   ├── Dockerfile
│   └── package.json
│
├── ml_pipeline/                # ML training pipeline
│   ├── data/
│   │   ├── raw/               # Raw dataset (20,000 records)
│   │   └── processed/         # Processed train/test data
│   ├── src/
│   │   ├── data_preprocessing.py
│   │   ├── train.py           # Model training + MLflow
│   │   ├── evaluate.py
│   │   └── register_model.py
│   └── experiments/           # Training results
│
├── k8s/                        # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
│
├── monitoring/                 # Prometheus + Grafana
│   ├── prometheus.yml
│   └── grafana/dashboards/
│
├── scripts/                    # Automation scripts
│   ├── train.sh
│   └── deploy.sh
│
├── .github/workflows/          # CI/CD pipeline
│   └── ci-cd.yml
│
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 🛠️ Technologies

| Category | Tools |
|----------|-------|
| **Frontend** | React 18, Vite, Recharts, React Router |
| **Backend** | Python, FastAPI, Pydantic |
| **ML** | scikit-learn, pandas, numpy |
| **MLOps** | MLflow (tracking, registry) |
| **Containerization** | Docker, Docker Compose |
| **Orchestration** | Kubernetes, HPA |
| **Cloud** | AWS (ECR, EKS) |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus, Grafana |

---

## 📊 Model Performance

| Model | Accuracy | Precision | Recall | F1 | AUC |
|-------|----------|-----------|--------|-------|------|
| **Random Forest** ⭐ | 94.2% | 92.1% | 95.7% | 93.8% | 96.7% |
| Gradient Boosting | 93.5% | 91.8% | 94.2% | 93.0% | 95.9% |
| Logistic Regression | 88.7% | 86.3% | 90.1% | 88.2% | 91.4% |

---

## 🎨 UI Design

The dashboard uses the **Carbon Mint Dark Mode** design system:
- **Background**: Deep anthracite `#1A1A1A`
- **Accent**: Glowing mint `#00FFC2`
- **Typography**: Inter (clean sans-serif)
- **Style**: Glassmorphism cards with subtle mint borders
- **Animations**: Smooth transitions, pulse indicators, gauge widgets

UI designed with [Google Stitch](https://stitch.withgoogle.com) for pixel-perfect precision.

---

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Metrics**: http://localhost:8000/metrics

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/predict` | Single loan prediction |
| `POST` | `/api/predict/batch` | Batch predictions |
| `GET` | `/api/model/info` | Model metadata |
| `GET` | `/api/model/features` | Feature importance |
| `GET` | `/api/health` | Health check |

---

## 📄 License

MIT License

