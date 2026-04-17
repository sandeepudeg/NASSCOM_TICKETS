#!/bin/bash
# scripts/validate_deployment.sh
# Quick deployment validation script for Flask Admin

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENVIRONMENT=${1:-local}

echo -e "${BLUE}🔍 Validating Flask Admin Deployment${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    if timeout $timeout curl -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name: $url${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: $url${NC}"
        return 1
    fi
}

# Function to test endpoint with response check
test_endpoint_response() {
    local url=$1
    local name=$2
    local expected=$3
    local timeout=${4:-10}
    
    response=$(timeout $timeout curl -s "$url" 2>/dev/null || echo "")
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✅ $name: $url (contains '$expected')${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: $url (expected '$expected', got: ${response:0:50}...)${NC}"
        return 1
    fi
}

case $ENVIRONMENT in
    "local")
        echo -e "${YELLOW}Testing local deployment...${NC}"
        
        BASE_URL="http://localhost:5001"
        
        # Test health endpoint first
        if test_endpoint_response "$BASE_URL/health" "Health Check" '"status"'; then
            echo -e "${GREEN}Flask Admin is running${NC}"
        else
            echo -e "${RED}Flask Admin is not responding${NC}"
            exit 1
        fi
        
        # Test all Flask Admin endpoints
        endpoints=(
            "/:Dashboard"
            "/folders:Folder Management"
            "/create-ticket:Ticket Creation"
            "/classify-test:Classification Test"
            "/system-health:System Health"
        )
        
        failed=0
        for endpoint_info in "${endpoints[@]}"; do
            IFS=':' read -r endpoint name <<< "$endpoint_info"
            if ! test_endpoint "$BASE_URL$endpoint" "$name"; then
                failed=$((failed + 1))
            fi
        done
        
        # Test API connectivity
        echo ""
        echo -e "${YELLOW}Testing API connectivity...${NC}"
        if test_endpoint "http://localhost:8000/health/ready" "Backend API"; then
            echo -e "${GREEN}Backend API is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend API not accessible (may be expected if not running)${NC}"
        fi
        
        # Summary
        echo ""
        if [ $failed -eq 0 ]; then
            echo -e "${GREEN}🎉 Local deployment validation PASSED!${NC}"
            echo -e "${GREEN}All Flask Admin endpoints are working${NC}"
        else
            echo -e "${RED}❌ Local deployment validation FAILED!${NC}"
            echo -e "${RED}$failed endpoints are not working${NC}"
            exit 1
        fi
        ;;
        
    "hf-spaces")
        echo -e "${YELLOW}Testing HF Spaces deployment...${NC}"
        
        # Check if HF_SPACE_URL is provided
        HF_SPACE_URL=${HF_SPACE_URL:-"https://sandeepudeg-tickets.hf.space"}
        
        echo -e "${BLUE}Testing HF Space: $HF_SPACE_URL${NC}"
        
        # Test health endpoint first
        if test_endpoint_response "$HF_SPACE_URL/health" "Health Check" '"status"' 30; then
            echo -e "${GREEN}HF Spaces deployment is running${NC}"
        else
            echo -e "${RED}HF Spaces deployment is not responding${NC}"
            echo -e "${YELLOW}Note: HF Spaces may take time to start up${NC}"
            exit 1
        fi
        
        # Test main endpoints
        endpoints=(
            "/:Dashboard"
            "/folders:Folder Management"
            "/create-ticket:Ticket Creation"
            "/classify-test:Classification Test"
            "/system-health:System Health"
        )
        
        failed=0
        for endpoint_info in "${endpoints[@]}"; do
            IFS=':' read -r endpoint name <<< "$endpoint_info"
            if ! test_endpoint "$HF_SPACE_URL$endpoint" "$name" 30; then
                failed=$((failed + 1))
            fi
        done
        
        # Summary
        echo ""
        if [ $failed -eq 0 ]; then
            echo -e "${GREEN}🎉 HF Spaces deployment validation PASSED!${NC}"
            echo -e "${GREEN}All Flask Admin endpoints are working${NC}"
            echo -e "${BLUE}🌐 Access your deployment: $HF_SPACE_URL${NC}"
        else
            echo -e "${RED}❌ HF Spaces deployment validation FAILED!${NC}"
            echo -e "${RED}$failed endpoints are not working${NC}"
            exit 1
        fi
        ;;
        
    "quick")
        echo -e "${YELLOW}Running quick validation...${NC}"
        
        # Just test if Flask admin is responding
        if test_endpoint_response "http://localhost:5001/health" "Flask Admin" '"status"' 5; then
            echo -e "${GREEN}✅ Flask Admin is running and healthy${NC}"
        else
            echo -e "${RED}❌ Flask Admin is not responding${NC}"
            exit 1
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
        echo ""
        echo -e "${YELLOW}Usage: $0 [local|hf-spaces|quick]${NC}"
        echo ""
        echo -e "${BLUE}Environments:${NC}"
        echo "  local     - Validate local Docker Compose deployment"
        echo "  hf-spaces - Validate HF Spaces deployment (set HF_SPACE_URL env var)"
        echo "  quick     - Quick health check for local deployment"
        echo ""
        echo -e "${BLUE}Examples:${NC}"
        echo "  $0 local"
        echo "  HF_SPACE_URL=https://your-space.hf.space $0 hf-spaces"
        echo "  $0 quick"
        echo ""
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}✅ Deployment validation complete!${NC}"