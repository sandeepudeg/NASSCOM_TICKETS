"""
Pytest configuration for E2E tests with Playwright.

Provides fixtures and setup for end-to-end testing.
"""

import pytest
from playwright.config import PLAYWRIGHT_CONFIG, get_browser_config
from playwright.sync_api import Page


@pytest.fixture(scope="session", params=PLAYWRIGHT_CONFIG["browsers"])
def browser_type_launch_args(request):
    """
    Parametrize tests across multiple browsers and versions.

    This fixture runs each test against all configured browsers:
    - Chromium (latest stable)
    - Chrome (latest 2 versions via channel)
    - Firefox (latest 2 versions)
    - WebKit/Safari (latest 2 versions)

    Args:
        request: Pytest request fixture with browser config params

    Returns:
        dict: Browser launch arguments including channel if specified
    """
    browser_config = request.param
    return get_browser_config(
        browser_name=browser_config["name"], channel=browser_config.get("channel")
    )


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """
    Configure browser context with custom settings.

    Returns:
        dict: Browser context arguments including viewport, locale, timezone, etc.
    """
    return {
        **browser_context_args,
        "viewport": {
            "width": 1920,
            "height": 1080,
        },
        "locale": "en-US",
        "timezone_id": "America/New_York",
        "permissions": ["clipboard-read", "clipboard-write"],
        "ignore_https_errors": True,  # For local development with self-signed certs
    }


@pytest.fixture(scope="function")
def authenticated_page(page: Page, base_url: str):
    """
    Provide an authenticated page for tests that require login.

    This fixture handles authentication by either:
    1. Using stored auth state if available
    2. Performing login flow if needed

    Args:
        page: Playwright page fixture
        base_url: Base URL of the application

    Returns:
        Page: Authenticated Playwright page
    """
    # For now, we'll assume the app is in development mode without strict auth
    # In production, you would:
    # 1. Navigate to login page
    # 2. Fill in credentials
    # 3. Submit login form
    # 4. Wait for redirect to dashboard
    # 5. Store auth state for reuse

    # Example login flow (uncomment and customize for your auth):
    # page.goto(f"{base_url}/login")
    # page.fill('input[name="email"]', "test@example.com")
    # page.fill('input[name="password"]', "testpassword")
    # page.click('button[type="submit"]')
    # page.wait_for_url(f"{base_url}/dashboard", timeout=5000)

    return page


@pytest.fixture(scope="function")
def clean_database():
    """
    Fixture to clean database before/after tests.

    This ensures test isolation by resetting database state.
    In a real implementation, you would:
    1. Connect to test database
    2. Truncate relevant tables
    3. Reset sequences
    4. Optionally seed with test data
    """
    # Before test: clean database
    # yield
    # After test: clean database again
    pass


@pytest.fixture(scope="session")
def base_url():
    """
    Base URL for the frontend application.

    Returns:
        str: Base URL (default: http://localhost:5173 for Vite dev server)
    """
    return "http://localhost:5173"


@pytest.fixture(scope="session")
def api_base_url():
    """
    Base URL for the backend API.

    Returns:
        str: API base URL (default: http://localhost:8000)
    """
    return "http://localhost:8000"


def pytest_configure(config):
    """
    Pytest configuration hook.

    Registers custom markers for E2E tests.
    """
    config.addinivalue_line(
        "markers", "e2e: mark test as end-to-end test requiring full stack"
    )
    config.addinivalue_line("markers", "slow: mark test as slow running (> 10 seconds)")
    config.addinivalue_line(
        "markers", "authenticated: mark test as requiring authentication"
    )
    config.addinivalue_line(
        "markers", "browser_compat: mark test for cross-browser compatibility testing"
    )


@pytest.fixture(autouse=True)
def setup_test_environment(request):
    """
    Auto-use fixture to set up test environment.

    This runs before each test to ensure proper environment setup.
    """
    # Add any global setup here
    # For example: set environment variables, start services, etc.

    yield

    # Add any global teardown here
    # For example: stop services, clean up resources, etc.
