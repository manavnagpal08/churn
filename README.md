# CHURN//ZERO
> **Understand the risk. Decode the decision. Retain the customer.**

An exceptional, production-grade AI analytics and intelligence platform built for an academic microproject in **Data Mining & Data Warehousing (Semester 5)**: *Customer Churn Prediction using Decision Tree Induction*.

**Live Production Deployment on Vercel:** [https://churn-prediction-taupe-six.vercel.app](https://churn-prediction-taupe-six.vercel.app)  
**Alternative Production URL:** [https://churn-prediction-1ybmh71io-manavnagpal08s-projects.vercel.app](https://churn-prediction-1ybmh71io-manavnagpal08s-projects.vercel.app)

---

## 1. Product Overview

**CHURN//ZERO** is an interpretability-first telecom churn intelligence platform designed to replace black-box opacity with transparent, audit-ready decision tree logic. Built strictly around the mandatory dataset `Telco_customer_churn.xlsx`, CHURN//ZERO empowers stakeholders to explore historical subscriber cohorts, predict individual subscriber churn, inspect the exact decision path traversed through the tree, and interact with the full induction topology.

### Visual Identity & Design System
- **Editorial White Interface:** Warm white (`#FFFFFF`) primary canvas paired with soft ivory (`#FFFDF7`).
- **Signature Accents:** Vibrant caution yellow (`#FFD43B`) for interactive emphasis, active states, and focus metrics; high-risk red (`#EF4444`) for churn hazards.
- **Typography:** High-contrast sans-serif (`Geist` / `Inter`) with compact uppercase monospace telemetry and generous editorial whitespace.

---

## 2. Machine Learning Architecture

In strict compliance with academic requirements, **Decision Tree classification** is the sole predictive engine:
- **Algorithm:** CART (Classification and Regression Trees) via `sklearn.tree.DecisionTreeClassifier`.
- **Criteria:** Gini Impurity ($G = 1 - \sum p_i^2$) and Shannon Entropy / Information Gain ($H = -\sum p_i \log_2 p_i$).
- **No Disallowed Models:** No Random Forest, XGBoost, Logistic Regression, SVMs, neural networks, or external AI APIs.
- **Zero Data Leakage:** Customer identifiers (`CustomerID`), constants (`Count`, `Country`, `State`), spatial coordinates (`City`, `Zip Code`, `Lat Long`), and post-churn leakage fields (`Churn Value`, `Churn Score`, `Churn Reason`, `CLTV`) were completely purged from model inputs.
- **Rigorous Validation Protocol:** Preprocessing is strictly fitted **only** on training data (80% stratified split with fixed seed `random_state=42`). Evaluation is measured exclusively on held-out test data (1,409 verified customer records).

### Empirical Model Performance (Held-out Test Cohort)
| Metric | CART (Gini Impurity) | CART (Shannon Entropy) |
| :--- | :--- | :--- |
| **Test Accuracy** | **79.42%** | **79.13%** |
| **ROC-AUC** | **0.8361** | **0.8354** |
| **Test Precision** | **61.60%** | **63.42%** |
| **Test Recall** | **59.63%** | **52.67%** |
| **Test F1-Score** | **0.6060** | **0.5755** |
| **Held-out Test Cohort** | 1,409 customers (20%) | 1,409 customers (20%) |
| **Training Cohort** | 5,634 customers (80%) | 5,634 customers (80%) |

*Note: In telecommunications, Recall is prioritized because False Negatives (unintercepted subscriber loss) incur direct churn penalties, whereas False Positives (promotional outreach to loyal customers) carry low operational cost.*

---

## 3. Key Pages & Features

### 1. The Command Center
- Asymmetric editorial hero: *"Every customer tells a story. Decode the ones at risk."*
- Live telemetry calculated from the 7,043 verified records in `Telco_customer_churn.xlsx` (Total Customers, Churned Count, Retained Count, Historical Churn Rate: 26.54%, Held-out Test Accuracy: 79.42%).
- Target distribution composition, contract-type breakdown, and tenure lifecycle distribution.
- Real-time system and model status badge.

### 2. Customer Prediction Studio
- Interactive customer parameter simulator organized into 4 intuitive categories:
  1. *Customer Profile:* Gender, Senior Citizen status, Partner, Dependents.
  2. *Account Information:* Tenure Months (0–72 range slider), Contract agreement, Paperless billing.
  3. *Service Subscriptions:* Phone service, Multiple lines, Internet service (Fiber/DSL), Security, Tech Support, Streaming.
  4. *Billing & Payment:* Payment method, Monthly charges, Total charges.
- Quick archetype presets: *High Risk Archetype*, *Moderate Case*, *Retained Cohort*.
- **Instant Decision Path Breakdown:** Traces the exact node-by-node Boolean conditions evaluated through the fitted CART tree, revealing the exact thresholds, node sample sizes, and local cohort churn probabilities leading to the terminal leaf.
- Configurable operational risk bands: High Risk ($\ge 60\%$), Moderate Risk ($30\% - 60\%$), Low Risk ($< 30\%$).

### 3. Decision Tree Observatory
- Interactive SVG visualization of the actual fitted decision tree.
- Pan, zoom, node selection, and floating node inspector panel.
- Visual highlighting of tree traversal paths and terminal churn leaves.
- Hyperparameter controls: Configurable `max_depth` (2–10), `min_samples_leaf` (5–100), and cost-complexity pruning (`ccp_alpha`).
- Real-time on-demand tree retraining with instant visualization update.
- Academic side-by-side benchmark modal comparing Gini vs Entropy induction.

### 4. Pattern Intelligence
- Exploratory data analytics strictly computed from historical dataset records.
- Churn by Contract Type (Month-to-month: 42.7% vs 2-Year: 2.8%).
- Churn across Tenure Windows (0-12 Mo acute hazard: 47.7% vs 61-72 Mo: 6.6%).
- Connectivity architecture (Fiber Optic vs DSL) and support services adoption (Tech Support churn: 15.2% with support vs 41.6% without).
- Payment method friction (Electronic check: 45.3% vs Automated: 16%).
- Impurity-based feature importance ranking extracted directly from fitted tree splits.
- Prominent academic non-causation disclaimer.

### 5. Model Evaluation Lab
- Confusion Matrix drilldown (True Negatives, False Positives, False Negatives, True Positives).
- Receiver Operating Characteristic (ROC) curve plot with sensitivity analysis.
- Detailed classification report and side-by-side Train vs Held-out Test generalization comparison.
- Narrative analysis explaining why Recall is the vital metric for telecom customer retention.

### 6. Customer Portfolio & Batch Inference
- Searchable, filterable, sortable ledger of all 7,043 customers from `Telco_customer_churn.xlsx`.
- Strict distinction between historical ground-truth churn labels and model-predicted outcomes.
- Batch prediction file upload accepting external CSV or Excel datasets with automated schema verification.
- One-click CSV export of subscriber records augmented with model predictions and risk tiers.

### 7. Methodology & Project Documentation
- Comprehensive academic documentation for university microproject review.
- Mathematical formulations for Gini Impurity, Shannon Entropy, and Information Gain.
- Explicit distinction between textbook multi-way ID3 and Scikit-learn's binary entropy CART induction.
- Epistemic boundaries and dataset limitations.

---

## 4. Project Structure

```
f:\PROJECTS\DMDW PROJECT SEM - 5\
├── Telco_customer_churn.xlsx       # Mandatory verified Telco Excel dataset
├── run.ps1                         # One-command PowerShell startup script
├── run.bat                         # One-command Windows Batch startup script
├── README.md                       # Complete platform documentation
├── backend/
│   ├── main.py                     # FastAPI REST server & endpoint controllers
│   ├── pipeline.py                 # Data loading, leakage removal, CART training, tree JSON & tracer
│   ├── models.py                   # Pydantic schemas & validation models
│   ├── requirements.txt            # Python dependency manifest
│   └── artifacts/                  # Persisted joblib model pipelines
└── frontend/
    ├── package.json                # Frontend dependency manifest
    ├── vite.config.ts              # Vite configuration with proxy to FastAPI backend
    ├── tsconfig.json               # TypeScript configuration
    ├── index.html                  # HTML entry with custom typography & favicon
    └── src/
        ├── App.tsx                 # Root application state & page routing
        ├── index.css               # Tailwind CSS styles & design system colors
        ├── types/                  # Typed interfaces for API, trees, and analytics
        ├── services/api.ts         # REST API client
        ├── components/
        │   ├── Navbar.tsx          # Wordmark, live model badge & navigation pills
        │   └── DecisionTreeViewer.tsx # Interactive SVG tree explorer (pan, zoom, inspect)
        └── pages/
            ├── CommandCenter.tsx   # Page 1: Hero & dataset telemetry
            ├── PredictionStudio.tsx# Page 2: Customer input & decision path tracer
            ├── TreeObservatory.tsx # Page 3: Interactive tree visualizer & retrain lab
            ├── PatternIntelligence.tsx # Page 4: Exploratory analytics & feature importance
            ├── ModelEvaluationLab.tsx  # Page 5: Confusion matrix & ROC diagnostics
            ├── CustomerPortfolio.tsx   # Page 6: Paginated table & batch upload/export
            └── MethodologyPage.tsx     # Page 7: Academic documentation & formulas
```

---

## 5. Quick Start Instructions

### Prerequisites
- Python 3.10+ (with `pandas`, `scikit-learn`, `fastapi`, `uvicorn`, `openpyxl`, `joblib`)
- Node.js v18+ and `npm`

### Option 1: One-Command Startup (Recommended)

In PowerShell:
```powershell
.\run.ps1
```

Or in Windows Command Prompt:
```cmd
run.bat
```

### Option 2: Manual Terminal Startup

**Terminal 1 — Backend:**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Web Application is available at: [http://localhost:3000](http://localhost:3000)*

---

## 6. Academic Integrity & Limitations

1. **Dataset Authenticity:** All analytics and predictions are derived exclusively from `Telco_customer_churn.xlsx`. No synthetic records, mocked accuracy figures, or external LLMs were utilized.
2. **Causation vs Predictive Association:** Feature importance reflects node split purity reduction within this specific sample cohort and does not imply direct causal intervention.
3. **Generalization:** Performance metrics (~79.4% test accuracy) reflect held-out test records from this historical dataset and serve as probabilistic guidance rather than guaranteed business outcomes.
