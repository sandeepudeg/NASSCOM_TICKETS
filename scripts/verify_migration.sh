#!/bin/bash
# scripts/verify_migration.sh
# Migration verification script to ensure Streamlit removal completeness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Hugging Face Flask Deployment Migration Completeness...${NC}"
echo ""

# Initialize counters
ERRORS=0
WARNINGS=0
CHECKS=0

# Function to log results
log_check() {
    local status=$1
    local message=$2
    CHECKS=$((CHECKS + 1))
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "FAIL")
            echo -e "${RED}❌ $message${NC}"
            ERRORS=$((ERRORS + 1))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  $message${NC}"
            WARNINGS=$((WARNINGS + 1))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Check 1: Streamlit references in code
echo -e "${YELLOW}Checking for Streamlit references in code...${NC}"
if grep -r "streamlit" --exclude-dir=.git --exclude-dir=.hypothesis --exclude-dir=.pytest_cache --exclude-dir=.ruff_cache --exclude-dir=.venv_tickets --exclude="*.md" --exclude="*.log" . 2>/dev/null | grep -v "# Remove streamlit" | grep -v "streamlit removal" | grep -v "Streamlit" | grep -v "STREAMLIT" > /tmp/streamlit_refs.txt; then
    log_check "FAIL" "Found Streamlit references in code:"
    cat /tmp/streamlit_refs.txt | head -10
    if [ $(wc -l < /tmp/streamlit_refs.txt) -gt 10 ]; then
        echo -e "${YELLOW}... and $(($(wc -l < /tmp/streamlit_refs.txt) - 10)) more references${NC}"
    fi
else
    log_check "PASS" "No Streamlit references found in code"
fi

# Check 2: Streamlit files
echo -e "${YELLOW}Checking for Streamlit files...${NC}"
if find . -name "*streamlit*" -not -path "./.git/*" -not -path "./.hypothesis/*" -not -path "./.pytest_cache/*" -not -path "./.ruff_cache/*" -not -path "./.venv_tickets/*" 2>/dev/null | grep -q .; then
    log_check "FAIL" "Found Streamlit files:"
    find . -name "*streamlit*" -not -path "./.git/*" -not -path "./.hypothesis/*" -not -path "./.pytest_cache/*" -not -path "./.ruff_cache/*" -not -path "./.venv_tickets/*"
else
    log_check "PASS" "No Streamlit files found"
fi

# Check 3: docker-compose.yml
echo -e "${YELLOW}Checking docker-compose.yml...${NC}"
if [ -f "docker-compose.yml" ]; then
    if grep -q "streamlit" docker-compose.yml 2>/dev/null; then
        log_check "FAIL" "Found Streamlit service in docker-compose.yml"
    else
        log_check "PASS" "No Streamlit service in docker-compose.yml"
    fi
else
    if [ -f "docker/docker-compose.yml" ]; then
        if grep -q "streamlit" docker/docker-compose.yml 2>/dev/null; then
            log_check "FAIL" "Found Streamlit service in docker/docker-compose.yml"
        else
            log_check "PASS" "No Streamlit service in docker/docker-compose.yml"
        fi
    else
        log_check "WARN" "No docker-compose.yml found"
    fi
fi

# Check 4: requirements.txt
echo -e "${YELLOW}Checking requirements.txt...${NC}"
if [ -f "requirements.txt" ]; then
    if grep -q "streamlit" requirements.txt 2>/dev/null; then
        log_check "FAIL" "Found Streamlit in requirements.txt"
    else
        log_check "PASS" "No Streamlit in requirements.txt"
    fi
else
    log_check "WARN" "No requirements.txt found"
fi

