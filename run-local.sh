#!/bin/bash

# TicketIQ Unified Startup for Linux/macOS
echo "🎫 TicketIQ - Unified Startup"
echo "============================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

SEED_DATA=0
SYNC_DATA=0
CLEAN_BUILD=0

# Parse arguments
for arg in "$@"
do
    case $arg in
        --seed)
        SEED_DATA=1
        shift
        ;;
        --sync)
        SYNC_DATA=1
        shift
        ;;
        --clean)
        CLEAN_BUILD=1
        shift
        ;;
    esac
done

cd docker

if [ $SYNC_DATA -eq 1 ]; then
    echo "💾 Syncing current live state to persistent storage..."
    docker compose exec api sh -c "PYTHONPATH=. python export_tickets.py"
    echo "✅ State preserved in backend/tickets_seed.json"
    exit 0
fi

docker compose --profile vector-store stop

if [ $CLEAN_BUILD -eq 1 ]; then
    echo "🧹 Clean Build Mode: Building with --no-cache..."
    docker compose --profile vector-store build --no-cache
fi

docker compose --profile vector-store down --remove-orphans
docker compose --profile vector-store up -d --build --force-recreate

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Startup failed! Check the logs above for errors."
    exit 1
fi

echo ""
echo "✅ Application Services Started!"
echo "----------------------------------------"
echo "🖥️  Dashboard:      http://localhost:3003"
echo "🔌 API Docs:       http://localhost:8005/docs"
echo "📊 Traefik Hub:    http://localhost:8081"
echo "📈 Monitoring:     http://localhost:3002 (Grafana)"
echo "🧪 ML Experiments: http://localhost:5000 (MLflow)"
echo "🛠️  Admin Portal:   http://localhost:5001 (Flask Admin)"
echo "🔍 Trace Viewer:   http://localhost:16686 (Jaeger)"
echo "🧠 AI Memory:      http://localhost:6333/dashboard (Qdrant)"
echo "📦 Storage:       http://localhost:9001 (MinIO)"
echo "🔐 Identity:      http://localhost:8080 (Keycloak)"
echo "----------------------------------------"
echo "📊 Intelligence State:"
docker exec tickets_postgres psql -U postgres -d tickets -t -c "SELECT count(*) || ' Tickets across ' || (SELECT count(*) FROM folders WHERE deleted_at IS NULL) || ' Departments' FROM tickets;"
echo "----------------------------------------"
echo "💡 TIP: If changes don't appear, use Ctrl+Shift+R for a Hard Refresh."
echo "----------------------------------------"
echo "📚 Manuals:        Check the /docs folder for guides!"
echo "----------------------------------------"
echo ""

# SEED_DATA logic handled below

if [ $SEED_DATA -eq 0 ]; then
    read -p "❓ Would you like to seed the database with enterprise demo data? (This will WIPE existing tickets and folders!) [y/N]: " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        SEED_DATA=1
    fi
fi

if [ $SEED_DATA -eq 1 ]; then
    echo "🌱 Seeding database..."
    docker compose exec api sh -c "PYTHONPATH=. python scripts/seed_enterprise_data.py"
    echo "✅ Seeding complete!"
fi

echo ""
echo "💡 Use 'docker compose -f docker/docker-compose.yml logs -f' to see real-time logs."
echo "📊 Current Service Status:"
docker compose --profile vector-store ps
echo ""
echo "Press Ctrl+C to stop this script (services will stay running)."