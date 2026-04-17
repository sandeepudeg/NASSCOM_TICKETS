#!/bin/bash
# scripts/deploy.sh
# Comprehensive deployment automation script for Flask Admin

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENVIRONMENT=${1:-local}

echo -e "${BLUE}🚀 Flask Admin Deployment Automation${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

case $ENVIRONMENT in
    "local")
        log "Starting local Docker Compose deployment..."
        
        # Check if Docker is running
        if ! docker info > /dev/null 2>&1; then
            echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
            exit 1
        fi
        
        # Run migration verification first
        if [ -f "scripts/verify_migration.sh" ]; then
            log "Running migration verification..."
            bash scripts/verify_migration.sh
            check_success "Migration verification"
        else
            echo -e "${YELLOW}⚠️  Migration verification script not found${NC}"
        fi
        
        # Check for docker-compose.yml
        compose_file=""
        if [ -f "docker-compose.yml" ]; then
            compose_file="docker-compose.yml"
        elif [ -f "docker/docker-compose.yml" ]; then
            compose_file="docker/docker-compose.yml"
        else
            echo -e "${RED}❌ No docker-compose.yml found${NC}"
            exit 1
        fi
        
        log "Building Flask admin container..."
        if [ "$compose_file" = "docker-compose.yml" ]; then
            docker compose build flask-admin
        else
            docker compose -f docker/docker-compose.yml build flask-admin
        fi
        check_success "Docker build"
        
        log "Starting Flask admin service..."
        if [ "$compose_file" = "docker-compose.yml" ]; then
            docker compose up -d flask-admin
        else
            docker compose -f docker/docker-compose.yml up -d flask-admin
        fi
        check_success "Service startup"
        
        log "Waiting for Flask admin to be ready..."
        timeout=60
        counter=0
        while [ $counter -lt $timeout ]; do
            if curl -f http://localhost:5001/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Flask admin is ready!${NC}"
                break
            fi
            sleep 2
            counter=$((counter + 2))
            echo -n "."
        done
        
        if [ $counter -ge $timeout ]; then
            echo -e "${RED}❌ Flask admin failed to start within ${timeout}s${NC}"
            echo -e "${YELLOW}Checking logs...${NC}"
            if [ "$compose_file" = "docker-compose.yml" ]; then
                docker compose logs flask-admin | tail -20
            else
                docker compose -f docker/docker-compose.yml logs flask-admin | tail -20
            fi
            exit 1
        fi
        
        # Test Flask admin endpoints
        log "Testing Flask admin endpoints..."
        endpoints=("/" "/folders" "/create-ticket" "/classify-test" "/system-health")
        failed_endpoints=0
        
        for endpoint in "${endpoints[@]}"; do
            if curl -f "http://localhost:5001$endpoint" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Endpoint working: $endpoint${NC}"
            else
                echo -e "${RED}❌ Endpoint failed: $endpoint${NC}"
                failed_endpoints=$((failed_endpoints + 1))
            fi
        done
        
        if [ $failed_endpoints -eq 0 ]; then
            echo -e "${GREEN}✅ All Flask admin endpoints working${NC}"
        else
            echo -e "${YELLOW}⚠️  $failed_endpoints endpoints failed${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎉 Local deployment complete!${NC}"
        echo -e "${BLUE}🌐 Flask Admin: http://localhost:5001${NC}"
        echo -e "${BLUE}📊 Health Check: http://localhost:5001/health${NC}"
        echo -e "${BLUE}📋 System Health: http://localhost:5001/system-health${NC}"
        echo ""
        echo -e "${YELLOW}💡 Additional Tools:${NC}"
        echo -e "${BLUE}• Quick status check: bash scripts/check_deployment_status.sh${NC}"
        echo -e "${BLUE}• Validate deployment: bash scripts/validate_deployment.sh local${NC}"
        echo -e "${BLUE}• Run E2E tests: bash scripts/e2e/run_e2e_tests.sh${NC}"
        
        # Show service status
        log "Service status:"
        if [ "$compose_file" = "docker-compose.yml" ]; then
            docker compose ps flask-admin
        else
            docker compose -f docker/docker-compose.yml ps flask-admin
        fi
        ;;
        
    "hf-spaces")
        log "Preparing HF Spaces deployment..."
        
        # Run HF Spaces deployment validation
        if [ -f "scripts/deploy_hf_spaces.sh" ]; then
            log "Running HF Spaces deployment validation..."
            bash scripts/deploy_hf_spaces.sh
            check_success "HF Spaces validation"
        else
            echo -e "${RED}❌ HF Spaces deployment script not found${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${GREEN}✅ HF Spaces deployment validation complete!${NC}"
        echo ""
        echo -e "${BLUE}📋 Next Steps for HF Spaces Deployment:${NC}"
        echo ""
        echo -e "${YELLOW}1. Push to HF Spaces repository:${NC}"
        echo "   git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME"
        echo "   git push hf main"
        echo ""
        echo -e "${YELLOW}2. Configure secrets in HF Spaces settings:${NC}"
        echo "   - API_BASE_URL: Your FastAPI backend URL"
        echo "   - SECRET_KEY: $(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || echo 'generate-32-char-hex-string')"
        echo "   - FLASK_ENV: production"
        echo ""
        echo -e "${YELLOW}3. Monitor deployment:${NC}"
        echo "   - Check HF Spaces build logs"
        echo "   - Verify Flask admin loads correctly"
        echo "   - Test API connectivity"
        echo "   - Use: HF_SPACE_URL=https://sandeepudeg-tickets.hf.space bash scripts/validate_deployment.sh hf-spaces"
        echo ""
        echo -e "${YELLOW}4. Additional Tools:${NC}"
        echo "   - Quick status: bash scripts/check_deployment_status.sh"
        echo "   - Validate deployment: bash scripts/validate_deployment.sh hf-spaces"
        echo ""
        ;;
        
    "test")
        log "Running deployment tests..."
        
        # Run migration verification
        if [ -f "scripts/verify_migration.sh" ]; then
            log "Running migration verification..."
            bash scripts/verify_migration.sh
            check_success "Migration verification"
        fi
        
        # Run E2E tests if available
        if [ -f "scripts/e2e/run_e2e_tests.sh" ]; then
            log "Running E2E tests..."
            bash scripts/e2e/run_e2e_tests.sh --browser chromium
            check_success "E2E tests"
        else
            echo -e "${YELLOW}⚠️  E2E test script not found${NC}"
        fi
        
        echo -e "${GREEN}✅ All deployment tests passed!${NC}"
        ;;
        
    "clean")
        log "Cleaning up deployment artifacts..."
        
        # Stop and remove containers
        compose_file=""
        if [ -f "docker-compose.yml" ]; then
            compose_file="docker-compose.yml"
        elif [ -f "docker/docker-compose.yml" ]; then
            compose_file="docker/docker-compose.yml"
        fi
        
        if [ -n "$compose_file" ]; then
            if [ "$compose_file" = "docker-compose.yml" ]; then
                docker compose down flask-admin 2>/dev/null || true
            else
                docker compose -f docker/docker-compose.yml down flask-admin 2>/dev/null || true
            fi
        fi
        
        # Remove test artifacts
        rm -f migration_verification_report.json 2>/dev/null || true
        rm -f /tmp/streamlit_refs.txt 2>/dev/null || true
        
        # Clean Docker images
        docker rmi hf-spaces-test 2>/dev/null || true
        
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
        
    "status")
        log "Checking deployment status..."
        
        # Check local Flask admin
        if curl -f http://localhost:5001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Flask Admin running locally (http://localhost:5001)${NC}"
            
            # Get health status
            health_response=$(curl -s http://localhost:5001/health 2>/dev/null || echo '{}')
            echo -e "${BLUE}Health Status: $health_response${NC}"
        else
            echo -e "${YELLOW}⚠️  Flask Admin not running locally${NC}"
        fi
        
        # Check Docker containers
        compose_file=""
        if [ -f "docker-compose.yml" ]; then
            compose_file="docker-compose.yml"
        elif [ -f "docker/docker-compose.yml" ]; then
            compose_file="docker/docker-compose.yml"
        fi
        
        if [ -n "$compose_file" ]; then
            echo -e "${BLUE}Docker Services:${NC}"
            if [ "$compose_file" = "docker-compose.yml" ]; then
                docker compose ps 2>/dev/null || echo "No services running"
            else
                docker compose -f docker/docker-compose.yml ps 2>/dev/null || echo "No services running"
            fi
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
        echo ""
        echo -e "${YELLOW}Usage: $0 [local|hf-spaces|test|clean|status]${NC}"
        echo ""
        echo -e "${BLUE}Environments:${NC}"
        echo "  local     - Deploy to local Docker Compose"
        echo "  hf-spaces - Validate and prepare for HF Spaces deployment"
        echo "  test      - Run deployment tests and verification"
        echo "  clean     - Clean up deployment artifacts"
        echo "  status    - Check current deployment status"
        echo ""
        exit 1
        ;;
esac

log "Deployment automation complete!"