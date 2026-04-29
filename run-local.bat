@echo off
REM TicketIQ Unified Startup for Windows
echo 🎫 TicketIQ - Unified Startup
echo ============================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

set SEED_DATA=0
set SYNC_DATA=0
set CLEAN_BUILD=0

:parse_args
if "%1"=="" goto start_services
if "%1"=="--seed" set SEED_DATA=1
if "%1"=="--sync" set SYNC_DATA=1
if "%1"=="--clean" set CLEAN_BUILD=1
shift
goto parse_args

:start_services
cd docker
docker compose --profile vector-store stop

if %CLEAN_BUILD%==1 (
    echo 🧹 Clean Build Mode: Building with --no-cache...
    docker compose --profile vector-store build --no-cache
)

docker compose --profile vector-store down --remove-orphans
docker compose --profile vector-store up -d --build --force-recreate

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
echo 💡 TIP: If changes don't appear, use Ctrl+Shift+R for a Hard Refresh.
echo ----------------------------------------
echo 📚 Manuals:        Check the /docs folder for guides!
echo ----------------------------------------
echo.

if %SYNC_DATA%==1 (
    echo 💾 Syncing current live state to persistent storage...
    docker compose exec api sh -c "PYTHONPATH=. python export_tickets.py"
    echo ✅ State preserved in backend/tickets_seed.json
    goto end
)

if %SEED_DATA%==0 (
    if exist backend\tickets_seed.json (
        echo 🟢 Persistence Mode: Detected existing intelligence state.
        echo    The system will start with your 300+ tickets and 48 patterns automatically.
    ) else (
        echo ❓ No seed data found. Would you like to seed the database with enterprise demo data? 
        echo    (This will WIPE existing tickets and folders!)
        set /p CHOICE=Type 'Y' to seed, or press Enter to skip: 
        if /I "!CHOICE!"=="Y" set SEED_DATA=1
    )
)

if %SEED_DATA%==1 (
    echo 🌱 Seeding database...
    docker compose exec api sh -c "PYTHONPATH=. python scripts/seed_enterprise_data.py"
    echo ✅ Seeding complete!
)

:end

echo.
echo 💡 Use 'docker compose -f docker/docker-compose.yml logs -f' to see real-time logs.
echo.
echo 📊 Current Service Status:
docker compose --profile vector-store ps
echo.
echo Press any key to exit this window (services will stay running).
pause >nul