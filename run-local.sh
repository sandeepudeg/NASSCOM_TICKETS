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

echo ""
echo "🚀 Launching full application stack (Frontend, Backend, Database)..."
echo "(This may take a minute on the first run)"
echo ""

cd docker
docker compose --profile vector-store down
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
echo "📚 Manuals:        Check the /docs folder for guides!"
echo "----------------------------------------"
echo ""
echo "💡 Use 'docker compose -f docker/docker-compose.yml logs -f' to see real-time logs."
echo "Press Ctrl+C to stop this script (services will stay running)."