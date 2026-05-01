@echo off
REM TicketIQ Unified Startup for Windows
echo 🎫 TicketIQ - Unified Startup (Restored State)
echo ===========================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

set SEED_DATA=0
set CLEAN_BUILD=0

:parse_args
if "%1"=="" goto start_services
if "%1"=="--seed" set SEED_DATA=1
if "%1"=="--clean" set CLEAN_BUILD=1
shift
goto parse_args

:start_services
cd docker

echo 🚀 Restarting services with latest code...
docker compose --profile vector-store down --remove-orphans

if %CLEAN_BUILD%==1 (
    echo 🧹 Clean Build Mode: Building with --no-cache...
    docker compose --profile vector-store build --no-cache
) else (
    echo 🏗️  Building with latest changes...
    docker compose --profile vector-store build
)

docker compose --profile vector-store up -d --force-recreate

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
echo.

if %SEED_DATA%==1 (
    echo 🌱 Seeding database...
    docker compose exec api sh -c "PYTHONPATH=. python scripts/seed_enterprise_data.py"
    echo ✅ Seeding complete!
)

:end
echo.
echo 💡 Use 'docker compose -f docker/docker-compose.yml logs -f' to see real-time logs.
echo.
echo Press any key to exit this window (services will stay running).
pause >nul
