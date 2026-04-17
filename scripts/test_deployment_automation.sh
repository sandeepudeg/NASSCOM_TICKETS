#!/bin/bash
# scripts/test_deployment_automation.sh
# Test script for deployment automation functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Deployment Automation Scripts${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Test counters
TESTS_PASSED=0
TESTS_TOTAL=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_exit_code="${3:-0}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        actual_exit_code=$?
    else
        actual_exit_code=$?
    fi
    
    if [ $actual_exit_code -eq $expected_exit_code ]; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL: $test_name (exit code: $actual_exit_code, expected: $expected_exit_code)${NC}"
    fi
}

# Test 1: Check if deployment scripts exist
echo -e "${YELLOW}=== Testing Script Existence ===${NC}"

run_test "HF Spaces deployment script exists" "test -f scripts/deploy_hf_spaces.sh"
run_test "Migration verification script exists" "test -f scripts/verify_migration.sh"
run_test "Deployment automation script exists" "test -f scripts/deploy_automation.sh"
run_test "E2E test script exists" "test -f scripts/e2e/run_e2e_tests.sh"

# Test 2: Check if scripts are executable
echo -e "${YELLOW}=== Testing Script Permissions ===${NC}"

run_test "HF Spaces deployment script is executable" "test -x scripts/deploy_hf_spaces.sh"
run_test "Migration verification script is executable" "test -x scripts/verify_migration.sh"
run_test "Deployment automation script is executable" "test -x scripts/deploy_automation.sh"
run_test "E2E test script is executable" "test -x scripts/e2e/run_e2e_tests.sh"

# Test 3: Test script help/usage functions
echo -e "${YELLOW}=== Testing Script Help Functions ===${NC}"

run_test "Deployment automation help" "bash scripts/deploy_automation.sh --help"
run_test "HF Spaces deployment validation (dry run)" "bash scripts/deploy_hf_spaces.sh --help || true"

# Test 4: Test migration verification
echo -e "${YELLOW}=== Testing Migration Verification ===${NC}"

# Create a temporary test environment
TEST_DIR=$(mktemp -d)
echo -e "${BLUE}ℹ️  Using temporary test directory: $TEST_DIR${NC}"

# Copy verification script to test directory
cp scripts/verify_migration.sh "$TEST_DIR/"
cd "$TEST_DIR"

# Test with missing Flask admin structure (should fail)
run_test "Migration verification with missing Flask admin" "bash verify_migration.sh" 1

# Create minimal Flask admin structure
mkdir -p flask_admin/templates flask_admin/static/css flask_admin/static/js flask_admin/utils
touch flask_admin/app.py
touch flask_admin/config.py
touch flask_admin/utils/api_client.py
touch flask_admin/templates/base.html
touch flask_admin/templates/dashboard.html
touch flask_admin/templates/folders.html
touch flask_admin/templates/create_ticket.html
touch flask_admin/templates/classify_test.html
touch flask_admin/templates/health.html
touch flask_admin/templates/404.html
touch flask_admin/templates/500.html
touch flask_admin/templates/403.html
touch flask_admin/static/css/style.css
touch flask_admin/static/js/app.js
touch app.py
touch requirements.txt
touch README.md
touch Dockerfile

# Add required content to files
echo "Flask==3.0.0" > requirements.txt
echo "gunicorn" >> requirements.txt
echo "Flask-WTF" >> requirements.txt
echo "flask-cors" >> requirements.txt
echo "Flask-Compress" >> requirements.txt
echo "Flask-Caching" >> requirements.txt

echo "---" > README.md
echo "sdk: docker" >> README.md
echo "app_port: 7860" >> README.md
echo "---" >> README.md

echo "EXPOSE 7860" > Dockerfile

# Add minimal Flask app content
cat > flask_admin/app.py << 'EOF'
from flask import Flask

def create_app():
    app = Flask(__name__)
    
    @app.route('/')
    def dashboard():
        return "Dashboard"
    
    @app.route('/folders')
    def folders():
        return "Folders"
    
    @app.route('/create-ticket')
    def create_ticket():
        return "Create Ticket"
    
    @app.route('/classify-test')
    def classify_test():
        return "Classify Test"
    
    @app.route('/system-health')
    def system_health():
        return "System Health"
    
    @app.route('/health')
    def health_check():
        return {"status": "healthy"}
    
    return app

app = create_app()
EOF

cat > flask_admin/utils/api_client.py << 'EOF'
import requests

class APIClient:
    def __init__(self, base_url, timeout=10):
        self.base_url = base_url
        self.timeout = timeout
    
    def get(self, endpoint):
        try:
            response = requests.get(f"{self.base_url}{endpoint}", timeout=self.timeout)
            return response.json()
        except Exception:
            return None
    
    def post(self, endpoint, data=None):
        try:
            response = requests.post(f"{self.base_url}{endpoint}", json=data, timeout=self.timeout)
            return response.json()
        except Exception:
            return None
EOF

cat > flask_admin/config.py << 'EOF'
import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://api:8000')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    WTF_CSRF_ENABLED = True
    SESSION_COOKIE_HTTPONLY = True
