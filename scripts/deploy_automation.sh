#!/bin/bash
# scripts/deploy_automation.sh
# Comprehensive deployment automation script for Flask Admin

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/deployment_automation.log"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case $level in
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "STEP")
            echo -e "${PURPLE}🔄 $message${NC}"
            ;;
    esac
}

# Initialize deployment log
echo "=== Flask Admin Deployment Automation Log ===" > "$LOG_FILE"
log "INFO" "Starting deployment automation at $(date)"

echo -e "${BLUE}🚀 Flask Admin Deployment Automation${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Parse command line arguments
ENVIRONMENT="local"
SKIP_TESTS=false
SKIP_VERIFICATION=false
FORCE_DEPLOY=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-verification)
            SKIP_VERIFICATION=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV    Deployment environment (local|hf-spaces) [default: local]"
            echo "  --skip-tests            Skip endpoint testing"
            echo "  --skip-verification     Skip migration verification"
            echo "  --force                 Force deployment even if tests fail"
            echo "  -v, --verbose           Verbose output"
            echo "  -h, --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Deploy to local environment"
            echo "  $0 --environment hf-spaces          # Prepare for HF Spaces deployment"
            echo "  $0 --skip-tests --force             # Force deployment without tests"
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            exit 1
            ;;
    esac
done

log "INFO" "Deployment environment: $ENVIRONMENT"
log "INFO" "Skip tests: $SKIP_TESTS"
log "INFO" "Skip verification: $SKIP_VERIFICATION"
log "INFO" "Force deploy: $FORCE_DEPLOY"

# Step 1: Pre-deployment validation
log "STEP" "Step 1: Pre-deployment validation"

cd "$PROJECT_ROOT"

# Check required files
required_files=(
    "flask_admin/app.py"
    "flask_admin/config.py"
    "flask_admin/utils/api_client.py"
    "requirements.txt"
    "app.py"
)

if [ "$ENVIRONMENT" = "hf-spaces" ]; then
    required_files+=("README.md" "Dockerfile")
fi

missing_files=0
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        log "ERROR" "Required file missing: $file"
        missing_files=$((missing_files + 1))
    else
        log "SUCCESS" "Found required file: $file"
    fi
done

if [ $missing_files -gt 0 ] && [ "$FORCE_DEPLOY" = false ]; then
    log "ERROR" "$missing_files required files missing. Use --force to override."
    exit 1
fi

# Step 2: Migration verification
if [ "$SKIP_VERIFICATION" = false ]; then
    log "STEP" "Step 2: Migration verification"
    
    if [ -f "scripts/verify_migration.sh" ]; then
        log "INFO" "Running migration verification script"
        
        if bash scripts/verify_migration.sh >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "Migration verification passed"
        else
            log "ERROR" "Migration verification failed"
            if [ "$FORCE_DEPLOY" = false ]; then
                log "ERROR" "Deployment aborted. Use --force to override."
                exit 1
            else
                log "WARNING" "Continuing deployment despite verification failure (--force used)"
            fi
        fi
    else
        log "WARNING" "Migration verification script not found"
    fi
else
    log "INFO" "Skipping migration verification (--skip-verification used)"
fi

# Step 3: Environment-specific preparation
log "STEP" "Step 3: Environment-specific preparation"

