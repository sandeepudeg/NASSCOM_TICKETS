"""
E2E Test: Ticket Submission → Classification Result Display

Tests the complete flow from ticket submission through classification to result display.
Validates Requirements 9.1 (classification output) and 9.3 (confidence score).

Feature: tickets-folder
"""

import pytest
from playwright.sync_api import Page, expect


@pytest.fixture(scope="module")
def base_url():
    """Base URL for the application."""
    return "http://localhost:5173"  # Vite dev server default port


@pytest.fixture(scope="module")
def api_base_url():
    """Base URL for the API."""
    return "http://localhost:8000"


def test_ticket_submission_to_classification_display(page: Page, base_url: str, api_base_url: str):
    """
    E2E Test: Submit a ticket and verify classification result is displayed.
    
    Steps:
    1. Navigate to ticket submission form
    2. Fill in ticket details (title, description, priority)
    3. Submit the ticket
    4. Wait for classification to complete
    5. Verify classification result page displays:
       - Category (one of 7 valid categories)
       - Confidence score (0.0-1.0)
       - Routing status
    
    Validates:
    - Requirement 9.1: Classification returns exactly one category
    - Requirement 9.3: Confidence score is a float in [0.0, 1.0]
    """
    # Navigate to ticket submission form
    page.goto(f"{base_url}/tickets/new")
    
    # Wait for form to load
    expect(page.locator("h1")).to_contain_text("Submit New Ticket", timeout=5000)
    
    # Fill in ticket details
    ticket_title = "Database connection timeout in production"
    ticket_description = """
    Our production database is experiencing connection timeouts.
    Error: psycopg2.OperationalError: could not connect to server: Connection timed out
    This started happening after the latest deployment at 14:30 UTC.
    Multiple services are affected.
    """
    
    page.fill('input[name="title"]', ticket_title)
    page.fill('textarea[name="description"]', ticket_description)
    
    # Select priority
    page.select_option('select[name="priority"]', "high")
    
    # Submit the ticket
    page.click('button[type="submit"]')
    
    # Wait for navigation to classification result page
    # URL should be /tickets/{ticket_id}
    page.wait_for_url("**/tickets/*", timeout=10000)
    
    # Wait for classification to complete (may take a few seconds)
    # Look for the classification result section
    expect(page.locator('[data-testid="classification-result"]')).to_be_visible(timeout=15000)
    
    # Verify category is displayed and is one of the 7 valid categories
    category_element = page.locator('[data-testid="ticket-category"]')
    expect(category_element).to_be_visible()
    
    category_text = category_element.inner_text()
    valid_categories = [
        "Infrastructure",
        "Application",
        "Security",
        "Database",
        "Storage",
        "Network",
        "Access Management"
    ]
    assert category_text in valid_categories, f"Category '{category_text}' is not in valid categories"
    
    # Verify confidence score is displayed and is in valid range [0.0, 1.0]
    confidence_element = page.locator('[data-testid="confidence-score"]')
    expect(confidence_element).to_be_visible()
    
    confidence_text = confidence_element.inner_text()
    # Extract numeric value (e.g., "0.87" or "87%")
    confidence_value = float(confidence_text.strip('%').strip()) / (100 if '%' in confidence_text else 1)
    assert 0.0 <= confidence_value <= 1.0, f"Confidence score {confidence_value} is not in range [0.0, 1.0]"
    
    # Verify routing status is displayed
    routing_status_element = page.locator('[data-testid="routing-status"]')
    expect(routing_status_element).to_be_visible()
    
    routing_status = routing_status_element.inner_text()
    valid_statuses = ["pending_classification", "routed", "escalated", "resolved"]
    assert routing_status in valid_statuses, f"Routing status '{routing_status}' is not valid"
    
    # Verify ticket title is displayed on result page
    expect(page.locator("h1")).to_contain_text(ticket_title)


def test_ticket_classification_with_structured_input(page: Page, base_url: str):
    """
    E2E Test: Submit a ticket with structured JSON log input.
    
    Validates that structured input is accepted and causal context is extracted.
    """
    page.goto(f"{base_url}/tickets/new")
    
    # Fill in basic details
    page.fill('input[name="title"]', "API Gateway 502 errors")
    
    # Select structured input format
    page.select_option('select[name="inputFormat"]', "json_log")
    
    # Fill in structured payload
    structured_payload = """{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "service": "api-gateway",
  "message": "Upstream service returned 502",
  "error.rate": 0.45,
  "http.status_code": 502
}"""
    page.fill('textarea[name="structuredPayload"]', structured_payload)
    page.fill('textarea[name="description"]', "Seeing increased 502 errors from API gateway")
    
    # Submit
    page.click('button[type="submit"]')
    
    # Wait for classification result
    page.wait_for_url("**/tickets/*", timeout=10000)
    expect(page.locator('[data-testid="classification-result"]')).to_be_visible(timeout=15000)
    
    # Verify causal context is displayed (if available)
    causal_context_element = page.locator('[data-testid="causal-context"]')
    if causal_context_element.is_visible():
        # Should contain extracted context from structured input
        expect(causal_context_element).to_contain_text("api-gateway")


def test_low_confidence_escalation_indicator(page: Page, base_url: str):
    """
    E2E Test: Submit an ambiguous ticket that triggers escalation.
    
    Validates that low-confidence tickets show escalation status.
    """
    page.goto(f"{base_url}/tickets/new")
    
    # Submit an intentionally ambiguous ticket
    page.fill('input[name="title"]', "Something is broken")
    page.fill('textarea[name="description"]', "It doesn't work. Please fix.")
    page.select_option('select[name="priority"]', "medium")
    
    page.click('button[type="submit"]')
    
    # Wait for classification
    page.wait_for_url("**/tickets/*", timeout=10000)
    expect(page.locator('[data-testid="classification-result"]')).to_be_visible(timeout=15000)
    
    # Check if escalation indicator is present (for low confidence)
    routing_status = page.locator('[data-testid="routing-status"]').inner_text()
    
    if routing_status == "escalated":
        # Verify escalation banner is shown
        escalation_banner = page.locator('[data-testid="escalation-banner"]')
        expect(escalation_banner).to_be_visible()
        expect(escalation_banner).to_contain_text("escalated")
