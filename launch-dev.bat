@echo off
SETLOCAL EnableDelayedExpansion

echo 🎫 TicketIQ Enterprise - Unified Startup
echo ========================================

:: 1. Cleanup Stale Processes on Port 8005 (Back) and 3003 (Front)
echo 🔍 Checking for zombie processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8005 ^| findstr LISTENING') do (
    echo 🔪 Killing process %%a on port 8005...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003 ^| findstr LISTENING') do (
    echo 🔪 Killing process %%a on port 3003...
    taskkill /F /PID %%a >nul 2>&1
)

:: 2. Start Infrastructure (Docker)
echo 🐳 Starting core infrastructure (Postgres, MinIO)...
cd docker
docker-compose up -d postgres minio
cd ..

:: 3. Start Backend
echo 🐍 Launching Backend on Port 8005...
start "TicketIQ Backend" cmd /k "cd backend && ..\.venv_tickets\Scripts\python -m uvicorn main:app --port 8005 --host 127.0.0.1 --reload --no-access-log"

:: 4. Start Frontend
echo ⚛️  Launching Frontend on Port 3003...
start "TicketIQ Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Startup sequence initiated!
echo ----------------------------------------
echo 🖥️  Dashboard: http://localhost:3003/dashboard
echo 🔌 API Docs:  http://localhost:8005/docs
echo ----------------------------------------
echo (Check the newly opened windows for logs)
pause