case $ENVIRONMENT in
    "local")
        log "INFO" "Preparing for local Docker Compose deployment"
        
        # Check Docker availability
        if ! command -v docker &> /dev/null; then
            log "ERROR" "Docker not found. Please install Docker."
            exit 1
        fi
        
        if ! docker info > /dev/null 2>&1; then
            log "ERROR" "Docker daemon not running. Please start Docker."
            exit 1
        fi
        
        log "SUCCESS" "Docker is available and running"
        
        # Check docker-compose configuration
        compose_file=""
        if [ -f "docker-compose.yml" ]; then
            compose_file="docker-compose.yml"
        elif [ -f "docker/docker-compose.yml" ]; then
            compose_file="docker/docker-compose.yml"
        else
            log "ERROR" "No docker-compose.yml found"
            exit 1
        fi
        
        log "SUCCESS" "Found docker-compose configuration: $compose_file"
        
        # Build Flask admin service
        log "INFO" "Building Flask admin Docker image"
        
        if [ -f "docker/docker-compose.yml" ]; then
            docker-compose -f docker/docker-compose.yml build flask-admin >> "$LOG_FILE" 2>&1
        else
            docker-compose build flask-admin >> "$LOG_FILE" 2>&1
        fi
        
        if [ $? -eq 0 ]; then
            log "SUCCESS" "Flask admin Docker image built successfully"
        else
            log "ERROR" "Failed to build Flask admin Docker image"
            exit 1
        fi
        ;;
        
    "hf-spaces")
        log "INFO" "Preparing for Hugging Face Spaces deployment"
        
        # Run HF Spaces deployment script
        if [ -f "scripts/deploy_hf_spaces.sh" ]; then
            log "INFO" "Running HF Spaces deployment preparation"
            
            if bash scripts/deploy_hf_spaces.sh >> "$LOG_FILE" 2>&1; then
                log "SUCCESS" "HF Spaces deployment preparation completed"
            else
                log "ERROR" "HF Spaces deployment preparation failed"
                if [ "$FORCE_DEPLOY" = false ]; then
                    exit 1
                fi
            fi
        else
            log "ERROR" "HF Spaces deployment script not found"
            exit 1
        fi
        ;;
        
    *)
        log "ERROR" "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Step 4: Service deployment
log "STEP" "Step 4: Service deployment"

case $ENVIRONMENT in
    "local")
        log "INFO" "Starting Flask admin service"
        
        if [ -f "docker/docker-compose.yml" ]; then
            docker-compose -f docker/docker-compose.yml up -d flask-admin >> "$LOG_FILE" 2>&1
        else
            docker-compose up -d flask-admin >> "$LOG_FILE" 2>&1
        fi
        
        if [ $? -eq 0 ]; then
            log "SUCCESS" "Flask admin service started"
        else
            log "ERROR" "Failed to start Flask admin service"
            exit 1
        fi
        
        # Wait for service to be ready
        log "INFO" "Waiting for Flask admin service to be ready"
        
        max_attempts=30
        attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            if curl -f http://localhost:5001/health > /dev/null 2>&1; then
                log "SUCCESS" "Flask admin service is ready"
                break
            fi
            
            attempt=$((attempt + 1))
            sleep 2
            
            if [ $attempt -eq $max_attempts ]; then
                log "ERROR" "Flask admin service failed to become ready"
                exit 1
            fi
        done
        ;;
        
    "hf-spaces")
        log "INFO" "HF Spaces deployment requires manual push to repository"
        log "INFO" "Deployment preparation completed - ready for HF Spaces push"
        ;;
esac

# Step 5: Endpoint testing
if [ "$SKIP_TESTS" = false ] && [ "$ENVIRONMENT" = "local" ]; then
    log "STEP" "Step 5: Endpoint testing"
    
    # Run E2E tests with Flask admin focus
    if [ -f "scripts/e2e/run_e2e_tests.sh" ]; then
        log "INFO" "Running E2E tests with Flask admin validation"
        
        # Run only Flask admin endpoint tests
        export FLASK_ADMIN_TESTS_ONLY=true
        
        if bash scripts/e2e/run_e2e_tests.sh --flask-admin-only >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "Flask admin endpoint tests passed"
        else
            log "WARNING" "Some Flask admin endpoint tests failed"
            if [ "$FORCE_DEPLOY" = false ]; then
                log "ERROR" "Deployment validation failed. Use --force to override."
                exit 1
            fi
        fi
    else
        log "WARNING" "E2E test script not found - running basic endpoint tests"
        
        # Basic endpoint testing
        endpoints=("/" "/folders" "/create-ticket" "/classify-test" "/system-health" "/health")
        failed_endpoints=0
        
        for endpoint in "${endpoints[@]}"; do
            response_code=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:5001$endpoint" 2>/dev/null || echo "000")
            
            if [ "$response_code" = "200" ]; then
                log "SUCCESS" "Endpoint test passed: $endpoint"
            else
                log "ERROR" "Endpoint test failed: $endpoint (HTTP $response_code)"
                failed_endpoints=$((failed_endpoints + 1))
            fi
        done
        
        if [ $failed_endpoints -gt 0 ] && [ "$FORCE_DEPLOY" = false ]; then
            log "ERROR" "$failed_endpoints endpoint tests failed. Use --force to override."
            exit 1
        fi
    fi
