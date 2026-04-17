"""
Playwright configuration for E2E tests.

This configuration file defines settings for Playwright test execution,
including browsers, timeouts, retries, and test output.
"""

# Playwright configuration
PLAYWRIGHT_CONFIG = {
    # Base URL for the application
    "base_url": "http://localhost:5173",
    # Timeout settings (in milliseconds)
    "timeout": 30000,  # Default timeout for actions
    "navigation_timeout": 30000,  # Timeout for page navigation
    "expect_timeout": 5000,  # Timeout for expect assertions
    # Browser settings
    "headless": True,  # Run in headless mode (set to False for debugging)
    "slow_mo": 0,  # Slow down operations by N milliseconds (useful for debugging)
    # Screenshot and video settings
    "screenshot": "only-on-failure",  # Options: "on", "off", "only-on-failure"
    "video": "retain-on-failure",  # Options: "on", "off", "retain-on-failure"
    # Trace settings (for debugging)
    "trace": "retain-on-failure",  # Options: "on", "off", "retain-on-failure"
    # Retry settings
    "retries": 2,  # Number of retries for failed tests
    # Parallel execution
    "workers": 4,  # Number of parallel workers (adjust based on your system)
    # Browsers to test against
    "browsers": [
        {"name": "chromium", "channel": None},  # Latest stable Chromium
        {
            "name": "chromium",
            "channel": "chrome",
        },  # Latest 2 Chrome versions via channel
        {"name": "firefox", "channel": None},  # Latest stable Firefox
        {"name": "webkit", "channel": None},  # Latest stable WebKit (Safari)
    ],
    # Test directory
    "test_dir": "tests/e2e",
    # Test match pattern
    "test_match": "test_*.py",
    # Output directory for test artifacts
    "output_dir": "tests/e2e/test-results",
    # Reporter settings
    "reporters": [
        ["list"],  # Console output
        ["html", {"open": "never", "output_folder": "tests/e2e/playwright-report"}],
        ["json", {"output_file": "tests/e2e/test-results.json"}],
    ],
}


def get_browser_config(browser_name="chromium", channel=None):
    """
    Get browser configuration for Playwright.

    Args:
        browser_name: Name of the browser (chromium, firefox, webkit)
        channel: Browser channel (e.g., "chrome", "msedge" for chromium)

    Returns:
        dict: Browser launch configuration
    """
    config = {
        "headless": PLAYWRIGHT_CONFIG["headless"],
        "slow_mo": PLAYWRIGHT_CONFIG["slow_mo"],
    }

    # Add channel if specified (for testing specific browser versions)
    if channel:
        config["channel"] = channel

    # Browser-specific args
    if browser_name == "chromium":
        config["args"] = [
            "--disable-blink-features=AutomationControlled",  # Avoid detection
            "--disable-dev-shm-usage",  # Overcome limited resource problems
            "--no-sandbox",  # Required for Docker/CI environments
        ]

    return config


def get_context_config():
    """
    Get browser context configuration.

    Returns:
        dict: Browser context configuration
    """
    return {
        "viewport": {"width": 1920, "height": 1080},
        "locale": "en-US",
        "timezone_id": "America/New_York",
        "permissions": ["clipboard-read", "clipboard-write"],
        "ignore_https_errors": True,
        "record_video_dir": (
            f"{PLAYWRIGHT_CONFIG['output_dir']}/videos"
            if PLAYWRIGHT_CONFIG["video"] != "off"
            else None
        ),
        "record_video_size": {"width": 1280, "height": 720},
    }


# Export configuration for pytest-playwright
pytest_plugins = ["pytest_playwright"]