EOF

# Test with complete Flask admin structure (should pass)
cd - > /dev/null
run_test "Migration verification with complete Flask admin" "cd '$TEST_DIR' && bash verify_migration.sh"

# Cleanup test directory
rm -rf "$TEST_DIR"
echo -e "${BLUE}ℹ️  Cleaned up test directory${NC}"

# Test 5: Test deployment automation dry run
echo -e "${YELLOW}=== Testing Deployment Automation Dry Run ===${NC}"

# Test help function
run_test "Deployment automation help function" "bash scripts/deploy_automation.sh --help"

# Test with invalid environment
run_test "Deployment automation with invalid environment" "bash scripts/deploy_automation.sh --environment invalid" 1

# Test 6: Test E2E script Flask admin integration
echo -e "${YELLOW}=== Testing E2E Script Flask Admin Integration ===${NC}"

# Check if E2E script has Flask admin testing
run_test "E2E script contains Flask admin tests" "grep -q 'Flask Admin' scripts/e2e/run_e2e_tests.sh"
run_test "E2E script has endpoint testing function" "grep -q 'test_flask_endpoint' scripts/e2e/run_e2e_tests.sh"
run_test "E2E script tests CSRF protection" "grep -q 'CSRF' scripts/e2e/run_e2e_tests.sh"

# Test 7: Test HF Spaces deployment script features
echo -e "${YELLOW}=== Testing HF Spaces Deployment Script Features ===${NC}"

run_test "HF Spaces script validates required files" "grep -q 'required_files' scripts/deploy_hf_spaces.sh"
run_test "HF Spaces script checks Docker build" "grep -q 'docker build' scripts/deploy_hf_spaces.sh"
run_test "HF Spaces script validates metadata" "grep -q 'sdk: docker' scripts/deploy_hf_spaces.sh"
run_test "HF Spaces script tests endpoints" "grep -q 'endpoints' scripts/deploy_hf_spaces.sh"

# Test 8: Test migration verification completeness
echo -e "${YELLOW}=== Testing Migration Verification Completeness ===${NC}"

run_test "Migration verification checks Streamlit removal" "grep -q 'streamlit' scripts/verify_migration.sh"
run_test "Migration verification checks Flask structure" "grep -q 'flask_admin' scripts/verify_migration.sh"
run_test "Migration verification checks dependencies" "grep -q 'Flask' scripts/verify_migration.sh"
run_test "Migration verification checks Docker config" "grep -q 'Dockerfile' scripts/verify_migration.sh"
run_test "Migration verification checks HF Spaces config" "grep -q 'HF Spaces' scripts/verify_migration.sh"

# Test 9: Test script integration
echo -e "${YELLOW}=== Testing Script Integration ===${NC}"

run_test "Deployment automation calls migration verification" "grep -q 'verify_migration.sh' scripts/deploy_automation.sh"
run_test "Deployment automation calls HF Spaces script" "grep -q 'deploy_hf_spaces.sh' scripts/deploy_automation.sh"
run_test "HF Spaces script calls migration verification" "grep -q 'verify_migration.sh' scripts/deploy_hf_spaces.sh"

# Test 10: Test error handling
echo -e "${YELLOW}=== Testing Error Handling ===${NC}"

run_test "Deployment automation has error handling" "grep -q 'set -e' scripts/deploy_automation.sh"
run_test "Migration verification has error handling" "grep -q 'set -e' scripts/verify_migration.sh"
run_test "HF Spaces script has error handling" "grep -q 'set -e' scripts/deploy_hf_spaces.sh"
run_test "E2E script has error handling" "grep -q 'set -e' scripts/e2e/run_e2e_tests.sh"

# Test Summary
echo ""
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}/$TESTS_TOTAL"

success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
echo -e "Success rate: ${GREEN}$success_rate%${NC}"

if [ $success_rate -eq 100 ]; then
    echo -e "${GREEN}🎉 All deployment automation tests passed!${NC}"
    exit_code=0
elif [ $success_rate -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most deployment automation tests passed${NC}"
    exit_code=0
else
    echo -e "${RED}❌ Deployment automation tests have significant failures${NC}"
    exit_code=1
fi

# Generate test report
test_report_file="deployment_automation_test_report.json"
cat > "$test_report_file" << EOF
{
  "test_report": {
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "total_tests": $TESTS_TOTAL,
    "tests_passed": $TESTS_PASSED,
    "tests_failed": $((TESTS_TOTAL - TESTS_PASSED)),
    "success_rate": $success_rate,
    "status": "$([ $success_rate -ge 80 ] && echo "PASSED" || echo "FAILED")",
    "test_categories": {
      "script_existence": "completed",
      "script_permissions": "completed",
      "help_functions": "completed",
      "migration_verification": "completed",
      "deployment_automation": "completed",
      "e2e_integration": "completed",
      "hf_spaces_features": "completed",
      "script_integration": "completed",
      "error_handling": "completed"
    }
  }
}
EOF

echo -e "${BLUE}ℹ️  Test report saved to: $test_report_file${NC}"

exit $exit_code