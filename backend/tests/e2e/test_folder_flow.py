"""
E2E Test: Folder Create → Assign Ticket → View Folder Contents

Tests the complete folder management workflow from creation to ticket assignment.
Validates Requirements 1.1 (folder creation), 5.1 (ticket assignment), 7.1 (list tickets).

Feature: tickets-folder
"""

import pytest
from playwright.sync_api import Page, expect


@pytest.fixture(scope="module")
def base_url():
    """Base URL for the application."""
    return "http://localhost:5173"


@pytest.fixture(scope="module")
def api_base_url():
    """Base URL for the API."""
    return "http://localhost:8000"


def test_folder_create_assign_ticket_view_contents(page: Page, base_url: str):
    """
    E2E Test: Create folder, assign ticket, view folder contents.
    
    Steps:
    1. Navigate to main page with folder sidebar
    2. Create a new folder via sidebar
    3. Verify folder appears in sidebar
    4. Create or select an existing ticket
    5. Assign ticket to the folder
    6. Navigate to folder view
    7. Verify ticket appears in folder contents
    
    Validates:
    - Requirement 1.1: Folder creation with valid name
    - Requirement 5.1: Ticket assignment to folder
    - Requirement 7.1: List tickets in folder
    """
    # Navigate to main page
    page.goto(f"{base_url}/dashboard")
    
    # Wait for page to load
    expect(page.locator('[data-testid="folder-sidebar"]')).to_be_visible(timeout=5000)
    
    # Create a new folder via sidebar
    folder_name = f"Test Folder {page.evaluate('Date.now()')}"
    
    # Click "Create Folder" button in sidebar
    create_folder_button = page.locator('[data-testid="create-folder-button"]')
    expect(create_folder_button).to_be_visible()
    create_folder_button.click()
    
    # Fill in folder name in inline form or modal
    folder_name_input = page.locator('input[name="folderName"], input[placeholder*="folder name" i]')
    expect(folder_name_input).to_be_visible(timeout=3000)
    folder_name_input.fill(folder_name)
    
    # Submit folder creation
    submit_button = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
    submit_button.click()
    
    # Wait for folder to appear in sidebar
    folder_item = page.locator(f'[data-testid="folder-item"]:has-text("{folder_name}")')
    expect(folder_item).to_be_visible(timeout=5000)
    
    # Get folder ID from the element
    folder_id = folder_item.get_attribute("data-folder-id")
    
    # Now create a ticket to assign to this folder
    page.goto(f"{base_url}/tickets/new")
    
    ticket_title = f"Test Ticket for Folder {page.evaluate('Date.now()')}"
    page.fill('input[name="title"]', ticket_title)
    page.fill('textarea[name="description"]', "This is a test ticket for folder assignment")
    page.select_option('select[name="priority"]', "medium")
    
    # Submit ticket
    page.click('button[type="submit"]')
    
    # Wait for classification result page
    page.wait_for_url("**/tickets/*", timeout=10000)
    
    # Extract ticket ID from URL
    ticket_url = page.url
    ticket_id = ticket_url.split("/tickets/")[-1]
    
    # Wait for classification to complete
    expect(page.locator('[data-testid="classification-result"]')).to_be_visible(timeout=15000)
    
    # Assign ticket to folder
    # Look for "Assign to Folder" button or dropdown
    assign_button = page.locator('[data-testid="assign-to-folder-button"], button:has-text("Assign to Folder")')
    expect(assign_button).to_be_visible(timeout=5000)
    assign_button.click()
    
    # Select the folder from dropdown
    folder_dropdown = page.locator('select[name="folderId"], [data-testid="folder-select"]')
    expect(folder_dropdown).to_be_visible(timeout=3000)
    
    # Select our created folder
    folder_dropdown.select_option(label=folder_name)
    
    # Confirm assignment
    confirm_button = page.locator('button:has-text("Assign"), button:has-text("Confirm")')
    confirm_button.click()
    
    # Wait for success notification
    success_notification = page.locator('[data-testid="success-toast"], .ant-message-success, [role="alert"]')
    expect(success_notification).to_be_visible(timeout=5000)
    
    # Navigate to folder view to verify ticket appears
    page.goto(f"{base_url}/folders/{folder_id}")
    
    # Wait for folder contents to load
    expect(page.locator("h1")).to_contain_text(folder_name, timeout=5000)
    
    # Verify ticket appears in folder contents
    ticket_list = page.locator('[data-testid="folder-tickets-list"]')
    expect(ticket_list).to_be_visible(timeout=5000)
    
    # Look for our specific ticket
    ticket_item = page.locator(f'[data-testid="ticket-item"][data-ticket-id="{ticket_id}"]')
    expect(ticket_item).to_be_visible(timeout=3000)
    
    # Verify ticket title is displayed
    expect(ticket_item).to_contain_text(ticket_title)


