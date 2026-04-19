# Enterprise MLOps Architecture: Loan Prediction System

This document outlines the complete, end-to-end architecture of the **LoanAI Prediction System**. It details every Machine Learning Operations (MLOps) component, how they are connected, and the specific role they play in the automated CI/CD pipeline.

---

## 1. Project Overview
LoanAI is an enterprise-grade machine learning application designed to predict whether a loan applicant should be strictly Approved or Rejected. Because it handles financial data, the system goes far beyond a simple Jupyter Notebook: it features automated data versioning, strict deployment security gates, cloud model registries, and decoupled microservices.

### Tech Stack
- **Frontend**: React (Vite) hosted on Vercel
- **Backend API**: Python FastAPI hosted on Render
- **Machine Learning**: Scikit-Learn, Pandas, MLflow
- **Cloud Registry**: Supabase (PostgreSQL / S3-compatible cloud storage)
- **CI/CD Pipeline**: GitHub Actions

---

## 2. The Machine Learning Pipeline
The ML Pipeline acts as the "Brain" of the application. It runs completely autonomously whenever data or model logic is updated.

1. **Dataset Generation / Ingestion (`generate_dataset.py`)**: 
   Simulates or ingests raw loan applicant records (e.g., 20,000 rows).
2. **Data Preprocessing (`data_preprocessing.py`)**: 
   Cleans the raw data and engineers 55 highly predictive financial features (e.g., `financial_stress_index`, `income_adequacy_ratio`). It handles missing values and encodings.
3. **Model Training (`train.py`)**:
   Runs rigorous cross-validation (GridSearchCV) across multiple algorithms (RandomForest, GradientBoosting, LogisticRegression). It selects the optimal hyper-parameters.
4. **Evaluation & Readiness Gates (`evaluate.py`)**:
   *This is a critical MLOps safety feature.* Before allowing a model to be deployed, this script enforces two strict rules:
   - **Overfitting Check**: The gap between Training Accuracy and Test Accuracy cannot exceed exactly 5%.
   - **Class Bias Check**: It must predict both "Approved" and "Rejected" classes with at least 65% recall to prevent biased discrimination.

If the model fails these tests, the entire CI/CD pipeline halts, preventing a broken model from reaching production.

---

## 3. MLOps Operations Explained

To achieve "Continuous Integration and Continuous Deployment" (CI/CD), we use specific MLOps tools to handle the complexities of data logic.

### A. DVC (Data Version Control)
**What it is:** Git is designed for text files, not 30MB `.csv` datasets or heavy `model.pkl` binaries. DVC fixes this.
**How we use it:** DVC runs locally to version-control the actual models and datasets. It places lightweight `.dvc` placeholder files into Git while protecting the underlying heavy `.pkl` binaries. If we ever need to revert to last month's model, `dvc checkout` immediately swaps the binaries to the correct historical version.

### B. MLFlow (Experiment Tracking)
**What it is:** A tool used to log algorithms, parameters, and metrics during training.
**How we use it:** While training, MLflow logs every hyper-parameter, accuracy metric, and F1 score into an SQLite database (`mlflow.db`). This allows data scientists to graphically compare why *GradientBoosting* beat *RandomForest* over historical runs.

### C. Supabase (The Model Registry)
**What it is:** A secure, cloud-based storage system.
**How we use it:** We do NOT compile machine learning binaries into our backend Docker container. Instead, Supabase acts as a centralized "Model Registry." When the ML Pipeline succeeds, it pushes `model.pkl` to Supabase. When the FastAPI server boots up on Render, it dynamically downloads the model directly from Supabase into memory.

### D. Monorepo CI/CD (GitHub Actions)
**What it is:** Automated cloud servers that execute tasks based on file changes.
**How we use it:** We have implemented a decoupled "Monorepo Routing" architecture with 3 independent pipelines:
- **`frontend-cd.yml`**: If UI files change, it builds the React app and deploys to **Vercel** within 30 seconds.
- **`backend-cd.yml`**: If API routing files change, it lints the code and triggers the **Render** deployment hook.
- **`ml-pipeline-cd.yml`**: If Python ML algorithms change, this triggers the heavy 6-minute compute instance. It trains the model, runs the safety gates, uploads the `.pkl` to **Supabase**, and sends an invisible webhook "ping" to **Render** to reboot the backend so it can download the new model.

This decoupling saves astronomical compute costs and ensures rapid iteration speeds for developers.

---

## 4. The Request Lifecycle (In Production)

When a Loan Officer or Customer uses the live application:
1. The user visits the Vercel-hosted React frontend.
2. They input their financial details and click "Predict".
3. Vercel sends a JSON `POST` request to the FastAPI Render server (`VITE_API_URL`).
4. The FastAPI server, keeping the Supabase-downloaded Gradient Boosting model in warm memory, executes a `.predict_proba()` calculation.
5. The API returns an Approved/Rejected status along with a % Confidence Score back to the user within milliseconds.
