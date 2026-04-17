# PowerShell script to run E2E tests with Playwright
# This script ensures all services are running before executing tests

$ErrorActionPreference = "Stop"

Write-Host "=== Tickets Folder E2E Test Runner ===" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: docker-compose.yml not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "Starting services with Docker Compose..." -ForegroundColor Yellow
docker compose up -d

# Wait for services to be healthy
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow

# Wait for PostgreSQL
Write-Host "Waiting for PostgreSQL..." -NoNewline
$timeout = 60
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        docker compose exec -T postgres pg_isready -U postgres 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " Ready!" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $elapsed += 2
}
if ($elapsed -ge $timeout) {
    Write-Host " Failed to start" -ForegroundColor Red
    docker compose logs postgres
    exit 1
}

# Wait for backend API
Write-Host "Waiting for Backend API..." -NoNewline
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health/ready" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host " Ready!" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $elapsed += 2
}
if ($elapsed -ge $timeout) {
    Write-Host " Failed to start" -ForegroundColor Red
    docker compose logs api
    exit 1
}

# Wait for frontend
Write-Host "Waiting for Frontend..." -NoNewline
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host " Ready!" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $elapsed += 2
}
if ($elapsed -ge $timeout) {
    Write-Host " Frontend not running on port 5173. You may need to start it manually with 'cd frontend && npm run dev'" -ForegroundColor Yellow
}

# Check if Playwright is installed
try {
    python -c "import playwright" 2>&1 | Out-Null
} catch {
    Write-Host "Playwright not found. Installing..." -ForegroundColor Yellow
    pip install pytest-playwright playwright
    playwright install chromium
}

# Run E2E tests
Write-Host "Running E2E tests..." -ForegroundColor Green

# Parse command line arguments
$Browser = "chromium"
$Headed = ""
$SlowMo = ""
$TestFile = ""
$Verbose = "-v"
$ExtraArgs = @()

for ($i = 0; $i -lt $args.Count; $i++) {
    switch ($args[$i]) {
        "--browser" {
            $Browser = $args[$i + 1]
            $i++
        }
        "--headed" {
            $Headed = "--headed"
        }
        "--slowmo" {
            $SlowMo = "--slowmo $($args[$i + 1])"
            $i++
        }
        "--file" {
            $TestFile = $args[$i + 1]
            $i++
        }
        "--debug" {
            $Headed = "--headed"
            $SlowMo = "--slowmo 1000"
            $ExtraArgs += "--pause-on-failure"
        }
        default {
            $ExtraArgs += $args[$i]
        }
    }
}

# Build pytest command
$TestPath = "tests/e2e/"
if ($TestFile) {
    $TestPath = "tests/e2e/$TestFile"
}

$PytestArgs = @($TestPath, $Verbose, "--browser", $Browser)
if ($Headed) { $PytestArgs += $Headed }
if ($SlowMo) { $PytestArgs += $SlowMo.Split(" ") }
$PytestArgs += $ExtraArgs

Write-Host "Running: pytest $($PytestArgs -join ' ')" -ForegroundColor Yellow
& pytest @PytestArgs

$TestExitCode = $LASTEXITCODE

# Show test results
if ($TestExitCode -eq 0) {
    Write-Host "=== All E2E tests passed! ===" -ForegroundColor Green
} else {
    Write-Host "=== Some E2E tests failed ===" -ForegroundColor Red
    Write-Host "Check test artifacts in tests/e2e/test-results/" -ForegroundColor Yellow
    Write-Host "View HTML report: playwright show-report tests/e2e/playwright-report" -ForegroundColor Yellow
}

# Ask if user wants to stop services
$response = Read-Host "Stop Docker services? (y/N)"
if ($response -match "^[Yy]$") {
    Write-Host "Stopping services..." -ForegroundColor Yellow
    docker compose down
    Write-Host "Services stopped." -ForegroundColor Green
}

exit $TestExitCode
