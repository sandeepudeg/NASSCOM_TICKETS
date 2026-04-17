@echo off
REM TicketIQ Local Development Setup for Windows
REM This script helps you run the unified design system locally

echo 🎫 TicketIQ - Unified Design System Local Setup
echo ==============================================

REM Load local environment variables
if exist ".env.local" (
    echo 📋 Loading local environment configuration...
    for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do (
        if not "%%a"=="" if not "%%a"=="REM" if not "%%a"=="#" (
            set "%%a=%%b"
        )
    )
    echo ✅ Local environment loaded
) else (
    echo ⚠️  .env.local not found, using default settings
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check if Ollama is running on host (optional)
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama is running on host (localhost:11434)
) else (
    echo ⚠️  Ollama not detected on host. You can install it later or use the Docker version.
)

REM Build the design system first
echo.
echo 📦 Building Design System...
cd design-system
if exist "package.json" (
    call npm install
    call npm run build
    echo ✅ Design system built successfully
) else (
    echo ❌ Design system package.json not found
    pause
    exit /b 1
)
cd ..

REM Install frontend dependencies
echo.
echo 📦 Installing Frontend Dependencies...
cd frontend
if exist "package.json" (
    call npm install
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend package.json not found
    pause
    exit /b 1
)
cd ..

REM Install Python dependencies for Flask admin
echo.
echo 🐍 Installing Python Dependencies...
if exist "requirements.txt" (
    pip install -r requirements.txt
    echo ✅ Python dependencies installed
) else (
    echo ❌ requirements.txt not found
    pause
    exit /b 1
)

echo.
echo 🚀 Starting Services...
echo.

REM Start infrastructure services first
echo Starting infrastructure services (PostgreSQL, MinIO, etc.)...
cd docker
docker-compose up -d postgres minio keycloak prometheus grafana loki jaeger

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service health
echo Checking service health...
docker-compose ps

echo.
echo 🎯 Services Started! You can now access:
echo.
echo 📊 Demo Page (Original Design):     http://localhost:8080/demo/
echo ⚛️  React Frontend:                 http://localhost:3000
echo 🌶️  Flask Admin:                   http://localhost:5001
echo.
echo 🔧 Infrastructure Services:
echo    PostgreSQL:                     localhost:5432
echo    MinIO Console:                  http://localhost:9001
echo    Keycloak Admin:                 http://localhost:8080
echo    Grafana:                        http://localhost:3002
echo    Prometheus:                     http://localhost:9090
echo.
echo 📝 Next Steps:
echo 1. Open a new terminal and run: cd frontend ^&^& npm run dev
echo 2. Open another terminal and run: python -m flask_admin.app
echo 3. Visit the URLs above to see the unified design system!
echo.
echo 🎨 The unified design system transforms all three interfaces:
echo    • Demo page: Original sophisticated dark theme
echo    • React frontend: Now uses the same design language
echo    • Flask admin: Completely redesigned with design system
echo.
echo 💡 To run this script, use: .\run-local.bat
echo Press Ctrl+C to stop all services when done.

REM Keep script running
docker-compose logs -f