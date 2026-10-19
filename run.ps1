# CHURN//ZERO - Single-command runner
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  CHURN//ZERO - Telecommunication Intelligence Platform   " -ForegroundColor Black -BackgroundColor Yellow
Write-Host "  Understand the risk. Decode the decision. Retain.       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
$BackendJob = Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory $BaseDir -PassThru

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Vite Frontend on http://localhost:3000..." -ForegroundColor Cyan
$FrontendDir = Join-Path $BaseDir "frontend"
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $FrontendDir

Write-Host "`n>> CHURN//ZERO is running!" -ForegroundColor Green
Write-Host ">> Backend API docs: http://127.0.0.1:8000/docs" -ForegroundColor Gray
Write-Host ">> Frontend App:     http://localhost:3000" -ForegroundColor Yellow
