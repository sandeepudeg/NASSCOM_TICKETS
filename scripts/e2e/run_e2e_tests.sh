#!/bin/bash
# Script to run E2E tests with Playwright
# This script ensures all services are running before executing tests

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Tickets Folder E2E Test Runner ===${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Start services
echo -e "${YELLOW}Starting services with Docker Compose...${NC}"
docker compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL..."
timeout 60 bash -c 'until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do echo -n "."; sleep 2; done' || {
    echo -e "${RED}PostgreSQL failed to start${NC}"
    docker compose logs postgres
    exit 1
}
echo -e "${GREEN} Ready!${NC}"

# Wait for backend API
echo -n "Waiting for Backend API..."
timeout 60 bash -c 'until curl -f http://localhost:8000/health/ready > /dev/null 2>&1; do echo -n "."; sleep 2; done' || {
    echo -e "${RED}Backend API failed to start${NC}"
    docker compose logs api
    exit 1
}
echo -e "${GREEN} Ready!${NC}"

# Wait for frontend
echo -n "Waiting for Frontend..."
timeout 60 bash -c 'until curl -f http://localhost:5173 > /dev/null 2>&1; do echo -n "."; sleep 2; done' || {
    echo -e "${YELLOW}Frontend not running on port 5173. You may need to start it manually with 'cd frontend && npm run dev'${NC}"
}
echo -e "${GREEN} Ready!${NC}"

# Wait for Flask Admin (if running)
echo -n "Waiting for Flask Admin..."
timeout 60 bash -c 'until curl -f http://localhost:5001/health > /dev/null 2>&1; do echo -n "."; sleep 2; done' || {
    echo -e "${YELLOW}Flask Admin not running on port 5001. Starting Flask Admin service...${NC}"
    docker compose up -d flask-admin || echo -e "${YELLOW}Flask Admin service not configured in docker-compose.yml${NC}"
    
    # Wait again for Flask Admin after starting
    timeout 60 bash -c 'until curl -f http://localhost:5001/health > /dev/null 2>&1; do echo -n "."; sleep 2; done' || {
        echo -e "${YELLOW}Flask Admin still not available. E2E tests will skip Flask Admin endpoints.${NC}"
    }
}
echo -e "${GREEN} Ready!${NC}"

# Check if Playwright is installed
if ! python -c "import playwright" 2>/dev/null; then
    echo -e "${YELLOW}Playwright not found. Installing...${NC}"
    pip install pytest-playwright playwright
    playwright install chromium
fi

# Run E2E tests
echo -e "${GREEN}Running E2E tests...${NC}"

# Test Flask Admin endpoints before running full E2E suite
echo -e "${YELLOW}Testing Flask Admin endpoints...${NC}"

# Initialize Flask Admin test results
FLASK_ADMIN_TESTS_PASSED=0
FLASK_ADMIN_TESTS_TOTAL=0

# Function to test Flask Admin endpoint
test_flask_endpoint() {
    local endpoint="$1"
    local description="$2"
    local method="${3:-GET}"
    local expected_status="${4:-200}"
    
    FLASK_ADMIN_TESTS_TOTAL=$((FLASK_ADMIN_TESTS_TOTAL + 1))
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:5001$endpoint 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "%{http_code}" -o /dev/null -X "$method" http://localhost:5001$endpoint 2>/dev/null || echo "000")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $description (HTTP $response)${NC}"
        FLASK_ADMIN_TESTS_PASSED=$((FLASK_ADMIN_TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $description (HTTP $response, expected $expected_status)${NC}"
        return 1
    fi
}

# Test Flask Admin availability
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Flask Admin service is running${NC}"
    
    # Test core Flask Admin endpoints
    echo -e "${YELLOW}Testing Flask Admin core endpoints...${NC}"
    test_flask_endpoint "/health" "Flask Admin health endpoint"
    test_flask_endpoint "/" "Flask Admin dashboard"
    test_flask_endpoint "/folders" "Flask Admin folders page"
    test_flask_endpoint "/create-ticket" "Flask Admin create ticket page"
    test_flask_endpoint "/classify-test" "Flask Admin classify test page"
    test_flask_endpoint "/system-health" "Flask Admin system health page"
    
    # Test error pages
    echo -e "${YELLOW}Testing Flask Admin error handling...${NC}"
    test_flask_endpoint "/nonexistent-page" "Flask Admin 404 error page" "GET" "404"
    
    # Test static assets
    echo -e "${YELLOW}Testing Flask Admin static assets...${NC}"
    test_flask_endpoint "/static/css/style.css" "Flask Admin CSS file"
    test_flask_endpoint "/static/js/app.js" "Flask Admin JavaScript file"
    
    # Test API connectivity from Flask Admin
    echo -e "${YELLOW}Testing Flask Admin API connectivity...${NC}"
    health_response=$(curl -s http://localhost:5001/health 2>/dev/null || echo '{}')
    if echo "$health_response" | grep -q '"status".*"healthy"'; then
        echo -e "${GREEN}✅ Flask Admin reports healthy status${NC}"
        FLASK_ADMIN_TESTS_PASSED=$((FLASK_ADMIN_TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  Flask Admin health status unclear: $health_response${NC}"
    fi
    FLASK_ADMIN_TESTS_TOTAL=$((FLASK_ADMIN_TESTS_TOTAL + 1))
    
    # Test Flask Admin form endpoints (POST requests)
    echo -e "${YELLOW}Testing Flask Admin form handling...${NC}"
    
    # Test CSRF protection (should return 400 without CSRF token)
    csrf_response=$(curl -s -w "%{http_code}" -o /dev/null -X POST http://localhost:5001/folders 2>/dev/null || echo "000")
    if [ "$csrf_response" = "400" ] || [ "$csrf_response" = "403" ]; then
        echo -e "${GREEN}✅ Flask Admin CSRF protection working (HTTP $csrf_response)${NC}"
        FLASK_ADMIN_TESTS_PASSED=$((FLASK_ADMIN_TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  Flask Admin CSRF protection response: HTTP $csrf_response${NC}"
    fi
    FLASK_ADMIN_TESTS_TOTAL=$((FLASK_ADMIN_TESTS_TOTAL + 1))
    
    # Test Flask Admin template rendering
    echo -e "${YELLOW}Testing Flask Admin template rendering...${NC}"
    dashboard_content=$(curl -s http://localhost:5001/ 2>/dev/null || echo "")
    if echo "$dashboard_content" | grep -q "Tickets Admin" && echo "$dashboard_content" | grep -q "Dashboard"; then
        echo -e "${GREEN}✅ Flask Admin templates rendering correctly${NC}"
        FLASK_ADMIN_TESTS_PASSED=$((FLASK_ADMIN_TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ Flask Admin templates not rendering correctly${NC}"
    fi
    FLASK_ADMIN_TESTS_TOTAL=$((FLASK_ADMIN_TESTS_TOTAL + 1))
    
    # Test Flask Admin navigation
    if echo "$dashboard_content" | grep -q "nav" && echo "$dashboard_content" | grep -q "navbar"; then
        echo -e "${GREEN}✅ Flask Admin navigation present${NC}"
        FLASK_ADMIN_TESTS_PASSED=$((FLASK_ADMIN_TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ Flask Admin navigation missing${NC}"
    fi
    FLASK_ADMIN_TESTS_TOTAL=$((FLASK_ADMIN_TESTS_TOTAL + 1))
    
    # Test Flask Admin responsive design
    mobile_content=$(curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" http://localhost:5001/ 2>/dev/null || echo "")
    if echo "$mobile_content" | grep -q "viewport" && echo "$mobile_content" | grep -q "Bootstrap"; then
        echo -e "${GREEN}✅ Flask Admin responsive design configured${NC}"
        FLASK_ADMIN_TESTS_PASSED=$((FLASK_ADMIN_TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  Flask Admin responsive design may not be configured${NC}"
    fi
    FLASK_ADMIN_TESTS_TOTAL=$((FLASK_ADMIN_TESTS_TOTAL + 1))
    
else
    echo -e "${YELLOW}⚠️  Flask Admin not available - skipping Flask Admin endpoint tests${NC}"
    echo -e "${BLUE}ℹ️  To start Flask Admin: docker compose up -d flask-admin${NC}"
fi

# Flask Admin test summary
echo ""
echo -e "${BLUE}=== Flask Admin Test Summary ===${NC}"
if [ $FLASK_ADMIN_TESTS_TOTAL -gt 0 ]; then
    echo -e "Tests passed: ${GREEN}$FLASK_ADMIN_TESTS_PASSED${NC}/$FLASK_ADMIN_TESTS_TOTAL"
    success_rate=$((FLASK_ADMIN_TESTS_PASSED * 100 / FLASK_ADMIN_TESTS_TOTAL))
    echo -e "Success rate: ${GREEN}$success_rate%${NC}"
    
    if [ $success_rate -ge 80 ]; then
        echo -e "${GREEN}✅ Flask Admin endpoints are working well${NC}"
    elif [ $success_rate -ge 60 ]; then
        echo -e "${YELLOW}⚠️  Flask Admin has some issues but is functional${NC}"
    else
        echo -e "${RED}❌ Flask Admin has significant issues${NC}"
    fi
else
    echo -e "${YELLOW}No Flask Admin tests performed (service not available)${NC}"
fi

echo -e "${YELLOW}Flask Admin endpoint testing complete${NC}"

# Parse command line arguments
BROWSER="chromium"
HEADED=""
SLOWMO=""
TEST_FILE=""
VERBOSE="-v"
EXTRA_ARGS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --headed)
            HEADED="--headed"
            shift
            ;;
        --slowmo)
            SLOWMO="--slowmo $2"
            shift 2
            ;;
        --file)
            TEST_FILE="$2"
            shift 2
            ;;
        --debug)
            HEADED="--headed"
            SLOWMO="--slowmo 1000"
            EXTRA_ARGS="--pause-on-failure"
            shift
            ;;
        *)
            EXTRA_ARGS="$EXTRA_ARGS $1"
            shift
            ;;
    esac
done

# Build pytest command
PYTEST_CMD="pytest tests/e2e/"
if [ -n "$TEST_FILE" ]; then
    PYTEST_CMD="pytest tests/e2e/$TEST_FILE"
fi

PYTEST_CMD="$PYTEST_CMD $VERBOSE --browser $BROWSER $HEADED $SLOWMO $EXTRA_ARGS"

echo -e "${YELLOW}Running: $PYTEST_CMD${NC}"
eval $PYTEST_CMD

TEST_EXIT_CODE=$?

# Show test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}=== All E2E tests passed! ===${NC}"
else
    echo -e "${RED}=== Some E2E tests failed ===${NC}"
    echo -e "${YELLOW}Check test artifacts in tests/e2e/test-results/${NC}"
    echo -e "${YELLOW}View HTML report: playwright show-report tests/e2e/playwright-report${NC}"
fi

# Ask if user wants to stop services
read -p "Stop Docker services? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Stopping services...${NC}"
    docker compose down
    echo -e "${GREEN}Services stopped.${NC}"
fi

exit $TEST_EXIT_CODE