# Check 5: Flask admin structure
echo -e "${YELLOW}Checking Flask admin structure...${NC}"
required_files=(
    "flask_admin/app.py"
    "flask_admin/config.py"
    "flask_admin/utils/api_client.py"
    "flask_admin/templates/base.html"
    "flask_admin/templates/dashboard.html"
    "flask_admin/templates/folders.html"
    "flask_admin/templates/create_ticket.html"
    "flask_admin/templates/classify_test.html"
    "flask_admin/templates/health.html"
    "flask_admin/static/css/style.css"
    "flask_admin/static/js/app.js"
    "app.py"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        log_check "FAIL" "Required Flask file missing: $file"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -eq 0 ]; then
    log_check "PASS" "All required Flask admin files present"
else
    log_check "FAIL" "$missing_files Flask admin files missing"
fi

# Check 6: Flask dependencies
echo -e "${YELLOW}Checking Flask dependencies in requirements.txt...${NC}"
if [ -f "requirements.txt" ]; then
    required_deps=("Flask" "gunicorn" "Flask-WTF" "flask-cors" "Flask-Compress" "Flask-Caching")
    missing_deps=0
    
    for dep in "${required_deps[@]}"; do
        if ! grep -q "$dep" requirements.txt; then
            log_check "FAIL" "Missing Flask dependency: $dep"
            missing_deps=$((missing_deps + 1))
        fi
    done
    
    if [ $missing_deps -eq 0 ]; then
        log_check "PASS" "All Flask dependencies present in requirements.txt"
    else
        log_check "FAIL" "$missing_deps Flask dependencies missing"
    fi
fi

# Check 7: HF Spaces configuration
echo -e "${YELLOW}Checking HF Spaces configuration...${NC}"
if [ -f "README.md" ]; then
    if grep -q "sdk: docker" README.md && grep -q "app_port: 7860" README.md; then
        log_check "PASS" "HF Spaces metadata present in README.md"
    else
        log_check "WARN" "HF Spaces metadata incomplete in README.md"
    fi
else
    log_check "WARN" "No README.md found for HF Spaces"
fi

if [ -f "Dockerfile" ]; then
    if grep -q "EXPOSE 7860" Dockerfile; then
        log_check "PASS" "Dockerfile configured for HF Spaces (port 7860)"
    else
        log_check "WARN" "Dockerfile may not be configured for HF Spaces"
    fi
else
    log_check "WARN" "No Dockerfile found for HF Spaces deployment"
fi

# Check 8: Test Flask application startup
echo -e "${YELLOW}Testing Flask application startup...${NC}"
if [ -f "flask_admin/app.py" ]; then
    cd flask_admin 2>/dev/null || true
    if python3 -c "from app import create_app; app = create_app(); print('Flask app created successfully')" 2>/dev/null; then
        log_check "PASS" "Flask app imports and creates successfully"
    else
        log_check "FAIL" "Flask app failed to import or create"
    fi
    cd .. 2>/dev/null || true
else
    log_check "FAIL" "Cannot test Flask app - flask_admin/app.py not found"
fi

# Check 9: Verify Flask routes
echo -e "${YELLOW}Checking Flask routes configuration...${NC}"
if [ -f "flask_admin/app.py" ]; then
    required_routes=("dashboard" "folders" "create_ticket" "classify_test" "system_health" "health_check")
    missing_routes=0
    
    for route in "${required_routes[@]}"; do
        if ! grep -q "def $route" flask_admin/app.py; then
            log_check "FAIL" "Missing Flask route: $route"
            missing_routes=$((missing_routes + 1))
        fi
    done
    
    if [ $missing_routes -eq 0 ]; then
        log_check "PASS" "All required Flask routes present"
    else
        log_check "FAIL" "$missing_routes Flask routes missing"
    fi
fi

# Check 10: Verify error page templates
echo -e "${YELLOW}Checking error page templates...${NC}"
error_templates=("404.html" "500.html" "403.html")
missing_error_templates=0

for template in "${error_templates[@]}"; do
    if [[ ! -f "flask_admin/templates/$template" ]]; then
        log_check "FAIL" "Missing error template: $template"
        missing_error_templates=$((missing_error_templates + 1))
    fi
done

