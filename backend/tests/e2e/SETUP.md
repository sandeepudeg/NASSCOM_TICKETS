# E2E Test Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies (includes Playwright)
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### 2. Start Services

```bash
# Start all backend services
docker compose up -d

# Start frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

### 3. Run Tests

**On Windows (PowerShell):**
```powershell
.\scripts\run_e2e_tests.ps1
```

**On Linux/Mac (Bash):**
```bash
./scripts/run_e2e_tests.sh
```

**Or directly with pytest:**
```bash
pytest tests/e2e/ -v
```

## Test Coverage

The E2E test suite covers the following workflows:

### ✅ Ticket Flow (test_ticket_flow.py)
- Ticket submission with text input
- Ticket submission with structured JSON log input
- Classification result display (category, confidence score, routing status)
- Low confidence escalation indicator
- Causal context extraction from structured input

### ✅ Escalation Flow (test_escalation_flow.py)
- Escalation queue display (sorted oldest-first)
- Agent override workflow
- Override confirmation and toast notification
- Routing status update after override
- Similar tickets display in escalation queue
- Audit trail verification

### ✅ Folder Flow (test_folder_flow.py)
- Folder creation via sidebar
- Folder name validation (empty, too long)
- Ticket assignment to folder
- Folder contents display
- Ticket removal from folder
- Folder list display
- Folder navigation

### ✅ Dashboard Flow (test_dashboard_flow.py)
- Dashboard summary cards display
- Auto-refresh without page reload
- Manual refresh button
- Navigation to detail pages
- Loading states
- Error handling

## Running Specific Tests

```bash
# Run a specific test file
pytest tests/e2e/test_ticket_flow.py -v

# Run a specific test
pytest tests/e2e/test_ticket_flow.py::test_ticket_submission_to_classification_display -v

# Run with headed browser (see what's happening)
pytest tests/e2e/ --headed --slowmo 1000

# Run in debug mode
.\scripts\run_e2e_tests.ps1 --debug
```

## Troubleshooting

### Services Not Starting

```bash
# Check service status
docker compose ps

# View logs
docker compose logs api
docker compose logs postgres

# Restart services
docker compose down
docker compose up -d
```

### Frontend Not Running

```bash
# Start frontend manually
cd frontend
npm install
npm run dev
```

### Tests Timing Out

- Increase timeout in `playwright.config.py`
- Check if services are healthy: `curl http://localhost:8000/health/ready`
- Run tests with `--headed --slowmo 1000` to see what's happening

### Element Not Found

- Verify frontend components have `data-testid` attributes
- Check if element is rendered: inspect browser with `--headed` mode
- Add explicit waits: `expect(element).to_be_visible(timeout=10000)`

## CI/CD Integration

The E2E tests are designed to run in CI/CD pipelines. See `tests/e2e/README.md` for GitHub Actions example.

## Next Steps

1. Add more test scenarios as features are implemented
2. Add visual regression testing with Playwright screenshots
3. Add performance testing with Playwright metrics
4. Add accessibility testing with axe-core
5. Add API contract testing alongside E2E tests