def test_folder_sidebar_navigation(page: Page, base_url: str):
    """
    E2E Test: Verify folder sidebar allows navigation between folders.
    
    Validates that clicking folders in sidebar navigates to folder view.
    """
    page.goto(f"{base_url}/dashboard")
    
    # Wait for sidebar to load
    sidebar = page.locator('[data-testid="folder-sidebar"]')
    expect(sidebar).to_be_visible(timeout=5000)
    
    # Get all folder items
    folder_items = page.locator('[data-testid="folder-item"]')
    
    if folder_items.count() > 0:
        # Click first folder
        first_folder = folder_items.first
        folder_name = first_folder.inner_text()
        folder_id = first_folder.get_attribute("data-folder-id")
        
        first_folder.click()
        
        # Verify navigation to folder view
        page.wait_for_url(f"**/folders/{folder_id}", timeout=5000)
        
        # Verify folder name is displayed as page title
        expect(page.locator("h1")).to_contain_text(folder_name, timeout=3000)


def test_folder_creation_validation(page: Page, base_url: str):
    """
    E2E Test: Verify folder name validation (empty name, too long name).
    
    Validates Requirement 1.2: Folder name validation.
    """
    page.goto(f"{base_url}/dashboard")
    
    # Wait for sidebar
    expect(page.locator('[data-testid="folder-sidebar"]')).to_be_visible(timeout=5000)
    
    # Click create folder
    create_folder_button = page.locator('[data-testid="create-folder-button"]')
    create_folder_button.click()
    
    # Try to submit with empty name
    folder_name_input = page.locator('input[name="folderName"], input[placeholder*="folder name" i]')
    expect(folder_name_input).to_be_visible(timeout=3000)
    
    # Leave empty and try to submit
    folder_name_input.fill("")
    submit_button = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
    submit_button.click()
    
    # Verify error message appears
    error_message = page.locator('[data-testid="error-message"], .ant-form-item-explain-error, [role="alert"]')
    expect(error_message).to_be_visible(timeout=3000)
    expect(error_message).to_contain_text("required", timeout=1000)
    
    # Try with name that's too long (> 255 characters)
    long_name = "A" * 300
    folder_name_input.fill(long_name)
    submit_button.click()
    
    # Verify error message for length
    expect(error_message).to_be_visible(timeout=3000)
    expect(error_message).to_contain_text("255", timeout=1000)