if [ $missing_error_templates -eq 0 ]; then
    log_check "PASS" "All error page templates present"
else
    log_check "FAIL" "$missing_error_templates error templates missing"
fi

# Check 11: Verify deployment scripts
echo -e "${YELLOW}Checking deployment scripts...${NC}"
deployment_scripts=("scripts/deploy_hf_spaces.sh" "scripts/e2e/run_e2e_tests.sh")
missing_scripts=0

for script in "${deployment_scripts[@]}"; do
    if [[ ! -f "$script" ]]; then
        log_check "FAIL" "Missing deployment script: $script"
        missing_scripts=$((missing_scripts + 1))
    elif [[ ! -x "$script" ]]; then
        log_check "WARN" "Deployment script not executable: $script"
        chmod +x "$script" 2>/dev/null && log_check "INFO" "Made $script executable"
    fi
done

if [ $missing_scripts -eq 0 ]; then
    log_check "PASS" "All deployment scripts present"
fi

# Check 12: Verify Docker configuration
echo -e "${YELLOW}Checking Docker configuration...${NC}"
if [ -f "docker/Dockerfile.flask" ] || [ -f "Dockerfile" ]; then
    log_check "PASS" "Docker configuration present"
    
    # Check for Flask-specific Docker setup
    dockerfile_path=""
    if [ -f "docker/Dockerfile.flask" ]; then
        dockerfile_path="docker/Dockerfile.flask"
    elif [ -f "Dockerfile" ]; then
        dockerfile_path="Dockerfile"
    fi
    
    if [ -n "$dockerfile_path" ]; then
        if grep -q "gunicorn" "$dockerfile_path"; then
            log_check "PASS" "Dockerfile configured with Gunicorn"
        else
            log_check "WARN" "Dockerfile may not be configured with Gunicorn"
        fi
    fi
else
    log_check "WARN" "No Docker configuration found"
fi

# Check 13: Verify environment configuration
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ -f ".env.example" ]; then
    required_env_vars=("API_BASE_URL" "SECRET_KEY" "FLASK_ENV")
    missing_env_vars=0
    
    for var in "${required_env_vars[@]}"; do
        if ! grep -q "$var" .env.example; then
            log_check "WARN" "Missing environment variable example: $var"
            missing_env_vars=$((missing_env_vars + 1))
        fi
    done
    
    if [ $missing_env_vars -eq 0 ]; then
        log_check "PASS" "All required environment variables documented"
    fi
else
    log_check "WARN" "No .env.example found"
fi

# Check 15: Verify Flask admin API integration
echo -e "${YELLOW}Checking Flask admin API integration...${NC}"
if [ -f "flask_admin/utils/api_client.py" ]; then
    # Check for proper API client implementation
    if grep -q "class APIClient" flask_admin/utils/api_client.py && \
       grep -q "def get" flask_admin/utils/api_client.py && \
       grep -q "def post" flask_admin/utils/api_client.py; then
        log_check "PASS" "API client properly implemented"
    else
        log_check "FAIL" "API client implementation incomplete"
    fi
    
    # Check for error handling
    if grep -q "except" flask_admin/utils/api_client.py && \
       grep -q "timeout" flask_admin/utils/api_client.py; then
        log_check "PASS" "API client error handling implemented"
    else
        log_check "WARN" "API client error handling may be incomplete"
    fi
else
    log_check "FAIL" "API client module not found"
fi

# Check 16: Verify Flask admin security configuration
echo -e "${YELLOW}Checking Flask admin security configuration...${NC}"
if [ -f "flask_admin/config.py" ]; then
    # Check for CSRF protection
    if grep -q "CSRF" flask_admin/config.py || grep -q "csrf" flask_admin/app.py; then
        log_check "PASS" "CSRF protection configured"
    else
        log_check "WARN" "CSRF protection not found"
    fi
    
    # Check for secure session configuration
    if grep -q "SESSION_COOKIE" flask_admin/config.py; then
        log_check "PASS" "Secure session configuration present"
    else
        log_check "WARN" "Secure session configuration not found"
    fi
    
    # Check for SECRET_KEY handling
    if grep -q "SECRET_KEY" flask_admin/config.py; then
        log_check "PASS" "SECRET_KEY configuration present"
    else
        log_check "FAIL" "SECRET_KEY configuration missing"
    fi