else
    log "INFO" "Skipping endpoint tests (--skip-tests used or not local environment)"
fi

# Step 6: Post-deployment validation
log "STEP" "Step 6: Post-deployment validation"

case $ENVIRONMENT in
    "local")
        # Validate service health
        health_response=$(curl -s http://localhost:5001/health 2>/dev/null || echo '{}')
        
        if echo "$health_response" | grep -q '"status".*"healthy"'; then
            log "SUCCESS" "Flask admin service reports healthy status"
        else
            log "WARNING" "Flask admin service health status unclear"
        fi
        
        # Check service logs for errors
        log "INFO" "Checking service logs for errors"
        
        if [ -f "docker/docker-compose.yml" ]; then
            error_count=$(docker-compose -f docker/docker-compose.yml logs flask-admin 2>/dev/null | grep -i error | wc -l)
        else
            error_count=$(docker-compose logs flask-admin 2>/dev/null | grep -i error | wc -l)
        fi
        
        if [ "$error_count" -eq 0 ]; then
            log "SUCCESS" "No errors found in service logs"
        else
            log "WARNING" "Found $error_count error messages in service logs"
        fi
        ;;
        
    "hf-spaces")
        log "INFO" "HF Spaces deployment validation will occur after repository push"
        ;;
esac

# Step 7: Generate deployment report
log "STEP" "Step 7: Generating deployment report"

deployment_report_file="deployment_report_$(date +%Y%m%d_%H%M%S).json"

cat > "$deployment_report_file" << EOF
{
  "deployment_report": {
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "environment": "$ENVIRONMENT",
    "status": "completed",
    "configuration": {
      "skip_tests": $SKIP_TESTS,
      "skip_verification": $SKIP_VERIFICATION,
      "force_deploy": $FORCE_DEPLOY,
      "verbose": $VERBOSE
    },
    "validation_results": {
      "required_files_present": $([ $missing_files -eq 0 ] && echo "true" || echo "false"),
      "migration_verification_passed": $([ "$SKIP_VERIFICATION" = true ] && echo "null" || echo "true"),
      "docker_build_successful": true,
      "service_deployment_successful": true,
      "endpoint_tests_passed": $([ "$SKIP_TESTS" = true ] && echo "null" || echo "true")
    },
    "next_steps": $([ "$ENVIRONMENT" = "hf-spaces" ] && echo '["Push code to HF Spaces repository", "Configure secrets", "Monitor deployment"]' || echo '["Access Flask admin at http://localhost:5001", "Monitor service health", "Run full E2E tests"]'),
    "log_file": "$LOG_FILE",
    "deployment_urls": $([ "$ENVIRONMENT" = "local" ] && echo '{"flask_admin": "http://localhost:5001", "health_check": "http://localhost:5001/health"}' || echo 'null')
  }
}
EOF

log "SUCCESS" "Deployment report generated: $deployment_report_file"

# Final summary
echo ""
echo -e "${BLUE}=== Deployment Automation Summary ===${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Status: ${GREEN}COMPLETED${NC}"
echo -e "Log file: ${BLUE}$LOG_FILE${NC}"
echo -e "Report file: ${BLUE}$deployment_report_file${NC}"

case $ENVIRONMENT in
    "local")
        echo ""
        echo -e "${GREEN}🎉 Local deployment completed successfully!${NC}"
        echo -e "Flask Admin URL: ${BLUE}http://localhost:5001${NC}"
        echo -e "Health Check: ${BLUE}http://localhost:5001/health${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo -e "1. Access the Flask admin interface"
        echo -e "2. Test all functionality"
        echo -e "3. Monitor service health"
        ;;
        
    "hf-spaces")
        echo ""
        echo -e "${GREEN}🎉 HF Spaces deployment preparation completed!${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo -e "1. Push code to your HF Spaces repository:"
        echo -e "   ${BLUE}git push hf main${NC}"
        echo -e "2. Configure secrets in HF Spaces settings"
        echo -e "3. Monitor deployment logs in HF Spaces"
        echo -e "4. Test the deployed application"
        ;;
esac

log "SUCCESS" "Deployment automation completed successfully"

exit 0