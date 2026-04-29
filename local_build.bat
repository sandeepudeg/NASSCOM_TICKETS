@echo off
REM TicketIQ Full System Build & Startup for Windows
echo 🎫 TicketIQ - Full Enterprise Build
echo ===================================

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

cd docker

echo 🏗️  Building all components (API, Frontend, Database, Intelligence)...
:: We use --profile "*" to ensure ALL services (including qdrant) are included
:: We use --build and --no-cache to ensure "not partial" builds
docker compose --profile "*" build --no-cache

echo 🚀 Starting the complete stack...
docker compose --profile "*" down --remove-orphans
docker compose --profile "*" up -d --force-recreate

if %errorlevel% neq 0 (
    echo.
    echo ❌ Startup failed! Check the logs above for errors.
    pause
    exit /b 1
)

echo.
echo ✅ Application Services Started!
echo ----------------------------------------
echo 🖥️  Dashboard:      http://localhost:3003
echo 🔌 API Docs:       http://localhost:8005/docs
echo 📊 Traefik Hub:    http://localhost:8081
echo 📈 Monitoring:     http://localhost:3002 (Grafana)
echo 🧪 ML Experiments: http://localhost:5000 (MLflow)
echo 🛠️  Admin Portal:   http://localhost:5001 (Flask Admin)
echo 🔍 Trace Viewer:   http://localhost:16686 (Jaeger)
echo 🧠 AI Memory:      http://localhost:6333/dashboard (Qdrant)
echo 📦 Storage:       http://localhost:9001 (MinIO)
echo 🔐 Identity:      http://localhost:8080 (Keycloak)
echo ----------------------------------------
echo 📊 Intelligence State:
docker exec tickets_postgres psql -U postgres -d tickets -t -c "SELECT count(*) || ' Tickets across ' || (SELECT count(*) FROM folders WHERE deleted_at IS NULL) || ' Departments' FROM tickets;"
echo ----------------------------------------
echo 💡 TIP: If changes don't appear, use Ctrl+Shift+R for a Hard Refresh.
echo ----------------------------------------
echo 📚 Manuals:        Check the /docs folder for guides!
echo ----------------------------------------
echo.

pause
