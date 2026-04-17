import pytest
from flask_admin.app import create_app
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as client:
        yield client

def test_dashboard_route(client):
    """Test the dashboard route renders successfully"""
    with patch.object(client.application.api_client, 'get') as mock_get:
        mock_get.side_effect = [[], []] # Folders and Escalations
        response = client.get('/')
        assert response.status_code == 200
        assert b"Dashboard" in response.data

def test_folders_route_get(client):
    """Test the folders list route"""
    with patch.object(client.application.api_client, 'get') as mock_get:
        # Return folders list
        mock_get.return_value = [{"id": "1", "name": "Test Folder", "description": "Test Desc"}]
        response = client.get('/folders')
        assert response.status_code == 200
        assert b"Test Folder" in response.data

def test_create_ticket_route_get(client):
    """Test the create ticket page renders"""
    with patch.object(client.application.api_client, 'get') as mock_get:
        mock_get.return_value = []  # Empty folders list
        response = client.get('/create-ticket')
        assert response.status_code == 200
        assert b"Create Ticket" in response.data

def test_classify_test_route_get(client):
    """Test the classify test page renders"""
    response = client.get('/classify-test')
    assert response.status_code == 200
    assert b"Classification Test" in response.data

def test_health_json_route(client):
    """Test the health JSON endpoint"""
    with patch.object(client.application.api_client, 'get') as mock_get:
        mock_get.return_value = {"status": "healthy"}
        response = client.get('/health', headers={'Accept': 'application/json'})
        assert response.status_code == 200
        assert response.is_json
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'flask-admin'

def test_system_health_ui_route(client):
    """Test the health UI route"""
    with patch.object(client.application.api_client, 'get') as mock_get:
        mock_get.return_value = {"status": "healthy", "components": {}}
        response = client.get('/system-health')
        assert response.status_code == 200
        assert b"System Health" in response.data
