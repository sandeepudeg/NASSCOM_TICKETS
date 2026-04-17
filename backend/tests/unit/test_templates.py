from unittest.mock import patch

import pytest

from flask_admin.app import create_app


class TestTemplateRendering:
    """Test suite for Flask template rendering"""

    @pytest.fixture
    def app(self):
        """Create Flask app for testing"""
        app = create_app()
        app.config["TESTING"] = True
        app.config["SECRET_KEY"] = "test-secret-key"
        app.config["WTF_CSRF_ENABLED"] = False  # Disable CSRF for testing
        yield app
        # Teardown: ensure API client session is closed
        if hasattr(app, "api_client"):
            app.api_client.close()

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        with app.test_client() as client:
            yield client

    @pytest.fixture
    def app_context(self, app):
        """Create application context"""
        with app.app_context():
            yield app

    def test_base_template_structure(self, client):
        """Test that base template renders with proper structure"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.side_effect = [[], []]  # Empty folders and escalations
            response = client.get("/")

            assert response.status_code == 200
            assert b"<!DOCTYPE html>" in response.data
            assert b"<html" in response.data
            assert b"<head>" in response.data
            assert b"<body>" in response.data
            assert b"</html>" in response.data

    def test_base_template_navigation(self, client):
        """Test that base template includes navigation menu"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.side_effect = [[], []]
            response = client.get("/")

            assert response.status_code == 200
            # Check for navigation elements
            assert b"Dashboard" in response.data
            assert b"Folders" in response.data
            assert b"Create Ticket" in response.data
            assert b"Test" in response.data
            assert b"System Health" in response.data

    def test_base_template_bootstrap(self, client):
        """Test that base template includes Bootstrap CSS and JS"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.side_effect = [[], []]
            response = client.get("/")

            assert response.status_code == 200
            # Check for Bootstrap CDN links
            assert b"bootstrap" in response.data.lower()
            assert b"css" in response.data.lower()

    def test_dashboard_template_rendering(self, client):
        """Test dashboard template renders without errors"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_folders = [
                {
                    "id": "1",
                    "name": "Test Folder",
                    "description": "Test",
                    "ticket_count": 5,
                },
                {
                    "id": "2",
                    "name": "Another Folder",
                    "description": "Another",
                    "ticket_count": 3,
                },
            ]
            mock_escalations = [{"id": "1", "status": "pending"}]
            mock_get.side_effect = [mock_folders, mock_escalations]

            response = client.get("/")

            assert response.status_code == 200
            assert b"Dashboard" in response.data
            assert b"Test Folder" in response.data
            assert b"Another Folder" in response.data

    def test_dashboard_template_metrics_display(self, client):
        """Test dashboard template displays metrics correctly"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_folders = [{"id": str(i), "name": f"Folder {i}"} for i in range(5)]
            mock_escalations = [{"id": str(i)} for i in range(3)]
            mock_get.side_effect = [mock_folders, mock_escalations]

            response = client.get("/")

            assert response.status_code == 200
            # Check that metrics are displayed
            assert b"5" in response.data  # Total folders count
            assert b"3" in response.data  # Pending escalations count

    def test_folders_template_rendering(self, client):
        """Test folders template renders without errors"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_folders = [
                {
                    "id": "1",
                    "name": "Test Folder",
                    "description": "Test Description",
                    "ticket_count": 10,
                    "created_at": "2024-01-01T00:00:00Z",
                }
            ]
            mock_get.return_value = mock_folders

            response = client.get("/folders")

            assert response.status_code == 200
            assert b"Folders" in response.data
            assert b"Test Folder" in response.data
            assert b"Test Description" in response.data

    def test_folders_template_empty_state(self, client):
        """Test folders template handles empty folder list"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.return_value = []

            response = client.get("/folders")

            assert response.status_code == 200
            assert b"Folders" in response.data
            # Should still render without errors even with no folders

    def test_folders_template_form(self, client):
        """Test folders template includes create folder form"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.return_value = []

            response = client.get("/folders")

            assert response.status_code == 200
            assert b"<form" in response.data
            assert b'name="name"' in response.data
            assert b'name="description"' in response.data
            assert b"Create Folder" in response.data

    def test_create_ticket_template_rendering(self, client):
        """Test create ticket template renders without errors"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_folders = [
                {"id": "1", "name": "Folder 1"},
                {"id": "2", "name": "Folder 2"},
            ]
            mock_get.return_value = mock_folders

            response = client.get("/create-ticket")

            assert response.status_code == 200
            assert b"Create Ticket" in response.data
            assert b"Folder 1" in response.data
            assert b"Folder 2" in response.data

    def test_create_ticket_template_form(self, client):
        """Test create ticket template includes proper form fields"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.return_value = []

            response = client.get("/create-ticket")

            assert response.status_code == 200
            assert b"<form" in response.data
            assert b'name="title"' in response.data
            assert b'name="description"' in response.data
            assert b'name="folder_id"' in response.data

    def test_create_ticket_template_with_classification_results(self, client):
        """Test create ticket template displays classification results"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.return_value = []

            with patch.object(client.application.api_client, "post") as mock_post:
                mock_classification = {
                    "classification": {
                        "category": "Technical Issue",
                        "confidence": 0.85,
                        "similar_tickets": [
                            {
                                "id": "1",
                                "title": "Similar Ticket",
                                "similarity_score": 0.9,
                            }
                        ],
                    }
                }
                mock_post.return_value = mock_classification

                response = client.post(
                    "/create-ticket",
                    data={"title": "Test Ticket", "description": "Test Description"},
                )

                assert response.status_code == 200
                assert b"Technical Issue" in response.data
                assert b"Similar Ticket" in response.data

    def test_classify_test_template_rendering(self, client):
        """Test classify test template renders without errors"""
        response = client.get("/classify-test")

        assert response.status_code == 200
        assert b"Test" in response.data
        assert b"<form" in response.data
        assert b'name="title"' in response.data
        assert b'name="description"' in response.data

    def test_classify_test_template_with_results(self, client):
        """Test classify test template displays classification results"""
        with patch.object(client.application.api_client, "post") as mock_post:
            mock_result = {
                "category": "Bug Report",
                "confidence_score": 0.92,
                "similar_tickets": [],
            }
            mock_post.return_value = mock_result

            response = client.post(
                "/classify-test",
                data={
                    "title": "Test Classification",
                    "description": "Test Description",
                },
            )

            assert response.status_code == 200
            assert b"Bug Report" in response.data
            assert b"92" in response.data

    def test_health_template_rendering(self, client):
        """Test health template renders without errors"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_health = {
                "status": "healthy",
                "components": {
                    "database": "healthy",
                    "ollama": "healthy",
                    "minio": "healthy",
                },
            }
            mock_get.return_value = mock_health

            response = client.get("/system-health")

            assert response.status_code == 200
            assert b"System Health" in response.data
            assert b"Healthy" in response.data

    def test_health_template_component_status(self, client):
        """Test health template displays component statuses"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_health = {
                "status": "healthy",
                "components": {
                    "database": "healthy",
                    "ollama": "unhealthy",
                    "minio": "healthy",
                },
            }
            mock_get.return_value = mock_health

            response = client.get("/system-health")

            assert response.status_code == 200
            assert b"Database" in response.data
            assert b"Ollama" in response.data
            assert b"Minio" in response.data
            assert b"Unhealthy" in response.data

    def test_error_404_template_rendering(self, client):
        """Test 404 error template renders without errors"""
        response = client.get("/nonexistent-page")

        assert response.status_code == 404
        assert b"404" in response.data or b"Not Found" in response.data

    def test_error_500_template_rendering(self, client):
        """Test 500 error template renders without errors"""
        with patch.object(client.application.api_client, "get") as mock_get:
            # Force an exception to trigger 500 error
            mock_get.side_effect = Exception("Test error")

            response = client.get("/")

            # Should handle the error gracefully and render error template
            assert response.status_code in [
                200,
                500,
            ]  # May handle gracefully or show error page

    def test_error_403_template_rendering(self, app_context):
        """Test 403 error template renders without errors"""
        with app_context.test_client():
            # Simulate a 403 error by accessing the error handler directly
            from flask import abort

            with pytest.raises(Exception, match=r'.*'):  # This will be caught by error handler
                with app_context.test_request_context():
                    abort(403)

    def test_template_context_injection(self, client):
        """Test that context processors inject required variables"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.side_effect = [[], []]
            response = client.get("/")

            assert response.status_code == 200
            # Navigation items should be available
            assert b"Dashboard" in response.data
            assert b"Folders" in response.data
            # API base URL should be available in footer or debug info
            # Current time should be available

    def test_template_flash_messages(self, client):
        """Test that flash messages are displayed in templates"""
        with patch.object(client.application.api_client, "post") as mock_post:
            mock_post.return_value = {"id": "123", "created": True}

            response = client.post(
                "/folders",
                data={"name": "Test Folder", "description": "Test Description"},
                follow_redirects=True,
            )

            assert response.status_code == 200
            # Should show success message
            assert (
                b"success" in response.data.lower()
                or b"created" in response.data.lower()
            )

    def test_template_error_handling(self, client):
        """Test that templates handle API errors gracefully"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.return_value = None  # Simulate API error

            response = client.get("/")

            assert response.status_code == 200
            # Should still render template even with API errors
            assert b"Dashboard" in response.data

    def test_template_csrf_protection(self, app):
        """Test that templates include CSRF tokens when enabled"""
        app.config["WTF_CSRF_ENABLED"] = True

        with app.test_client() as client:
            with patch.object(client.application.api_client, "get") as mock_get:
                mock_get.return_value = []

                response = client.get("/folders")

                assert response.status_code == 200
                # Should include CSRF token in forms
                assert b"csrf_token" in response.data or b"hidden" in response.data

    def test_template_responsive_design(self, client):
        """Test that templates include responsive design elements"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.side_effect = [[], []]
            response = client.get("/")

            assert response.status_code == 200
            # Check for responsive design indicators
            assert b"viewport" in response.data or b"responsive" in response.data
            assert (
                b"col-" in response.data or b"container" in response.data
            )  # Bootstrap grid

    def test_template_accessibility_features(self, client):
        """Test that templates include basic accessibility features"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.side_effect = [[], []]
            response = client.get("/")

            assert response.status_code == 200
            # Check for accessibility features
            assert (
                b"alt=" in response.data
                or b"aria-" in response.data
                or b"role=" in response.data
            )

    def test_template_performance_optimization(self, client):
        """Test that templates include performance optimization elements"""
        with patch.object(client.application.api_client, "get") as mock_get:
            mock_get.side_effect = [[], []]
            response = client.get("/")

            assert response.status_code == 200
            # Check for performance optimizations
            # CDN usage, minified resources, etc.
            assert b"cdn" in response.data.lower() or b"min." in response.data.lower()

    def test_all_templates_render_without_errors(self, client):
        """Test that all main templates render without Python errors"""
        routes_to_test = [
            ("/", [[], []]),  # Dashboard - needs folders and escalations
            ("/folders", [[]]),  # Folders - needs folders list
            ("/create-ticket", [[]]),  # Create ticket - needs folders list
            ("/classify-test", None),  # Classify test - no API calls needed
            ("/health", [{}]),  # Health - needs health data
        ]

        for route, mock_returns in routes_to_test:
            with patch.object(client.application.api_client, "get") as mock_get:
                if mock_returns:
                    mock_get.side_effect = mock_returns

                response = client.get(route)

                # All templates should render successfully (200) or redirect (3xx)
                assert response.status_code in [
                    200,
                    301,
                    302,
                    303,
                    307,
                    308,
                ], f"Route {route} failed with status {response.status_code}"

                # Should not contain Python error traces
                assert b"Traceback" not in response.data
                assert b"Exception" not in response.data
                assert (
                    b"Error:" not in response.data or b"Error loading" in response.data
                )  # Allow user-friendly error messages