fi

# Check 17: Verify Flask admin performance optimizations
echo -e "${YELLOW}Checking Flask admin performance optimizations...${NC}"
if [ -f "requirements.txt" ]; then
    # Check for caching
    if grep -q "Flask-Caching" requirements.txt; then
        log_check "PASS" "Flask-Caching dependency present"
    else
        log_check "WARN" "Flask-Caching not found in requirements"
    fi
    
    # Check for compression
    if grep -q "Flask-Compress" requirements.txt; then
        log_check "PASS" "Flask-Compress dependency present"
    else
        log_check "WARN" "Flask-Compress not found in requirements"
    fi
fi

# Check 18: Verify Flask admin logging configuration
echo -e "${YELLOW}Checking Flask admin logging configuration...${NC}"
if [ -f "flask_admin/app.py" ]; then
    if grep -q "logging" flask_admin/app.py || grep -q "logger" flask_admin/app.py; then
        log_check "PASS" "Logging configuration present"
    else
        log_check "WARN" "Logging configuration not found"
    fi
    
    # Check for structured logging
    if grep -q "structlog" flask_admin/app.py || grep -q "json" flask_admin/config.py; then
        log_check "PASS" "Structured logging configured"
    else
        log_check "WARN" "Structured logging not configured"
    fi
fi

# Check 19: Verify Flask admin template completeness
echo -e "${YELLOW}Checking Flask admin template completeness...${NC}"
if [ -f "flask_admin/templates/base.html" ]; then
    # Check for Bootstrap integration
    if grep -q "bootstrap" flask_admin/templates/base.html; then
        log_check "PASS" "Bootstrap CSS framework integrated"
    else
        log_check "WARN" "Bootstrap CSS framework not found"
    fi
    
    # Check for navigation menu
    if grep -q "nav" flask_admin/templates/base.html && grep -q "navbar" flask_admin/templates/base.html; then
        log_check "PASS" "Navigation menu present in base template"
    else
        log_check "WARN" "Navigation menu not found in base template"
    fi
    
    # Check for flash message support
    if grep -q "flash" flask_admin/templates/base.html || grep -q "get_flashed_messages" flask_admin/templates/base.html; then
        log_check "PASS" "Flash message support present"
    else
        log_check "WARN" "Flash message support not found"
    fi
fi

# Check 20: Verify Flask admin static assets
echo -e "${YELLOW}Checking Flask admin static assets...${NC}"
static_assets_present=0
static_assets_total=3

if [ -f "flask_admin/static/css/style.css" ]; then
    log_check "PASS" "Custom CSS file present"
    static_assets_present=$((static_assets_present + 1))
else
    log_check "WARN" "Custom CSS file missing"
fi

if [ -f "flask_admin/static/js/app.js" ]; then
    log_check "PASS" "Custom JavaScript file present"
    static_assets_present=$((static_assets_present + 1))
else
    log_check "WARN" "Custom JavaScript file missing"
fi

if [ -f "flask_admin/static/favicon.ico" ] || [ -f "static/favicon.ico" ]; then
    log_check "PASS" "Favicon present"
    static_assets_present=$((static_assets_present + 1))
else
    log_check "WARN" "Favicon missing"
fi

if [ $static_assets_present -eq $static_assets_total ]; then
    log_check "PASS" "All static assets present"
elif [ $static_assets_present -gt 0 ]; then
    log_check "WARN" "Some static assets missing ($static_assets_present/$static_assets_total)"
else
    log_check "FAIL" "No static assets found"
fi

