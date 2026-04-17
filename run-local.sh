#!/bin/bash

# TicketIQ Local Development Setup
# This script helps you run the unified design system locally

echo "🎫 TicketIQ - Unified Design System Local Setup"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Check if Ollama is running on host (optional)
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running on host (localhost:11434)"
else
    echo "⚠️  Ollama not detected on host. You can install it later or use the Docker version."
fi

# Build the design system first
echo ""
echo "📦 Building Design System..."
cd design-system
if [ -f "package.json" ]; then
    npm install
    npm run build
    echo "✅ Design system built successfully"
else
    echo "❌ Design system package.json not found"
    exit 1
fi
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing Frontend Dependencies..."
cd frontend
if [ -f "package.json" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend package.json not found"
    exit 1
fi
cd ..

# Install Python dependencies for Flask admin
echo ""
echo "🐍 Installing Python Dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo "✅ Python dependencies installed"
else
    echo "❌ requirements.txt not found"
    exit 1
fi

echo ""
echo "🚀 Starting Services..."
echo ""

# Start infrastructure services first
echo "Starting infrastructure services (PostgreSQL, MinIO, etc.)..."
cd docker
docker-compose up -d postgres minio keycloak prometheus grafana loki jaeger

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 30

# Check service health
echo "Checking service health..."
docker-compose ps

echo ""
echo "🎯 Services Started! You can now access:"
echo ""
echo "📊 Demo Page (Original Design):     http://localhost:8080/demo/"
echo "⚛️  React Frontend:                 http://localhost:3000"
echo "🌶️  Flask Admin:                   http://localhost:5001"
echo ""
echo "🔧 Infrastructure Services:"
echo "   PostgreSQL:                     localhost:5432"
echo "   MinIO Console:                  http://localhost:9001"
echo "   Keycloak Admin:                 http://localhost:8080"
echo "   Grafana:                        http://localhost:3002"
echo "   Prometheus:                     http://localhost:9090"
echo ""
echo "📝 Next Steps:"
echo "1. Open a new terminal and run: cd frontend && npm run dev"
echo "2. Open another terminal and run: python -m flask_admin.app"
echo "3. Visit the URLs above to see the unified design system!"
echo ""
echo "🎨 The unified design system transforms all three interfaces:"
echo "   • Demo page: Original sophisticated dark theme"
echo "   • React frontend: Now uses the same design language"
echo "   • Flask admin: Completely redesigned with design system"
echo ""
echo "Press Ctrl+C to stop all services when done."

# Keep script running
docker-compose logs -f