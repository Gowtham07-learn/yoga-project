# Start Electron Development Environment
Write-Host "Starting PoseYoga Electron Development Mode..." -ForegroundColor Green

# Start Vite dev server in background
Write-Host "Starting Vite dev server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# Wait for Vite to be ready
Write-Host "Waiting for Vite server to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if server is up
$maxAttempts = 10
$attempt = 0
$serverReady = $false

while (-not $serverReady -and $attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing
        $serverReady = $true
        Write-Host "✓ Vite server is ready!" -ForegroundColor Green
    }
    catch {
        $attempt++
        Write-Host "Waiting... ($attempt/$maxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if ($serverReady) {
    # Start Electron
    Write-Host "Starting Electron..." -ForegroundColor Cyan
    $env:NODE_ENV = "development"
    npm run electron:start
}
else {
    Write-Host "Failed to start Vite server" -ForegroundColor Red
    Write-Host "Please run 'npm run dev' manually first" -ForegroundColor Yellow
}
