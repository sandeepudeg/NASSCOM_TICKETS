#!/bin/bash
# scripts/check_deployment_status.sh
# Simple deployment status checker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Deployment Status Check${NC}"
echo ""

# Check local Flask Admin
echo -e "${YELLOW}Local Flask Admin (http://localhost:5001):${NC}"
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    health=$(curl -s http://localhost:5001/health 2>/dev/null || echo '{}')
    echo -e "${GREEN}✅ Running - $health${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Check local Backend API
echo -e "${YELLOW}Local Backend API (http://localhost:8000):${NC}"
if curl -f http://localhost:8000/health/ready > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Check local Frontend
echo -e "${YELLOW}Local Frontend (http://localhost:5173):${NC}"
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Check Docker containers
echo ""
echo -e "${YELLOW}Docker Containers:${NC}"
if command -v docker &> /dev/null; then
    if docker compose ps 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}✅ Docker services running:${NC}"
        docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No services found"
    else
        echo -e "${RED}❌ No Docker services running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not available${NC}"
fi

# Check HF Spaces (if URL provided)
if [ -n "$HF_SPACE_URL" ]; then
    echo ""
    echo -e "${YELLOW}HF Spaces ($HF_SPACE_URL):${NC}"
    if curl -f "$HF_SPACE_URL/health" > /dev/null 2>&1; then
        health=$(curl -s "$HF_SPACE_URL/health" 2>/dev/null || echo '{}')
        echo -e "${GREEN}✅ Running - $health${NC}"
    else
        echo -e "${RED}❌ Not accessible${NC}"
    fi
fi

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "• Start local services: docker compose up -d"
echo "• Check Flask admin: http://localhost:5001"
echo "• Check backend API: http://localhost:8000/docs"
echo "• Set HF_SPACE_URL=https://your-space.hf.space to check HF Spaces deployment"
echo ""