# End-to-End Tests with Playwright

This directory contains end-to-end (E2E) tests for the Tickets Folder feature using Playwright.

## Overview

E2E tests validate the complete user workflows from the frontend UI through the backend API to the database. These tests run against a fully deployed stack (frontend + backend + database + services).

## Test Files

- `test_ticket_flow.py` - Ticket submission and classification result display
- `test_escalation_flow.py` - Escalation queue review and override workflow
- `test_folder_flow.py` - Folder creation, ticket assignment, and folder contents
- `test_dashboard_flow.py` - Dashboard auto-refresh and summary cards
- `conftest.py` - Pytest fixtures and configuration for E2E tests

## Prerequisites

### 1. Install Playwright

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
# Optional: Install other browsers
playwright install firefox
playwright install webkit
```

### 2. Start the Full Stack

Before running E2E tests, ensure all services are running:

```bash
# Start all services with Docker Compose
docker compose up -d

# Wait for services to be healthy
docker compose ps

# Verify backend is running
curl http://localhost:8000/health/ready

# Verify frontend is running
curl http://localhost:5173
```

### 3. Seed Test Data (Optional)

For some tests, you may want to seed the database with test data:

```bash
# Run database migrations
alembic upgrade head

# Seed test data (if you have a seed script)
python scripts/seed_test_data.py
```

## Running Tests

### Run All E2E Tests

```bash
# Run all E2E tests
pytest tests/e2e/ -v

# Run with Playwright UI (for debugging)
pytest tests/e2e/ --headed --slowmo 1000

# Run specific test file
pytest tests/e2e/test_ticket_flow.py -v

# Run specific test
pytest tests/e2e/test_ticket_flow.py::test_ticket_submission_to_classification_display -v
```

### Run with Different Browsers

```bash
# Run on Chromium (default)
pytest tests/e2e/ --browser chromium

# Run on Firefox
pytest tests/e2e/ --browser firefox

# Run on WebKit (Safari)
pytest tests/e2e/ --browser webkit

# Run on all browsers
pytest tests/e2e/ --browser chromium --browser firefox --browser webkit
```

### Debugging Options

```bash
# Run in headed mode (see browser window)
pytest tests/e2e/ --headed

# Slow down operations for visibility
pytest tests/e2e/ --headed --slowmo 1000

# Keep browser open after test
pytest tests/e2e/ --headed --slowmo 1000 --pause-on-failure

# Generate trace for debugging
pytest tests/e2e/ --tracing on

# Take screenshots on failure
pytest tests/e2e/ --screenshot only-on-failure

# Record video on failure
pytest tests/e2e/ --video retain-on-failure
```

### Parallel Execution

```bash
# Run tests in parallel (4 workers)
pytest tests/e2e/ -n 4

# Run tests in parallel with specific number of workers
pytest tests/e2e/ -n auto
```

## Test Reports

After running tests, reports are generated in:

- `tests/e2e/test-results/` - Test artifacts (screenshots, videos, traces)
- `tests/e2e/playwright-report/` - HTML report
- `tests/e2e/test-results.json` - JSON report

To view the HTML report:

```bash
playwright show-report tests/e2e/playwright-report
```

## CI/CD Integration

E2E tests are designed to run in CI/CD pipelines. Example GitHub Actions workflow:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          playwright install --with-deps chromium
      
      - name: Start services
        run: docker compose up -d
      
      - name: Wait for services
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8000/health/ready; do sleep 2; done'
          timeout 60 bash -c 'until curl -f http://localhost:5173; do sleep 2; done'
      
      - name: Run E2E tests
        run: pytest tests/e2e/ -v --screenshot only-on-failure --video retain-on-failure
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: tests/e2e/test-results/
```

## Writing New E2E Tests

When writing new E2E tests:

1. Use descriptive test names that explain the user workflow
2. Add docstrings explaining the test steps and requirements validated
3. Use data-testid attributes for reliable element selection
4. Handle loading states and async operations with proper waits
5. Clean up test data after tests (or use database transactions)
6. Mark tests with appropriate pytest markers (@pytest.mark.e2e, @pytest.mark.slow)

Example test structure:

```python
def test_user_workflow_description(page: Page, base_url: str):
    """
    E2E Test: Brief description of the workflow.
    
    Steps:
    1. Step one
    2. Step two
    3. Step three
    
    Validates:
    - Requirement X.Y: Description
    - Requirement Z.W: Description
    """
    # Navigate to page
    page.goto(f"{base_url}/path")
    
    # Perform actions
    page.click('[data-testid="button"]')
    
    # Verify results
    expect(page.locator('[data-testid="result"]')).to_be_visible()
```

## Troubleshooting

### Tests Fail with Timeout Errors

- Increase timeout in `playwright.config.py`
- Check if services are running: `docker compose ps`
- Check service logs: `docker compose logs api`

### Browser Not Found

- Install Playwright browsers: `playwright install chromium`
- Check Playwright installation: `playwright --version`

### Tests Pass Locally but Fail in CI

- Ensure CI has enough resources (memory, CPU)
- Use headless mode in CI
- Add explicit waits for async operations
- Check for timing issues (use `page.wait_for_timeout()` sparingly)

### Element Not Found Errors

- Verify data-testid attributes exist in frontend components
- Check if element is visible: `expect(element).to_be_visible()`
- Wait for element to appear: `page.wait_for_selector('[data-testid="element"]')`
- Use browser inspector to verify selectors

## Best Practices

1. **Use data-testid attributes** - More stable than CSS classes or text content
2. **Wait for explicit conditions** - Use `expect().to_be_visible()` instead of fixed timeouts
3. **Isolate tests** - Each test should be independent and not rely on other tests
4. **Clean up after tests** - Remove test data or use database transactions
5. **Use fixtures** - Share common setup logic via pytest fixtures
6. **Handle async operations** - Wait for API calls, animations, and state updates
7. **Test error cases** - Verify error handling and edge cases
8. **Keep tests maintainable** - Use page objects or helper functions for complex workflows

## Resources

- [Playwright Documentation](https://playwright.dev/python/)
- [pytest-playwright Plugin](https://github.com/microsoft/playwright-pytest)
- [Playwright Best Practices](https://playwright.dev/python/docs/best-practices)
