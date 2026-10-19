@echo off
echo ==========================================================
echo   CHURN//ZERO - Telecommunication Intelligence Platform
echo   Understand the risk. Decode the decision. Retain.
echo ==========================================================

echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000...
start "CHURN//ZERO Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Vite Frontend on http://localhost:3000...
start "CHURN//ZERO Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================================
echo CHURN//ZERO is launching!
echo Backend API docs: http://127.0.0.1:8000/docs
echo Frontend App:     http://localhost:3000
echo ==========================================================
