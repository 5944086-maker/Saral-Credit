# Saral Credit - Start Backend + Frontend

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = "C:\Users\Admin\.local\bin\python3.11.exe"
$venvPath = "$root\backend\.venv"
$nodePath = "C:\nodejs\node-v20.18.0-win-x64"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Saral Credit - Starting Project      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fix PATH for Node
$env:PATH = "$nodePath;" + $env:PATH

# Recreate venv if broken or missing
if (-Not (Test-Path "$venvPath\Scripts\uvicorn.exe")) {
    Write-Host "[0/2] Setting up virtual environment..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $venvPath -ErrorAction SilentlyContinue
    & $python -m venv $venvPath
    Write-Host "      Installing packages (2-3 min first time)..." -ForegroundColor Gray
    & "$venvPath\Scripts\pip.exe" install -r "$root\backend\requirements.txt"
    & "$venvPath\Scripts\pip.exe" install email-validator
    Write-Host "      Setup done!" -ForegroundColor Green
}

# Start Backend
Write-Host "[1/2] Starting Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root\backend'; & '$venvPath\Scripts\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8000 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 5

# Start Frontend
Write-Host "[2/2] Starting Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:PATH = 'C:\nodejs\node-v20.18.0-win-x64;' + `$env:PATH; cd '$root\frontend'; node_modules\.bin\vite.cmd"
) -WindowStyle Normal

Start-Sleep -Seconds 5

# Open both tabs in Chrome
Write-Host "Opening Chrome..." -ForegroundColor Yellow
Start-Process $chrome "http://localhost:3000/login"
Start-Sleep -Seconds 1
Start-Process $chrome "http://localhost:3000/admin/login"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Project is LIVE!                      " -ForegroundColor Cyan
Write-Host "  User  App  : http://localhost:3000     " -ForegroundColor Green
Write-Host "  Admin Panel: http://localhost:3000/admin/login" -ForegroundColor Green
Write-Host "  Backend API: http://localhost:8000     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Admin Email    : admin@creditscoring.com" -ForegroundColor Magenta
Write-Host "  Admin Password : Admin@123456           " -ForegroundColor Magenta
Write-Host ""
