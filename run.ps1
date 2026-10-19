$ErrorActionPreference = 'Stop'
$ProjectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDirectory = Join-Path $ProjectDirectory 'frontend'
if (-not (Test-Path -LiteralPath (Join-Path $FrontendDirectory 'node_modules'))) {
    throw 'Install frontend dependencies first: npm.cmd ci --prefix frontend'
}
$BackendProcess = Start-Process -FilePath 'python' -ArgumentList '-m uvicorn backend.main:app --host 127.0.0.1 --port 8000' -WorkingDirectory $ProjectDirectory -WindowStyle Hidden -PassThru
try {
    $Ready = $false
    for ($Attempt = 0; $Attempt -lt 60; $Attempt++) {
        if ($BackendProcess.HasExited) { throw 'Backend failed to start. Run the backend command directly to see the error.' }
        try {
            $Response = Invoke-RestMethod 'http://127.0.0.1:8000/api/health' -TimeoutSec 2
            if ($Response.ready) { $Ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $Ready) { throw 'Backend did not become ready. Check dependencies and the dataset.' }
    Write-Host 'Workspace: http://localhost:3000. Press Ctrl+C to stop.' -ForegroundColor Green
    Push-Location $FrontendDirectory
    try { & npm.cmd run dev } finally { Pop-Location }
} finally {
    if (-not $BackendProcess.HasExited) { Stop-Process -Id $BackendProcess.Id }
}