def test_remove_ticket_from_folder(page: Page, base_url: str):
    """
    E2E Test: Assign ticket to folder, then remove it.
    
    Validates Requirement 6.1: Remove ticket from folder.
    """
    # First create a folder and assign a ticket (reuse logic from main test)
    page.goto(f"{base_url}/dashboard")
    
    # Create folder
    expect(page.locator('[data-testid="folder-sidebar"]')).to_be_visible(timeout=5000)
    
    folder_name = f"Temp Folder {page.evaluate('Date.now()')}"
    create_folder_button = page.locator('[data-testid="create-folder-button"]')
    create_folder_button.click()
    
    folder_name_input = page.locator('input[name="folderName"], input[placeholder*="folder name" i]')
    folder_name_input.fill(folder_name)
    
    submit_button = page.locator('button[type="submit"], button:has-text("Create")')
    submit_button.click()
    
    folder_item = page.locator(f'[data-testid="folder-item"]:has-text("{folder_name}")')
    expect(folder_item).to_be_visible(timeout=5000)
    folder_id = folder_item.get_attribute("data-folder-id")
    
    # Create and assign a ticket
    page.goto(f"{base_url}/tickets/new")
    page.fill('input[name="title"]', "Ticket to Remove")
    page.fill('textarea[name="description"]', "This ticket will be removed from folder")
    page.select_option('select[name="priority"]', "low")
    page.click('button[type="submit"]')
    
    page.wait_for_url("**/tickets/*", timeout=10000)
    ticket_url = page.url
    ticket_id = ticket_url.split("/tickets/")[-1]
    
    expect(page.locator('[data-testid="classification-result"]')).to_be_visible(timeout=15000)
    
    # Assign to folder
    assign_button = page.locator('[data-testid="assign-to-folder-button"], button:has-text("Assign to Folder")')
    assign_button.click()
    
    folder_dropdown = page.locator('select[name="folderId"], [data-testid="folder-select"]')
    folder_dropdown.select_option(label=folder_name)
    
    confirm_button = page.locator('button:has-text("Assign"), button:has-text("Confirm")')
    confirm_button.click()
    
    page.wait_for_timeout(1000)
    
    # Navigate to folder view
    page.goto(f"{base_url}/folders/{folder_id}")
    
    # Verify ticket is in folder
    ticket_item = page.locator(f'[data-testid="ticket-item"][data-ticket-id="{ticket_id}"]')
    expect(ticket_item).to_be_visible(timeout=5000)
    
    # Remove ticket from folder
    remove_button = ticket_item.locator('[data-testid="remove-ticket-button"], button:has-text("Remove")')
    expect(remove_button).to_be_visible()
    remove_button.click()
    
    # Confirm removal if there's a confirmation dialog
    confirm_remove = page.locator('button:has-text("Confirm"), button:has-text("Yes"), .ant-modal button.ant-btn-primary')
    if confirm_remove.is_visible():
        confirm_remove.click()
    
    # Wait for success notification
    success_notification = page.locator('[data-testid="success-toast"], .ant-message-success')
    expect(success_notification).to_be_visible(timeout=5000)
    
    # Verify ticket is no longer in folder
    page.reload()
    page.wait_for_timeout(1000)
    
    removed_ticket = page.locator(f'[data-testid="ticket-item"][data-ticket-id="{ticket_id}"]')
    expect(removed_ticket).to_have_count(0, timeout=3000)


def test_folder_list_displays_all_user_folders(page: Page, base_url: str):
    """
    E2E Test: Verify folder sidebar displays all user's folders.
    
    Validates Requirement 2.1: List all folders for authenticated user.
    """
    page.goto(f"{base_url}/dashboard")
    
    # Wait for sidebar to load
    sidebar = page.locator('[data-testid="folder-sidebar"]')
    expect(sidebar).to_be_visible(timeout=5000)
    
    # Create multiple folders
    folder_names = [
        f"Folder A {page.evaluate('Date.now()')}",
        f"Folder B {page.evaluate('Date.now()')}",
        f"Folder C {page.evaluate('Date.now()')}"
    ]
    
    for folder_name in folder_names:
        create_folder_button = page.locator('[data-testid="create-folder-button"]')
        create_folder_button.click()
        
        folder_name_input = page.locator('input[name="folderName"], input[placeholder*="folder name" i]')
        folder_name_input.fill(folder_name)
        
        submit_button = page.locator('button[type="submit"], button:has-text("Create")')
        submit_button.click()
        
        # Wait for folder to appear
        folder_item = page.locator(f'[data-testid="folder-item"]:has-text("{folder_name}")')
        expect(folder_item).to_be_visible(timeout=5000)
        
        page.wait_for_timeout(500)
    
    # Verify all folders are visible in sidebar
    for folder_name in folder_names:
        folder_item = page.locator(f'[data-testid="folder-item"]:has-text("{folder_name}")')
        expect(folder_item).to_be_visible()