# Check 21: Verify migration completeness indicators
echo -e "${YELLOW}Checking migration completeness indicators...${NC}"

# Check if streamlit_app directory was removed
if [ -d "streamlit_app" ]; then
    log_check "FAIL" "streamlit_app directory still exists"
else
    log_check "PASS" "streamlit_app directory removed"
fi

# Check for Flask admin service in docker-compose
if [ -f "docker-compose.yml" ] || [ -f "docker/docker-compose.yml" ]; then
    compose_file=""
    if [ -f "docker-compose.yml" ]; then
        compose_file="docker-compose.yml"
    elif [ -f "docker/docker-compose.yml" ]; then
        compose_file="docker/docker-compose.yml"
    fi
    
    if [ -n "$compose_file" ]; then
        if grep -q "flask-admin" "$compose_file"; then
            log_check "PASS" "Flask admin service configured in docker-compose"
        else
            log_check "WARN" "Flask admin service not found in docker-compose"
        fi
    fi
fi

# Check 22: Verify deployment readiness
echo -e "${YELLOW}Checking deployment readiness...${NC}"

# Check for deployment scripts
deployment_scripts=("scripts/deploy_hf_spaces.sh" "scripts/deploy_automation.sh" "scripts/verify_migration.sh")
deployment_scripts_present=0

for script in "${deployment_scripts[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        log_check "PASS" "Deployment script ready: $script"
        deployment_scripts_present=$((deployment_scripts_present + 1))
    elif [ -f "$script" ]; then
        log_check "WARN" "Deployment script not executable: $script"
        chmod +x "$script" 2>/dev/null && log_check "INFO" "Made $script executable"
        deployment_scripts_present=$((deployment_scripts_present + 1))
    else
        log_check "FAIL" "Deployment script missing: $script"
    fi
done

if [ $deployment_scripts_present -eq ${#deployment_scripts[@]} ]; then
    log_check "PASS" "All deployment scripts ready"
fi

# Summary
echo ""
echo -e "${BLUE}=== Migration Verification Summary ===${NC}"
echo -e "Total checks performed: ${CHECKS}"
echo -e "Errors found: ${RED}${ERRORS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo -e "Successful checks: ${GREEN}$((CHECKS - ERRORS - WARNINGS))${NC}"

# Generate migration report
report_file="migration_verification_report.json"
cat > "$report_file" << EOF
{
  "migration_verification": {
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "total_checks": $CHECKS,
    "errors": $ERRORS,
    "warnings": $WARNINGS,
    "successful_checks": $((CHECKS - ERRORS - WARNINGS)),
    "status": "$([ $ERRORS -eq 0 ] && echo "PASSED" || echo "FAILED")",
    "streamlit_removal_complete": $([ $ERRORS -eq 0 ] && echo "true" || echo "false"),
    "flask_admin_ready": $([ -f "flask_admin/app.py" ] && echo "true" || echo "false"),
    "hf_spaces_ready": $([ -f "README.md" ] && [ -f "Dockerfile" ] && echo "true" || echo "false"),
    "deployment_scripts_ready": $([ -f "scripts/deploy_hf_spaces.sh" ] && echo "true" || echo "false")
  }
}
EOF

log_check "INFO" "Migration verification report saved to: $report_file"

# Final result
echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Migration verification PASSED!${NC}"
    echo -e "${GREEN}✅ Streamlit has been successfully removed${NC}"
    echo -e "${GREEN}✅ Flask admin is properly configured${NC}"
    echo -e "${GREEN}✅ Ready for deployment${NC}"
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Note: $WARNINGS warnings found - review recommended${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}❌ Migration verification FAILED!${NC}"
    echo -e "${RED}$ERRORS critical issues found that must be resolved${NC}"
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}$WARNINGS additional warnings to review${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Review and fix the errors listed above"
    echo -e "2. Re-run this script to verify fixes"
    echo -e "3. Check the migration verification report: $report_file"
    
    exit 1
fi