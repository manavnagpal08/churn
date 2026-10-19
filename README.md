# CHURN//ZERO

An explainable customer churn workspace for the Semester 5 Data Mining & Data Warehousing decision tree project. It supports dataset analytics, individual risk predictions, tree inspection, model evaluation, customer search, and CSV/XLSX batch scoring.

## Run locally

Use Python 3.13 and Node.js 22.12 or newer. Install dependencies once:

```powershell
python -m pip install -r backend/requirements-dev.txt
npm.cmd ci --prefix frontend
```

Start both services with `./run.ps1`, or run these in separate terminals from the project directory:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
npm.cmd run dev --prefix frontend
```

Open [the workspace](http://localhost:3000). The development frontend proxies `/api` to port 8000. [API documentation](http://localhost:8000/docs) and [readiness](http://localhost:8000/api/health) are available on the backend. Readiness returns 503 if the model is unavailable; startup fails if the dataset cannot load.

## Model and measured results

The latest experiment first audits and preprocesses the data, then compares **22 configurations** of logistic regression, gradient boosting, and CatBoost with five-fold stratified training cross-validation. It tests both the 19 raw account features and 14 additional account/service/billing features. The earlier 17-configuration benchmark also examined CART, random forest, and XGBoost. The latest winner is recorded in `backend/artifacts/preprocessed_training_report.json`.

`Telco_customer_churn.xlsx` contains 7,043 historical rows. The fixed stratified split has 5,634 training rows and 1,409 test rows, seed 42. Identifiers, location metadata, churn scores/reasons/values, CLTV, and targets are excluded from predictive inputs. The audit found 11 blank total charges and no duplicate customer IDs. Blank totals are estimated from tenure and monthly charges; explicit zero totals are preserved. Numeric imputation, categorical encoding, and linear-model scaling are fitted independently inside each training fold. CatBoost uses native categorical inputs. See `backend/artifacts/preprocessing_audit.json` for the source fingerprint and checks.

Selection uses mean training CV accuracy, with F1 as a tie-breaker. Recall, precision, F1, ROC-AUC, balanced accuracy, and average precision are also recorded. The requested accuracy target is **90%**; the app shows whether the actual test result reaches it. Training accuracy is never substituted for held-out accuracy. The test cohort has been examined in prior project experiments and is not new external validation.

The selected predictor is **logistic regression, C=1**, with engineered inputs, one-hot categories, fold-fitted median imputation and numeric scaling. Its five-fold training CV accuracy is **81.54% ± 1.24 percentage points** (standard deviation across folds).

| Held-out measure | Original CART | Previous gradient boosting | New selected predictor |
| --- | ---: | ---: | ---: |
| Accuracy | 79.35% | 80.41% | 80.55% |
| Churn precision | 67.08% | 66.12% | 65.34% |
| Churn recall | 43.58% | 53.74% | 56.95% |
| F1 | 0.5284 | 0.5929 | 0.6086 |
| ROC-AUC | 0.8316 | 0.8547 | 0.8566 |

The 90% target was **not reached**. Accuracy improves by 1.21 percentage points over the original CART, and 0.14 points over the previous predictor. Churn recall improves by 13.37 points over CART. The fitted model is 80.55% accurate on this fixed test cohort; no broader accuracy guarantee is claimed. CatBoost is retained as a training dependency in `requirements-dev.txt`, while production installs only the packages needed for the selected predictor.

[Live website](https://churn-prediction-taupe-six.vercel.app) · [GitHub repository](https://github.com/manavnagpal08/churn)


The fitted predictor and its preprocessor are saved together in `backend/artifacts/predictor_bundle.joblib`. Startup verifies the dataset and artifact SHA-256 against the validation report. Only load trusted locally generated model files. Changed datasets fall back to the reference tree until a fresh benchmark is generated.

The original CART remains a separate reference for tree induction and inspection (Gini, depth 4, minimum leaf size 15, alpha 0). Reference-tree retraining does not change the selected predictor. Local predictor selection applies to the server process. On Vercel, selection is isolated to the browser tab through the request header; exports carry the same selection. Refresh restores the benchmark winner. Hosted reference-tree training is disabled.

Reproduce the latest preprocessing and training experiment:

```powershell
python train_preprocessed.py
```

`--resume` reuses completed training-fold scores; use it only with the same data, candidate order, split, and library versions. `python benchmark_predictors.py` reproduces the earlier multi-family benchmark. `python tune_model.py` reproduces the tree-only search. All reports are retained for comparison.

Explanations come from the actual predictor. Logistic regression uses exact feature × coefficient contributions plus the fitted intercept. CatBoost and XGBoost use native TreeSHAP. Gradient boosting uses exact additive path-difference attribution in log-odds, explicitly identified as not SHAP. CART exposes its exact rule path. Numerical reconstruction is checked before returning a prediction. These explanations describe fitted behavior, not causal effects.

Training was informed by the [scikit-learn training skill](https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/skills/scikit-learn/SKILL.md), official [leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html), and [CatBoost parameter tuning](https://catboost.ai/docs/en/concepts/parameter-tuning). Skill library citation: Kassis, T., Agarwal, V., He, Y., Patel, D., and Brueckner, A. M. (2026), *Scientific Agent Skills: A Library of Procedural Knowledge for Research Agents*, [doi:10.48550/arXiv.2609.00065](https://doi.org/10.48550/arXiv.2609.00065).

## Working flows

- **Command Center:** dataset counts, historical churn distribution, contract and tenure breakdowns.
- **Prediction Studio:** realistic service combinations, presets, input validation, current prediction, and model-specific explanations. Changing inputs clears the previous result. Explicit zero total charges are preserved; omitted totals are estimated as tenure Ã— monthly charges.
- **Tree Observatory:** separate reference-tree configuration, protected retraining, independent Gini/entropy comparison, pan/zoom, fit-to-view, and keyboard-selectable nodes. Node counts and probabilities support modern scikit-learn proportions correctly.
- **Evaluation Lab:** measured confusion matrix, accuracy, precision, recall, F1, ROC-AUC, model-family comparison, explicit predictor switching, downloadable evaluation evidence, and an optional administrator token field. The token stays in tab memory.
- **Customer Portfolio:** literal-text search, filters, sorting, pagination, matching CSV exports, and explicit load errors. Exports include historical labels separately from predictions.
- **Batch scoring:** download a template, upload CSV or XLSX, preview ten results, and download every scored row. Limits: 4 MB compressed upload on Vercel (10 MB locally), 100 MB expanded workbook, 10,000 rows. Invalid categories, negative/nonfinite numbers, and inconsistent service combinations are rejected with row errors. Uploaded data is scored in memory and is not appended to the historical dataset.
- **Methodology:** reachable project documentation and interpretation limits.

Risk bands remain unchanged: high â‰¥60%, moderate â‰¥30% and <60%, low <30%. Classification uses the active model's class decision, separately from operational risk bands. Historical correlations and feature importance do not establish causation. CART probabilities are leaf cohort estimates; logistic and boosted probabilities come from their fitted model scores. These probabilities have no separate calibration guarantee in this experiment.

## Production build

```powershell
npm.cmd run build --prefix frontend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 1
```

When `frontend/dist` exists, FastAPI serves the built frontend and API from the same origin. The app uses hash routing, so bookmarked pages work without frontend rewrite configuration. A Dockerfile and Compose configuration provide the same single-process deployment. Container execution requires Docker and was not validated in this environment.

```powershell
docker compose up --build -d
```

Compose binds port 8000 to localhost. Put an authenticated HTTPS gateway in front of the app before granting access to real customer records. This project does not implement user accounts, role-based dataset access, a persistent audit log, multi-worker model coordination, or monitoring infrastructure; those are deployment requirements for a shared customer-data system, not implied certifications.

Configuration (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `CHURN_ENV=production` | Disables model mutation unless an admin token is configured. |
| `CHURN_ADMIN_TOKEN` | Backend secret for `POST /api/model/train` and `POST /api/model/select`; enter it in Evaluation Lab when needed. Never put it in frontend build variables. |
| `CORS_ORIGINS` | Comma-separated exact frontend origins; defaults to localhost:3000 and 127.0.0.1:3000. Same-origin builds do not need CORS. |
| `VITE_API_BASE_URL` | Optional frontend API root for a separately hosted API; defaults to `/api`. Set at frontend build time. |

The backend does not load `.env` implicitly. Set variables in your shell/service environment, or use Docker Compose's `.env` support. Do not commit real tokens. The read/predict/export API is intended to sit behind the deployment's access gateway; the model admin token protects model changes, not dataset access. Vercel hosts the frontend and FastAPI as separate services defined in `vercel.json`. The saved fitted model is included in the backend deployment. Run `vercel deploy --prod` from the project root with the linked account. Do not enable model training on the hosted service.

## Verification

```powershell
python -m unittest test_application -v
npm.cmd run build --prefix frontend
npm.cmd run lint --prefix frontend
python verify_deployment.py https://churn-prediction-taupe-six.vercel.app
```

Regression coverage includes real metric consistency, no overlapping train/test rows, exclusion of leakage fields, tree counts and probabilities, single/batch agreement, explicit-zero handling, invalid inputs, concurrent read-only comparison, complete batches beyond 500 rows, CSV/XLSX/template uploads, literal search, empty and filtered exports, model mutation authorization, predictor switching, independence of the reference tree, and additive explanation reconstruction.

The responsive UI was checked in the desktop app browser. Physical-device behavior still requires verification on real hardware.
